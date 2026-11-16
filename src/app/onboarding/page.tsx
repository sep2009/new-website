import { redirect } from "next/navigation";
import { LogoMark } from "@/components/brand/Logo";
import { OnboardingForm } from "@/components/auth/OnboardingForm";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Welcome" };

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarded, display_name")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.onboarded) redirect("/home");

  const first = profile?.display_name?.split(" ")[0];

  return (
    <div className="min-h-dvh bg-ambient px-5 py-10 sm:px-10">
      <div className="mx-auto max-w-2xl">
        <LogoMark className="size-9" />
        <h1 className="type-title mt-10">{first ? `Welcome, ${first}.` : "Welcome."}</h1>
        <p className="type-body mb-12 mt-2 text-fg-muted">
          Two quick questions so LifeArchive feels like yours. You can skip this.
        </p>
        <OnboardingForm userId={user.id} />
      </div>
    </div>
  );
}
