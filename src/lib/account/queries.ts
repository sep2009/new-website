import "server-only";
import { DEFAULT_PREFS, type Preferences } from "@/lib/preferences";
import { createClient } from "@/lib/supabase/server";

export type Account = {
  user: { id: string; email: string | null; createdAt: string; hasPassword: boolean };
  profile: {
    display_name: string | null;
    bio: string | null;
    avatar_url: string | null;
    birth_year: number | null;
  };
  avatarSignedUrl: string | null;
  prefs: Preferences;
};

/** The signed-in person's profile and preferences (defaults fill in anything not saved yet). */
export async function getAccount(): Promise<Account | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, { data: prefs }] = await Promise.all([
    supabase.from("profiles").select("display_name,bio,avatar_url,birth_year").eq("id", user.id).maybeSingle(),
    supabase.from("user_preferences").select("*").eq("user_id", user.id).maybeSingle(),
  ]);

  let avatarSignedUrl: string | null = null;
  if (profile?.avatar_url) {
    const { data } = await supabase.storage.from("memories").createSignedUrl(profile.avatar_url, 3600);
    avatarSignedUrl = data?.signedUrl ?? null;
  }

  const providers = (user.app_metadata?.providers as string[] | undefined) ?? [user.app_metadata?.provider ?? "email"];

  return {
    user: {
      id: user.id,
      email: user.email ?? null,
      createdAt: user.created_at,
      hasPassword: providers.includes("email"),
    },
    profile: {
      display_name:
        profile?.display_name ?? (typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null),
      bio: profile?.bio ?? null,
      avatar_url: profile?.avatar_url ?? null,
      birth_year: profile?.birth_year ?? null,
    },
    avatarSignedUrl,
    prefs: { ...DEFAULT_PREFS, ...(prefs ?? {}) },
  };
}

export type ProfileOverview = {
  memories: number;
  inJourney: number;
  firstDate: string | null;
  lastDate: string | null;
};

/** Honest overview numbers for the profile page. */
export async function getProfileOverview(): Promise<ProfileOverview> {
  const supabase = await createClient();
  const [all, journey, first, last] = await Promise.all([
    supabase.from("memories").select("id", { count: "exact", head: true }),
    supabase.from("memories").select("id", { count: "exact", head: true }).eq("in_journey", true),
    supabase.from("memories").select("memory_date").order("memory_date", { ascending: true }).limit(1),
    supabase.from("memories").select("memory_date").order("memory_date", { ascending: false }).limit(1),
  ]);
  return {
    memories: all.count ?? 0,
    inJourney: journey.count ?? 0,
    firstDate: first.data?.[0]?.memory_date ?? null,
    lastDate: last.data?.[0]?.memory_date ?? null,
  };
}
