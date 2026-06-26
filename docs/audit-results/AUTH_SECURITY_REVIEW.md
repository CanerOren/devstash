# DevStash — Auth Security Review

**Last audited:** 2026-06-26
**Scope:** NextAuth v5 auth stack — credentials + GitHub providers, email verification, password reset, profile page.
**Audited by:** auth-auditor agent

## Summary

Reviewed the full authentication surface: NextAuth core/split config, the credentials `authorize` flow, registration + bcrypt hashing, the email-verification flow, the forgot/reset-password flow, the profile page and its server-action mutations (`changePassword`, `deleteAccount`), the `requireUserId()` session seam, and the auth UI forms. The core security controls that NextAuth does **not** handle for you are implemented correctly: bcrypt cost 12 everywhere, cryptographically secure 256-bit tokens, bounded token expirations, strict single-use enforcement (the reset token is consumed in the same `$transaction` as the password update), and consistent session scoping of every mutation. No Critical or High findings. The only real gaps are the (known, deliberate) **absence of rate limiting** — **1 Medium** — and an **account-enumeration timing difference** on the forgot-password / resend-verification endpoints — **1 Low**.

**Counts:** Critical 0 · High 0 · Medium 1 · Low 1

## 🟡 Medium

### No rate limiting on any auth endpoint
- **File:**
  - `src/auth.ts` (`authorize`, `src/auth.ts:30`) — credentials login
  - `src/app/api/auth/register/route.ts` (`POST`, `src/app/api/auth/register/route.ts:25`)
  - `src/app/api/auth/forgot-password/route.ts` (`POST`, `src/app/api/auth/forgot-password/route.ts:17`)
  - `src/app/api/auth/reset-password/route.ts` (`POST`, `src/app/api/auth/reset-password/route.ts:26`)
  - `src/app/api/auth/resend-verification/route.ts` (`POST`, `src/app/api/auth/resend-verification/route.ts:14`)
- **Issue:** None of the auth entry points apply any rate limiting or brute-force throttling. NextAuth does not do this for you. Traced each handler end-to-end: every one goes straight from input validation to a Prisma/bcrypt operation with no per-IP / per-account counter. Concretely, `authorize` allows unlimited `bcrypt.compare` password guesses against a known email; `reset-password` allows unlimited reset-token guessing (mitigated in practice by the 256-bit token space, but the request volume is uncapped); and `register` / `forgot-password` / `resend-verification` can be driven in a loop to spray email or fill the `VerificationToken` table. This is a real gap on shipped code, but per the severity rubric (most small apps ship without it, and the high-entropy tokens blunt the reset-guessing angle) it is **Medium**, not Critical.
- **Fix:** Add a lightweight limiter in front of these handlers — e.g. an IP+route token-bucket using the optional Redis already noted in the stack (`REDIS_URL`), or `@upstash/ratelimit`. Prioritize `authorize` (per-IP and per-email) and `reset-password` (per-IP) first; a coarse per-IP cap on `register` / `forgot-password` / `resend-verification` covers the email-spray/table-fill angle.

## 🔵 Low

### Account enumeration via response-timing on forgot-password / resend-verification
- **File:**
  - `src/app/api/auth/forgot-password/route.ts:29-41`
  - `src/app/api/auth/resend-verification/route.ts:36-51`
- **Issue:** Both endpoints correctly return a **generic, identical response body** regardless of whether the account exists (good anti-enumeration design, confirmed). However, the work performed is **conditional on account existence**: in `forgot-password`, `issuePasswordResetEmail` (token write + Resend network call) runs only inside `if (user?.password)` (line 33); in `resend-verification`, `issueVerificationEmail` runs only inside `if (user?.password && !user.emailVerified)` (line 40). A non-existent email returns almost immediately, while an existing one incurs a DB write plus an outbound email send, producing an observable latency difference an attacker can use to confirm which addresses are registered. This is explicitly called out as a known limitation in the codebase and is **Low** per the rubric (enumeration via timing, not trivially exploitable, no data disclosed).
- **Fix:** Defense-in-depth only — make the timing constant by always doing comparable work (or by enqueueing the send to a background job so the request latency no longer depends on the account state), and/or rely on the Medium-severity rate limiting above to cap probing volume. Acceptable to leave as-is for now given the generic response and low impact.

## ✅ Passed Checks

