import { cn } from "@/lib/cn";

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  /** "flat" = surface only. "raised" = brighter surface + soft shadow. */
  tone?: "flat" | "raised";
  interactive?: boolean;
};

export function Card({
  tone = "flat",
  interactive = false,
  className,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-card border border-line p-6",
        tone === "flat" ? "bg-surface" : "bg-surface-2 shadow-soft",
        interactive &&
          "transition duration-300 ease-calm hover:-translate-y-0.5 hover:border-line-strong hover:shadow-lift",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Photo-first tile for memories. Children render over a bottom scrim so
 * captions stay readable on any photo.
 */
export function MediaCard({
  src,
  alt,
  className,
  children,
}: {
  src: string;
  alt: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <figure
      className={cn(
        "group relative overflow-hidden rounded-card border border-line bg-surface shadow-soft",
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="size-full object-cover transition duration-700 ease-calm group-hover:scale-[1.03]"
      />
      {children && (
        <figcaption className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-linear-to-t from-base/85 via-base/40 to-transparent p-4 pt-12 text-sm text-fg">
          {children}
        </figcaption>
      )}
    </figure>
  );
}
