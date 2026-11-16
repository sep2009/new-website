import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/cn";

/* Small hand-drawn illustrations: soft gradients, no external images. */

function CalendarArt() {
  return (
    <svg viewBox="0 0 160 90" className="h-24 w-auto" aria-hidden="true">
      <defs>
        <linearGradient id="ft-cal" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#c9a6ff" />
          <stop offset="1" stopColor="#7a52ff" />
        </linearGradient>
        <radialGradient id="ft-planet" cx="0.35" cy="0.3" r="0.8">
          <stop stopColor="#ffb08a" />
          <stop offset="1" stopColor="#7a3fc0" />
        </radialGradient>
      </defs>
      <circle cx="122" cy="62" r="46" fill="url(#ft-planet)" opacity="0.55" />
      <g transform="rotate(-8 70 48)">
        <rect x="38" y="16" width="64" height="62" rx="14" fill="url(#ft-cal)" />
        <rect x="38" y="16" width="64" height="18" rx="9" fill="#e9dcff" opacity="0.55" />
        <rect x="52" y="8" width="7" height="16" rx="3.5" fill="#e9dcff" />
        <rect x="81" y="8" width="7" height="16" rx="3.5" fill="#e9dcff" />
        <path
          d="M70 40l4.2 8.6 9.5 1.3-6.9 6.7 1.7 9.4L70 61.3l-8.5 4.7 1.7-9.4-6.9-6.7 9.5-1.3z"
          fill="#fff"
        />
      </g>
    </svg>
  );
}

function MoodArt() {
  return (
    <svg viewBox="0 0 160 90" className="h-24 w-auto" aria-hidden="true">
      <defs>
        <linearGradient id="ft-mood" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#7ff5d2" />
          <stop offset="1" stopColor="#12a8a0" />
        </linearGradient>
      </defs>
      <path
        d="M0 62c14-22 26-22 40 0s26 22 40 0 26-22 40 0 26 22 40 0"
        fill="none"
        stroke="#35e0c2"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.7"
      />
      <circle cx="80" cy="40" r="30" fill="url(#ft-mood)" />
      <ellipse cx="70" cy="34" rx="3.4" ry="5.2" fill="#063b3a" />
      <ellipse cx="90" cy="34" rx="3.4" ry="5.2" fill="#063b3a" />
      <path d="M66 47c4 9 24 9 28 0" fill="none" stroke="#063b3a" strokeWidth="3.4" strokeLinecap="round" />
      <ellipse cx="62" cy="31" rx="7" ry="4" fill="#fff" opacity="0.35" transform="rotate(-30 62 31)" />
    </svg>
  );
}

function EnvelopeArt() {
  return (
    <svg viewBox="0 0 160 90" className="h-24 w-auto" aria-hidden="true">
      <defs>
        <linearGradient id="ft-env" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#ffd7bd" />
          <stop offset="1" stopColor="#f08a9e" />
        </linearGradient>
      </defs>
      <g transform="rotate(-6 80 48)">
        <rect x="38" y="22" width="84" height="56" rx="10" fill="url(#ft-env)" />
        <path d="M40 28l40 28 40-28" fill="none" stroke="#fff" strokeOpacity="0.7" strokeWidth="3" strokeLinejoin="round" />
        <path
          d="M80 62c-9-6-13-11-13-16a7 7 0 0 1 13-3 7 7 0 0 1 13 3c0 5-4 10-13 16z"
          fill="#ff4f86"
          transform="translate(0 -4)"
        />
      </g>
      <g fill="#ffd9a8">
        <circle cx="30" cy="22" r="2" />
        <circle cx="136" cy="18" r="2.4" />
        <circle cx="128" cy="76" r="1.6" />
      </g>
    </svg>
  );
}

function ClapperArt() {
  return (
    <svg viewBox="0 0 160 90" className="h-24 w-auto" aria-hidden="true">
      <defs>
        <linearGradient id="ft-clap" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#b9a3ff" />
          <stop offset="1" stopColor="#5b3fd9" />
        </linearGradient>
      </defs>
      <path d="M0 66c28-16 56-16 84-4s52 8 76-6v24H0z" fill="#8f7cff" opacity="0.35" />
      <g transform="rotate(-6 80 48)">
        <rect x="42" y="30" width="76" height="46" rx="9" fill="url(#ft-clap)" />
        <path d="M42 34l8-18 14 8-8 18zM64 24l8-18 14 8-8 18z" fill="#e9dcff" />
        <path d="M70 41v26l22-13z" fill="#fff" />
      </g>
    </svg>
  );
}

