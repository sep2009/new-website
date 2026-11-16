import { Container } from "@/components/layout/AppShell";
import { AddToJourney } from "@/components/journey/AddToJourney";
import { JourneyView } from "@/components/journey/JourneyView";
import { listJourney, listJourneyYears } from "@/lib/memories/queries";

export const metadata = { title: "My Journey" };

const PAGE = 40;

export default async function JourneyPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; limit?: string }>;
}) {
  const sp = await searchParams;
  const year = /^\d{4}$/.test(sp.year ?? "") ? Number(sp.year) : undefined;
  const limit = Math.min(Math.max(Number(sp.limit) || PAGE, PAGE), 400);

  const [{ entries, total, error }, years] = await Promise.all([listJourney({ year, limit }), listJourneyYears()]);

  const more = new URLSearchParams();
  if (year) more.set("year", String(year));
  more.set("limit", String(limit + PAGE));

  return (
    <Container>
      <JourneyView
        entries={entries}
        years={years}
        selectedYear={year}
        total={total}
        basePath="/journey"
        entryHref={(id) => `/memories/${id}`}
        moreHref={`/journey?${more.toString()}`}
        action={<AddToJourney />}
        loadError={!!error}
      />
    </Container>
  );
}
