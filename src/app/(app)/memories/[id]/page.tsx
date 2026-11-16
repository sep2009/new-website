import { CalendarDays, MapPin } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/layout/BackLink";
import { Container } from "@/components/layout/AppShell";
import { JourneyToggle, MemoryIconActions } from "@/components/memories/MemoryActions";
import { MediaViewer } from "@/components/memories/MediaViewer";
import { formatDate } from "@/lib/memories/format";
import { getAccount } from "@/lib/account/queries";
import { isUnder18 } from "@/lib/preferences";
import { getMemory } from "@/lib/memories/queries";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const found = await getMemory(id);
  return { title: found?.memory.title ?? "Memory" };
}

export default async function MemoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Row Level Security means this only ever returns the signed-in user's own memory.
  const [found, account] = await Promise.all([getMemory(id), getAccount()]);
  if (!found) notFound();
  const { memory, media } = found;
  const minor = isUnder18(account?.profile.birth_year);

  return (
    <Container size="wide">
      <div className="pt-4 md:pt-10">
        <MediaViewer
          media={media}
          title={memory.title}
          topLeft={
            <span className="rounded-full bg-base/50 px-4 py-2 backdrop-blur-sm">
              <BackLink href="/memories" />
            </span>
          }
          topRight={
            <MemoryIconActions
              memory={memory}
              media={media}
              canShare={!minor}
              shareLocation={!minor && !!account?.prefs.share_location}
            />
          }
          overlay={
            <>
              <h1 className="type-title">{memory.title}</h1>
              <p className="type-small mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-fg-muted">
                <span className="inline-flex items-center gap-2">
                  <CalendarDays className="size-4" />
                  {formatDate(memory.memory_date, "long")}
                </span>
                {memory.location_name && (
                  <span className="inline-flex items-center gap-2">
                    <MapPin className="size-4" />
                    {memory.location_name}
                  </span>
                )}
              </p>
            </>
          }
        />

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-start">
          <div className="max-w-2xl">
            {memory.note ? (
              <p className="type-body whitespace-pre-wrap text-lg text-fg/90">{memory.note}</p>
            ) : (
              <p className="type-body text-fg-subtle">
                No note yet.{" "}
                <Link href={`/memories/${memory.id}/edit`} className="text-accent-3 underline underline-offset-4">
                  Add one
                </Link>
              </p>
            )}
            {memory.tags.length > 0 && (
              <ul className="mt-6 flex flex-wrap gap-2" aria-label="Tags">
                {memory.tags.map((t) => (
                  <li key={t}>
                    <Link
                      href={`/memories?q=${encodeURIComponent(t)}`}
                      className="inline-flex rounded-full bg-accent/15 px-3.5 py-1.5 text-sm text-accent-3 transition hover:bg-accent/25"
                    >
                      #{t}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <JourneyToggle id={memory.id} initial={memory.in_journey} />
        </div>
      </div>
    </Container>
  );
}
