import { Bell, Plus } from "lucide-react";
import Link from "next/link";
import { LogoMark } from "@/components/brand/Logo";
import { cn } from "@/lib/cn";
import { initials, type ShellUser } from "@/lib/user";
import { MobileTabBar, Sidebar } from "./Navigation";
import { SearchBox } from "./SearchBox";

export type { ShellUser };

/** Top header: search, the one primary action, notifications (demo only for now) and avatar. */
function TopBar({ user, demo }: { user?: ShellUser; demo?: boolean }) {
  return (
    <div className="flex h-16 items-center gap-3 px-5 sm:px-8 md:h-24 lg:px-12 print:hidden">
      <Link href={demo ? "/demo" : "/home"} aria-label="LifeArchive home" className="md:hidden">
        <LogoMark className="size-8" />
      </Link>

      <div className="hidden flex-1 md:block">
        <SearchBox demo={demo} />
      </div>
      <div className="flex-1 md:hidden" />

      <div className="flex items-center gap-2 sm:gap-3">
        <Link
          href={demo ? "/demo" : "/memories/new"}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-brand px-3 text-sm font-medium text-white shadow-brand transition duration-300 hover:brightness-110 sm:px-5"
          aria-label="Add a Memory"
        >
          <Plus className="size-5" />
          <span className="hidden sm:inline">Add a Memory</span>
        </Link>

        {/* Notifications arrive with the Future Messages / recap features; shown only in the demo. */}
        {demo && (
          <span className="relative hidden size-11 items-center justify-center rounded-full text-fg-muted sm:inline-flex">
            <Bell className="size-5" strokeWidth={1.75} />
            <span className="absolute right-3 top-3 size-2 rounded-full bg-accent-pink ring-2 ring-base" />
          </span>
        )}

        {user && (
          <Link
            href={demo ? "/demo" : "/profile"}
            aria-label="Your profile"
            title={user.name ?? user.email ?? "Profile"}
            className="inline-flex size-11 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white shadow-brand ring-2 ring-base transition hover:brightness-110"
          >
            {initials(user)}
          </Link>
        )}
      </div>
    </div>
  );
}

/**
 * Shared frame for every primary screen.
 * Content gets a consistent gutter, max width and room for the mobile tab bar.
 */
export function AppShell({
  children,
  user,
  demo,
  reduceMotion,
}: {
  children: React.ReactNode;
  user?: ShellUser;
  reduceMotion?: boolean;
  /** Sample-data preview: nothing links into the real app. */
  demo?: boolean;
}) {
  return (
    <div className="min-h-dvh bg-ambient" data-reduce-motion={reduceMotion ? "true" : undefined}>
      <Sidebar user={user} demo={demo} />
      <div className="md:pl-22 lg:pl-64 print:pl-0">
        <div className="px-5 pt-3 md:hidden print:hidden">
          <SearchBox demo={demo} />
        </div>
        <TopBar user={user} demo={demo} />
        <main>{children}</main>
      </div>
      <MobileTabBar demo={demo} />
    </div>
  );
}

/** Centered content column with responsive gutters. */
export function Container({
  className,
  size = "wide",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { size?: "default" | "narrow" | "wide" }) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-5 pb-32 sm:px-8 md:pb-16 lg:px-12",
        size === "narrow" && "max-w-3xl",
        size === "default" && "max-w-5xl",
        size === "wide" && "max-w-[88rem]",
        className,
      )}
      {...props}
    />
  );
}

/** Screen title block: one heading, one quiet line, optional right-side action. */
export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 pb-8 pt-2 md:pt-4">
      <div>
        <h1 className="type-title">{title}</h1>
        {subtitle && <p className="type-body mt-2 text-fg-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
