import { CalendarDays, MapPin, Route } from "lucide-react";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/memories/format";
import type { JourneyEntry, JourneyYear } from "@/lib/memories/queries";

type Props = {
  entries: JourneyEntry[];
  years: JourneyYear[];
  selectedYear?: number;
  total: number;
  /** Where year chips point. */
  basePath: string;
  entryHref: (id: string) => string;
  moreHref?: string;
  /** Slot for the "Add memories" control (a client component in the real app). */
  action?: React.ReactNode;
  loadError?: boolean;
};

/** Minimal vertical timeline, grouped by year. Works for a handful of entries or hundreds. */
export function JourneyView({
  entries,
  years,
  selectedYear,
  total,
  basePath,
  entryHref,
  moreHref,
  action,
  loadError,
}: Props) {
  const groups: { year: number; items: JourneyEntry[] }[] = [];
  for (const e of entries) {
    const y = Number(e.memory_date.slice(0, 4));
    const last = groups[groups.length - 1];
    if (last?.year === y) last.items.push(e);
    else groups.push({ year: y, items: [e] });
  }

  const chip = (active: boolean) =>
    cn(
      "inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-5 text-sm transition duration-300 ease-calm",
      active
        ? "border-transparent bg-linear-to-r from-[#5a3df0] to-[#7d52ff] text-white shadow-brand"
        : "border-line bg-surface/50 text-fg-muted hover:border-line-strong hover:text-fg",
    );

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 pb-6 pt-2 md:pt-4">
        <div>
          <h1 className="type-title">My Journey</h1>
          <p className="type-body mt-2 text-fg-muted">Every moment is part of your story.</p>
        </div>
        {action}
      </div>

      {years.length > 0 && (
        <nav
          aria-label="Filter by year"
          className="sticky top-0 z-20 -mx-5 mb-10 overflow-x-auto bg-base/80 px-5 py-3 backdrop-blur-xl sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12"
        >
          <ul className="flex gap-2">
            <li>
              <Link href={basePath} className={chip(!selectedYear)} aria-current={!selectedYear ? "true" : undefined}>
                All years
              </Link>
            </li>
            {years.map(({ year, count }) => (
              <li key={year}>
                <Link
                  href={`${basePath}?year=${year}`}
                  className={chip(selectedYear === year)}
                  aria-current={selectedYear === year ? "true" : undefined}
                >
                  {year}
                  <span className="text-[0.7rem] opacity-70">{count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {loadError && (
        <p
          role="alert"
          className="type-small mb-6 rounded-control border border-accent-pink/30 bg-accent-pink/10 px-4 py-3 text-accent-pink"
        >
          We couldn&apos;t load your Journey just now. Please refresh in a moment.
        </p>
      )}

      {entries.length === 0 && !loadError && (
        <div className="mx-auto mt-6 flex max-w-md flex-col items-center gap-5 text-center">
          <span className="inline-flex size-16 items-center justify-center rounded-full bg-accent/15 text-accent-3">
            <Route className="size-8" strokeWidth={1.5} />
          </span>
          <h2 className="type-title">Your Journey is waiting.</h2>
          <p className="type-body text-fg-muted">
            Memories you add to your Journey appear here, year by year.
          </p>
          <ButtonLink href="/memories/new" size="lg">
            Create a Memory
          </ButtonLink>
        </div>
      )}

      <div className="flex flex-col gap-14">
        {groups.map((g) => (
          <section key={g.year} aria-labelledby={`y-${g.year}`} className="grid gap-6 md:grid-cols-[6rem_1fr]">
            <h2
              id={`y-${g.year}`}
              className="font-display text-4xl font-bold tracking-tight text-fg/90 md:sticky md:top-20 md:self-start md:text-5xl"
            >
              {g.year}
            </h2>

            <ol className="relative flex flex-col gap-10 border-l border-accent/30 pl-8 md:pl-12">
              {g.items.map((e) => (
                <li key={e.id} className="relative">
                  <span
                    aria-hidden
                    className="absolute -left-[2.45rem] top-2 size-4 rounded-full border-2 border-accent-2 bg-base shadow-[0_0_0_5px_rgb(148_101_255/0.18)] md:-left-[3.45rem]"
                  />
                  <Link
                    href={entryHref(e.id)}
                    className="group grid gap-4 rounded-3xl border border-transparent p-3 transition duration-300 ease-calm hover:border-line hover:bg-surface/40 sm:grid-cols-[1fr_minmax(0,16rem)] sm:items-center sm:gap-8 sm:p-4"
                  >
                    <div className="order-2 sm:order-1">
                      <p className="type-small flex items-center gap-2 text-accent-3">
                        <CalendarDays className="size-4" />
                        {formatDate(e.memory_date)}
                      </p>
                      <h3 className="type-heading mt-2 text-[1.35rem] transition-colors group-hover:text-accent-3">
                        {e.title}
                      </h3>
                      {e.excerpt && <p className="type-small mt-2 max-w-lg text-fg-muted">{e.excerpt}</p>}
                      {e.location_name && (
                        <p className="type-caption mt-3 flex items-center gap-1.5 text-fg-subtle">
                          <MapPin className="size-3.5" />
                          {e.location_name}
                        </p>
                      )}
                    </div>
                    <div className="order-1 aspect-16/10 overflow-hidden rounded-2xl border border-line bg-surface-2 sm:order-2">
                      {e.cover_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={e.cover_url}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          className="size-full object-cover transition duration-700 ease-calm group-hover:scale-[1.04]"
                        />
                      ) : (
                        <div className="size-full bg-linear-to-br from-accent/30 via-surface-2 to-accent-pink/15" />
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>

      {entries.length > 0 && (
        <div className="mt-12 flex flex-col items-center gap-3">
          <p className="type-caption text-fg-subtle">
            Showing {entries.length} of {total}
          </p>
          {moreHref && entries.length < total && (
            <Link
              href={moreHref}
              scroll={false}
              className="type-small inline-flex h-11 items-center rounded-full border border-line-strong bg-surface px-6 transition hover:bg-surface-2"
            >
              Show more
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
