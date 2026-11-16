import { AppShell, Container } from "@/components/layout/AppShell";
import { HomeView } from "@/components/home/HomeView";
import type { JourneyStats } from "@/lib/memories/queries";
import type { MemoryCardData } from "@/lib/memories/types";

export const metadata = { title: "Demo · Maya's LifeArchive" };

/**
 * SAMPLE PREVIEW ONLY. A fictional persona with placeholder content so the design can be judged
 * before real data exists. Nothing here touches the database or the signed-in user's account.
 *
 * Persona: Maya Lindqvist, 29. Photographer and weekend traveller based in Lisbon. Has used every
 * feature for six years: 247 memories, 47 places, 38 favorites.
 */
const img = (id: string) => `https://images.unsplash.com/${id}?w=1400&q=75&auto=format&fit=crop`;

const iso = (daysAgo: number, now: Date) => {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export default function DemoPage() {
  const now = new Date();

  const onThisDay = [
    { id: "d1", title: "Golden hour on the Seine", location_name: "Paris", yearsAgo: 1, photo: "photo-1502602898657-3e91760cbb34" },
    { id: "d2", title: "Cherry blossoms in Maruyama Park", location_name: "Kyoto", yearsAgo: 2, photo: "photo-1522383225653-ed111181a951" },
    { id: "d3", title: "Chasing the northern lights", location_name: "Reykjavik", yearsAgo: 3, photo: "photo-1483347756197-71ef80e95f73" },
    { id: "d4", title: "First night in Istanbul", location_name: "Istanbul", yearsAgo: 4, photo: "photo-1524231757912-21f4fe3a7200" },
    { id: "d5", title: "Sunrise at the old harbour", location_name: "Valletta", yearsAgo: 5, photo: "photo-1507525428034-b723cf961d3e" },
  ].map((m) => ({
    id: m.id,
    title: m.title,
    location_name: m.location_name,
    cover_url: img(m.photo),
    cover_kind: "image" as const,
    yearsAgo: m.yearsAgo,
    href: "/demo",
  }));

  const card = (id: string, title: string, daysAgo: number, photo: string, place: string): MemoryCardData => ({
    id,
    title,
    memory_date: iso(daysAgo, now),
    location_name: place,
    is_favorite: false,
    cover_url: img(photo),
    cover_kind: "image",
    media_count: 1,
  });

  const recent: MemoryCardData[] = [
    card("r1", "Lake morning, Banff", 0, "photo-1506905925346-21bda4d32df4", "Banff"),
    card("r2", "Pixel's afternoon nap", 3, "photo-1514888286974-6c03e2ca1dba", "Lisbon"),
    card("r3", "Skyline at dusk", 7, "photo-1480714378408-67cf0d13bc1b", "New York"),
    card("r4", "Neon Nights festival", 14, "photo-1459749411175-04bf5292ceea", "Berlin"),
    card("r5", "Cabin weekend", 30, "photo-1470071459604-3b5ec3a7fe05", "Alps"),
  ];

  const stats: JourneyStats = {
    total: 247,
    favorites: 38,
    years: 6,
    places: 47,
    monthly: [9, 14, 11, 17, 22, 18, 25, 20, 23, 19, 21, 12],
    thisMonth: 12,
  };

  return (
    <AppShell demo user={{ name: "Maya Lindqvist", email: "maya@example.com" }}>
      <Container>
        <p className="mb-5 rounded-2xl border border-accent-2/30 bg-accent/10 px-5 py-3 text-sm text-accent-3">
          <strong className="font-semibold">Design preview.</strong> Sample content for a fictional user, Maya
          Lindqvist (photographer, Lisbon). It&apos;s not your data and nothing here is saved.
        </p>
        <HomeView demo onThisDay={onThisDay} recent={recent} stats={stats} today={now} />
      </Container>
    </AppShell>
  );
}
