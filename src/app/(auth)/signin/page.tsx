import { AuthLink, AuthShell } from "@/components/auth/AuthShell";
import { SignInForm } from "@/components/auth/SignInForm";

export const metadata = { title: "Sign in" };

const NOTICES: Record<string, string> = {
  "signed-out": "You've been signed out.",
  "account-deleted": "Your account has been deleted.",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; notice?: string }>;
}) {
  const { next, notice } = await searchParams;
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your LifeArchive."
      footer={
        <>
          New here? <AuthLink href="/signup">Create an account</AuthLink>
        </>
      }
    >
      <SignInForm next={next} notice={notice ? NOTICES[notice] : undefined} />
    </AuthShell>
  );
}
