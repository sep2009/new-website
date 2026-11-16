import { AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/cn";

/** Inline status message. Announced to screen readers. */
export function Notice({
  tone,
  children,
  className,
}: {
  tone: "error" | "success";
  children: React.ReactNode;
  className?: string;
}) {
  const Icon = tone === "error" ? AlertCircle : CheckCircle2;
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-3 rounded-control border px-4 py-3 type-small",
        tone === "error"
          ? "border-accent-pink/30 bg-accent-pink/10 text-accent-pink"
          : "border-accent-2/30 bg-accent/10 text-accent-3",
        className,
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}
