import { Container } from "@/components/layout/AppShell";
import { HomeView } from "@/components/home/HomeView";
import { getJourneyStats, getOnThisDay, listMemories } from "@/lib/memories/queries";

export const metadata = { title: "Home" };

export default async function HomePage() {
  // All data is the signed-in user's own (Row Level Security enforces it in the database).
  const [recent, onThisDay, stats] = await Promise.all([
    listMemories({ limit: 5, sort: "newest" }),
    getOnThisDay(5),
    getJourneyStats(),
  ]);

  return (
    <Container>
      <HomeView
        onThisDay={onThisDay.map((m) => ({
          id: m.id,
          title: m.title,
          location_name: m.location_name,
          cover_url: m.cover_url,
          cover_kind: m.cover_kind,
          yearsAgo: m.yearsAgo,
          href: `/memories/${m.id}`,
        }))}
        recent={recent.memories}
        stats={stats}
        loadError={!!recent.error}
      />
    </Container>
  );
}
