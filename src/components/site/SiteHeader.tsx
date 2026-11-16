"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { LogoMark } from "@/components/brand/Logo";
import { ButtonLink, IconButton } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

const LINKS = [
  { label: "Home", href: "/" },
  { label: "Features", href: "/#features" },
  { label: "About", href: "/#about" },
];

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 transition duration-500 ease-calm",
        scrolled || open
          ? "border-b border-line bg-base/80 backdrop-blur-xl"
          : "border-b border-transparent",
      )}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-12">
        <Link href="/" aria-label="LifeArchive home" className="flex items-center gap-3">
          <LogoMark className="size-8" />
          <span className="font-heading text-lg font-semibold tracking-tight">LifeArchive</span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-10 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm text-fg-muted transition-colors duration-300 hover:text-fg"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <ButtonLink href="/signin" variant="ghost" size="sm">
            Sign In
          </ButtonLink>
          <ButtonLink href="/signup" size="sm">
            Get Started
          </ButtonLink>
        </div>

        <IconButton
          label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="md:hidden"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </IconButton>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden md:hidden"
          >
            <div className="flex flex-col gap-1 px-5 pb-6 pt-2">
              {LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="rounded-control px-3 py-3.5 text-lg text-fg-muted hover:text-fg"
                >
                  {l.label}
                </Link>
              ))}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <ButtonLink href="/signin" variant="secondary" onClick={() => setOpen(false)}>
                  Sign In
                </ButtonLink>
                <ButtonLink href="/signup" onClick={() => setOpen(false)}>
                  Get Started
                </ButtonLink>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
