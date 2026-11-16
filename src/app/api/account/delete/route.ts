import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Client = Awaited<ReturnType<typeof createClient>>;

/** Every stored file under a folder, walking sub-folders. */
async function listAll(supabase: Client, prefix: string): Promise<string[]> {
  const out: string[] = [];
  for (let offset = 0; ; offset += 100) {
    const { data, error } = await supabase.storage
      .from("memories")
      .list(prefix, { limit: 100, offset, sortBy: { column: "name", order: "asc" } });
    if (error) throw error;
    if (!data?.length) break;
    for (const f of data) {
      if (f.id) out.push(`${prefix}/${f.name}`); // a file
      else out.push(...(await listAll(supabase, `${prefix}/${f.name}`))); // a folder
    }
    if (data.length < 100) break;
  }
  return out;
}

/**
 * Permanently delete the signed-in person's account.
 * 1. Same-origin check. 2. Typed confirmation (+ password re-check). 3. Remove stored files.
 * 4. Delete the auth user via a SECURITY DEFINER function, which cascades to all rows.
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

  const { confirm, password } = (await request.json().catch(() => ({}))) as { confirm?: string; password?: string };
  if (confirm !== "DELETE") return NextResponse.json({ error: "Type DELETE to confirm." }, { status: 400 });

  const providers = (user.app_metadata?.providers as string[] | undefined) ?? [user.app_metadata?.provider ?? "email"];
  if (providers.includes("email")) {
    if (!password || !user.email) return NextResponse.json({ error: "Enter your password to confirm." }, { status: 400 });
    const { error } = await supabase.auth.signInWithPassword({ email: user.email, password });
    if (error) return NextResponse.json({ error: "That password isn't correct." }, { status: 403 });
  }

  try {
    const files = await listAll(supabase, user.id);
    for (let i = 0; i < files.length; i += 100) {
      const { error } = await supabase.storage.from("memories").remove(files.slice(i, i + 100));
      if (error) throw error;
    }
  } catch {
    return NextResponse.json(
      { error: "We couldn't remove your files, so nothing was deleted. Please try again." },
      { status: 500 },
    );
  }

  const { error } = await supabase.rpc("delete_my_account");
  if (error) {
    return NextResponse.json(
      { error: "We couldn't delete your account. If this keeps happening, contact support." },
      { status: 500 },
    );
  }

  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
