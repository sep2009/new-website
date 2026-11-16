import { redirect } from "next/navigation";
import { Container, PageHeader } from "@/components/layout/AppShell";
import { SettingsForm } from "@/components/profile/SettingsForm";
import { getAccount } from "@/lib/account/queries";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const account = await getAccount();
  if (!account) redirect("/signin");

  return (
    <Container size="default">
      <PageHeader title="Settings" subtitle="Your account, privacy and preferences." />
      <SettingsForm
        userId={account.user.id}
        email={account.user.email}
        hasPassword={account.user.hasPassword}
        birthYear={account.profile.birth_year}
        prefs={account.prefs}
      />
    </Container>
  );
}
