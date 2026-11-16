import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export function BackLink({ href, children = "Back" }: { href: string; children?: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="type-small inline-flex items-center gap-2 text-fg-muted transition-colors duration-300 hover:text-fg"
    >
      <ArrowLeft className="size-4" />
      {children}
    </Link>
  );
}
