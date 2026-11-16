/**
 * Cinematic hero artwork, drawn as inline SVG: a lone figure on a cliff,
 * layered ridgelines fading into mist, and a glowing moon.
 * No image request, scales crisply, anchored right so the figure stays
 * visible on narrow screens while the left stays calm for text.
 */

function stars(count: number) {
  let seed = 7;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: rand() * 1600,
    y: rand() * 430,
    r: 0.5 + rand() * 1.3,
    o: 0.25 + rand() * 0.65,
    d: (rand() * 4).toFixed(2),
  }));
}

const STARS = stars(90);

export function HeroArt({
  className,
  viewBox = "0 0 1600 900",
}: {
  className?: string;
  /** Crop of the 1600x900 scene. Wide banners use a shorter, wider crop. */
  viewBox?: string;
}) {
  return (
    <svg
      viewBox={viewBox}
      preserveAspectRatio="xMaxYMid slice"
      className={className}
      role="img"
      aria-label="A person sitting on a cliff at night, looking over misty mountains toward a glowing moon"
    >
      <defs>
        <linearGradient id="h-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#060818" />
          <stop offset="0.45" stopColor="#15124a" />
          <stop offset="0.8" stopColor="#3b2478" />
          <stop offset="1" stopColor="#7a46a8" />
        </linearGradient>
        <radialGradient id="h-moon-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#e9d4ff" stopOpacity="0.55" />
          <stop offset="0.35" stopColor="#b58aff" stopOpacity="0.22" />
          <stop offset="1" stopColor="#9465ff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="h-moon" cx="0.38" cy="0.35" r="0.75">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e6d3ff" />
        </radialGradient>
        <linearGradient id="h-mist" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f0a8e8" stopOpacity="0" />
          <stop offset="0.7" stopColor="#c690f0" stopOpacity="0.3" />
          <stop offset="1" stopColor="#f0a8e8" stopOpacity="0" />
        </linearGradient>
        <filter id="h-blur" x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur stdDeviation="22" />
        </filter>
        <filter id="h-soft">
          <feGaussianBlur stdDeviation="1.2" />
        </filter>
      </defs>

      <rect width="1600" height="900" fill="url(#h-sky)" />

      {/* stars */}
      <g fill="#f8f7ff">
        {STARS.map((s) => (
          <circle
            key={s.id}
            cx={s.x}
            cy={s.y}
            r={s.r}
            opacity={s.o}
            className="la-twinkle"
            style={{ animationDelay: `${s.d}s` }}
          />
        ))}
      </g>

      {/* moon */}
      <circle cx="1470" cy="140" r="300" fill="url(#h-moon-glow)" />
      <circle cx="1470" cy="140" r="58" fill="url(#h-moon)" filter="url(#h-soft)" />

      {/* horizon bloom */}
      <ellipse cx="900" cy="640" rx="760" ry="120" fill="#f0a8e8" opacity="0.2" filter="url(#h-blur)" />

      {/* ridgelines, far to near */}
      <path
        fill="#33257a"
        d="M0 560 L140 482 L260 530 L420 412 L560 510 L700 440 L860 528 L1020 452 L1180 536 L1340 462 L1480 526 L1600 486 V900 H0Z"
      />
      <rect y="470" width="1600" height="120" fill="url(#h-mist)" />
      <path
        fill="#241a62"
        d="M0 650 L180 552 L330 620 L520 512 L700 610 L900 532 L1100 628 L1300 552 L1600 646 V900 H0Z"
      />
      <rect y="560" width="1600" height="110" fill="url(#h-mist)" opacity="0.8" />
      <path
        fill="#17104a"
        d="M0 735 L200 655 L420 712 L640 634 L860 712 L1080 664 L1300 730 L1600 690 V900 H0Z"
      />

      {/* drifting cloud banks */}
      <g filter="url(#h-blur)" fill="#d4b5ff">
        <ellipse className="la-drift" cx="420" cy="700" rx="260" ry="26" opacity="0.18" />
        <ellipse className="la-drift-slow" cx="1000" cy="640" rx="320" ry="22" opacity="0.16" />
        <ellipse className="la-drift" cx="1380" cy="760" rx="240" ry="24" opacity="0.2" />
      </g>

      {/* cliff */}
      <path
        fill="#06071b"
        d="M1020 900 L1040 790 C1100 740 1180 706 1270 696 L1420 690 C1500 686 1560 700 1600 716 V900Z"
      />

      {/* seated figure, facing left toward the view */}
      <g
        transform="translate(1400 692)"
        stroke="#06071b"
        fill="#06071b"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 -8 L-30 -46 L-46 -4" fill="none" strokeWidth="15" />
        <path d="M16 -8 C22 -40 16 -62 6 -80" fill="none" strokeWidth="24" />
        <path d="M8 -70 L-22 -50" fill="none" strokeWidth="8" />
        <circle cx="0" cy="-96" r="11" strokeWidth="0" />
        <path d="M4 -104 C16 -102 20 -88 14 -80 L6 -84Z" strokeWidth="2" />
      </g>

      {/* foreground haze for depth */}
      <rect y="760" width="1600" height="140" fill="#06071b" opacity="0.55" />
    </svg>
  );
}
