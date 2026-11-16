import { BarChart3, CalendarDays, Heart, MapPin, TrendingUp } from "lucide-react";
import Link from "next/link";
import type { JourneyStats } from "@/lib/memories/queries";

function Sparkline({ values }: { values: number[] }) {
  const w = 230;
  const h = 76;
  const pad = 8;
  const max = Math.max(1, ...values);
  const pts = values.map((v, i) => [
    pad + (i * (w - pad * 2)) / (values.length - 1),
    h - pad - (v / max) * (h - pad * 2),
  ]);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const area = `${line} L${pts[pts.length - 1][0]} ${h} L${pts[0][0]} ${h}Z`;
  const [lx, ly] = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-20 w-full max-w-60" role="img" aria-label="Memories saved per month, last 12 months">
      <defs>
        <linearGradient id="jc-fill" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#9465ff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#9465ff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#jc-fill)" />
      <path d={line} fill="none" stroke="#b58aff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lx} cy={ly} r="4.5" fill="#fff" stroke="#9465ff" strokeWidth="2.5" />
    </svg>
  );
}

/** Real, countable numbers only. No scores, no streaks. */
export function JourneyCard({ stats }: { stats: JourneyStats }) {
  const mini = [
    { icon: Heart, value: stats.favorites, label: "Favorites", tone: "text-accent-pink" },
    { icon: CalendarDays, value: stats.years, label: stats.years === 1 ? "Year" : "Years", tone: "text-[#6fb3ff]" },
    { icon: MapPin, value: stats.places, label: stats.places === 1 ? "Place" : "Places", tone: "text-accent-2" },
  ];
  return (
    <section className="rounded-3xl border border-line bg-surface/50 p-6 backdrop-blur-sm" aria-label="Your memory journey">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2.5 font-heading text-[1.05rem] font-semibold">
          <BarChart3 className="size-5 text-accent-2" /> Your Memory Journey
        </h2>
        {stats.thisMonth > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#35e0c2]/15 px-3 py-1 text-xs font-medium text-[#7ff5d2]">
            +{stats.thisMonth} this month <TrendingUp className="size-3.5" />
          </span>
        )}
      </div>

      <div className="mt-5 flex items-end justify-between gap-4">
        <div>
          <p className="font-display text-5xl font-bold leading-none tracking-tight">{stats.total}</p>
          <p className="type-small mt-2 text-fg-muted">Total Memories</p>
        </div>
        <Sparkline values={stats.monthly} />
      </div>

      <ul className="mt-6 grid grid-cols-3 gap-3">
        {mini.map(({ icon: Icon, value, label, tone }) => (
          <li key={label} className="rounded-2xl border border-line bg-base/40 px-3 py-3.5 text-center">
            <Icon className={`mx-auto size-6 ${tone}`} strokeWidth={1.75} />
            <p className="mt-2 text-xl font-semibold leading-none">{value}</p>
            <p className="type-caption mt-1.5 text-fg-subtle">{label}</p>
          </li>
        ))}
      </ul>

      <Link href="/journey" className="type-small mt-5 inline-block text-accent-3 transition-colors hover:text-fg">
        Open your Journey →
      </Link>
    </section>
  );
}
