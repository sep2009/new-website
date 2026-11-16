"use client";

import { Heart } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { setFavorite } from "@/lib/memories/save";

/** Heart toggle. Updates instantly and rolls back if saving fails. */
export function FavoriteButton({
  memoryId,
  initial,
  variant = "overlay",
  className,
}: {
  memoryId: string;
  initial: boolean;
  variant?: "overlay" | "plain";
  className?: string;
}) {
  const [on, setOn] = useState(initial);
  const [failed, setFailed] = useState(false);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const next = !on;
    setOn(next);
    setFailed(false);
    try {
      await setFavorite(memoryId, next);
    } catch {
      setOn(!next);
      setFailed(true);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      aria-label={on ? "Remove from favorites" : "Add to favorites"}
      title={failed ? "Couldn't save. Try again." : on ? "Remove from favorites" : "Add to favorites"}
      className={cn(
        "relative z-10 inline-flex size-9 items-center justify-center rounded-full transition duration-300 ease-calm active:scale-90",
        variant === "overlay"
          ? "bg-base/50 backdrop-blur-sm hover:bg-base/70"
          : "border border-line bg-surface/60 hover:bg-surface-2",
        failed && "ring-2 ring-accent-pink/60",
        className,
      )}
    >
      <Heart
        className={cn("size-[1.1rem] transition", on ? "fill-accent-pink text-accent-pink" : "text-fg")}
        strokeWidth={1.75}
      />
    </button>
  );
}
