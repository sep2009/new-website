import { Plus, SearchX } from "lucide-react";
import Link from "next/link";
import { Container, PageHeader } from "@/components/layout/AppShell";
import { GalleryControls, type View } from "@/components/memories/GalleryControls";
import { MemoryCard, MemoryRow } from "@/components/memories/MemoryCard";
import { Notice } from "@/components/ui/Notice";
import { createClient } from "@/lib/supabase/server";
import { ButtonLink } from "@/components/ui/Button";
import {
  listMemories,
  listMemoryYears,
  type GalleryFilter,
  type GallerySort,
} from "@/lib/memories/queries";

export const metadata = { title: "My Memories" };

const PAGE = 48;
const FILTERS = ["all", "photos", "videos", "favorites"];

type SP = { q?: string; filter?: string; sort?: string; year?: string; view?: string; limit?: string; focus?: string };

export default async function MemoriesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").slice(0, 80);
  const filter = (FILTERS.includes(sp.filter ?? "") ? sp.filter : "all") as GalleryFilter;
  const sort = (sp.sort === "oldest" ? "oldest" : "newest") as GallerySort;
  const yearNum = /^\d{4}$/.test(sp.year ?? "") ? Number(sp.year) : undefined;
  let view: View = sp.view === "list" ? "list" : "grid";
  if (!sp.view) {
    const supabase = await createClient();
    const { data: pref } = await supabase.from("user_preferences").select("default_view").maybeSingle();
    if (pref?.default_view === "list") view = "list";
  }
  const limit = Math.min(Math.max(Number(sp.limit) || PAGE, PAGE), 480);

  const [{ memories, total, error }, years] = await Promise.all([
    listMemories({ q, filter, sort, year: yearNum, limit }),
    listMemoryYears(),
  ]);

  const filtered = q || filter !== "all" || yearNum;
  const addButton = (
    <ButtonLink href="/memories/new">
      <Plus className="size-4" /> Add a Memory
    </ButtonLink>
  );

  const loadMore = new URLSearchParams();
  if (q) loadMore.set("q", q);
  if (filter !== "all") loadMore.set("filter", filter);
  if (sort !== "newest") loadMore.set("sort", sort);
  if (yearNum) loadMore.set("year", String(yearNum));
  if (view !== "grid") loadMore.set("view", view);
  loadMore.set("limit", String(limit + PAGE));

  return (
    <Container size="wide">
      <PageHeader title="My Memories" subtitle="A collection of moments that matter." action={addButton} />

      {/* Search and filters are always available. */}
      <div className="mb-8">
        <GalleryControls autoFocus={sp.focus === "1"} q={q} filter={filter} sort={sort} year={yearNum ? String(yearNum) : ""} view={view} years={years} />
      </div>

      {error && (
        <Notice tone="error">
          We couldn&apos;t load your memories just now. Please refresh in a moment. If this keeps happening, the
          database setup may be incomplete: run supabase/setup.sql in the Supabase SQL Editor.
        </Notice>
      )}

      {!error && memories.length === 0 && !filtered && (
        <div className="mx-auto mt-10 flex max-w-md flex-col items-center gap-5 text-center">
          <span className="inline-flex size-16 items-center justify-center rounded-full bg-accent/15 text-accent-3">
            <Plus className="size-8" />
          </span>
          <h2 className="type-title">No memories yet.</h2>
          <p className="type-body text-fg-muted">Your story starts with one moment.</p>
          <ButtonLink href="/memories/new" size="lg">
            Create Your First Memory
          </ButtonLink>
        </div>
      )}

      {!error && memories.length === 0 && filtered && (
        <div className="mx-auto mt-10 flex max-w-md flex-col items-center gap-4 text-center">
          <SearchX className="size-10 text-fg-subtle" strokeWidth={1.5} />
          <h2 className="type-heading">Nothing matches that.</h2>
          <p className="type-small text-fg-muted">Try a different search, or clear the filters.</p>
          <Link href="/memories" className="type-small text-accent-3 underline underline-offset-4">
            Clear all filters
          </Link>
        </div>
      )}

      {memories.length > 0 &&
        (view === "grid" ? (
          <ul className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
            {memories.map((m) => (
              <li key={m.id}>
                <MemoryCard memory={m} />
              </li>
            ))}
          </ul>
        ) : (
          <ul className="flex flex-col gap-3">
            {memories.map((m) => (
              <li key={m.id}>
                <MemoryRow memory={m} />
              </li>
            ))}
          </ul>
        ))}

      {memories.length > 0 && (
        <div className="mt-10 flex flex-col items-center gap-3">
          <p className="type-caption text-fg-subtle">
            Showing {memories.length} of {total}
          </p>
          {memories.length < total && (
            <Link
              href={`/memories?${loadMore.toString()}`}
              scroll={false}
              className="type-small inline-flex h-11 items-center rounded-full border border-line-strong bg-surface px-6 transition hover:bg-surface-2"
            >
              Show more
            </Link>
          )}
        </div>
      )}
    </Container>
  );
}
