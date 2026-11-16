/**
 * SAMPLE DATA for the design preview only: a fictional persona, Maya Lindqvist (29, photographer, Lisbon).
 * Never read from or written to the database.
 */
import type { MapMemory } from "@/lib/memories/queries";
import type { RecapMemory } from "@/lib/recap";

const img = (id: string, w = 900) => `https://images.unsplash.com/${id}?w=${w}&q=70&auto=format&fit=crop`;

type Seed = [id: string, title: string, date: string, place: string, lat: number, lng: number, photo: string, note: string, tags: string[], fav: boolean];

const SEEDS: Seed[] = [
  ["1", "Golden hour on the Seine", "2025-06-14", "Paris, France", 48.8566, 2.3522, "photo-1502602898657-3e91760cbb34", "We walked along the river until the sky turned copper. Pixel would have hated the crowds, but I loved every one of them.", ["travel", "paris"], true],
  ["2", "Café by the Louvre", "2025-06-15", "Paris, France", 48.8606, 2.3376, "photo-1502602898657-3e91760cbb34", "Croissants, a notebook and a very long people-watching session.", ["travel", "paris"], false],
  ["3", "Cherry blossoms in Maruyama Park", "2025-04-04", "Kyoto, Japan", 35.0116, 135.7681, "photo-1522383225653-ed111181a951", "Petals everywhere. A stranger shared her tea and we talked for an hour about nothing and everything.", ["travel", "spring"], true],
  ["4", "Studio opening night", "2025-02-21", "Lisbon, Portugal", 38.7223, -9.1393, "photo-1480714378408-67cf0d13bc1b", "Three years of saving, one wall of prints. Mum cried before I did.", ["milestone", "work"], true],
  ["5", "Sunday at the Feira da Ladra", "2024-09-08", "Lisbon, Portugal", 38.7166, -9.1259, "photo-1480714378408-67cf0d13bc1b", "Found a 1960s lens for six euros.", ["lisbon", "photography"], false],
  ["6", "Pixel's afternoon nap", "2026-11-11", "Lisbon, Portugal", 38.7253, -9.15, "photo-1514888286974-6c03e2ca1dba", "Sunbeam, sofa, zero responsibilities.", ["pixel", "home"], false],
  ["7", "Chasing the northern lights", "2024-11-09", "Reykjavik, Iceland", 64.1466, -21.9426, "photo-1483347756197-71ef80e95f73", "Minus nine, a thermos of cocoa, and a sky that finally cooperated at 1 a.m.", ["travel", "night"], true],
  ["8", "First big exhibition", "2024-05-18", "Porto, Portugal", 41.1579, -8.6291, "photo-1507525428034-b723cf961d3e", "My photographs on a real gallery wall. I stood in the corner and watched people look.", ["milestone", "work"], true],
  ["9", "First night in Istanbul", "2022-09-12", "Istanbul, Türkiye", 41.0082, 28.9784, "photo-1524231757912-21f4fe3a7200", "Call to prayer drifting over the rooftops while I ate the best simit of my life.", ["travel"], false],
  ["10", "Lake morning", "2026-10-02", "Banff, Canada", 51.1784, -115.5708, "photo-1506905925346-21bda4d32df4", "Mist on the water before anyone else was awake.", ["travel", "nature"], false],
  ["11", "Skyline at dusk", "2023-10-21", "New York, USA", 40.7128, -74.006, "photo-1480714378408-67cf0d13bc1b", "", ["city"], false],
  ["12", "Neon Nights festival", "2026-10-30", "Berlin, Germany", 52.52, 13.405, "photo-1459749411175-04bf5292ceea", "Lost my voice by midnight and didn't care.", ["music", "friends"], false],
  ["13", "Sunrise at the old harbour", "2021-06-03", "Valletta, Malta", 35.8989, 14.5146, "photo-1507525428034-b723cf961d3e", "", ["travel"], false],
];

export const DEMO_MAP: MapMemory[] = SEEDS.map(([id, title, date, place, lat, lng, photo]) => ({
  id, title, memory_date: date, location_name: place, latitude: lat, longitude: lng, cover_url: img(photo, 300),
}));

export const DEMO_RECAP: RecapMemory[] = SEEDS.map(([id, title, date, place, , , photo, note, tags, fav]) => ({
  id, title, memory_date: date, location_name: place, note: note || null, tags, is_favorite: fav,
  cover_url: img(photo, 400), full_url: img(photo, 1600),
}));

export const DEMO_OTD = [
  { id: "d1", title: "Golden hour on the Seine", location_name: "Paris", yearsAgo: 1, photo: "photo-1502602898657-3e91760cbb34", excerpt: "We walked along the river until the sky turned copper." },
  { id: "d2", title: "Cherry blossoms in Maruyama Park", location_name: "Kyoto", yearsAgo: 2, photo: "photo-1522383225653-ed111181a951", excerpt: "A stranger shared her tea and we talked for an hour." },
  { id: "d3", title: "Chasing the northern lights", location_name: "Reykjavik", yearsAgo: 3, photo: "photo-1483347756197-71ef80e95f73", excerpt: "A thermos of cocoa and a sky that finally cooperated." },
  { id: "d4", title: "First night in Istanbul", location_name: "Istanbul", yearsAgo: 4, photo: "photo-1524231757912-21f4fe3a7200", excerpt: "Call to prayer drifting over the rooftops." },
  { id: "d5", title: "Sunrise at the old harbour", location_name: "Valletta", yearsAgo: 5, photo: "photo-1507525428034-b723cf961d3e", excerpt: null },
].map((m) => ({ ...m, cover_url: img(m.photo, 1400) }));
