import Link from "next/link";
import { LogoMark } from "@/components/brand/Logo";
import { HeroArt } from "@/components/site/HeroArt";

/** Premium split-screen frame: form on one side, cinematic message on the other. */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="grid min-h-dvh bg-ambient lg:grid-cols-2">
      <div className="flex flex-col px-5 py-8 sm:px-10 lg:px-16">
        <Link href="/" className="flex w-fit items-center gap-3" aria-label="LifeArchive home">
          <LogoMark className="size-8" />
          <span className="font-heading text-lg font-semibold tracking-tight">LifeArchive</span>
        </Link>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12">
          <h1 className="type-title">{title}</h1>
          {subtitle && <p className="type-body mt-2 text-fg-muted">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="type-small mt-8 text-center text-fg-muted">{footer}</div>}
        </div>
      </div>

      <aside className="relative isolate hidden overflow-hidden lg:block" aria-hidden="true">
        <HeroArt className="absolute inset-0 -z-10 size-full" />
        <div className="absolute inset-0 -z-10 bg-linear-to-t from-base via-base/30 to-base/40" />
        <div className="absolute inset-x-0 bottom-0 p-14">
          <p className="type-display text-[clamp(2.25rem,3.4vw,3.25rem)]">
            Your story
            <br />
            <span className="text-brand">starts here.</span>
          </p>
          <p className="type-body mt-4 max-w-sm text-fg-muted">
            A private home for the moments that matter. Capture. Remember. Live More.
          </p>
        </div>
      </aside>
    </div>
  );
}

export function AuthLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="font-medium text-accent-3 underline-offset-4 transition-colors hover:text-fg hover:underline"
    >
      {children}
    </Link>
  );
}
