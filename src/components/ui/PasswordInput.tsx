"use client";

import { Eye, EyeOff } from "lucide-react";
import { forwardRef, useState } from "react";
import { cn } from "@/lib/cn";
import { Input } from "./Input";

type Props = Omit<React.ComponentProps<typeof Input>, "type">;

/** Password field with a show/hide toggle. */
export const PasswordInput = forwardRef<HTMLInputElement, Props>(function PasswordInput(
  props,
  ref,
) {
  const [shown, setShown] = useState(false);
  return (
    <div className="relative">
      <Input ref={ref} type={shown ? "text" : "password"} className="pr-12" {...props} />
      <button
        type="button"
        onClick={() => setShown((v) => !v)}
        aria-label={shown ? "Hide password" : "Show password"}
        className={cn(
          "absolute right-2 inline-flex size-8 items-center justify-center rounded-full text-fg-subtle transition-colors hover:text-fg",
          props.label ? "top-9" : "top-2",
        )}
      >
        {shown ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
});
