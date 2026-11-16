import { DemoFrame } from "@/components/demo/DemoFrame";
import { OnThisDayView } from "@/components/features/OnThisDayView";
import { DEMO_OTD } from "@/lib/demo-data";

export const metadata = { title: "Demo · On This Day" };

export default async function DemoOnThisDay({ searchParams }: { searchParams: Promise<{ ago?: string }> }) {
  const { ago } = await searchParams;
  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric" });
  const entries = DEMO_OTD.map((m) => ({ ...m, memory_date: `${new Date().getFullYear() - m.yearsAgo}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}` }));
  return (
    <DemoFrame>
      <OnThisDayView entries={entries} selected={Number(ago) || 1} basePath="/demo/on-this-day" entryHref={() => "/demo/on-this-day"} todayLabel={today} />
    </DemoFrame>
  );
}
