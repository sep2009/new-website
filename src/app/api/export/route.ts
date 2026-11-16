import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const SEVEN_DAYS = 60 * 60 * 24 * 7;

/**
 * Download everything the signed-in person has saved, as JSON.
 * Authorisation: the person is identified from their session, never from the request.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const [profile, prefs] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("user_preferences").select("*").eq("user_id", user.id).maybeSingle(),
  ]);

  // Row Level Security limits all of these to the caller's own rows.
  const memories: Record<string, unknown>[] = [];
  for (let from = 0; from < 20000; from += 1000) {
    const { data, error } = await supabase
      .from("memories")
      .select("*, memory_media(*)")
      .order("memory_date", { ascending: true })
      .range(from, from + 999);
    if (error) return NextResponse.json({ error: "Couldn't read your memories." }, { status: 500 });
    memories.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }

  // Short-lived signed links so files can be downloaded without exposing the private bucket.
  const paths = memories.flatMap((m) =>
    ((m.memory_media as { storage_path: string }[]) ?? []).map((x) => x.storage_path),
  );
  const urlByPath = new Map<string, string>();
  for (let i = 0; i < paths.length; i += 200) {
    const { data } = await supabase.storage.from("memories").createSignedUrls(paths.slice(i, i + 200), SEVEN_DAYS);
    data?.forEach((d) => d.path && d.signedUrl && urlByPath.set(d.path, d.signedUrl));
  }
  for (const m of memories) {
    for (const x of (m.memory_media as { storage_path: string; download_url?: string }[]) ?? []) {
      x.download_url = urlByPath.get(x.storage_path);
    }
  }

  const body = {
    exported_at: new Date().toISOString(),
    note: "File links in download_url expire 7 days after export. Download your files before then.",
    account: { id: user.id, email: user.email, created_at: user.created_at },
    profile: profile.data,
    preferences: prefs.data,
    memories,
  };

  return new NextResponse(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="lifearchive-export-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
