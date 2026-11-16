import { AppShell, Container, PageHeader } from "@/components/layout/AppShell";
import { MemoryMap } from "@/components/map/MemoryMap";
import type { MapMemory } from "@/lib/memories/queries";

export const metadata = { title: "Demo · Memory Map" };

/** SAMPLE PREVIEW ONLY: fictional persona Maya Lindqvist. Not real data. */
const img = (id: string) => `https://images.unsplash.com/${id}?w=300&q=70&auto=format&fit=crop`;

const M = (
  id: string,
  title: string,
  date: string,
  place: string,
  lat: number,
  lng: number,
  photo: string,
): MapMemory => ({
  id,
  title,
  memory_date: date,
  location_name: place,
  latitude: lat,
  longitude: lng,
  cover_url: img(photo),
});

const SAMPLE: MapMemory[] = [
  M("1", "Golden hour on the Seine", "2025-06-14", "Paris, France", 48.8566, 2.3522, "photo-1502602898657-3e91760cbb34"),
  M("2", "Café by the Louvre", "2025-06-15", "Paris, France", 48.8606, 2.3376, "photo-1502602898657-3e91760cbb34"),
  M("3", "Cherry blossoms in Maruyama Park", "2025-04-04", "Kyoto, Japan", 35.0116, 135.7681, "photo-1522383225653-ed111181a951"),
  M("4", "Studio opening night", "2025-02-21", "Lisbon, Portugal", 38.7223, -9.1393, "photo-1480714378408-67cf0d13bc1b"),
  M("5", "Sunday at the Feira da Ladra", "2024-09-08", "Lisbon, Portugal", 38.7166, -9.1259, "photo-1480714378408-67cf0d13bc1b"),
  M("6", "Pixel's afternoon nap", "2026-11-11", "Lisbon, Portugal", 38.7253, -9.15, "photo-1514888286974-6c03e2ca1dba"),
  M("7", "Chasing the northern lights", "2024-11-09", "Reykjavik, Iceland", 64.1466, -21.9426, "photo-1483347756197-71ef80e95f73"),
  M("8", "First big exhibition", "2024-05-18", "Porto, Portugal", 41.1579, -8.6291, "photo-1507525428034-b723cf961d3e"),
  M("9", "First night in Istanbul", "2022-09-12", "Istanbul, Türkiye", 41.0082, 28.9784, "photo-1524231757912-21f4fe3a7200"),
  M("10", "Lake morning", "2026-10-02", "Banff, Canada", 51.1784, -115.5708, "photo-1506905925346-21bda4d32df4"),
  M("11", "Skyline at dusk", "2023-10-21", "New York, USA", 40.7128, -74.006, "photo-1480714378408-67cf0d13bc1b"),
  M("12", "Neon Nights festival", "2026-10-30", "Berlin, Germany", 52.52, 13.405, "photo-1459749411175-04bf5292ceea"),
  M("13", "Sunrise at the old harbour", "2021-06-03", "Valletta, Malta", 35.8989, 14.5146, "photo-1507525428034-b723cf961d3e"),
];

export default function DemoMap() {
  return (
    <AppShell demo user={{ name: "Maya Lindqvist", email: "maya@example.com" }}>
      <Container>
        <p className="mb-5 rounded-2xl border border-accent-2/30 bg-accent/10 px-5 py-3 text-sm text-accent-3">
          <strong className="font-semibold">Design preview.</strong> Sample places for a fictional user, Maya Lindqvist.
          Not your data.
        </p>
        <PageHeader title="Memory Map" subtitle="Explore your memories around the world." />
        <MemoryMap memories={SAMPLE} demo />
      </Container>
    </AppShell>
  );
}