function GlobeArt() {
  return (
    <svg viewBox="0 0 160 90" className="h-24 w-auto" aria-hidden="true">
      <defs>
        <radialGradient id="ft-globe" cx="0.35" cy="0.3" r="0.85">
          <stop stopColor="#7cc4ff" />
          <stop offset="1" stopColor="#2a4fd6" />
        </radialGradient>
      </defs>
      <ellipse cx="80" cy="48" rx="68" ry="16" fill="none" stroke="#8fb4ff" strokeOpacity="0.45" strokeWidth="1.5" transform="rotate(-18 80 48)" />
      <circle cx="80" cy="46" r="34" fill="url(#ft-globe)" />
      <path d="M62 34c8-6 16-4 18 2s-6 8-4 14-10 6-14 0-4-12 0-16zM90 50c6-4 14-2 14 6s-8 12-12 8-4-10-2-14z" fill="#7be0a5" opacity="0.85" />
      <g fill="#ff5fa8">
        <path d="M46 28c-6 0-9 5-9 9 0 6 9 15 9 15s9-9 9-15c0-4-3-9-9-9z" />
        <path d="M118 22c-5 0-8 4-8 8 0 5 8 13 8 13s8-8 8-13c0-4-3-8-8-8z" />
      </g>
      <circle cx="46" cy="37" r="3" fill="#fff" />
      <circle cx="118" cy="30" r="2.6" fill="#fff" />
    </svg>
  );
}

export type Tile = {
  key: "otd" | "mood" | "messages" | "recap" | "map";
  title: string;
  desc: string;
  cta: string;
  href?: string;
  /** Feature not built yet: shown honestly, not as a dead link. */
  soon?: boolean;
};

const STYLE: Record<
  Tile["key"],
  { art: () => React.JSX.Element; wrap: string; pill: string; glow: string }
> = {
  otd: {
    art: CalendarArt,
    wrap: "border-[#e29a7a]/30 bg-linear-to-b from-[#6a2f6e]/55 via-[#3b2166]/45 to-[#1a1245]/60",
    pill: "text-[#ffd9c4]",
    glow: "from-[#ff9a76]/25",
  },
  mood: {
    art: MoodArt,
    wrap: "border-[#35e0c2]/30 bg-linear-to-b from-[#0f6b72]/50 via-[#10405f]/45 to-[#140f45]/60",
    pill: "text-[#7ff5d2]",
    glow: "from-[#35e0c2]/20",
  },
  messages: {
    art: EnvelopeArt,
    wrap: "border-[#f08a9e]/30 bg-linear-to-b from-[#7a3a52]/50 via-[#4a2358]/45 to-[#1a1245]/60",
    pill: "text-[#ffd0d8]",
    glow: "from-[#ff8aa8]/22",
  },
  recap: {
    art: ClapperArt,
    wrap: "border-[#8f7cff]/35 bg-linear-to-b from-[#3d33b8]/55 via-[#2a2488]/45 to-[#150f45]/60",
    pill: "text-[#d9ccff]",
    glow: "from-[#8f7cff]/25",
  },
  map: {
    art: GlobeArt,
    wrap: "border-[#4f86ff]/35 bg-linear-to-b from-[#1f4bb0]/50 via-[#1b3a86]/45 to-[#140f45]/60",
    pill: "text-[#bcd2ff]",
    glow: "from-[#4f86ff]/22",
  },
};

function TileBody({ tile }: { tile: Tile }) {
  const s = STYLE[tile.key];
  const Art = s.art;
  return (
    <>
      <div className={cn("pointer-events-none absolute inset-0 bg-radial-[at_50%_0%] to-transparent", s.glow)} />
      <div className="relative flex h-full flex-col items-center gap-1 px-4 pb-5 pt-5 text-center">
        <Art />
        <h3 className="mt-1 font-heading text-[1.05rem] font-semibold">{tile.title}</h3>
        <p className="type-small max-w-[14rem] text-fg-muted">{tile.desc}</p>
        <span
          className={cn(
            "mt-auto inline-flex h-9 items-center gap-1.5 rounded-full bg-base/45 px-5 text-sm font-medium backdrop-blur-sm",
            s.pill,
          )}
        >
          {tile.soon ? (
            "Coming soon"
          ) : (
            <>
              {tile.cta}
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </>
          )}
        </span>
      </div>
    </>
  );
}

export function FeatureTiles({ tiles }: { tiles: Tile[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-5">
      {tiles.map((t) => {
        const s = STYLE[t.key];
        const cls = cn(
          "group relative flex h-full min-h-60 overflow-hidden rounded-3xl border backdrop-blur-sm transition duration-300 ease-calm",
          s.wrap,
        );
        return (
          <li key={t.key} className={t.key === "map" ? "col-span-2 md:col-span-1" : undefined}>
            {t.href && !t.soon ? (
              <Link href={t.href} className={cn(cls, "hover:-translate-y-0.5 hover:shadow-lift")}>
                <TileBody tile={t} />
              </Link>
            ) : (
              <div className={cls} aria-disabled={t.soon || undefined}>
                <TileBody tile={t} />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
