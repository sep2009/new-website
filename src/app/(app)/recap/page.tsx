import { Container } from "@/components/layout/AppShell";
import { RecapBuilder, type SavedRecap } from "@/components/features/RecapBuilder";
import { listMemoryYears } from "@/lib/memories/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Life Recap" };

export default async function RecapPage() {
  const supabase = await createClient();
  const [years, { data }] = await Promise.all([
    listMemoryYears(),
    supabase.from("recaps").select("id,title,period_start,period_end,created_at").order("created_at", { ascending: false }).limit(50),
  ]);

  return (
    <Container>
      <RecapBuilder years={years} saved={(data ?? []) as SavedRecap[]} />
    </Container>
  );
}
