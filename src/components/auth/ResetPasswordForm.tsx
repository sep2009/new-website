"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { friendlyAuthError } from "@/lib/auth-errors";
import { createClient } from "@/lib/supabase/client";
import { PASSWORD_MIN, validateConfirm, validatePassword } from "@/lib/validation";

export function ResetPasswordForm() {
  const router = useRouter();
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirm = String(form.get("confirm") ?? "");
    const next = {
      password: validatePassword(password),
      confirm: validateConfirm(password, confirm),
    };
    setErrors(next);
    setFormError("");
    if (next.password || next.confirm) return;

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setFormError(friendlyAuthError(error));
      return;
    }
    setDone(true);
    setTimeout(() => {
      router.replace("/home");
      router.refresh();
    }, 1500);
  }

  if (done) return <Notice tone="success">Your password has been updated. Taking you home…</Notice>;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {formError && <Notice tone="error">{formError}</Notice>}
      <PasswordInput
        name="password"
        label="New password"
        autoComplete="new-password"
        hint={`At least ${PASSWORD_MIN} characters, with a letter and a number.`}
        error={errors.password}
      />
      <PasswordInput
        name="confirm"
        label="Confirm new password"
        autoComplete="new-password"
        error={errors.confirm}
      />
      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? "Updating…" : "Update password"}
      </Button>
    </form>
  );
}
