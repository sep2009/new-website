import { DemoFrame } from "@/components/demo/DemoFrame";
import { RecapBuilder, type SavedRecap } from "@/components/features/RecapBuilder";
import { DEMO_RECAP } from "@/lib/demo-data";

export const metadata = { title: "Demo · Life Recap" };

const saved: SavedRecap[] = [
  { id: "r1", title: "My 2024: A Year to Remember", period_start: "2024-01-01", period_end: "2024-12-31", created_at: "2025-01-02T09:00:00Z" },
];

export default function DemoRecap() {
  return (
    <DemoFrame>
      <RecapBuilder demo years={[2026, 2025, 2024, 2023, 2022, 2021]} saved={saved} sample={DEMO_RECAP} />
    </DemoFrame>
  );
}
