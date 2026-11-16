"use client";

import { ChevronLeft, ChevronRight, Lock, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { Textarea } from "@/components/ui/Input";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/memories/format";
import { describeError } from "@/lib/memories/save";
import { MOODS, moodOf, shiftMonth, type MoodEntry, type MoodId } from "@/lib/mood";
import { createClient } from "@/lib/supabase/client";

type Props = {
  month: string; // YYYY-MM
  today: string; // YYYY-MM-DD
  entries: MoodEntry[]; // entries in this month
  recent: MoodEntry[]; // last few entries overall
  basePath: string;
  /** Sample-data preview: changes stay in this page and aren't saved. */
  demo?: boolean;
};

const monthTitle = (key: string) => {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
};

export function MoodTracker({ month, today, entries: initial, recent: initialRecent, basePath, demo }: Props) {
  const router = useRouter();
  const [entries, setEntries] = useState(initial);
  const [recent, setRecent] = useState(initialRecent);
  const startDate = today.startsWith(month) ? today : `${month}-01`;
  const [date, setDate] = useState(startDate);
  const existing = entries.find((e) => e.entry_date === date) ?? recent.find((e) => e.entry_date === date);
  const [mood, setMood] = useState<MoodId | null>(existing?.mood ?? null);
  const [note, setNote] = useState(existing?.note ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const [y, m] = month.split("-").map(Number);
  const firstWeekday = new Date(y, m - 1, 1).getDay();
  const daysInMonth = new Date(y, m, 0).getDate();
  const cells: (number | null)[] = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const byDate = new Map(entries.map((e) => [e.entry_date, e]));
  const counts = MOODS.map((md) => ({ ...md, n: entries.filter((e) => e.mood === md.id).length }));
  const total = entries.length;
  const top = [...counts].sort((a, b) => b.n - a.n)[0];

  function pickDate(d: string) {
    if (d > today) return;
    const e = byDate.get(d) ?? recent.find((r) => r.entry_date === d);
    setDate(d);
    setMood(e?.mood ?? null);
    setNote(e?.note ?? "");
    setSaved(false);
    setError("");
  }

  function applyLocal(entry: MoodEntry | null, d: string) {
    const upsert = (list: MoodEntry[]) =>
      entry
        ? [...list.filter((e) => e.entry_date !== d), entry].sort((a, b) => b.entry_date.localeCompare(a.entry_date))
        : list.filter((e) => e.entry_date !== d);
    if (d.startsWith(month)) setEntries((l) => upsert(l));
    setRecent((l) => upsert(l).slice(0, 14));
  }

  async function save() {
    if (!mood) return setError("Choose how you felt first.");
    setBusy(true);
    setError("");
    const trimmed = note.trim() || null;
    if (demo) {
      applyLocal({ id: `demo-${date}`, entry_date: date, mood, note: trimmed }, date);
      setSaved(true);
      setBusy(false);
      return;
    }
    const { data, error: err } = await createClient()
      .from("mood_entries")
      .upsert({ entry_date: date, mood, note: trimmed }, { onConflict: "user_id,entry_date" })
      .select("id")
      .single();
    setBusy(false);
    if (err || !data) return setError(describeError(err));
    applyLocal({ id: data.id, entry_date: date, mood, note: trimmed }, date);
    setSaved(true);
    router.refresh();
  }

  async function remove() {
    if (!existing) return;
    setBusy(true);
    setError("");
    if (!demo) {
      const { error: err } = await createClient().from("mood_entries").delete().eq("entry_date", date);
      if (err) {
        setBusy(false);
        return setError(describeError(err));
      }
    }
    applyLocal(null, date);
    setMood(null);
    setNote("");
    setSaved(false);
    setBusy(false);
    if (!demo) router.refresh();
  }

  const isToday = date === today;

  return (
    <div>
      <div className="pb-6 pt-2 md:pt-4">
        <h1 className="type-title">Mood Track</h1>
        <p className="type-body mt-2 text-fg-muted">How are you feeling? Optional, private, and just for you.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        {/* Check-in */}
        <section className="rounded-[2rem] border border-line bg-surface/50 p-6 sm:p-8" aria-label="Mood check-in">
          <h2 className="type-heading">{isToday ? "How are you feeling today?" : `How did you feel on ${formatDate(date, "long")}?`}</h2>

          <div role="radiogroup" aria-label="Mood" className="mt-6 grid grid-cols-3 gap-3">
            {MOODS.map((md) => {
              const on = mood === md.id;
              return (
                <button
                  key={md.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => {
                    setMood(md.id);
                    setSaved(false);
                  }}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-2xl border px-2 py-4 text-sm transition duration-300 ease-calm",
                    on ? md.ring : "border-line bg-base/40 text-fg-muted hover:border-line-strong hover:text-fg",
                  )}
                >
                  <span className="text-3xl" aria-hidden>
                    {md.emoji}
                  </span>
                  {md.label}
                </button>
              );
            })}
          </div>

          <div className="mt-6">
            <Textarea
              label="Private note"
              optional
              rows={4}
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                setSaved(false);
              }}
              placeholder="Anything you'd like to remember about today."
              maxLength={2000}
            />
          </div>

          {error && <Notice tone="error" className="mt-4">{error}</Notice>}
          {saved && <Notice tone="success" className="mt-4">Saved.</Notice>}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button onClick={save} disabled={busy || !mood}>
              {busy ? "Saving…" : existing ? "Update entry" : "Save entry"}
            </Button>
            {existing && (
              <Button variant="ghost" onClick={remove} disabled={busy}>
                <Trash2 className="size-4" /> Remove
              </Button>
            )}
          </div>

          <p className="type-caption mt-6 flex items-start gap-2 text-fg-subtle">
            <Lock className="mt-0.5 size-3.5 shrink-0" />
            Only you can see this. LifeArchive doesn&apos;t diagnose, judge or predict, and there&apos;s no streak to keep.
          </p>
        </section>

        {/* Calendar + overview */}
        <div className="flex flex-col gap-6">
          <section className="rounded-[2rem] border border-line bg-surface/50 p-6 sm:p-8" aria-label="Mood calendar">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="type-heading">{monthTitle(month)}</h2>
              <div className="flex gap-1">
                <Link href={demo ? basePath : `${basePath}?m=${shiftMonth(month, -1)}`} aria-label="Previous month" className="inline-flex size-10 items-center justify-center rounded-full text-fg-muted hover:bg-surface hover:text-fg">
                  <ChevronLeft className="size-5" />
                </Link>
                <Link href={demo ? basePath : `${basePath}?m=${shiftMonth(month, 1)}`} aria-label="Next month" className="inline-flex size-10 items-center justify-center rounded-full text-fg-muted hover:bg-surface hover:text-fg">
                  <ChevronRight className="size-5" />
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1.5 text-center" role="grid" aria-label={monthTitle(month)}>
              {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                <span key={i} className="type-caption py-1 text-fg-subtle" aria-hidden>
                  {d}
                </span>
              ))}
              {cells.map((day, i) => {
                if (!day) return <span key={`b${i}`} />;
                const d = `${month}-${String(day).padStart(2, "0")}`;
                const e = byDate.get(d);
                const md = e ? moodOf(e.mood) : null;
                const future = d > today;
                return (
                  <button
                    key={d}
                    type="button"
                    disabled={future}
                    onClick={() => pickDate(d)}
                    aria-label={`${formatDate(d, "long")}${md ? `, ${md.label}` : ""}`}
                    aria-pressed={d === date}
                    className={cn(
                      "relative flex aspect-square flex-col items-center justify-center rounded-xl text-sm transition",
                      future && "opacity-30",
                      d === date ? "bg-accent/25 ring-1 ring-accent-2" : "hover:bg-surface-2/60",
                      d === today && "font-semibold text-accent-3",
                    )}
                  >
                    {day}
                    <span className={cn("absolute bottom-1.5 size-1.5 rounded-full", md ? md.dot : "bg-transparent")} />
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-[2rem] border border-line bg-surface/50 p-6 sm:p-8" aria-label="Monthly overview">
            <h2 className="type-heading">This month</h2>
            {total === 0 ? (
              <p className="type-small mt-3 text-fg-muted">No entries yet for {monthTitle(month)}.</p>
            ) : (
              <>
                <p className="type-small mt-2 text-fg-muted">
                  {total} {total === 1 ? "entry" : "entries"}. You noted feeling <strong className="font-medium text-fg">{top.label.toLowerCase()}</strong> most often.
                </p>
                <ul className="mt-5 flex flex-col gap-3">
                  {counts.filter((c) => c.n > 0).map((c) => (
                    <li key={c.id} className="flex items-center gap-3">
                      <span className="w-20 shrink-0 text-sm text-fg-muted">
                        <span aria-hidden>{c.emoji}</span> {c.label}
                      </span>
                      <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                        <span className={cn("block h-full rounded-full", c.bar)} style={{ width: `${(c.n / total) * 100}%` }} />
                      </span>
                      <span className="w-6 text-right text-sm tabular-nums text-fg-muted">{c.n}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        </div>
      </div>

      {/* History */}
      <section className="mt-6 rounded-[2rem] border border-line bg-surface/50 p-6 sm:p-8" aria-label="History">
        <h2 className="type-heading">Recent entries</h2>
        {recent.length === 0 ? (
          <p className="type-small mt-3 text-fg-muted">Your entries will appear here.</p>
        ) : (
          <ul className="mt-5 grid gap-3 md:grid-cols-2">
            {recent.map((e) => {
              const md = moodOf(e.mood);
              return (
                <li key={e.id}>
                  <button
                    type="button"
                    onClick={() => pickDate(e.entry_date)}
                    className="flex w-full items-start gap-4 rounded-2xl border border-line bg-base/40 p-4 text-left transition hover:border-line-strong hover:bg-surface-2/60"
                  >
                    <span className="text-2xl" aria-hidden>{md.emoji}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">
                        {md.label} <span className="font-normal text-fg-subtle">· {formatDate(e.entry_date)}</span>
                      </span>
                      {e.note && <span className="type-caption mt-1 line-clamp-2 block text-fg-muted">{e.note}</span>}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
