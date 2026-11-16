import { useId } from "react";
import { cn } from "@/lib/cn";

/**
 * LifeArchive mark: two nested arcs (moments held inside time) resting on a
 * single point (the present). Abstract, symmetric, readable at 16px.
 */
export function LogoMark({ className }: { className?: string }) {
  // Unique per instance: duplicate gradient ids break when the first one is in a hidden element.
  const gid = `la-mark-${useId().replace(/:/g, "")}`;
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
      className={cn("size-9", className)}
    >
      <defs>
        <linearGradient id={gid} x1="4" y1="6" x2="36" y2="34" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7956FF" />
          <stop offset="0.55" stopColor="#B36CFF" />
          <stop offset="1" stopColor="#E2A0F5" />
        </linearGradient>
      </defs>
      <path
        d="M5 28C5 15.3 11.7 8 20 8s15 7.3 15 20"
        stroke={`url(#${gid})`}
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <path
        d="M12.5 28c0-6.6 3.2-10.5 7.5-10.5s7.5 3.9 7.5 10.5"
        stroke={`url(#${gid})`}
        strokeWidth="4.5"
        strokeLinecap="round"
        opacity="0.75"
      />
      <circle cx="20" cy="30.5" r="2.6" fill={`url(#${gid})`} />
    </svg>
  );
}

export function Logo({
  className,
  showWordmark = true,
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <span className={cn("inline-flex flex-col items-center gap-1.5", className)}>
      <LogoMark />
      {showWordmark && (
        <span className="font-heading text-[0.95rem] font-semibold tracking-tight text-fg">
          LifeArchive
        </span>
      )}
    </span>
  );
}
