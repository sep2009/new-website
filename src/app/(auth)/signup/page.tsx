import { AuthLink, AuthShell } from "@/components/auth/AuthShell";
import { SignUpForm } from "@/components/auth/SignUpForm";

export const metadata = { title: "Create your account" };

export default function SignUpPage() {
  return (
    <AuthShell
      title="Create your account"
      subtitle="Start keeping the moments that matter."
      footer={
        <>
          Already have an account? <AuthLink href="/signin">Sign in</AuthLink>
        </>
      }
    >
      <SignUpForm />
    </AuthShell>
  );
}
