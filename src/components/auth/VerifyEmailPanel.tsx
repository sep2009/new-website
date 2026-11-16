"use client";

import { MailCheck } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { friendlyAuthError } from "@/lib/auth-errors";
import { createClient } from "@/lib/supabase/client";

const COOLDOWN = 60;

export function VerifyEmailPanel({ problem }: { problem?: string }) {
  const email = useSyncExternalStore(
    () => () => {},
    () => {
      try {
        return sessionStorage.getItem("la:pending-email") ?? "";
      } catch {
        return "";
      }
    },
    () => "",
  );
  const [cooldown, setCooldown] = useState(0);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function resend() {
    if (!email) return;
    setLoading(true);
    setError("");
    setSent(false);
    const { error: err } = await createClient().auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding` },
    });
    setLoading(false);
    if (err) {
      setError(friendlyAuthError(err));
      return;
    }
    setSent(true);
    setCooldown(COOLDOWN);
  }

  return (
    <div className="flex flex-col items-start gap-5">
      <span className="inline-flex size-14 items-center justify-center rounded-full bg-accent/20 text-accent-3">
        <MailCheck className="size-7" />
      </span>

      {problem && <Notice tone="error">{problem}</Notice>}

      <p className="type-body text-fg-muted">
        {email ? (
          <>
            We&apos;ve sent a verification link to{" "}
            <strong className="font-semibold text-fg">{email}</strong>. Open it to activate your
            account.
          </>
        ) : (
          <>We&apos;ve sent you a verification link. Open it to activate your account.</>
        )}
      </p>
      <p className="type-small text-fg-subtle">
        Nothing there? Check your spam folder. The link works for a limited time.
      </p>

      {sent && <Notice tone="success">A new link is on its way.</Notice>}
      {error && <Notice tone="error">{error}</Notice>}

      {email && (
        <Button variant="secondary" onClick={resend} disabled={loading || cooldown > 0}>
          {loading
            ? "Sending…"
            : cooldown > 0
              ? `Resend available in ${cooldown}s`
              : "Resend verification email"}
        </Button>
      )}
    </div>
  );
}
