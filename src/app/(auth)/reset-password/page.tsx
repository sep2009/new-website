import { AuthLink, AuthShell } from "@/components/auth/AuthShell";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { Notice } from "@/components/ui/Notice";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Reset password" };

export default async function ResetPasswordPage() {
  // The reset link signs the user in via /auth/callback; no session means an
  // expired or already-used link.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <AuthShell
      title="Choose a new password"
      subtitle={user ? "Make it something only you would know." : undefined}
      footer={<AuthLink href="/signin">Back to sign in</AuthLink>}
    >
      {user ? (
        <ResetPasswordForm />
      ) : (
        <Notice tone="error">
          This reset link has expired or was already used.{" "}
          <AuthLink href="/forgot-password">Request a new one</AuthLink>.
        </Notice>
      )}
    </AuthShell>
  );
}
