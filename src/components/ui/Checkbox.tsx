import { Check } from "lucide-react";
import { forwardRef, useId } from "react";
import { cn } from "@/lib/cn";

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: React.ReactNode;
  error?: string;
};

export const Checkbox = forwardRef<HTMLInputElement, Props>(function Checkbox(
  { label, error, className, id, ...props },
  ref,
) {
  const auto = useId();
  const fieldId = id ?? auto;
  return (
    <div className={className}>
      <label htmlFor={fieldId} className="flex cursor-pointer items-start gap-3">
        <span className="relative mt-0.5 inline-flex size-5 shrink-0">
          <input
            ref={ref}
            id={fieldId}
            type="checkbox"
            aria-invalid={!!error}
            className={cn(
              "peer size-5 cursor-pointer appearance-none rounded-md border bg-raised/70 transition",
              "checked:border-transparent checked:bg-brand",
              error ? "border-accent-pink/60" : "border-line-strong",
            )}
            {...props}
          />
          <Check className="pointer-events-none absolute inset-0 m-auto size-3.5 text-white opacity-0 peer-checked:opacity-100" />
        </span>
        <span className="type-small text-fg-muted">{label}</span>
      </label>
      {error && (
        <p className="type-caption mt-2 pl-8 text-accent-pink" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});
