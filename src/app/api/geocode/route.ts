import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BATCH = 12; // distinct place names per request (Nominatim allows ~1 request per second)

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Finds map coordinates for the signed-in person's place names.
 * Only the place TEXT is sent to OpenStreetMap's Nominatim search: no account, memory or photo data.
 * It runs only when the person asks for it on the Map page. Results are saved on their own memories.
 */
export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== request.headers.get("host")) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  // Names the page already failed to find in this session, so they aren't retried in a loop.
  const body = (await request.json().catch(() => ({}))) as { skip?: unknown };
  const skip = new Set(
    Array.isArray(body.skip) ? body.skip.filter((n): n is string => typeof n === "string").slice(0, 300) : [],
  );

  // Row Level Security limits this to the caller's own memories.
  const { data, error } = await supabase
    .from("memories")
    .select("id,location_name")
    .is("latitude", null)
    .not("location_name", "is", null)
    .limit(500);
  if (error) return NextResponse.json({ error: "Couldn't read your memories." }, { status: 500 });

  const byName = new Map<string, string[]>();
  for (const r of data ?? []) {
    const name = (r.location_name ?? "").trim().slice(0, 160);
    if (!name || skip.has(name)) continue;
    byName.set(name, [...(byName.get(name) ?? []), r.id]);
  }

  const names = [...byName.keys()];
  const batch = names.slice(0, BATCH);
  let located = 0;
  const notFound: string[] = [];

  for (const [i, name] of batch.entries()) {
    if (i > 0) await sleep(1100);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(name)}`,
        {
          headers: { "User-Agent": "LifeArchive-app/1.0", "Accept-Language": "en" },
          signal: AbortSignal.timeout(8000),
        },
      );
      if (!res.ok) throw new Error(`status ${res.status}`);
      const hits = (await res.json()) as { lat: string; lon: string }[];
      const hit = hits[0];
      const lat = hit ? Number(hit.lat) : NaN;
      const lon = hit ? Number(hit.lon) : NaN;
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        notFound.push(name);
        continue;
      }
      const { error: upErr } = await supabase
        .from("memories")
        .update({ latitude: lat, longitude: lon })
        .in("id", byName.get(name)!);
      if (upErr) throw upErr;
      located += byName.get(name)!.length;
    } catch {
      notFound.push(name);
    }
  }

  return NextResponse.json({
    located,
    notFound,
    remaining: Math.max(0, names.length - batch.length),
  });
}
