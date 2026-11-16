"use client";

import { Check, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Notice } from "@/components/ui/Notice";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/memories/format";
import { describeError } from "@/lib/memories/save";
import { createClient } from "@/lib/supabase/client";

type Candidate = { id: string; title: string; memory_date: string; thumb: string | null };

/** Pick memories that aren't on the Journey yet and add them in one step. */
export function AddToJourney() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Candidate[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (q: string) => {
    setError("");
    const supabase = createClient();
    let req = supabase
      .from("memories")
      .select("id,title,memory_date,memory_media(thumb_path,storage_path,kind,sort_order)")
      .eq("in_journey", false)
      .order("memory_date", { ascending: false })
      .limit(60);
    const term = q.replace(/[%*,()"\\]/g, " ").trim();
    if (term) req = req.ilike("title", `%${term}%`);
    const { data, error: err } = await req;
    if (err) {
      setError(describeError(err));
      setItems([]);
      return;
    }

    type Row = {
      id: string;
      title: string;
      memory_date: string;
      memory_media: { thumb_path: string | null; storage_path: string; kind: string; sort_order: number }[];
    };
    const rows = data as unknown as Row[];
    const covers = rows.map((r) => [...r.memory_media].sort((a, b) => a.sort_order - b.sort_order)[0]);
    const paths = covers.map((c) => (c ? (c.thumb_path ?? (c.kind === "image" ? c.storage_path : "")) : "")).filter(Boolean);
    const signed = paths.length ? await supabase.storage.from("memories").createSignedUrls(paths, 3600) : { data: [] };
    const map = new Map((signed.data ?? []).map((s) => [s.path, s.signedUrl]));

    setItems(
      rows.map((r, i) => {
        const c = covers[i];
        const p = c ? (c.thumb_path ?? (c.kind === "image" ? c.storage_path : "")) : "";
        return { id: r.id, title: r.title, memory_date: r.memory_date, thumb: map.get(p) ?? null };
      }),
    );
  }, []);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => load(query), query ? 300 : 0);
    return () => clearTimeout(t);
  }, [open, query, load]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function save() {
    if (selected.size === 0) return;
    setSaving(true);
    setError("");
    const { error: err } = await createClient()
      .from("memories")
      .update({ in_journey: true })
      .in("id", [...selected]);
    setSaving(false);
    if (err) {
      setError(describeError(err));
      return;
    }
    setOpen(false);
    setSelected(new Set());
    setItems(null);
    router.refresh();
  }

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <Plus className="size-4" /> Add memories
      </Button>

      <Modal
        open={open}
        onClose={() => !saving && setOpen(false)}
        title="Add to your Journey"
        description="Choose memories to place on your timeline."
        className="max-w-xl"
      >
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title"
              aria-label="Search memories"
              className="h-11 w-full rounded-full border border-line bg-raised/70 pl-11 pr-4 text-sm text-fg placeholder:text-fg-subtle focus:border-accent-2/70 focus:outline-none focus:ring-4 focus:ring-accent/15"
            />
          </div>

          {error && <Notice tone="error">{error}</Notice>}

          <div className="max-h-[50dvh] overflow-y-auto pr-1">
            {items === null && <p className="type-small py-8 text-center text-fg-subtle">Loading…</p>}
            {items && items.length === 0 && !error && (
              <p className="type-small py-8 text-center text-fg-muted">
                {query ? "No matching memories." : "Every memory is already on your Journey."}{" "}
                <Link href="/memories/new" className="text-accent-3 underline underline-offset-4">
                  Create one
                </Link>
              </p>
            )}
            <ul className="flex flex-col gap-2">
              {items?.map((m) => {
                const on = selected.has(m.id);
                return (
                  <li key={m.id}>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={on}
                      onClick={() => toggle(m.id)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-2xl border p-2.5 text-left transition",
                        on ? "border-accent/60 bg-accent/15" : "border-line bg-surface/50 hover:border-line-strong",
                      )}
                    >
                      <span className="size-14 shrink-0 overflow-hidden rounded-xl bg-surface-2">
                        {m.thumb && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={m.thumb} alt="" loading="lazy" className="size-full object-cover" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{m.title}</span>
                        <span className="type-caption text-fg-subtle">{formatDate(m.memory_date)}</span>
                      </span>
                      <span
                        className={cn(
                          "mr-1 inline-flex size-6 items-center justify-center rounded-full border",
                          on ? "border-transparent bg-brand text-white" : "border-line-strong",
                        )}
                      >
                        {on && <Check className="size-3.5" />}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving || selected.size === 0}>
              {saving ? "Adding…" : selected.size ? `Add ${selected.size} to Journey` : "Add to Journey"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
