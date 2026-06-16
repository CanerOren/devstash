import { Resend } from "resend";

// Resend client + email senders. Node-runtime only (imported by route handlers
// and server-side auth helpers, never by client or edge code).
//
// RESEND_API_KEY lives in .env. The sender defaults to Resend's shared
// onboarding address, which in test mode only delivers to the Resend account
// owner's own email — fine for development. Override with EMAIL_FROM once a
// domain is verified in Resend (e.g. "DevStash <noreply@yourdomain.com>").
const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.EMAIL_FROM ?? "DevStash <onboarding@resend.dev>";

interface VerificationEmailArgs {
  to: string;
  name: string | null;
  url: string;
}

// Sends the "verify your email" message. Returns true when Resend accepted the
// send, false otherwise (the caller decides how to react — registration, for
// example, still succeeds and offers a resend). Never throws.
export async function sendVerificationEmail({
  to,
  name,
  url,
}: VerificationEmailArgs): Promise<boolean> {
  const greeting = name ? `Hi ${name},` : "Hi,";

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to,
      subject: "Verify your DevStash email",
      text: [
        greeting,
        "",
        "Welcome to DevStash! Please confirm your email address by opening the link below:",
        "",
        url,
        "",
        "This link expires in 24 hours. If you didn't create a DevStash account, you can safely ignore this email.",
      ].join("\n"),
      html: verificationEmailHtml({ greeting, url }),
    });

    if (error) {
      console.error("[email] Resend rejected verification email:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] failed to send verification email:", err);
    return false;
  }
}

function verificationEmailHtml({ greeting, url }: { greeting: string; url: string }): string {
  return `
  <div style="font-family: ui-sans-serif, system-ui, sans-serif; max-width: 480px; margin: 0 auto; color: #0a0a0a;">
    <h1 style="font-size: 20px; margin-bottom: 16px;">Verify your email</h1>
    <p style="font-size: 14px; line-height: 1.6;">${greeting}</p>
    <p style="font-size: 14px; line-height: 1.6;">
      Welcome to DevStash! Please confirm your email address to activate your account.
    </p>
    <p style="margin: 24px 0;">
      <a href="${url}"
         style="display: inline-block; background: #0a0a0a; color: #ffffff; text-decoration: none;
                padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 600;">
        Verify email
      </a>
    </p>
    <p style="font-size: 12px; line-height: 1.6; color: #737373;">
      Or paste this link into your browser:<br />
      <a href="${url}" style="color: #2563eb;">${url}</a>
    </p>
    <p style="font-size: 12px; line-height: 1.6; color: #737373;">
      This link expires in 24 hours. If you didn't create a DevStash account, you can safely ignore this email.
    </p>
  </div>`;
}
