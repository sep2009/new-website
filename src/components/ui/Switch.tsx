import { cn } from "@/lib/cn";

/** Accessible on/off toggle. */
export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-control text-left disabled:opacity-60"
    >
      <span>
        <span className="type-small block font-medium text-fg">{label}</span>
        {description && <span className="type-caption block text-fg-subtle">{description}</span>}
      </span>
      <span
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 rounded-full border transition-colors duration-300 ease-calm",
          checked ? "border-transparent bg-brand" : "border-line-strong bg-raised",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform duration-300 ease-calm",
            checked ? "translate-x-[1.375rem]" : "translate-x-0.5",
          )}
        />
      </span>
    </button>
  );
}
