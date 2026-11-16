"use client";

import { ChevronDown, LayoutGrid, List, Search, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { cn } from "@/lib/cn";

export type View = "grid" | "list";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "photos", label: "Photos" },
  { value: "videos", label: "Videos" },
  { value: "favorites", label: "Favorites" },
] as const;

type Props = {
  autoFocus?: boolean;
  q: string;
  filter: string;
  sort: string;
  year: string;
  view: View;
  years: number[];
};

const selectCls =
  "h-11 appearance-none rounded-full border border-line bg-surface/70 pl-4 pr-10 text-sm text-fg " +
  "transition hover:border-line-strong focus:border-accent-2/70 focus:outline-none focus:ring-4 focus:ring-accent/15";

export function GalleryControls({ q, filter, sort, year, view, years, autoFocus }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [text, setText] = useState(q);
  const first = useRef(true);

  const state = { q, filter, sort, year, view };

  function push(next: Partial<typeof state>) {
    const merged = { ...state, ...next };
    const params = new URLSearchParams();
    if (merged.q) params.set("q", merged.q);
    if (merged.filter && merged.filter !== "all") params.set("filter", merged.filter);
    if (merged.sort && merged.sort !== "newest") params.set("sort", merged.sort);
    if (merged.year) params.set("year", merged.year);
    if (merged.view) params.set("view", merged.view);
    const qs = params.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  }

  // Debounced search: updates the URL (and the server-rendered results) as you type.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => {
      if (text.trim() !== q) push({ q: text.trim() });
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return (
    <div className={cn("flex flex-col gap-4 transition-opacity", pending && "opacity-70")}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" />
          <input
            type="search"
            autoFocus={autoFocus}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Search titles, notes, places and tags"
            aria-label="Search memories"
            className="h-11 w-full rounded-full border border-line bg-surface/70 pl-11 pr-10 text-sm text-fg placeholder:text-fg-subtle transition hover:border-line-strong focus:border-accent-2/70 focus:outline-none focus:ring-4 focus:ring-accent/15"
          />
          {text && (
            <button
              type="button"
              onClick={() => {
                setText("");
                push({ q: "" });
              }}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-fg-subtle hover:text-fg"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              aria-label="Filter by year"
              value={year}
              onChange={(e) => push({ year: e.target.value })}
              className={selectCls}
            >
              <option value="">All Time</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" />
          </div>
          <div className="relative">
            <select
              aria-label="Sort order"
              value={sort}
              onChange={(e) => push({ sort: e.target.value })}
              className={selectCls}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" />
          </div>
          <div className="ml-auto flex rounded-full border border-line bg-surface/70 p-1 md:ml-0" role="group" aria-label="View">
            {(
              [
                ["grid", LayoutGrid, "Grid view"],
                ["list", List, "List view"],
              ] as const
            ).map(([v, Icon, label]) => (
              <button
                key={v}
                type="button"
                onClick={() => push({ view: v })}
                aria-pressed={view === v}
                aria-label={label}
                title={label}
                className={cn(
                  "inline-flex size-9 items-center justify-center rounded-full transition",
                  view === v ? "bg-accent/25 text-fg" : "text-fg-subtle hover:text-fg",
                )}
              >
                <Icon className="size-4" />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Memory type">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            role="tab"
            aria-selected={filter === f.value}
            onClick={() => push({ filter: f.value })}
            className={cn(
              "h-10 shrink-0 rounded-full border px-5 text-sm transition duration-300 ease-calm",
              filter === f.value
                ? "border-accent/50 bg-accent/20 text-fg"
                : "border-line bg-surface/50 text-fg-muted hover:text-fg",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}
