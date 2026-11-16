"use client";

import { Check, ChevronLeft, ChevronRight, MapPin, Pause, Play, Printer, RefreshCw, Sparkles, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Notice } from "@/components/ui/Notice";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/memories/format";
import { describeError } from "@/lib/memories/save";
import { buildNarrative, keyMoments, periodLabel, periodTitle, placesOf, type Period, type RecapMemory } from "@/lib/recap";
import { createClient } from "@/lib/supabase/client";

export type SavedRecap = {
  id: string;
  title: string;
  period_start: string;
  period_end: string;
  created_at: string;
};

type Props = {
  years: number[];
  saved: SavedRecap[];
  /** Sample-data preview: builds from this list and doesn't save. */
  demo?: boolean;
  sample?: RecapMemory[];
};

type Draft = {
  recapId: string | null;
  period: Period;
  all: RecapMemory[];
  selected: Set<string>;
  title: string;
  narrative: string;
};

type Row = {
  id: string;
  title: string;
  memory_date: string;
  location_name: string | null;
  note: string | null;
  tags: string[];
  is_favorite: boolean;
  memory_media: { kind: string; storage_path: string; thumb_path: string | null; sort_order: number }[];
};

const COLS = "id,title,memory_date,location_name,note,tags,is_favorite,memory_media(kind,storage_path,thumb_path,sort_order)";

async function withCovers(rows: Row[]): Promise<RecapMemory[]> {
  const supabase = createClient();
  const covers = rows.map((r) => [...r.memory_media].sort((a, b) => a.sort_order - b.sort_order)[0]);
  const paths = covers.flatMap((c) => (c ? [c.thumb_path ?? "", c.kind === "image" ? c.storage_path : ""] : [])).filter(Boolean);
  const map = new Map<string, string>();
  for (let i = 0; i < paths.length; i += 100) {
    const { data } = await supabase.storage.from("memories").createSignedUrls(paths.slice(i, i + 100), 3600);
    data?.forEach((d) => d.path && d.signedUrl && map.set(d.path, d.signedUrl));
  }
  return rows.map((r, i) => {
    const c = covers[i];
    const thumb = c?.thumb_path ? map.get(c.thumb_path) ?? null : null;
    const full = c?.kind === "image" ? map.get(c.storage_path) ?? null : null;
    return {
      id: r.id,
      title: r.title,
      memory_date: r.memory_date,
      location_name: r.location_name,
      note: r.note,
      tags: r.tags,
      is_favorite: r.is_favorite,
      cover_url: thumb ?? full,
      full_url: full ?? thumb,
    };
  });
}

