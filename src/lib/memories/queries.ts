import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isUuid } from "./format";
import type { Memory, MemoryCardData, MemoryMedia, SignedMedia } from "./types";

const BUCKET = "memories";
const SIGNED_TTL = 60 * 60; // 1 hour

export type GalleryFilter = "all" | "photos" | "videos" | "favorites";
export type GallerySort = "newest" | "oldest";

export type GalleryParams = {
  q?: string;
  filter?: GalleryFilter;
  sort?: GallerySort;
  year?: number;
  limit?: number;
};

type Row = Pick<Memory, "id" | "title" | "memory_date" | "location_name" | "is_favorite"> & {
  memory_media: Pick<MemoryMedia, "id" | "kind" | "storage_path" | "thumb_path" | "sort_order">[];
};

/** Strip characters that have meaning inside a PostgREST filter expression. */
function cleanTerm(q: string) {
  return q.replace(/[%*,()"\\{}]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}

export async function signPaths(paths: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const unique = [...new Set(paths.filter(Boolean))];
  if (unique.length === 0) return out;
  const supabase = await createClient();
  const { data } = await supabase.storage.from(BUCKET).createSignedUrls(unique, SIGNED_TTL);
  data?.forEach((d) => {
    if (d.path && d.signedUrl) out.set(d.path, d.signedUrl);
  });
  return out;
}

export async function listMemories(p: GalleryParams) {
  const supabase = await createClient();
  const filter = p.filter ?? "all";
  const limit = Math.min(Math.max(p.limit ?? 48, 1), 500);
  const needsInner = filter === "photos" || filter === "videos";

  const mediaCols = "id,kind,storage_path,thumb_path,sort_order";
  const select = `id,title,memory_date,location_name,is_favorite,memory_media${
    needsInner ? "!inner" : ""
  }(${mediaCols})`;

  let query = supabase.from("memories").select(select, { count: "exact" });

  if (filter === "photos") query = query.eq("memory_media.kind", "image");
  if (filter === "videos") query = query.eq("memory_media.kind", "video");
  if (filter === "favorites") query = query.eq("is_favorite", true);

  if (p.year) {
    query = query.gte("memory_date", `${p.year}-01-01`).lte("memory_date", `${p.year}-12-31`);
  }

  const term = cleanTerm(p.q ?? "");
  if (term) {
    query = query.or(
      `title.ilike.%${term}%,note.ilike.%${term}%,location_name.ilike.%${term}%,tags.cs.{"${term.toLowerCase()}"}`,
    );
  }

  const asc = p.sort === "oldest";
  query = query
    .order("memory_date", { ascending: asc })
    .order("created_at", { ascending: asc })
    .limit(limit);

  const { data, error, count } = await query;
  if (error) return { error: error.message, memories: [] as MemoryCardData[], total: 0 };

  const rows = (data ?? []) as unknown as Row[];
  const covers = rows.map((r) => [...r.memory_media].sort((a, b) => a.sort_order - b.sort_order)[0]);
  const urls = await signPaths(covers.map((c) => (c ? (c.thumb_path ?? c.storage_path) : "")));

  const memories: MemoryCardData[] = rows.map((r, i) => {
    const c = covers[i];
    const path = c ? (c.thumb_path ?? c.storage_path) : "";
    return {
      id: r.id,
      title: r.title,
      memory_date: r.memory_date,
      location_name: r.location_name,
      is_favorite: r.is_favorite,
      cover_url: urls.get(path) ?? null,
      cover_kind: c?.kind ?? null,
      media_count: r.memory_media.length,
    };
  });

  return { error: null, memories, total: count ?? memories.length };
}

/** Distinct years that have memories, newest first (for the year filter). */
export async function listMemoryYears(): Promise<number[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("memories")
    .select("memory_date")
    .order("memory_date", { ascending: false })
    .limit(5000);
  const years = new Set((data ?? []).map((r) => Number(r.memory_date.slice(0, 4))));
  return [...years];
}

export async function getMemory(id: string) {
  if (!isUuid(id)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("memories")
    .select("*, memory_media(*)")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;

  const { memory_media, ...memory } = data as Memory & { memory_media: MemoryMedia[] };
  const sorted = [...memory_media].sort((a, b) => a.sort_order - b.sort_order);
  const urls = await signPaths(sorted.flatMap((m) => [m.storage_path, m.thumb_path ?? ""]));

  const media: SignedMedia[] = sorted.map((m) => ({
    ...m,
    url: urls.get(m.storage_path) ?? "",
    thumb_url: m.thumb_path ? (urls.get(m.thumb_path) ?? null) : null,
  }));

  return { memory: memory as Memory, media };
}

/** Bytes used and allowed for the signed-in user. Null if the database isn't set up yet. */
export async function getStorageUsage(): Promise<{ used: number; limit: number } | null> {
  const supabase = await createClient();
  const [used, limit] = await Promise.all([
    supabase.rpc("my_storage_used"),
    supabase.rpc("storage_limit_bytes"),
  ]);
  if (used.error || limit.error) return null;
  return { used: Number(used.data ?? 0), limit: Number(limit.data ?? 0) };
}

export type OnThisDay = {
  id: string;
  title: string;
  memory_date: string;
  location_name: string | null;
  excerpt: string | null;
  cover_url: string | null;
  cover_kind: "image" | "video" | null;
  yearsAgo: number;
};

/**
 * Memories from the same calendar day in earlier years (newest year first, up to `max`).
 * Matching is by month and day, so it works across any number of years.
 */
export async function getOnThisDay(max = 5, now: Date = new Date()): Promise<OnThisDay[]> {
  const supabase = await createClient();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const thisYear = now.getFullYear();

  const { data, error } = await supabase
    .from("memories")
    .select("id, memory_date")
    .order("memory_date", { ascending: false })
    .limit(5000);
  if (error || !data) return [];

  const ids = data
    .filter((r) => r.memory_date.slice(5) === `${month}-${day}` && Number(r.memory_date.slice(0, 4)) < thisYear)
    .slice(0, max)
    .map((r) => r.id);
  if (ids.length === 0) return [];

  const { data: rows } = await supabase
    .from("memories")
    .select("id, title, memory_date, location_name, note, memory_media(kind, storage_path, thumb_path, sort_order)")
    .in("id", ids)
    .order("memory_date", { ascending: false });
  if (!rows) return [];

  type M = Pick<MemoryMedia, "kind" | "storage_path" | "thumb_path" | "sort_order">;
  const covers = rows.map((r) => [...(r.memory_media as M[])].sort((a, b) => a.sort_order - b.sort_order)[0]);
  // Full-size file for images: these are large feature slots.
  const pathOf = (c?: M) => (c ? (c.kind === "image" ? c.storage_path : (c.thumb_path ?? "")) : "");
  const urls = await signPaths(covers.map(pathOf));

  return rows.map((r, i) => ({
    id: r.id,
    title: r.title,
    memory_date: r.memory_date,
    location_name: r.location_name,
    excerpt: excerptOf(r.note),
    cover_url: urls.get(pathOf(covers[i])) ?? null,
    cover_kind: covers[i]?.kind ?? null,
    yearsAgo: thisYear - Number(r.memory_date.slice(0, 4)),
  }));
}

export type JourneyStats = {
  total: number;
  favorites: number;
  years: number;
  places: number;
  /** Memories per month for the last 12 months, oldest first. */
  monthly: number[];
  thisMonth: number;
};

/** Honest, countable numbers about the person's archive (no scores). */
export async function getJourneyStats(now: Date = new Date()): Promise<JourneyStats> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("memories")
    .select("memory_date, location_name, is_favorite")
    .limit(5000);
  const rows = data ?? [];

  const years = new Set<string>();
  const places = new Set<string>();
  const monthly = Array<number>(12).fill(0);
  let favorites = 0;

  for (const r of rows) {
    years.add(r.memory_date.slice(0, 4));
    if (r.location_name) places.add(r.location_name.trim().toLowerCase());
    if (r.is_favorite) favorites++;
    const y = Number(r.memory_date.slice(0, 4));
    const m = Number(r.memory_date.slice(5, 7)) - 1;
    const back = (now.getFullYear() - y) * 12 + (now.getMonth() - m);
    if (back >= 0 && back < 12) monthly[11 - back]++;
  }

  return {
    total: rows.length,
    favorites,
    years: years.size,
    places: places.size,
    monthly,
    thisMonth: monthly[11],
  };
}

export type JourneyEntry = {
  id: string;
  title: string;
  memory_date: string;
  location_name: string | null;
  /** First ~160 characters of the note. */
  excerpt: string | null;
  cover_url: string | null;
};

export type JourneyYear = { year: number; count: number };

const excerptOf = (note: string | null) => {
  if (!note) return null;
  const t = note.replace(/\s+/g, " ").trim();
  return t.length > 160 ? `${t.slice(0, 157).trimEnd()}…` : t;
};

/** Years that have Journey entries, newest first, with counts (for the year navigation). */
export async function listJourneyYears(): Promise<JourneyYear[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("memories")
    .select("memory_date")
    .eq("in_journey", true)
    .order("memory_date", { ascending: false })
    .limit(5000);
  const counts = new Map<number, number>();
  (data ?? []).forEach((r) => {
    const y = Number(r.memory_date.slice(0, 4));
    counts.set(y, (counts.get(y) ?? 0) + 1);
  });
  return [...counts.entries()].map(([year, count]) => ({ year, count }));
}

/** Memories on the person's Journey, newest first. Optionally one year; paginated by `limit`. */
export async function listJourney(p: { year?: number; limit?: number }) {
  const supabase = await createClient();
  const limit = Math.min(Math.max(p.limit ?? 40, 1), 400);

  let query = supabase
    .from("memories")
    .select("id,title,memory_date,location_name,note,memory_media(kind,storage_path,thumb_path,sort_order)", {
      count: "exact",
    })
    .eq("in_journey", true);
  if (p.year) query = query.gte("memory_date", `${p.year}-01-01`).lte("memory_date", `${p.year}-12-31`);
  query = query.order("memory_date", { ascending: false }).order("created_at", { ascending: false }).limit(limit);

  const { data, error, count } = await query;
  if (error) return { error: error.message, entries: [] as JourneyEntry[], total: 0 };

  type M = Pick<MemoryMedia, "kind" | "storage_path" | "thumb_path" | "sort_order">;
  const rows = data as unknown as (Pick<Memory, "id" | "title" | "memory_date" | "location_name" | "note"> & {
    memory_media: M[];
  })[];
  const covers = rows.map((r) => [...r.memory_media].sort((a, b) => a.sort_order - b.sort_order)[0]);
  const pathOf = (c?: M) => (c ? (c.thumb_path ?? (c.kind === "image" ? c.storage_path : "")) : "");
  const urls = await signPaths(covers.map(pathOf));

  const entries: JourneyEntry[] = rows.map((r, i) => ({
    id: r.id,
    title: r.title,
    memory_date: r.memory_date,
    location_name: r.location_name,
    excerpt: excerptOf(r.note),
    cover_url: urls.get(pathOf(covers[i])) ?? null,
  }));
  return { error: null, entries, total: count ?? entries.length };
}

export type MapMemory = {
  id: string;
  title: string;
  memory_date: string;
  location_name: string | null;
  latitude: number | null;
  longitude: number | null;
  cover_url: string | null;
};

/** Memories that have a place name and/or coordinates. Coordinates stay private to the owner. */
export async function listMapMemories(): Promise<{ memories: MapMemory[]; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("memories")
    .select("id,title,memory_date,location_name,latitude,longitude,memory_media(kind,storage_path,thumb_path,sort_order)")
    .or("location_name.not.is.null,latitude.not.is.null")
    .order("memory_date", { ascending: false })
    .limit(2000);
  if (error) return { memories: [], error: error.message };

  type M = Pick<MemoryMedia, "kind" | "storage_path" | "thumb_path" | "sort_order">;
  const rows = data as unknown as (Omit<MapMemory, "cover_url"> & { memory_media: M[] })[];
  const covers = rows.map((r) => [...r.memory_media].sort((a, b) => a.sort_order - b.sort_order)[0]);
  const pathOf = (c?: M) => (c ? (c.thumb_path ?? (c.kind === "image" ? c.storage_path : "")) : "");
  const urls = await signPaths(covers.map(pathOf));

  return {
    error: null,
    memories: rows.map((r, i) => ({
      id: r.id,
      title: r.title,
      memory_date: r.memory_date,
      location_name: r.location_name,
      latitude: r.latitude,
      longitude: r.longitude,
      cover_url: urls.get(pathOf(covers[i])) ?? null,
    })),
  };
}
