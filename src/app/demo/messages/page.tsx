import { DemoFrame } from "@/components/demo/DemoFrame";
import { FutureMessages, type MessageRow } from "@/components/features/FutureMessages";

export const metadata = { title: "Demo · Future Messages" };

const plus = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString();

export default function DemoMessages() {
  const rows: MessageRow[] = [
    { id: "demo-ready", open_at: plus(-1), opened_at: null, created_at: plus(-365), photo_path: null },
    { id: "s1", open_at: plus(41), opened_at: null, created_at: plus(-20), photo_path: null },
    { id: "s2", open_at: plus(214), opened_at: null, created_at: plus(-3), photo_path: null },
    { id: "demo-old", open_at: plus(-290), opened_at: plus(-289), created_at: plus(-1010), photo_path: null },
  ];
  return (
    <DemoFrame>
      <FutureMessages demo userId="demo" nowIso={new Date().toISOString()} rows={rows} limit={20} />
    </DemoFrame>
  );
}
