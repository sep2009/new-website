"use client";

import { ChevronLeft, ChevronRight, Expand, Film, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import type { SignedMedia } from "@/lib/memories/types";

type Props = {
  media: SignedMedia[];
  title: string;
  /** Rendered over the bottom of the hero (title, date, place). */
  overlay?: React.ReactNode;
  /** Rendered in the top corners. */
  topLeft?: React.ReactNode;
  topRight?: React.ReactNode;
};

function Slide({ m, title, eager }: { m: SignedMedia; title: string; eager?: boolean }) {
  if (m.kind === "video") {
    return (
      <video
        key={m.id}
        src={m.url}
        poster={m.thumb_url ?? undefined}
        controls
        playsInline
        preload="metadata"
        className="size-full object-contain"
      />
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img key={m.id} src={m.url} alt={title} loading={eager ? "eager" : "lazy"} className="size-full object-cover" />;
}

export function MediaViewer({ media, title, overlay, topLeft, topRight }: Props) {
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const touchX = useRef<number | null>(null);
  const count = media.length;
  const current = media[index];

  const go = useCallback((delta: number) => setIndex((i) => (i + delta + count) % count), [count]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, go]);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative isolate aspect-4/5 overflow-hidden rounded-panel border border-line bg-surface shadow-lift sm:aspect-16/10 lg:aspect-16/9">
        {current ? (
          <Slide m={current} title={title} eager />
        ) : (
          <div className="flex size-full items-center justify-center bg-linear-to-br from-accent/30 via-surface-2 to-accent-pink/20">
            <Film className="size-10 text-fg-subtle" strokeWidth={1.25} />
          </div>
        )}

        {/* scrims keep the controls and text readable on any photo */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-linear-to-b from-base/70 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-linear-to-t from-base/90 via-base/45 to-transparent" />

        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4 sm:p-6">
          <div>{topLeft}</div>
          <div>{topRight}</div>
        </div>

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous"
              className="absolute left-3 top-1/2 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-base/55 backdrop-blur-sm transition hover:bg-base/80"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next"
              className="absolute right-3 top-1/2 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-base/55 backdrop-blur-sm transition hover:bg-base/80"
            >
              <ChevronRight className="size-5" />
            </button>
          </>
        )}

        {current?.kind === "image" && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="View full screen"
            className="absolute bottom-4 right-4 inline-flex size-10 items-center justify-center rounded-full bg-base/55 backdrop-blur-sm transition hover:bg-base/80 sm:bottom-6 sm:right-6"
          >
            <Expand className="size-4" />
          </button>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 p-5 pr-16 sm:p-8 sm:pr-20">{overlay}</div>
      </div>

      {count > 1 && (
        <ul className="flex gap-2 overflow-x-auto pb-1" aria-label="Photos and videos">
          {media.map((m, i) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show item ${i + 1} of ${count}`}
                aria-current={i === index}
                className={cn(
                  "relative block size-16 overflow-hidden rounded-control border transition sm:size-20",
                  i === index ? "border-accent-2" : "border-line opacity-70 hover:opacity-100",
                )}
              >
                {m.thumb_url || m.kind === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.thumb_url ?? m.url} alt="" loading="lazy" className="size-full object-cover" />
                ) : (
                  <span className="flex size-full items-center justify-center bg-surface-2">
                    <Film className="size-5 text-fg-subtle" />
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && current && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${title}, full screen`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-base/95 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchX.current == null) return;
            const dx = e.changedTouches[0].clientX - touchX.current;
            touchX.current = null;
            if (Math.abs(dx) > 50 && count > 1) go(dx < 0 ? 1 : -1);
          }}
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="absolute right-4 top-4 inline-flex size-11 items-center justify-center rounded-full bg-surface/80 hover:bg-surface-2"
          >
            <X className="size-5" />
          </button>
          {count > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  go(-1);
                }}
                aria-label="Previous"
                className="absolute left-3 inline-flex size-12 items-center justify-center rounded-full bg-surface/80 hover:bg-surface-2"
              >
                <ChevronLeft className="size-6" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  go(1);
                }}
                aria-label="Next"
                className="absolute right-3 inline-flex size-12 items-center justify-center rounded-full bg-surface/80 hover:bg-surface-2"
              >
                <ChevronRight className="size-6" />
              </button>
            </>
          )}
          {current.kind === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={current.url}
              alt={title}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[90dvh] max-w-[94vw] rounded-card object-contain"
            />
          ) : (
            <video
              src={current.url}
              controls
              autoPlay
              onClick={(e) => e.stopPropagation()}
              className="max-h-[90dvh] max-w-[94vw] rounded-card"
            />
          )}
          {count > 1 && (
            <p className="type-caption absolute bottom-5 rounded-full bg-surface/80 px-3 py-1 text-fg-muted">
              {index + 1} / {count}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
