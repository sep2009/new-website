"use client";

import { MailCheck } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Notice } from "@/components/ui/Notice";
import { friendlyAuthError } from "@/lib/auth-errors";
import { createClient } from "@/lib/supabase/client";
import { validateEmail } from "@/lib/validation";

export function ForgotPasswordForm() {
  const [error, setError] = useState<string>();
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email") ?? "").trim();
    const invalid = validateEmail(email);
    setError(invalid);
    setFormError("");
    if (invalid) return;

    setLoading(true);
    const { error: err } = await createClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    setLoading(false);

    // Rate limits are worth telling the user about; everything else is shown as
    // success so we never reveal whether an email has an account.
    if (err && (err.status === 429 || err.code?.includes("rate_limit"))) {
      setFormError(friendlyAuthError(err));
      return;
    }
    setSentTo(email);
  }

  if (sentTo) {
    return (
      <div className="flex flex-col items-start gap-4">
        <span className="inline-flex size-12 items-center justify-center rounded-full bg-accent/20 text-accent-3">
          <MailCheck className="size-6" />
        </span>
        <Notice tone="success">
          If an account exists for <strong className="font-semibold">{sentTo}</strong>, we&apos;ve sent a
          link to reset your password. It can take a minute to arrive. Check your spam folder too.
        </Notice>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {formError && <Notice tone="error">{formError}</Notice>}
      <Input
        name="email"
        type="email"
        label="Email"
        autoComplete="email"
        placeholder="you@example.com"
        error={error}
      />
      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? "Sending link…" : "Send reset link"}
      </Button>
    </form>
  );
}
