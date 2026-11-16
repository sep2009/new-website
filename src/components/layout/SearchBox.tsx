"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Search pill. Click or press ⌘K / Ctrl+K to jump to search in My Memories. */
export function SearchBox({ demo }: { demo?: boolean }) {
  const router = useRouter();
  const go = () => {
    if (!demo) router.push("/memories?focus=1");
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (!demo) router.push("/memories?focus=1");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, demo]);

  return (
    <button
      type="button"
      onClick={go}
      aria-label="Search your memories"
      className="group flex h-12 w-full max-w-md items-center gap-3 rounded-full border border-line bg-surface/60 px-5 text-left text-sm text-fg-subtle backdrop-blur-md transition duration-300 ease-calm hover:border-line-strong hover:bg-surface"
    >
      <Search className="size-[1.1rem] shrink-0 text-fg-muted" strokeWidth={1.75} />
      <span className="flex-1 truncate">Search your memories…</span>
      <kbd className="hidden rounded-md border border-line px-1.5 py-0.5 font-sans text-[0.7rem] text-fg-subtle sm:inline">
        ⌘ K
      </kbd>
    </button>
  );
}
