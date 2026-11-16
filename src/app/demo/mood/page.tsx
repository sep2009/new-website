import { DemoFrame } from "@/components/demo/DemoFrame";
import { MoodTracker } from "@/components/features/MoodTracker";
import { todayISO } from "@/lib/memories/format";
import { monthKey, type MoodEntry, type MoodId } from "@/lib/mood";

export const metadata = { title: "Demo · Mood Track" };

const PATTERN: MoodId[] = ["calm", "happy", "happy", "tired", "excited", "calm", "stressed", "happy", "calm", "sad", "calm", "happy", "excited", "tired"];
const NOTES: Record<number, string> = {
  2: "Quiet morning shoot at the harbour. Felt like myself.",
  6: "Deadline week. Too much coffee.",
  9: "Missed home today. Called Mum.",
  12: "Gallery email came through. Still smiling.",
};

export default function DemoMood() {
  const now = new Date();
  const month = monthKey(now);
  const today = todayISO();
  const entries: MoodEntry[] = Array.from({ length: now.getDate() }, (_, i) => i + 1)
    .filter((d) => d % 3 !== 0)
    .map((d) => ({ id: `m${d}`, entry_date: `${month}-${String(d).padStart(2, "0")}`, mood: PATTERN[d % PATTERN.length], note: NOTES[d] ?? null }));
  const recent = [...entries].sort((a, b) => b.entry_date.localeCompare(a.entry_date)).slice(0, 14);

  return (
    <DemoFrame>
      <MoodTracker demo month={month} today={today} entries={entries} recent={recent} basePath="/demo/mood" />
    </DemoFrame>
  );
}
