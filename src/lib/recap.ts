import { formatDate, parseDate } from "@/lib/memories/format";

export type RecapMemory = {
  id: string;
  title: string;
  memory_date: string;
  location_name: string | null;
  note: string | null;
  tags: string[];
  is_favorite: boolean;
  cover_url: string | null;
  /** Full-size image for the slideshow (falls back to cover_url). */
  full_url: string | null;
};

export type Period = { kind: "month" | "year" | "custom"; start: string; end: string };

const monthName = (d: Date) => d.toLocaleDateString("en-US", { month: "long" });

export function periodTitle(p: Period): string {
  const s = parseDate(p.start);
  if (p.kind === "year") return `My ${s.getFullYear()}: A Year to Remember`;
  if (p.kind === "month") return `My ${monthName(s)} ${s.getFullYear()}`;
  return `${formatDate(p.start)} – ${formatDate(p.end)}`;
}

export function periodLabel(p: Period): string {
  const s = parseDate(p.start);
  if (p.kind === "year") return String(s.getFullYear());
  if (p.kind === "month") return `${monthName(s)} ${s.getFullYear()}`;
  return `${formatDate(p.start)} to ${formatDate(p.end)}`;
}

const list = (items: string[]) =>
  items.length <= 1 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;

/** Memories worth highlighting: favorites first, then the ones with the longest notes. */
export function keyMoments(memories: RecapMemory[], max = 5): RecapMemory[] {
  const fav = memories.filter((m) => m.is_favorite);
  const rest = memories
    .filter((m) => !m.is_favorite && m.note)
    .sort((a, b) => (b.note?.length ?? 0) - (a.note?.length ?? 0));
  return [...fav, ...rest].slice(0, max);
}

export function placesOf(memories: RecapMemory[]): string[] {
  const counts = new Map<string, number>();
  for (const m of memories) {
    const p = m.location_name?.trim();
    if (p) counts.set(p, (counts.get(p) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([p]) => p);
}

/**
 * A short narrative written ONLY from facts in the selected memories: counts, dates, titles,
 * places and tags. It never adds events, feelings or details that aren't in the data.
 */
export function buildNarrative(memories: RecapMemory[], p: Period): string {
  if (memories.length === 0) return "";
  const sorted = [...memories].sort((a, b) => a.memory_date.localeCompare(b.memory_date));
  const n = sorted.length;
  const first = sorted[0];
  const last = sorted[n - 1];
  const parts: string[] = [];

  parts.push(`${periodLabel(p)}: you saved ${n} ${n === 1 ? "memory" : "memories"}.`);

  const places = placesOf(sorted);
  if (places.length) {
    parts.push(
      `Your memories took you to ${places.length === 1 ? "" : `${places.length} places, including `}${list(places.slice(0, 4))}.`,
    );
  }

  if (n > 1) {
    const byMonth = new Map<string, number>();
    sorted.forEach((m) => {
      const k = m.memory_date.slice(0, 7);
      byMonth.set(k, (byMonth.get(k) ?? 0) + 1);
    });
    const [bestKey, bestCount] = [...byMonth.entries()].sort((a, b) => b[1] - a[1])[0];
    if (byMonth.size > 1 && bestCount > 1) {
      const d = parseDate(`${bestKey}-01`);
      parts.push(`${monthName(d)} was your busiest month, with ${bestCount} memories.`);
    }
    parts.push(
      `It began with “${first.title}” on ${formatDate(first.memory_date, "long")} and reached “${last.title}” on ${formatDate(last.memory_date, "long")}.`,
    );
  } else {
    parts.push(`It was “${first.title}”, saved on ${formatDate(first.memory_date, "long")}.`);
  }

  const favs = sorted.filter((m) => m.is_favorite);
  if (favs.length) {
    parts.push(
      `You marked ${favs.length} as ${favs.length === 1 ? "a favorite" : "favorites"}${
        favs.length <= 3 ? `: ${list(favs.map((f) => `“${f.title}”`))}` : `, including ${list(favs.slice(0, 3).map((f) => `“${f.title}”`))}`
      }.`,
    );
  }

  const tagCounts = new Map<string, number>();
  sorted.forEach((m) => m.tags.forEach((t) => tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1)));
  const tags = [...tagCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t]) => `#${t}`);
  if (tags.length) parts.push(`The tags you reached for most: ${list(tags)}.`);

  return parts.join(" ");
}
