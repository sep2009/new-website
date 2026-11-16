import { redirect } from "next/navigation";
import { Container } from "@/components/layout/AppShell";
import { EditProfileDialog } from "@/components/profile/EditProfileDialog";
import { ProfileView } from "@/components/profile/ProfileView";
import { getAccount, getProfileOverview } from "@/lib/account/queries";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const [account, overview] = await Promise.all([getAccount(), getProfileOverview()]);
  if (!account) redirect("/signin");

  return (
    <Container>
      <ProfileView
        name={account.profile.display_name}
        email={account.user.email}
        bio={account.profile.bio}
        avatarUrl={account.avatarSignedUrl}
        joined={account.user.createdAt}
        overview={overview}
        settingsHref="/settings"
        editSlot={
          <EditProfileDialog
            userId={account.user.id}
            name={account.profile.display_name}
            email={account.user.email}
            bio={account.profile.bio}
            avatarPath={account.profile.avatar_url}
            avatarUrl={account.avatarSignedUrl}
          />
        }
      />
    </Container>
  );
}
