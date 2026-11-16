import Link from "next/link";
import { forwardRef } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap " +
  "transition duration-300 ease-calm disabled:pointer-events-none disabled:opacity-50 " +
  "active:scale-[0.98]";

const variants: Record<Variant, string> = {
  primary: "bg-brand text-white shadow-brand hover:brightness-110",
  secondary:
    "bg-surface text-fg border border-line-strong hover:bg-surface-2 hover:border-accent-2/40",
  ghost: "text-fg-muted hover:text-fg hover:bg-surface/70",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-[0.95rem]",
  lg: "h-13 px-8 text-base",
};

type CommonProps = { variant?: Variant; size?: Size; className?: string };

type ButtonProps = CommonProps & React.ButtonHTMLAttributes<HTMLButtonElement>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", className, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
});

type ButtonLinkProps = CommonProps & React.ComponentProps<typeof Link>;

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonLinkProps) {
  return <Link className={cn(base, variants[variant], sizes[size], className)} {...props} />;
}

/** Square-ish icon-only button (search, share, download...). Label required. */
export const IconButton = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }
>(function IconButton({ label, className, type = "button", ...props }, ref) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex size-11 items-center justify-center rounded-full text-fg-muted",
        "border border-line bg-surface/60 transition duration-300 ease-calm",
        "hover:bg-surface-2 hover:text-fg active:scale-95",
        className,
      )}
      {...props}
    />
  );
});
