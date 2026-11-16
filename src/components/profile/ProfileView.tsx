import { ChevronRight, Download, LogOut, Settings, ShieldCheck, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { initials } from "@/lib/user";
import { formatDate } from "@/lib/memories/format";
import type { ProfileOverview } from "@/lib/account/queries";

type Props = {
  name: string | null;
  email: string | null;
  bio: string | null;
  avatarUrl: string | null;
  joined: string; // ISO timestamp
  overview: ProfileOverview;
  /** The Edit Profile control (client component) or a static button in the demo. */
  editSlot: React.ReactNode;
  settingsHref: string;
  /** Demo previews don't sign anyone out. */
  signOut?: boolean;
};

const joinedLabel = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "long", year: "numeric" });

export function ProfileView({ name, email, bio, avatarUrl, joined, overview, editSlot, settingsHref, signOut = true }: Props) {
  const span =
    overview.firstDate && overview.lastDate
      ? overview.firstDate.slice(0, 4) === overview.lastDate.slice(0, 4)
        ? overview.firstDate.slice(0, 4)
        : `${overview.firstDate.slice(0, 4)} – ${overview.lastDate.slice(0, 4)}`
      : null;

  const rows = [
    { href: settingsHref, icon: Settings, label: "Settings", hint: "Account, notifications and appearance" },
    { href: `${settingsHref}#privacy`, icon: ShieldCheck, label: "Privacy", hint: "Your memories are private by default" },
    { href: `${settingsHref}#data`, icon: Download, label: "Export My Data", hint: "Download everything you've saved" },
    { href: `${settingsHref}#data`, icon: Trash2, label: "Delete Account", hint: "Permanently remove your account and data", danger: true },
  ];

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8">
      <section className="flex flex-col items-start gap-6 rounded-[2rem] border border-line bg-surface/50 p-6 backdrop-blur-sm sm:flex-row sm:items-center sm:p-9">
        <div className="relative size-28 shrink-0 overflow-hidden rounded-full border-2 border-accent-2/50 bg-brand shadow-brand sm:size-32">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt={name ? `${name}'s photo` : "Profile photo"} className="size-full object-cover" />
          ) : (
            <span className="flex size-full items-center justify-center text-4xl font-semibold text-white">
              {initials({ name, email })}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="type-title">{name || "Your name"}</h1>
          <p className="type-body mt-1 max-w-xl text-fg-muted">
            {bio || "Add a short bio so your archive feels like yours."}
          </p>
          <p className="type-small mt-3 text-fg-subtle">Joined {joinedLabel(joined)}</p>
        </div>
        <div className="sm:self-start">{editSlot}</div>
      </section>

      <section aria-label="Journey overview" className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-line bg-surface/50 p-6">
          <p className="font-display text-4xl font-bold leading-none">{overview.memories}</p>
          <p className="type-small mt-2 text-fg-muted">{overview.memories === 1 ? "Memory" : "Memories"} saved</p>
        </div>
        <div className="rounded-3xl border border-line bg-surface/50 p-6">
          <p className="font-display text-4xl font-bold leading-none">{overview.inJourney}</p>
          <p className="type-small mt-2 text-fg-muted">
            On your{" "}
            <Link href="/journey" className="text-accent-3 underline-offset-4 hover:underline">
              Journey
            </Link>
          </p>
        </div>
        <div className="rounded-3xl border border-line bg-surface/50 p-6">
          <p className="font-display text-4xl font-bold leading-none">{span ?? "—"}</p>
          <p className="type-small mt-2 text-fg-muted">
            {overview.firstDate ? `Since ${formatDate(overview.firstDate, "long")}` : "Your first memory starts the story"}
          </p>
        </div>
      </section>

      <section aria-label="Account actions" className="overflow-hidden rounded-3xl border border-line bg-surface/50">
        <ul className="divide-y divide-line">
          {rows.map(({ href, icon: Icon, label, hint, danger }) => (
            <li key={label}>
              <Link
                href={href}
                className="group flex items-center gap-4 px-5 py-4 transition duration-300 ease-calm hover:bg-surface-2/60 sm:px-6"
              >
                <span
                  className={`inline-flex size-11 shrink-0 items-center justify-center rounded-full ${
                    danger ? "bg-accent-pink/15 text-accent-pink" : "bg-accent/15 text-accent-3"
                  }`}
                >
                  <Icon className="size-5" strokeWidth={1.75} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[0.95rem] font-medium">{label}</span>
                  <span className="type-caption block text-fg-subtle">{hint}</span>
                </span>
                <ChevronRight className="size-4 text-fg-subtle transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {signOut ? (
        <form action="/auth/signout" method="post">
          <Button type="submit" variant="secondary">
            <LogOut className="size-4" /> Sign Out
          </Button>
        </form>
      ) : (
        <Button variant="secondary" disabled>
          <LogOut className="size-4" /> Sign Out
        </Button>
      )}
    </div>
  );
}
