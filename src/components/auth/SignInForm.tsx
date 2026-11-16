"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Notice } from "@/components/ui/Notice";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { friendlyAuthError } from "@/lib/auth-errors";
import { createClient } from "@/lib/supabase/client";
import { safeNext, validateEmail } from "@/lib/validation";
import { OAuthButtons } from "./OAuthButtons";

export function SignInForm({ next, notice }: { next?: string; notice?: string }) {
  const router = useRouter();
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState("");
  const [needsVerify, setNeedsVerify] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    const next_ = {
      email: validateEmail(email),
      password: password ? undefined : "Enter your password.",
    };
    setErrors(next_);
    setFormError("");
    setNeedsVerify(false);
    if (next_.email || next_.password) return;

    setLoading(true);
    const { error } = await createClient().auth.signInWithPassword({ email, password });

    if (error) {
      setLoading(false);
      setFormError(friendlyAuthError(error));
      if (error.code === "email_not_confirmed") {
        setNeedsVerify(true);
        try {
          sessionStorage.setItem("la:pending-email", email);
        } catch {}
      }
      return;
    }

    router.replace(safeNext(next));
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <OAuthButtons onError={setFormError} />

      {notice && !formError && <Notice tone="success">{notice}</Notice>}
      {formError && (
        <Notice tone="error">
          {formError}
          {needsVerify && (
            <>
              {" "}
              <Link href="/verify-email" className="underline underline-offset-4">
                Resend verification email
              </Link>
            </>
          )}
        </Notice>
      )}

      <Input
        name="email"
        type="email"
        label="Email"
        autoComplete="email"
        placeholder="you@example.com"
        error={errors.email}
      />
      <div className="flex flex-col gap-2">
        <PasswordInput
          name="password"
          label="Password"
          autoComplete="current-password"
          error={errors.password}
        />
        <Link
          href="/forgot-password"
          className="type-small self-end text-accent-3 underline-offset-4 hover:underline"
        >
          Forgot password?
        </Link>
      </div>

      <Button type="submit" size="lg" className="mt-1 w-full" disabled={loading}>
        {loading ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
