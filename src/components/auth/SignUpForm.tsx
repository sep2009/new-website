"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";
import { Notice } from "@/components/ui/Notice";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { friendlyAuthError } from "@/lib/auth-errors";
import { createClient } from "@/lib/supabase/client";
import {
  PASSWORD_MIN,
  validateConfirm,
  validateEmail,
  validateName,
  validatePassword,
} from "@/lib/validation";
import { OAuthButtons } from "./OAuthButtons";

type Errors = Partial<Record<"name" | "email" | "password" | "confirm" | "terms", string>>;

export function SignUpForm() {
  const router = useRouter();
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") ?? "");
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const confirm = String(form.get("confirm") ?? "");
    const terms = form.get("terms") === "on";

    const next: Errors = {
      name: validateName(name),
      email: validateEmail(email),
      password: validatePassword(password),
      confirm: validateConfirm(password, confirm),
      terms: terms ? undefined : "Please accept the Terms and Privacy Policy to continue.",
    };
    setErrors(next);
    setFormError("");
    if (Object.values(next).some(Boolean)) return;

    setLoading(true);
    const { data, error } = await createClient().auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name.trim() },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
      },
    });
    setLoading(false);

    if (error) {
      setFormError(friendlyAuthError(error));
      return;
    }

    if (data.session) {
      // Email confirmation is off in this project: signed in immediately.
      router.replace("/onboarding");
      router.refresh();
      return;
    }

    try {
      sessionStorage.setItem("la:pending-email", email);
    } catch {}
    router.push("/verify-email");
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <OAuthButtons onError={setFormError} />

      {formError && <Notice tone="error">{formError}</Notice>}

      <Input
        name="name"
        label="Full name"
        autoComplete="name"
        placeholder="Alex Carter"
        error={errors.name}
      />
      <Input
        name="email"
        type="email"
        label="Email"
        autoComplete="email"
        placeholder="you@example.com"
        error={errors.email}
      />
      <PasswordInput
        name="password"
        label="Password"
        autoComplete="new-password"
        hint={`At least ${PASSWORD_MIN} characters, with a letter and a number.`}
        error={errors.password}
      />
      <PasswordInput
        name="confirm"
        label="Confirm password"
        autoComplete="new-password"
        error={errors.confirm}
      />
      <Checkbox
        name="terms"
        error={errors.terms}
        label={
          <>
            I agree to the{" "}
            <Link href="/terms" target="_blank" className="text-accent-3 underline underline-offset-4">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" target="_blank" className="text-accent-3 underline underline-offset-4">
              Privacy Policy
            </Link>
            .
          </>
        }
      />

      <Button type="submit" size="lg" className="mt-1 w-full" disabled={loading}>
        {loading ? "Creating your account…" : "Create account"}
      </Button>
    </form>
  );
}
