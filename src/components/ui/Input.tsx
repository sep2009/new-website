import { forwardRef, useId } from "react";
import { cn } from "@/lib/cn";

const field =
  "w-full rounded-control border border-line bg-raised/70 px-4 text-fg placeholder:text-fg-subtle " +
  "transition duration-300 ease-calm hover:border-line-strong " +
  "focus:border-accent-2/70 focus:bg-raised focus:outline-none focus:ring-4 focus:ring-accent/15";

type FieldShellProps = {
  label?: string;
  hint?: string;
  optional?: boolean;
  error?: string;
  id: string;
  children: React.ReactNode;
};

function FieldShell({ label, hint, optional, error, id, children }: FieldShellProps) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label htmlFor={id} className="type-small font-medium text-fg">
          {label}
          {optional && <span className="ml-1.5 font-normal text-fg-subtle">(optional)</span>}
        </label>
      )}
      {children}
      {(error || hint) && (
        <p
          id={`${id}-msg`}
          className={cn("type-caption", error ? "text-accent-pink" : "text-fg-subtle")}
        >
          {error ?? hint}
        </p>
      )}
    </div>
  );
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  optional?: boolean;
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, optional, error, className, id, ...props },
  ref,
) {
  const auto = useId();
  const fieldId = id ?? auto;
  return (
    <FieldShell id={fieldId} label={label} hint={hint} optional={optional} error={error}>
      <input
        ref={ref}
        id={fieldId}
        aria-invalid={!!error}
        aria-describedby={error || hint ? `${fieldId}-msg` : undefined}
        className={cn(field, "h-12", className)}
        {...props}
      />
    </FieldShell>
  );
});

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  hint?: string;
  optional?: boolean;
  error?: string;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, optional, error, className, id, rows = 4, ...props },
  ref,
) {
  const auto = useId();
  const fieldId = id ?? auto;
  return (
    <FieldShell id={fieldId} label={label} hint={hint} optional={optional} error={error}>
      <textarea
        ref={ref}
        id={fieldId}
        rows={rows}
        aria-invalid={!!error}
        aria-describedby={error || hint ? `${fieldId}-msg` : undefined}
        className={cn(field, "resize-none py-3.5 leading-relaxed", className)}
        {...props}
      />
    </FieldShell>
  );
});
