import { Pencil } from "lucide-react";
import { AppShell, Container } from "@/components/layout/AppShell";
import { ProfileView } from "@/components/profile/ProfileView";
import { Button } from "@/components/ui/Button";

export const metadata = { title: "Demo · Profile" };

/** SAMPLE PREVIEW ONLY: fictional persona Maya Lindqvist. Not real data. */
export default function DemoProfile() {
  return (
    <AppShell demo user={{ name: "Maya Lindqvist", email: "maya@example.com" }}>
      <Container>
        <p className="mx-auto mb-5 max-w-4xl rounded-2xl border border-accent-2/30 bg-accent/10 px-5 py-3 text-sm text-accent-3">
          <strong className="font-semibold">Design preview.</strong> Sample content for a fictional user, Maya
          Lindqvist. Not your data.
        </p>
        <ProfileView
          name="Maya Lindqvist"
          email="maya@example.com"
          bio="Photographer and weekend wanderer in Lisbon. Collecting small moments, one frame at a time."
          avatarUrl="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=75&auto=format&fit=crop"
          joined="2020-03-14T10:00:00Z"
          overview={{ memories: 247, inJourney: 86, firstDate: "2020-03-18", lastDate: "2026-11-14" }}
          settingsHref="/demo/profile"
          signOut={false}
          editSlot={
            <Button variant="secondary" disabled>
              <Pencil className="size-4" /> Edit Profile
            </Button>
          }
        />
      </Container>
    </AppShell>
  );
}
