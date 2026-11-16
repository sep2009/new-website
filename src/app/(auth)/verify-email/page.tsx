import { AuthLink, AuthShell } from "@/components/auth/AuthShell";
import { VerifyEmailPanel } from "@/components/auth/VerifyEmailPanel";

export const metadata = { title: "Verify your email" };

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <AuthShell
      title="Check your email"
      footer={
        <>
          Wrong address? <AuthLink href="/signup">Start over</AuthLink>
        </>
      }
    >
      <VerifyEmailPanel
        problem={error ? "That verification link is invalid or has expired. Request a new one below." : undefined}
      />
    </AuthShell>
  );
}
