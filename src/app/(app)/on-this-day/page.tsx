import { Container } from "@/components/layout/AppShell";
import { OnThisDayView } from "@/components/features/OnThisDayView";
import { getOnThisDay } from "@/lib/memories/queries";

export const metadata = { title: "On This Day" };

export default async function OnThisDayPage({ searchParams }: { searchParams: Promise<{ ago?: string }> }) {
  const { ago } = await searchParams;
  const entries = await getOnThisDay(60);
  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric" });

  return (
    <Container>
      <OnThisDayView
        entries={entries}
        selected={Number(ago) || entries[0]?.yearsAgo || 1}
        basePath="/on-this-day"
        entryHref={(id) => `/memories/${id}`}
        todayLabel={today}
      />
    </Container>
  );
}
