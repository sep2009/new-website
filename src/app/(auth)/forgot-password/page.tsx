import { AuthLink, AuthShell } from "@/components/auth/AuthShell";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a link to reset it."
      footer={<AuthLink href="/signin">Back to sign in</AuthLink>}
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