const isoLocal = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function RecapBuilder({ years, saved: initialSaved, demo, sample = [] }: Props) {
  const now = new Date();
  const [kind, setKind] = useState<Period["kind"]>("year");
  const [month, setMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
  const [year, setYear] = useState(String(years[0] ?? now.getFullYear()));
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saved, setSaved] = useState(initialSaved);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [show, setShow] = useState(false);

  function currentPeriod(): Period | string {
    if (kind === "year") return { kind, start: `${year}-01-01`, end: `${year}-12-31` };
    if (kind === "month") {
      const [y, m] = month.split("-").map(Number);
      if (!y || !m) return "Choose a month.";
      return { kind, start: `${month}-01`, end: isoLocal(new Date(y, m, 0)) };
    }
    if (!from || !to) return "Choose a start and end date.";
    if (to < from) return "The end date must be after the start date.";
    return { kind, start: from, end: to };
  }

  async function fetchRange(start: string, end: string): Promise<RecapMemory[]> {
    if (demo) return sample.filter((m) => m.memory_date >= start && m.memory_date <= end).sort((a, b) => a.memory_date.localeCompare(b.memory_date));
    const { data, error: err } = await createClient()
      .from("memories")
      .select(COLS)
      .gte("memory_date", start)
      .lte("memory_date", end)
      .order("memory_date", { ascending: true })
      .limit(300);
    if (err) throw err;
    return withCovers((data ?? []) as unknown as Row[]);
  }

  async function create() {
    const p = currentPeriod();
    if (typeof p === "string") return setError(p);
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const all = await fetchRange(p.start, p.end);
      if (all.length === 0) {
        setDraft(null);
        setError(`You don't have any memories in ${periodLabel(p)} yet.`);
      } else {
        setDraft({
          recapId: null,
          period: p,
          all,
          selected: new Set(all.map((m) => m.id)),
          title: periodTitle(p),
          narrative: buildNarrative(all, p),
        });
      }
    } catch (e) {
      setError(describeError(e));
    } finally {
      setBusy(false);
    }
  }

  async function openSaved(r: SavedRecap) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const supabase = createClient();
      const { data: rec, error: err } = await supabase.from("recaps").select("narrative,memory_ids").eq("id", r.id).single();
      if (err || !rec) throw err ?? new Error("Couldn't open that recap.");
      const all = await fetchRange(r.period_start, r.period_end);
      const kindGuess: Period["kind"] = r.period_start.endsWith("-01-01") && r.period_end.endsWith("-12-31") ? "year" : "custom";
      setDraft({
        recapId: r.id,
        period: { kind: kindGuess, start: r.period_start, end: r.period_end },
        all,
        selected: new Set((rec.memory_ids as string[]).filter((id) => all.some((m) => m.id === id))),
        title: r.title,
        narrative: rec.narrative ?? "",
      });
    } catch (e) {
      setError(describeError(e));
    } finally {
      setBusy(false);
    }
  }

  const chosen = draft ? draft.all.filter((m) => draft.selected.has(m.id)) : [];

  function toggle(id: string) {
    setDraft((d) => {
      if (!d) return d;
      const next = new Set(d.selected);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { ...d, selected: next };
    });
  }

  function regenerate() {
    if (!draft) return;
    setDraft({ ...draft, narrative: buildNarrative(chosen, draft.period) });
    setNotice("Rewritten from the memories you've selected.");
  }

  async function save() {
    if (!draft) return;
    if (!draft.title.trim()) return setError("Give your recap a title.");
    if (chosen.length === 0) return setError("Select at least one memory.");
    setBusy(true);
    setError("");
    setNotice("");
    const payload = {
      title: draft.title.trim(),
      period_start: draft.period.start,
      period_end: draft.period.end,
      narrative: draft.narrative.trim() || null,
      memory_ids: chosen.map((m) => m.id),
    };
    if (demo) {
      const id = draft.recapId ?? `demo-${crypto.randomUUID()}`;
      setSaved((s) => [{ id, title: payload.title, period_start: payload.period_start, period_end: payload.period_end, created_at: new Date().toISOString() }, ...s.filter((x) => x.id !== id)]);
      setDraft({ ...draft, recapId: id });
      setNotice("Saved (preview only).");
      setBusy(false);
      return;
    }
    const supabase = createClient();
    const res = draft.recapId
      ? await supabase.from("recaps").update(payload).eq("id", draft.recapId).select("id,created_at").single()
      : await supabase.from("recaps").insert(payload).select("id,created_at").single();
    setBusy(false);
    if (res.error || !res.data) return setError(describeError(res.error));
    const row: SavedRecap = { id: res.data.id, title: payload.title, period_start: payload.period_start, period_end: payload.period_end, created_at: res.data.created_at };
    setSaved((s) => [row, ...s.filter((x) => x.id !== row.id)]);
    setDraft({ ...draft, recapId: row.id });
    setNotice("Your recap has been saved.");
  }

  async function remove() {
    if (!draft?.recapId) return;
    setBusy(true);
    if (!demo) {
      const { error: err } = await createClient().from("recaps").delete().eq("id", draft.recapId);
      if (err) {
        setBusy(false);
        return setError(describeError(err));
      }
    }
    setSaved((s) => s.filter((x) => x.id !== draft.recapId));
    setDraft(null);
    setBusy(false);
  }

  const moments = keyMoments(chosen);
  const places = placesOf(chosen);
  const withPhotos = chosen.filter((m) => m.cover_url);

  const chip = (on: boolean) =>
    cn(
      "inline-flex h-10 items-center rounded-full border px-5 text-sm transition duration-300 ease-calm",
      on ? "border-transparent bg-linear-to-r from-[#5a3df0] to-[#7d52ff] text-white shadow-brand" : "border-line bg-surface/50 text-fg-muted hover:text-fg",
    );

  return (
    <div>
      <div className="pb-6 pt-2 md:pt-4 print:hidden">
        <h1 className="type-title">Life Recap</h1>
        <p className="type-body mt-2 text-fg-muted">Turn a month, a year or any stretch of time into a story, written from your own memories.</p>
      </div>

      <section className="rounded-[2rem] border border-line bg-surface/50 p-6 sm:p-8 print:hidden" aria-label="Create a recap">
        <div role="tablist" aria-label="Recap period" className="flex flex-wrap gap-2">
          {(["year", "month", "custom"] as const).map((k) => (
            <button key={k} role="tab" aria-selected={kind === k} onClick={() => setKind(k)} className={chip(kind === k)}>
              {k === "year" ? "A year" : k === "month" ? "A month" : "Custom range"}
            </button>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-end gap-4">
          {kind === "year" && (
            <label className="flex flex-col gap-2 text-sm font-medium">
              Year
              <select value={year} onChange={(e) => setYear(e.target.value)} className="h-12 rounded-control border border-line bg-raised/70 px-4 text-fg focus:border-accent-2/70 focus:outline-none">
                {(years.length ? years : [now.getFullYear()]).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </label>
          )}
          {kind === "month" && <Input label="Month" type="month" value={month} max={isoLocal(now).slice(0, 7)} onChange={(e) => setMonth(e.target.value)} className="w-52" />}
          {kind === "custom" && (
            <>
              <Input label="From" type="date" value={from} max={isoLocal(now)} onChange={(e) => setFrom(e.target.value)} className="w-48" />
              <Input label="To" type="date" value={to} max={isoLocal(now)} onChange={(e) => setTo(e.target.value)} className="w-48" />
            </>
          )}
          <Button onClick={create} disabled={busy}>
            <Sparkles className="size-4" /> {busy && !draft ? "Gathering memories…" : "Create recap"}
          </Button>
        </div>
        <p className="type-caption mt-4 text-fg-subtle">
          Built only from memories you&apos;ve saved. Nothing is invented, and nothing leaves LifeArchive.
        </p>
        {error && <Notice tone="error" className="mt-4">{error}</Notice>}
      </section>

      {draft && (
        <section aria-label="Recap preview" className="mt-6 overflow-hidden rounded-[2rem] border border-line-strong bg-linear-to-b from-surface-2/70 to-surface/60 print:border-0 print:bg-white print:text-black">
          {withPhotos[0]?.full_url && (
            <div className="relative aspect-21/9 w-full overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={withPhotos[0].full_url} alt="" className="size-full object-cover" />
              <div className="absolute inset-0 bg-linear-to-t from-base via-base/30 to-transparent" />
            </div>
          )}

          <div className="p-6 sm:p-10">
            <p className="type-caption uppercase tracking-[0.18em] text-accent-pink">{periodLabel(draft.period)}</p>
            <input
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              aria-label="Recap title"
              maxLength={120}
              className="mt-2 w-full bg-transparent font-heading text-3xl font-bold tracking-tight text-fg placeholder:text-fg-subtle focus:outline-none print:text-black md:text-4xl"
            />

            <div className="mt-6 print:hidden">
              <Textarea label="Your story (edit anything)" rows={7} value={draft.narrative} onChange={(e) => setDraft({ ...draft, narrative: e.target.value })} maxLength={8000} />
              <div className="mt-3 flex flex-wrap gap-3">
                <Button variant="secondary" size="sm" onClick={regenerate}>
                  <RefreshCw className="size-4" /> Rewrite from selection
                </Button>
              </div>
            </div>
            <p className="type-body mt-6 hidden whitespace-pre-wrap text-lg print:block">{draft.narrative}</p>

            {places.length > 0 && (
              <ul className="mt-6 flex flex-wrap gap-2" aria-label="Places">
                {places.slice(0, 10).map((p) => (
                  <li key={p} className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3.5 py-1.5 text-sm text-accent-3 print:border print:bg-transparent print:text-black">
                    <MapPin className="size-3.5" /> {p}
                  </li>
                ))}
              </ul>
            )}

            {moments.length > 0 && (
              <div className="mt-10">
                <h2 className="type-heading">Important moments</h2>
                <ol className="mt-4 flex flex-col gap-3">
                  {moments.map((m) => (
                    <li key={m.id} className="rounded-2xl border border-line bg-base/40 p-4 print:border-black/20 print:bg-transparent">
                      <p className="text-sm font-medium">{m.title} <span className="font-normal text-fg-subtle">· {formatDate(m.memory_date)}</span></p>
                      {m.note && <p className="type-small mt-1 line-clamp-2 text-fg-muted print:line-clamp-none">{m.note}</p>}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            <div className="mt-10">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="type-heading">Memories in this recap</h2>
                <p className="type-caption text-fg-subtle print:hidden">{chosen.length} of {draft.all.length} selected. Tap to include or leave out.</p>
              </div>
              <ul className="mt-4 grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-6">
                {draft.all.map((m) => {
                  const on = draft.selected.has(m.id);
                  return (
                    <li key={m.id}>
                      <button
                        type="button"
                        onClick={() => toggle(m.id)}
                        aria-pressed={on}
                        aria-label={`${m.title}, ${formatDate(m.memory_date)}`}
                        className={cn("relative block aspect-square w-full overflow-hidden rounded-2xl border bg-surface-2 transition", on ? "border-accent-2" : "border-line opacity-40 print:hidden")}
                      >
                        {m.cover_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={m.cover_url} alt="" loading="lazy" className="size-full object-cover" />
                        ) : (
                          <span className="flex size-full items-center justify-center bg-linear-to-br from-accent/30 to-accent-pink/15 p-2 text-center text-xs">{m.title}</span>
                        )}
                        {on && (
                          <span className="absolute right-1.5 top-1.5 inline-flex size-5 items-center justify-center rounded-full bg-brand text-white print:hidden"><Check className="size-3" /></span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-3 print:hidden">
              <Button onClick={save} disabled={busy}>{busy ? "Saving…" : draft.recapId ? "Update recap" : "Save recap"}</Button>
              <Button variant="secondary" onClick={() => setShow(true)} disabled={withPhotos.length === 0}>
                <Play className="size-4" /> Play slideshow
              </Button>
              <Button variant="secondary" onClick={() => window.print()}>
                <Printer className="size-4" /> Print or save as PDF
              </Button>
              {draft.recapId && (
                <Button variant="ghost" onClick={remove} disabled={busy}>
                  <Trash2 className="size-4" /> Delete
                </Button>
              )}
            </div>
            {notice && <Notice tone="success" className="mt-4 print:hidden">{notice}</Notice>}
          </div>
        </section>
      )}

      {saved.length > 0 && (
        <section aria-label="Saved recaps" className="mt-6 rounded-[2rem] border border-line bg-surface/50 p-6 sm:p-8 print:hidden">
          <h2 className="type-heading">Saved recaps</h2>
          <ul className="mt-5 grid gap-3 md:grid-cols-2">
            {saved.map((r) => (
              <li key={r.id}>
                <button type="button" onClick={() => openSaved(r)} disabled={busy} className="flex w-full flex-col items-start gap-1 rounded-2xl border border-line bg-base/40 p-4 text-left transition hover:border-line-strong hover:bg-surface-2/60">
                  <span className="text-sm font-medium">{r.title}</span>
                  <span className="type-caption text-fg-subtle">{formatDate(r.period_start)} – {formatDate(r.period_end)}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {show && <Slideshow items={withPhotos} title={draft?.title ?? ""} onClose={() => setShow(false)} />}
    </div>
  );
}

/** A slideshow of the selected photos. It is a slideshow, not a rendered video file. */
function Slideshow({ items, title, onClose }: { items: RecapMemory[]; title: string; onClose: () => void }) {
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(true);
  const n = items.length;
  const go = useCallback((d: number) => setI((v) => (v + d + n) % n), [n]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === " ") {
        e.preventDefault();
        setPlaying((p) => !p);
      }
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [go, onClose]);

  useEffect(() => {
    if (!playing || n < 2) return;
    const t = setTimeout(() => go(1), 4500);
    return () => clearTimeout(t);
  }, [playing, i, n, go]);

  const m = items[i];
  return (
    <div role="dialog" aria-modal="true" aria-label={`${title} slideshow`} className="fixed inset-0 z-50 flex flex-col bg-black print:hidden">
      <div className="relative flex-1 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img key={m.id} src={m.full_url ?? m.cover_url ?? ""} alt={m.title} className="absolute inset-0 size-full animate-[la-fade_1s_ease] object-contain" />
        <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/90 to-transparent p-6 pt-24 text-center">
          <p className="font-heading text-2xl font-semibold">{m.title}</p>
          <p className="type-small mt-1 text-fg-muted">{formatDate(m.memory_date, "long")}{m.location_name ? ` · ${m.location_name}` : ""}</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close slideshow" className="absolute right-4 top-4 inline-flex size-11 items-center justify-center rounded-full bg-surface/80 hover:bg-surface-2"><X className="size-5" /></button>
      </div>
      <div className="flex items-center justify-center gap-3 bg-black p-4">
        <button type="button" onClick={() => go(-1)} aria-label="Previous" className="inline-flex size-11 items-center justify-center rounded-full bg-surface/80 hover:bg-surface-2"><ChevronLeft className="size-5" /></button>
        <button type="button" onClick={() => setPlaying((p) => !p)} aria-label={playing ? "Pause" : "Play"} className="inline-flex size-12 items-center justify-center rounded-full bg-brand text-white">{playing ? <Pause className="size-5" /> : <Play className="size-5" />}</button>
        <button type="button" onClick={() => go(1)} aria-label="Next" className="inline-flex size-11 items-center justify-center rounded-full bg-surface/80 hover:bg-surface-2"><ChevronRight className="size-5" /></button>
        <span className="type-caption ml-2 tabular-nums text-fg-subtle">{i + 1} / {n}</span>
      </div>
    </div>
  );
}
