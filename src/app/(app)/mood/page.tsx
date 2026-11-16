import { Container } from "@/components/layout/AppShell";
import { MoodTracker } from "@/components/features/MoodTracker";
import { isMonthKey, monthKey, type MoodEntry } from "@/lib/mood";
import { todayISO } from "@/lib/memories/format";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Mood Track" };

export default async function MoodPage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const { m } = await searchParams;
  const now = new Date();
  const month = isMonthKey(m) ? m : monthKey(now);
  const [y, mo] = month.split("-").map(Number);
  const start = `${month}-01`;
  const end = `${month}-${String(new Date(y, mo, 0).getDate()).padStart(2, "0")}`;

  // Row Level Security: only the signed-in person's own entries are ever returned.
  const supabase = await createClient();
  const [monthRes, recentRes] = await Promise.all([
    supabase.from("mood_entries").select("id,entry_date,mood,note").gte("entry_date", start).lte("entry_date", end),
    supabase.from("mood_entries").select("id,entry_date,mood,note").order("entry_date", { ascending: false }).limit(14),
  ]);

  return (
    <Container>
      <MoodTracker
        key={month}
        month={month}
        today={todayISO()}
        entries={(monthRes.data ?? []) as MoodEntry[]}
        recent={(recentRes.data ?? []) as MoodEntry[]}
        basePath="/mood"
      />
    </Container>
  );
}
