import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Server-side check in addition to the proxy: never trust one layer alone.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  // Name for the avatar. Falls back to the sign-up name if the profile row isn't there yet.
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();
  const { data: prefs } = await supabase
    .from("user_preferences")
    .select("reduce_motion")
    .eq("user_id", user.id)
    .maybeSingle();
  const name =
    profile?.display_name ?? (typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null);

  return (
    <AppShell user={{ name, email: user.email ?? null }} reduceMotion={!!prefs?.reduce_motion}>
      {children}
    </AppShell>
  );
}
