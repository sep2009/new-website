"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, CalendarDays, ChevronDown, ChevronUp, Play } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { HeroArt } from "@/components/site/HeroArt";

export type OnThisDayItem = {
  id: string;
  title: string;
  location_name: string | null;
  cover_url: string | null;
  cover_kind: "image" | "video" | null;
  yearsAgo: number;
  href: string;
};

const WORDS = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];
const ago = (n: number) => `${WORDS[n] ?? n} year${n === 1 ? "" : "s"} ago today`;

/** Cinematic "On This Day" banner. Browse older years with the pager when there are several. */
export function OnThisDayBanner({ items }: { items: OnThisDayItem[] }) {
  const [i, setI] = useState(0);
  const it = items[i];
  const many = items.length > 1;

  return (
    <section
      id="on-this-day"
      aria-label="On this day"
      className="relative isolate min-h-[19rem] overflow-hidden rounded-[2rem] border border-accent-2/25 shadow-lift md:min-h-[22rem]"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={it.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45 }}
          className="absolute inset-0 -z-20"
        >
          {it.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={it.cover_url} alt="" className="size-full object-cover" />
          ) : (
            <HeroArt viewBox="0 60 1600 700" className="size-full" />
          )}
        </motion.div>
      </AnimatePresence>
      <div className="absolute inset-0 -z-10 bg-linear-to-r from-[#0a0828]/95 via-[#0a0828]/65 to-[#0a0828]/10 max-md:from-[#0a0828]/90 max-md:via-[#0a0828]/70" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-1/3 bg-linear-to-t from-[#0a0828]/70 to-transparent" />

      <div className="flex min-h-[inherit] flex-col justify-center gap-5 px-6 py-9 sm:px-10 md:px-14">
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-line-strong bg-surface/70 px-4 py-2 text-sm backdrop-blur-md">
          <CalendarDays className="size-4 text-accent-3" />
          On This Day
        </span>

        <AnimatePresence mode="wait">
          <motion.div
            key={it.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35 }}
            className="max-w-xl"
          >
            <h1 className="type-display text-[clamp(2rem,4.2vw,3.4rem)]">
              {ago(it.yearsAgo)},
              <br />
              {it.location_name ? "you were in " : "you saved "}
              <span className="text-brand">
                {it.location_name ? `${it.location_name}!` : `“${it.title}”`}
              </span>
            </h1>
          </motion.div>
        </AnimatePresence>

        <div>
          <Link
            href={it.href}
            className="inline-flex h-13 items-center gap-3 rounded-full bg-linear-to-r from-[#5a3df0] to-[#7d52ff] px-7 text-base font-medium text-white shadow-brand transition duration-300 hover:brightness-110"
          >
            {it.cover_kind === "video" && <Play className="size-4 fill-current" />}
            See Memory <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>

      {/* Polaroid */}
      {it.cover_url && (
        <div className="pointer-events-none absolute right-6 top-1/2 hidden w-40 -translate-y-1/2 rotate-6 rounded-md bg-white p-2 pb-9 shadow-[0_20px_50px_rgba(0,0,0,0.5)] sm:block md:right-24 md:w-52 lg:right-28 lg:w-60">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={it.cover_url} alt="" className="aspect-4/5 w-full rounded-sm object-cover" />
        </div>
      )}

      {many && (
        <div className="absolute bottom-5 right-5 flex flex-col items-center gap-1 rounded-full border border-line bg-base/50 p-1.5 backdrop-blur-md sm:bottom-auto sm:right-6 sm:top-1/2 sm:-translate-y-1/2 md:right-8">
          <button
            type="button"
            aria-label="Newer memory"
            disabled={i === 0}
            onClick={() => setI((v) => v - 1)}
            className="inline-flex size-9 items-center justify-center rounded-full transition hover:bg-surface disabled:opacity-30"
          >
            <ChevronUp className="size-5" />
          </button>
          <span className="type-caption tabular-nums text-fg-muted" aria-live="polite">
            {i + 1} / {items.length}
          </span>
          <button
            type="button"
            aria-label="Older memory"
            disabled={i === items.length - 1}
            onClick={() => setI((v) => v + 1)}
            className="inline-flex size-9 items-center justify-center rounded-full transition hover:bg-surface disabled:opacity-30"
          >
            <ChevronDown className="size-5" />
          </button>
        </div>
      )}
    </section>
  );
}
