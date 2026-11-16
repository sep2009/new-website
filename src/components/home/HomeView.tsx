import { ArrowRight, CalendarDays, Plus, Sparkles, Film } from "lucide-react";
import Link from "next/link";
import { HeroArt } from "@/components/site/HeroArt";
import { ButtonLink } from "@/components/ui/Button";
import { relativeLabel } from "@/lib/memories/format";
import type { JourneyStats } from "@/lib/memories/queries";
import type { MemoryCardData } from "@/lib/memories/types";
import { FeatureTiles, type Tile } from "./FeatureTiles";
import { JourneyCard } from "./JourneyCard";
import { OnThisDayBanner, type OnThisDayItem } from "./OnThisDayBanner";

type Props = {
  onThisDay: OnThisDayItem[];
  recent: MemoryCardData[];
  stats: JourneyStats;
  loadError?: boolean;
  /** Sample-data preview: every feature tile looks active and nothing links into the real app. */
  demo?: boolean;
  today?: Date;
};

function Welcome() {
  return (
    <section
      id="on-this-day"
      className="relative isolate overflow-hidden rounded-[2rem] border border-accent-2/25 shadow-lift"
    >
      <HeroArt viewBox="0 60 1600 700" className="absolute inset-0 -z-20 size-full" />
      <div className="absolute inset-0 -z-10 bg-linear-to-r from-[#0a0828]/90 via-[#0a0828]/50 to-transparent max-md:bg-linear-to-b max-md:from-[#0a0828]/85 max-md:via-[#0a0828]/40" />
      <div className="flex min-h-[19rem] flex-col justify-center gap-6 px-6 py-10 sm:px-10 md:min-h-[22rem] md:px-14">
        <div>
          <h1 className="type-display text-[clamp(2.25rem,4.6vw,3.8rem)]">
            Welcome <span className="text-brand">back.</span>
          </h1>
          <p className="type-body mt-3 max-w-md text-lg text-fg-muted">
            Every moment has a story worth keeping.
          </p>
        </div>
        <div>
          <ButtonLink href="/memories/new" size="lg">
            <Plus className="size-5" /> Add a Memory
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}

/** Presentational: real data from the Home page, or the sample persona from /demo. */
export function HomeView({ onThisDay, recent, stats, loadError, demo, today = new Date() }: Props) {
  const empty = stats.total === 0 && !demo;
  const memoryHref = (id: string) => (demo ? "/demo" : `/memories/${id}`);

  const base = demo ? "/demo" : "";
  const tiles: Tile[] = [
    { key: "otd", title: "On This Day", desc: "A memory from this day in past years", cta: "View", href: `${base}/on-this-day` },
    { key: "mood", title: "Mood Track", desc: "How are you feeling today?", cta: "Track", href: `${base}/mood` },
    { key: "messages", title: "Future Messages", desc: "Write a message to your future self", cta: "Write", href: `${base}/messages` },
    { key: "recap", title: "Life Recap", desc: "Turn your memories into a beautiful story", cta: "Create", href: `${base}/recap` },
    { key: "map", title: "Memory Map", desc: "Explore your memories around the world", cta: "Explore", href: `${base}/map` },
  ];

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      {onThisDay.length > 0 ? <OnThisDayBanner items={onThisDay} /> : <Welcome />}

      {loadError && (
        <p role="alert" className="type-small rounded-control border border-accent-pink/30 bg-accent-pink/10 px-4 py-3 text-accent-pink">
          We couldn&apos;t load your memories just now. Please refresh in a moment.
        </p>
      )}

      <FeatureTiles tiles={tiles} />

      {empty ? (
        <section className="flex flex-col items-start gap-5 rounded-3xl border border-line bg-surface/50 p-8 sm:p-10">
          <h2 className="type-title">Your story starts with one moment.</h2>
          <p className="type-body max-w-md text-fg-muted">
            A photo, a place, a few words. Add your first memory and your journey begins.
          </p>
          <ButtonLink href="/memories/new" size="lg">
            <Plus className="size-4" /> Create Your First Memory
          </ButtonLink>
        </section>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_23rem]">
          <section className="rounded-3xl border border-line bg-surface/50 p-5 backdrop-blur-sm sm:p-6" aria-label="Recent memories">
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 className="flex items-center gap-2.5 font-heading text-[1.05rem] font-semibold">
                <Sparkles className="size-5 text-accent-2" /> Recent Memories
              </h2>
              <Link
                href={demo ? "/demo" : "/memories"}
                className="type-small inline-flex items-center gap-1.5 text-accent-3 transition-colors hover:text-fg"
              >
                See all <ArrowRight className="size-4" />
              </Link>
            </div>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {recent.slice(0, 5).map((m, i) => (
                <li key={m.id} className={i >= 4 ? "max-lg:hidden" : i === 4 ? "" : undefined}>
                  <Link
                    href={memoryHref(m.id)}
                    className="group relative block aspect-4/5 overflow-hidden rounded-2xl border border-line bg-surface-2 transition duration-300 ease-calm hover:-translate-y-0.5 hover:border-line-strong hover:shadow-lift"
                    aria-label={`${m.title}, ${relativeLabel(m.memory_date, today)}`}
                  >
                    {m.cover_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={m.cover_url}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="size-full object-cover transition duration-700 ease-calm group-hover:scale-[1.05]"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center bg-linear-to-br from-accent/30 via-surface-2 to-accent-pink/15">
                        {m.cover_kind === "video" && <Film className="size-7 text-fg-subtle" />}
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-base/85 to-transparent p-2.5 pt-10">
                      <p className="mb-1.5 truncate px-0.5 text-[0.8rem] font-medium">{m.title}</p>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-base/60 px-2.5 py-1 text-[0.7rem] text-fg backdrop-blur-sm">
                        <CalendarDays className="size-3" />
                        {relativeLabel(m.memory_date, today)}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <JourneyCard stats={stats} />
        </div>
      )}
    </div>
  );
}
