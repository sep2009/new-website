"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { friendlyAuthError } from "@/lib/auth-errors";
import { createClient } from "@/lib/supabase/client";

/**
 * Optional OAuth. Renders nothing unless NEXT_PUBLIC_OAUTH_GOOGLE=true,
 * which should only be set after enabling Google in Supabase.
 */
export function OAuthButtons({ onError }: { onError: (message: string) => void }) {
  const [busy, setBusy] = useState(false);
  if (process.env.NEXT_PUBLIC_OAUTH_GOOGLE !== "true") return null;

  async function google() {
    setBusy(true);
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/home` },
    });
    if (error) {
      onError(friendlyAuthError(error));
      setBusy(false);
    }
  }

  return (
    <>
      <Button variant="secondary" size="lg" className="w-full" onClick={google} disabled={busy}>
        {busy ? "Redirecting…" : "Continue with Google"}
      </Button>
      <div className="my-6 flex items-center gap-4" aria-hidden="true">
        <span className="h-px flex-1 bg-line" />
        <span className="type-caption text-fg-subtle">or</span>
        <span className="h-px flex-1 bg-line" />
      </div>
    </>
  );
}
