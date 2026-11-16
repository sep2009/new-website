import { AppShell, Container } from "@/components/layout/AppShell";
import { JourneyView } from "@/components/journey/JourneyView";
import { Button } from "@/components/ui/Button";
import type { JourneyEntry, JourneyYear } from "@/lib/memories/queries";
import { Plus } from "lucide-react";

export const metadata = { title: "Demo · Journey" };

/** SAMPLE PREVIEW ONLY: fictional persona Maya Lindqvist. Not real data. */
const img = (id: string) => `https://images.unsplash.com/${id}?w=900&q=70&auto=format&fit=crop`;

const ALL: JourneyEntry[] = [
  { id: "1", title: "Golden hour on the Seine", memory_date: "2025-06-14", location_name: "Paris", excerpt: "We walked along the river until the sky turned copper. Pixel would have hated the crowds, but I loved every one of them.", cover_url: img("photo-1502602898657-3e91760cbb34") },
  { id: "2", title: "Cherry blossoms in Maruyama Park", memory_date: "2025-04-04", location_name: "Kyoto", excerpt: "Petals everywhere. A stranger shared her tea and we talked for an hour about nothing and everything.", cover_url: img("photo-1522383225653-ed111181a951") },
  { id: "3", title: "Studio opening night", memory_date: "2025-02-21", location_name: "Lisbon", excerpt: "Three years of saving, one wall of prints. Mum cried before I did.", cover_url: img("photo-1480714378408-67cf0d13bc1b") },
  { id: "4", title: "Chasing the northern lights", memory_date: "2024-11-09", location_name: "Reykjavik", excerpt: "Minus nine, a thermos of cocoa, and a sky that finally cooperated at 1 a.m.", cover_url: img("photo-1483347756197-71ef80e95f73") },
  { id: "5", title: "First big exhibition", memory_date: "2024-05-18", location_name: "Porto", excerpt: "My photographs on a real gallery wall. I stood in the corner and watched people look.", cover_url: img("photo-1507525428034-b723cf961d3e") },
  { id: "6", title: "Graduation day", memory_date: "2023-07-02", location_name: "Lisbon", excerpt: "Cap, gown, a very loud family, and a promise to keep the camera moving.", cover_url: img("photo-1524231757912-21f4fe3a7200") },
  { id: "7", title: "First night in Istanbul", memory_date: "2022-09-12", location_name: "Istanbul", excerpt: "Call to prayer drifting over the rooftops while I ate the best simit of my life.", cover_url: img("photo-1506905925346-21bda4d32df4") },
];

export default async function DemoJourney({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const { year } = await searchParams;
  const y = /^\d{4}$/.test(year ?? "") ? Number(year) : undefined;

  const counts = new Map<number, number>();
  ALL.forEach((e) => counts.set(Number(e.memory_date.slice(0, 4)), (counts.get(Number(e.memory_date.slice(0, 4))) ?? 0) + 1));
  const years: JourneyYear[] = [...counts.entries()].map(([year, count]) => ({ year, count }));
  const entries = y ? ALL.filter((e) => e.memory_date.startsWith(String(y))) : ALL;

  return (
    <AppShell demo user={{ name: "Maya Lindqvist", email: "maya@example.com" }}>
      <Container>
        <p className="mb-5 rounded-2xl border border-accent-2/30 bg-accent/10 px-5 py-3 text-sm text-accent-3">
          <strong className="font-semibold">Design preview.</strong> Sample content for a fictional user, Maya
          Lindqvist. Not your data.
        </p>
        <JourneyView
          entries={entries}
          years={years}
          selectedYear={y}
          total={entries.length}
          basePath="/demo/journey"
          entryHref={() => "/demo/journey"}
          action={
            <Button variant="secondary" disabled>
              <Plus className="size-4" /> Add memories
            </Button>
          }
        />
      </Container>
    </AppShell>
  );
}
