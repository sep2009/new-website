"use client";

import { ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo, LogoMark } from "@/components/brand/Logo";
import { cn } from "@/lib/cn";
import { DEMO_HREF, isNavActive, NAV_ITEMS } from "@/lib/navigation";
import { initials, type ShellUser } from "@/lib/user";

/** A quiet range of violet mountains and pines for the foot of the sidebar. */
function SidebarArt() {
  return (
    <svg
      viewBox="0 0 240 220"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-56 w-full lg:block"
    >
      <defs>
        <linearGradient id="sb-back" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7a52ff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#2a1c78" stopOpacity="0.2" />
        </linearGradient>
        <linearGradient id="sb-front" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a2a9a" stopOpacity="0.8" />
          <stop offset="1" stopColor="#120d3a" stopOpacity="0.9" />
        </linearGradient>
        <radialGradient id="sb-glow" cx="0.3" cy="0.2" r="0.9">
          <stop offset="0" stopColor="#c690f0" stopOpacity="0.35" />
          <stop offset="1" stopColor="#c690f0" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="240" height="220" fill="url(#sb-glow)" />
      <path d="M0 150 L50 70 L84 110 L120 40 L170 118 L205 84 L240 128 V220 H0Z" fill="url(#sb-back)" />
      <path d="M0 175 L45 128 L92 168 L140 122 L196 170 L240 144 V220 H0Z" fill="url(#sb-front)" />
      <g fill="#0d0a2e" opacity="0.9">
        {[18, 38, 60, 196, 216, 234].map((x, i) => (
          <path key={x} d={`M${x} ${208 - (i % 3) * 8} l9 ${-34 - (i % 2) * 8} l9 ${34 + (i % 2) * 8}z`} />
        ))}
      </g>
    </svg>
  );
}

function UserChip({ user }: { user?: ShellUser }) {
  if (!user) return null;
  const first = user.name?.trim().split(/\s+/)[0] || user.email?.split("@")[0] || "You";
  return (
    <Link
      href="/profile"
      aria-label="Your profile"
      title={user.name ?? user.email ?? "Profile"}
      className="relative flex w-full items-center justify-center gap-3 rounded-2xl border border-line bg-surface/70 p-2 backdrop-blur-md transition duration-300 ease-calm hover:border-line-strong hover:bg-surface-2/80 lg:justify-start"
    >
      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white">
        {initials(user)}
      </span>
      <span className="hidden min-w-0 flex-1 truncate text-sm font-medium lg:block">{first}</span>
      <ChevronDown className="mr-1 hidden size-4 text-fg-subtle lg:block" />
    </Link>
  );
}

/**
 * Desktop (lg+): full sidebar with labels, a mountain scene and your profile chip.
 * Tablet (md): compact icon rail. Hidden on mobile, where MobileTabBar takes over.
 */
export function Sidebar({ user, demo }: { user?: ShellUser; demo?: boolean }) {
  const pathname = usePathname();
  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 hidden w-22 flex-col print:!hidden items-center overflow-hidden border-r border-line md:flex lg:w-64",
        "bg-linear-to-b from-[#0b0a2a] via-[#0e0c33] to-[#150f45] px-3 py-8",
      )}
    >
      <Link href={demo ? "/demo" : "/home"} aria-label="LifeArchive home" className="mb-10">
        <span className="hidden lg:block">
          <Logo className="[&_svg]:size-12" />
        </span>
        <span className="lg:hidden">
          <LogoMark />
        </span>
      </Link>

      <nav aria-label="Primary" className="relative z-10 flex w-full flex-col gap-1.5">
        {NAV_ITEMS.map((item) => {
          const href = demo ? DEMO_HREF[item.href] : item.href;
          const on = demo ? pathname === href && (href !== "/demo" || item.href === "/home") : isNavActive(item, pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={href}
              aria-current={on ? "page" : undefined}
              title={item.label}
              className={cn(
                "relative flex h-12 items-center justify-center gap-3 rounded-2xl px-4 text-[0.95rem] font-medium",
                "transition-colors duration-300 ease-calm lg:justify-start",
                on ? "text-white" : "text-fg-muted hover:bg-surface/50 hover:text-fg",
              )}
            >
              {on && (
                <motion.span
                  layoutId="nav-active-desktop"
                  className="absolute inset-0 rounded-2xl bg-linear-to-r from-[#5a3df0] to-[#7d52ff] shadow-brand"
                  transition={{ type: "spring", stiffness: 380, damping: 34 }}
                />
              )}
              <Icon className="relative size-5 shrink-0" strokeWidth={on ? 2.25 : 1.75} />
              <span className="relative hidden lg:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <SidebarArt />
      <div className="relative z-10 mt-auto w-full">
        <UserChip user={user} />
      </div>
    </aside>
  );
}

/** Mobile: floating bottom tab bar, thumb-reachable, safe-area aware. */
export function MobileTabBar({ demo }: { demo?: boolean }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-30 md:hidden print:hidden"
    >
      <ul className="glass flex items-center justify-between rounded-full p-1.5 shadow-lift">
        {NAV_ITEMS.map((item) => {
          const href = demo ? DEMO_HREF[item.href] : item.href;
          const on = demo ? pathname === href && (href !== "/demo" || item.href === "/home") : isNavActive(item, pathname);
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={href}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "relative flex h-14 flex-col items-center justify-center gap-0.5 rounded-full text-[0.64rem] font-medium",
                  "transition-colors duration-300 ease-calm",
                  on ? "text-white" : "text-fg-subtle",
                )}
              >
                {on && (
                  <motion.span
                    layoutId="nav-active-mobile"
                    className="absolute inset-0 rounded-full bg-linear-to-r from-[#5a3df0] to-[#7d52ff]"
                    transition={{ type: "spring", stiffness: 380, damping: 34 }}
                  />
                )}
                <Icon className="relative size-5" strokeWidth={1.75} />
                <span className="relative">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
