import { CalendarDays, Film, MapPin } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/memories/format";
import type { MemoryCardData } from "@/lib/memories/types";
import { FavoriteButton } from "./FavoriteButton";

function Cover({ m, className }: { m: MemoryCardData; className?: string }) {
  return (
    <div className={cn("relative overflow-hidden bg-surface-2", className)}>
      {m.cover_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={m.cover_url}
          alt=""
          loading="lazy"
          decoding="async"
          className="size-full object-cover transition duration-700 ease-calm group-hover:scale-[1.04]"
        />
      ) : (
        <div className="flex size-full items-center justify-center bg-linear-to-br from-accent/25 via-surface-2 to-accent-pink/15">
          {m.cover_kind === "video" && <Film className="size-8 text-fg-subtle" />}
        </div>
      )}
      {m.cover_kind === "video" && m.cover_url && (
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-base/60 px-2 py-0.5 text-[0.7rem] backdrop-blur-sm">
          <Film className="size-3" /> Video
        </span>
      )}
      {m.media_count > 1 && (
        <span className="absolute right-3 top-3 rounded-full bg-base/60 px-2 py-0.5 text-[0.7rem] backdrop-blur-sm">
          {m.media_count}
        </span>
      )}
    </div>
  );
}

/** Image-first tile: just the photo, a title, the date and a heart. */
export function MemoryCard({ memory: m }: { memory: MemoryCardData }) {
  return (
    <article className="group relative overflow-hidden rounded-card border border-line bg-surface shadow-soft">
      <Link href={`/memories/${m.id}`} className="absolute inset-0 z-0" aria-label={`Open ${m.title}`} />
      <Cover m={m} className="aspect-4/3" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-linear-to-t from-base/90 via-base/50 to-transparent p-4 pt-14">
        <div className="min-w-0">
          <h3 className="truncate text-[0.95rem] font-semibold">{m.title}</h3>
          <p className="type-caption mt-1 flex items-center gap-1.5 text-fg-muted">
            <CalendarDays className="size-3.5 shrink-0" />
            <span className="truncate">{formatDate(m.memory_date)}</span>
          </p>
          {m.location_name && (
            <p className="type-caption mt-0.5 flex items-center gap-1.5 text-fg-subtle">
              <MapPin className="size-3.5 shrink-0" />
              <span className="truncate">{m.location_name}</span>
            </p>
          )}
        </div>
        <div className="pointer-events-auto">
          <FavoriteButton memoryId={m.id} initial={m.is_favorite} />
        </div>
      </div>
    </article>
  );
}

export function MemoryRow({ memory: m }: { memory: MemoryCardData }) {
  return (
    <article className="group relative flex items-center gap-4 rounded-card border border-line bg-surface p-3 transition duration-300 ease-calm hover:border-line-strong hover:bg-surface-2">
      <Link href={`/memories/${m.id}`} className="absolute inset-0 z-0" aria-label={`Open ${m.title}`} />
      <Cover m={m} className="size-20 shrink-0 rounded-control sm:size-24" />
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-semibold">{m.title}</h3>
        <p className="type-small mt-1 text-fg-muted">{formatDate(m.memory_date)}</p>
        {m.location_name && (
          <p className="type-caption mt-0.5 flex items-center gap-1 text-fg-subtle">
            <MapPin className="size-3.5 shrink-0" />
            <span className="truncate">{m.location_name}</span>
          </p>
        )}
      </div>
      <FavoriteButton memoryId={m.id} initial={m.is_favorite} variant="plain" />
    </article>
  );
}
