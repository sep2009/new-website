export type MoodId = "happy" | "excited" | "calm" | "tired" | "stressed" | "sad";

export type MoodEntry = { id: string; entry_date: string; mood: MoodId; note: string | null };

export const MOODS: { id: MoodId; label: string; emoji: string; ring: string; dot: string; bar: string }[] = [
  { id: "happy", label: "Happy", emoji: "😊", ring: "border-[#ffd166]/70 bg-[#ffd166]/15", dot: "bg-[#ffd166]", bar: "bg-[#ffd166]" },
  { id: "excited", label: "Excited", emoji: "🤩", ring: "border-[#ff7eb6]/70 bg-[#ff7eb6]/15", dot: "bg-[#ff7eb6]", bar: "bg-[#ff7eb6]" },
  { id: "calm", label: "Calm", emoji: "😌", ring: "border-[#35e0c2]/70 bg-[#35e0c2]/15", dot: "bg-[#35e0c2]", bar: "bg-[#35e0c2]" },
  { id: "tired", label: "Tired", emoji: "😴", ring: "border-[#8fa3ff]/70 bg-[#8fa3ff]/15", dot: "bg-[#8fa3ff]", bar: "bg-[#8fa3ff]" },
  { id: "stressed", label: "Stressed", emoji: "😣", ring: "border-[#ff9a5b]/70 bg-[#ff9a5b]/15", dot: "bg-[#ff9a5b]", bar: "bg-[#ff9a5b]" },
  { id: "sad", label: "Sad", emoji: "😔", ring: "border-[#6fb3ff]/70 bg-[#6fb3ff]/15", dot: "bg-[#6fb3ff]", bar: "bg-[#6fb3ff]" },
];

export const moodOf = (id: string) => MOODS.find((m) => m.id === id) ?? MOODS[0];

/** YYYY-MM for a Date in local time. */
export const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

export function shiftMonth(key: string, delta: number): string {
  const [y, m] = key.split("-").map(Number);
  return monthKey(new Date(y, m - 1 + delta, 1));
}

export const isMonthKey = (v: string | undefined): v is string => !!v && /^\d{4}-(0[1-9]|1[0-2])$/.test(v);
