"use client";

import { X } from "lucide-react";
import { useId, useState } from "react";
import { TEXT_LIMITS } from "@/config/limits";

export function normalizeTag(raw: string) {
  return raw.trim().replace(/^#/, "").toLowerCase().replace(/\s+/g, " ").slice(0, TEXT_LIMITS.tag);
}

/** Type a tag and press Enter or comma. Tags are lowercase so search matches reliably. */
export function TagInput({
  value,
  onChange,
  disabled,
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  disabled?: boolean;
}) {
  const id = useId();
  const [draft, setDraft] = useState("");

  function commit(raw: string) {
    const parts = raw.split(",").map(normalizeTag).filter(Boolean);
    if (parts.length === 0) return;
    const next = [...value];
    for (const p of parts) {
      if (!next.includes(p) && next.length < TEXT_LIMITS.tags) next.push(p);
    }
    onChange(next);
    setDraft("");
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="type-small font-medium text-fg">
        Tags <span className="font-normal text-fg-subtle">(optional)</span>
      </label>
      <div className="flex min-h-12 flex-wrap items-center gap-2 rounded-control border border-line bg-raised/70 px-3 py-2 transition focus-within:border-accent-2/70 focus-within:ring-4 focus-within:ring-accent/15">
        {value.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 rounded-full bg-accent/20 py-1 pl-3 pr-1.5 text-sm text-accent-3"
          >
            {t}
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange(value.filter((x) => x !== t))}
              aria-label={`Remove tag ${t}`}
              className="inline-flex size-5 items-center justify-center rounded-full hover:bg-accent/30"
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          disabled={disabled || value.length >= TEXT_LIMITS.tags}
          onChange={(e) => {
            const v = e.target.value;
            if (v.includes(",")) commit(v);
            else setDraft(v);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit(draft);
            } else if (e.key === "Backspace" && !draft && value.length) {
              onChange(value.slice(0, -1));
            }
          }}
          onBlur={() => commit(draft)}
          placeholder={value.length ? "" : "travel, family, summer…"}
          className="min-w-24 flex-1 bg-transparent text-fg placeholder:text-fg-subtle focus:outline-none"
        />
      </div>
      <p className="type-caption text-fg-subtle">Press Enter or comma to add a tag.</p>
    </div>
  );
}
