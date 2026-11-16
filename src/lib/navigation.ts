import { History, Home, MapPin, Route, Settings, type LucideIcon } from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Extra path prefixes that should light this item up. */
  also?: string[];
};

export const NAV_ITEMS: readonly NavItem[] = [
  { label: "Home", href: "/home", icon: Home },
  { label: "Memories", href: "/memories", icon: History },
  { label: "Journey", href: "/journey", icon: Route },
  { label: "Map", href: "/map", icon: MapPin },
  { label: "Settings", href: "/settings", icon: Settings, also: ["/profile"] },
] as const;

/** In the sample-data preview, nav items point at the demo pages that exist. */
export const DEMO_HREF: Record<string, string> = {
  "/home": "/demo",
  "/memories": "/demo",
  "/journey": "/demo/journey",
  "/map": "/demo/map",
  "/settings": "/demo/profile",
};

export const isNavActive = (item: NavItem, pathname: string) =>
  [item.href, ...(item.also ?? [])].some((p) => pathname === p || pathname.startsWith(`${p}/`));