**Password hashing (the NextAuth-doesn't-handle-this core):**
- bcrypt cost factor **12** on every hash path — registration (`register/route.ts:46`), password reset (`reset-password/route.ts:70`), and change-password (`actions/profile.ts:67`). Meets the project's ≥12 target.
- The bcrypt hash is **never** returned or logged. Registration selects only `{ id, name, email }` (`register/route.ts:57`); `getProfileUser` destructures `password` out and exposes only a `hasPassword` boolean (`lib/db/user.ts:52-53`); `getCurrentUser` never selects it. No code path leaks the hash into a response.
- Passwords are capped at 72 chars in every Zod schema (register, reset, change), correctly respecting bcrypt's 72-byte input limit.

**Email-verification flow:**
- Token generated with `crypto.randomBytes(32)` → 256 bits of entropy (`lib/auth/verification.ts:26`), well above the 128-bit bar. Not `Math.random`/`Date.now`.
- Bounded **24h** expiration set at creation (`verification.ts:9,27`).
- **Single-use:** `verify-email` deletes the token (`verify-email/route.ts:30`) before evaluating the result, so it cannot be replayed even on the expired path.
- Verification sets `emailVerified` idempotently via `updateMany(where: { emailVerified: null })` (`verify-email/route.ts:37-40`), and the credentials sign-in gate (`auth.ts:52-54`) actually blocks unverified credential users by throwing `EmailNotVerifiedError` when `isEmailVerificationEnabled() && !user.emailVerified`. GitHub OAuth users correctly never hit this provider.

**Password-reset flow (highest-risk surface — traced in full):**
- Same secure RNG/entropy: `randomBytes(32)` (`lib/auth/password-reset.ts:35`).
- Short **1h** expiration (`password-reset.ts:15,36`).
- **Strict single-use, no replay window:** the password update and the token `delete` happen in the **same `prisma.$transaction`** (`reset-password/route.ts:74-83`), so a crash cannot leave a reusable token behind. Invalid / OAuth-only / expired paths also consume the token where appropriate (`reset-password/route.ts:53,63`).
- **Cross-flow isolation confirmed:** reset tokens are namespaced with a `reset:` identifier prefix (`password-reset.ts:16-21`). A verification token POSTed to `/reset-password` is rejected because `emailFromResetIdentifier` returns null (`reset-password/route.ts:43-49`) and is not consumed; a reset token sent to `/verify-email` verifies nobody (its `identifier` is `reset:<email>`, which matches no `User.email` in the `updateMany`). Issuing a reset uses `deleteMany` scoped to the reset identifier, so it never wipes a pending verification token.
- New password is re-hashed with bcrypt 12 (not stored raw), and a successful reset also sets `emailVerified` if it was null (proves ownership) — `reset-password/route.ts:79`.
- Anti-enumeration: `forgot-password` always returns the generic message (`forgot-password/route.ts:41`) and only acts for credentials users.

**Profile page & account mutations:**
- Every read and mutation is scoped to the authenticated session user via `requireUserId()` (`lib/db/helpers.ts:12-19`, which reads `auth()` → `session.user.id` and throws if absent). No fetcher or action trusts a client-supplied user id; all use a direct `userId` column filter. The old hardcoded demo-user seam is gone.
- `changePassword` re-verifies the current password with `bcrypt.compare` before changing it (`actions/profile.ts:62-65`) and rejects OAuth-only accounts (null hash) (`actions/profile.ts:53-58`).
- `deleteAccount` is session-gated, runs the delete inside a `$transaction`, and cleans up leftover verification + reset tokens keyed by email (`actions/profile.ts:96-101`). The destructive UI is additionally gated behind a type-`DELETE`-to-confirm input.
- Inputs are Zod-validated and both actions return the project's `{ success, error? }` shape.
- Route protection: `proxy.ts` gates both `/dashboard` and `/profile` (`proxy.ts:9,27`), and the profile page adds a defense-in-depth `auth()` redirect guard (`profile/page.tsx:29-32`).

**Auth UI forms:** No token or secret is mishandled client-side. The reset token travels only via the URL into the POST body (`ResetPasswordForm.tsx`), passwords use `type="password"` + appropriate `autoComplete`, and no hash/secret is ever rendered. The client never sees another user's data.

**No hardcoded secrets:** Grepped `src/` for `AUTH_SECRET` / `NEXTAUTH_SECRET` / GitHub secrets / API-key literals — none found. All secrets come from `process.env`. `.gitignore` ignores `.env*` (verified), so the `.env` / `.env.production` files present on disk are not committed.

**Correctly delegated to NextAuth (considered, intentionally not flagged):** CSRF protection on the auth routes, secure cookie flags (`httpOnly` / `secure` / `sameSite`) on session/CSRF cookies, OAuth `state` / PKCE for the GitHub provider, and JWT signing / session encryption via `AUTH_SECRET`. These are framework-managed; none are hardcoded in source.

## Could Not Confirm

- **`AUTH_SECRET` strength/presence at runtime.** The secret is correctly read from the environment (never hardcoded), but its actual value lives in the gitignored `.env*` files, which were not read. Confirm out-of-band that a strong, unique `AUTH_SECRET` is set in every environment (it is mandatory for JWT signing in NextAuth v5).
