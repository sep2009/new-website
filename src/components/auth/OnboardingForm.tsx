"use client";

import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/client";

const USE_CASES = [
  "Keep a personal journal",
  "Preserve memories with loved ones",
  "Track my growth and goals",
  "Collect creative inspiration",
];

const MEMORY_KINDS = [
  "Travel",
  "Friends and family",
  "Personal milestones",
  "Daily life",
  "Learning and achievements",
  "Creative projects",
];

function Chips({
  options,
  value,
  onToggle,
  label,
}: {
  options: string[];
  value: string[];
  onToggle: (option: string) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2.5">
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <button
            key={o}
            type="button"
            role="checkbox"
            aria-checked={on}
            onClick={() => onToggle(o)}
            className={cn(
              "inline-flex h-11 items-center gap-2 rounded-full border px-5 text-sm transition duration-300 ease-calm",
              on
                ? "border-accent/60 bg-accent/20 text-fg"
                : "border-line bg-surface/60 text-fg-muted hover:border-line-strong hover:text-fg",
            )}
          >
            {on && <Check className="size-4 text-accent-3" />}
            {o}
          </button>
        );
      })}
    </div>
  );
}

export function OnboardingForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [useCases, setUseCases] = useState<string[]>([]);
  const [kinds, setKinds] = useState<string[]>([]);
  const [loading, setLoading] = useState<"save" | "skip" | null>(null);
  const [error, setError] = useState("");

  const toggle = (list: string[], set: (v: string[]) => void) => (o: string) =>
    set(list.includes(o) ? list.filter((x) => x !== o) : [...list, o]);

  async function finish(skip: boolean) {
    setLoading(skip ? "skip" : "save");
    setError("");
    const { error: err } = await createClient()
      .from("profiles")
      .update({
        use_cases: skip ? [] : useCases,
        memory_kinds: skip ? [] : kinds,
        onboarded: true,
      })
      .eq("id", userId);

    if (err) {
      setLoading(null);
      setError("We couldn't save that just now. You can skip and set this up later.");
      return;
    }
    router.replace("/home");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-10">
      {error && <Notice tone="error">{error}</Notice>}

      <section>
        <h2 className="type-heading">What would you like to use LifeArchive for?</h2>
        <p className="type-small mb-4 mt-1 text-fg-subtle">Choose any that fit. Optional.</p>
        <Chips
          label="Ways to use LifeArchive"
          options={USE_CASES}
          value={useCases}
          onToggle={toggle(useCases, setUseCases)}
        />
      </section>

      <section>
        <h2 className="type-heading">What kind of memories do you want to save?</h2>
        <p className="type-small mb-4 mt-1 text-fg-subtle">Choose any that fit. Optional.</p>
        <Chips
          label="Kinds of memories"
          options={MEMORY_KINDS}
          value={kinds}
          onToggle={toggle(kinds, setKinds)}
        />
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button size="lg" onClick={() => finish(false)} disabled={loading !== null}>
          {loading === "save" ? "Saving…" : "Continue"}
        </Button>
        <Button variant="ghost" size="lg" onClick={() => finish(true)} disabled={loading !== null}>
          {loading === "skip" ? "One moment…" : "Skip for now"}
        </Button>
      </div>
    </div>
  );
}
