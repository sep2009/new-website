import { ArrowRight, CalendarHeart, MapPin } from "lucide-react";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/memories/format";

export type OtdEntry = {
  id: string;
  title: string;
  memory_date: string;
  location_name: string | null;
  excerpt: string | null;
  cover_url: string | null;
  yearsAgo: number;
};

const WORDS = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];
const ago = (n: number) => `${WORDS[n] ?? n} year${n === 1 ? "" : "s"} ago today…`;

/** Browse memories from this calendar day in earlier years. */
export function OnThisDayView({
  entries,
  selected,
  basePath,
  entryHref,
  todayLabel,
}: {
  entries: OtdEntry[];
  selected: number;
  basePath: string;
  entryHref: (id: string) => string;
  todayLabel: string;
}) {
  const current = entries.find((e) => e.yearsAgo === selected) ?? entries[0];
  const years = [...new Set(entries.map((e) => e.yearsAgo))].sort((a, b) => a - b);
  const sameYear = current ? entries.filter((e) => e.yearsAgo === current.yearsAgo) : [];

  return (
    <div>
      <div className="pb-6 pt-2 md:pt-4">
        <h1 className="type-title">On This Day</h1>
        <p className="type-body mt-2 text-fg-muted">Memories from {todayLabel} in years past.</p>
      </div>

      {!current ? (
        <div className="mx-auto mt-6 flex max-w-md flex-col items-center gap-5 text-center">
          <span className="inline-flex size-16 items-center justify-center rounded-full bg-accent/15 text-accent-3">
            <CalendarHeart className="size-8" strokeWidth={1.5} />
          </span>
          <h2 className="type-title">Nothing from this day yet.</h2>
          <p className="type-body text-fg-muted">
            As your story grows, memories saved on this date in past years will appear here.
          </p>
          <ButtonLink href="/memories/new" size="lg">
            Create a Memory
          </ButtonLink>
        </div>
      ) : (
        <>
          <nav aria-label="Browse by year" className="mb-8 overflow-x-auto">
            <ul className="flex gap-2">
              {years.map((y) => (
                <li key={y}>
                  <Link
                    href={`${basePath}?ago=${y}`}
                    aria-current={y === current.yearsAgo ? "true" : undefined}
                    className={cn(
                      "inline-flex h-10 shrink-0 items-center rounded-full border px-5 text-sm transition duration-300 ease-calm",
                      y === current.yearsAgo
                        ? "border-transparent bg-linear-to-r from-[#5a3df0] to-[#7d52ff] text-white shadow-brand"
                        : "border-line bg-surface/50 text-fg-muted hover:border-line-strong hover:text-fg",
                    )}
                  >
                    {y} {y === 1 ? "year" : "years"} ago
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <ul className="flex flex-col gap-6">
            {sameYear.map((e) => (
              <li key={e.id}>
                <Link
                  href={entryHref(e.id)}
                  className="group relative grid overflow-hidden rounded-[2rem] border border-line bg-surface shadow-lift md:grid-cols-[1.2fr_1fr]"
                >
                  <div className="relative aspect-4/3 overflow-hidden bg-surface-2 md:aspect-auto md:min-h-80">
                    {e.cover_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={e.cover_url}
                        alt=""
                        className="absolute inset-0 size-full object-cover transition duration-700 ease-calm group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-linear-to-br from-accent/30 via-surface-2 to-accent-pink/20" />
                    )}
                  </div>
                  <div className="flex flex-col justify-center gap-3 p-7 md:p-10">
                    <p className="type-small text-accent-3">{ago(e.yearsAgo)}</p>
                    <h2 className="type-title text-[1.75rem]">{e.title}</h2>
                    <p className="type-small text-fg-muted">{formatDate(e.memory_date, "long")}</p>
                    {e.location_name && (
                      <p className="type-small flex items-center gap-2 text-fg-subtle">
                        <MapPin className="size-4" /> {e.location_name}
                      </p>
                    )}
                    {e.excerpt && <p className="type-body text-fg-muted">{e.excerpt}</p>}
                    <span className="type-small mt-2 inline-flex items-center gap-2 font-medium">
                      View Memory{" "}
                      <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
