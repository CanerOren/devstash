"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Loader2, Trash2, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteAccount } from "@/actions/profile";

// The exact text the user must type to enable the destructive action.
const CONFIRM_WORD = "DELETE";

// Destructive action: a "Delete Account" button that opens a confirmation
// dialog. The confirm button stays disabled until the user types DELETE. On
// success the user is signed out and sent to /sign-in; their data is removed by
// the schema's cascading deletes.
export function DeleteAccountDialog() {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const confirmed = confirmText === CONFIRM_WORD;

  // Reset the typed confirmation + error whenever the dialog opens or closes,
  // so reopening always starts from a clean (disabled) state.
  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setConfirmText("");
      setError(null);
    }
  }

  async function onConfirm() {
    if (!confirmed) return;
    setError(null);
    setPending(true);
    try {
      const result = await deleteAccount();
      if (!result.success) {
        setError(result.error ?? "Something went wrong. Please try again.");
        setPending(false);
        return;
      }
      // Account is gone — clear the session and leave the app. The redirect
      // unmounts this component, so no need to reset pending.
      await signOut({ callbackUrl: "/sign-in" });
    } catch {
      setError("Something went wrong. Please try again.");
      setPending(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">
          <Trash2 />
          Delete Account
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
              <TriangleAlert className="size-5 text-destructive" />
            </span>
            <div className="space-y-1">
              <AlertDialogTitle>Delete Account</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone.
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm">
          <p className="mb-2">Deleting your account will permanently remove:</p>
          <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
            <li>All your items (snippets, prompts, commands, etc.)</li>
            <li>All your collections</li>
            <li>Your profile and account data</li>
          </ul>
        </div>

        <div className="space-y-2">
          <label htmlFor="confirm-delete" className="text-sm font-medium">
            Type{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
              {CONFIRM_WORD}
            </code>{" "}
            to confirm
          </label>
          <Input
            id="confirm-delete"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={CONFIRM_WORD}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            disabled={pending}
          />
        </div>

        {error && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={(e) => {
              // Keep the dialog open while the deletion runs.
              e.preventDefault();
              void onConfirm();
            }}
            disabled={pending || !confirmed}
          >
            {pending && <Loader2 className="animate-spin" />}
            Delete Account
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
