"use client";

import { Check, Pencil, Plus, Share2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, IconButton } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Notice } from "@/components/ui/Notice";
import { describeError, deleteMemory, setInJourney } from "@/lib/memories/save";
import { formatDate } from "@/lib/memories/format";
import type { Memory, SignedMedia } from "@/lib/memories/types";
import { FavoriteButton } from "./FavoriteButton";

/** Icon row shown on the hero: favorite, share, edit, delete. */
export function MemoryIconActions({
  memory,
  media,
  canShare = true,
  shareLocation = false,
}: {
  memory: Memory;
  media: SignedMedia[];
  /** False for people under 18. */
  canShare?: boolean;
  /** Include the place name when sharing. Off unless the person opted in. */
  shareLocation?: boolean;
}) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  async function share() {
    setToast("");
    const text = [memory.title, formatDate(memory.memory_date, "long"), shareLocation ? memory.location_name : null]
      .filter(Boolean)
      .join(" · ");
    try {
      const first = media[0];
      // Sharing hands the file to an app the person picks; nothing is published by LifeArchive.
      if (first && typeof navigator.canShare === "function") {
        const blob = await (await fetch(first.url)).blob();
        const file = new File([blob], `${memory.title}.${first.mime_type.split("/")[1] ?? "jpg"}`, {
          type: first.mime_type,
        });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ title: memory.title, text, files: [file] });
          return;
        }
      }
      if (typeof navigator.share === "function") {
        await navigator.share({ title: memory.title, text });
        return;
      }
      if (first) {
        const blob = await (await fetch(first.url)).blob();
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${memory.title}.${first.mime_type.split("/")[1] ?? "jpg"}`;
        a.click();
        URL.revokeObjectURL(a.href);
        setToast("Sharing isn't available here, so we saved a copy to your device instead.");
        return;
      }
      await navigator.clipboard.writeText(text);
      setToast("Copied to your clipboard.");
    } catch (e) {
      if ((e as Error)?.name !== "AbortError") setToast("Couldn't share this memory. Please try again.");
    }
  }

  async function confirmDelete() {
    setDeleting(true);
    setError("");
    try {
      await deleteMemory(memory.id, media);
      router.replace("/memories");
      router.refresh();
    } catch (e) {
      setError(describeError(e));
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <FavoriteButton memoryId={memory.id} initial={memory.is_favorite} className="size-11" />
        {canShare && (
          <IconButton label="Share or save a copy" onClick={share} className="border-transparent bg-base/50 backdrop-blur-sm">
            <Share2 className="size-[1.1rem]" />
          </IconButton>
        )}
        <Link
          href={`/memories/${memory.id}/edit`}
          aria-label="Edit memory"
          title="Edit memory"
          className="inline-flex size-11 items-center justify-center rounded-full bg-base/50 text-fg-muted backdrop-blur-sm transition hover:bg-base/70 hover:text-fg"
        >
          <Pencil className="size-[1.1rem]" />
        </Link>
        <IconButton
          label="Delete memory"
          onClick={() => setConfirmOpen(true)}
          className="border-transparent bg-base/50 backdrop-blur-sm hover:text-accent-pink"
        >
          <Trash2 className="size-[1.1rem]" />
        </IconButton>
      </div>

      {toast && (
        <div className="fixed inset-x-4 bottom-24 z-40 mx-auto max-w-sm md:bottom-8">
          <Notice tone="success">
            {toast}{" "}
            <button type="button" className="underline underline-offset-4" onClick={() => setToast("")}>
              Dismiss
            </button>
          </Notice>
        </div>
      )}

      <Modal
        open={confirmOpen}
        onClose={() => !deleting && setConfirmOpen(false)}
        title="Delete this memory?"
        description="Its photos, videos and note will be permanently removed. This can't be undone."
      >
        <div className="flex flex-col gap-4">
          {error && <Notice tone="error">{error}</Notice>}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => setConfirmOpen(false)} disabled={deleting}>
              Keep it
            </Button>
            <Button
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-accent-pink/90 text-base shadow-none hover:bg-accent-pink"
            >
              {deleting ? "Deleting…" : "Delete permanently"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

/** "Add to Journey +" toggle. */
export function JourneyToggle({ id, initial }: { id: string; initial: boolean }) {
  const [on, setOn] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function toggle() {
    setBusy(true);
    setError("");
    const next = !on;
    try {
      await setInJourney(id, next);
      setOn(next);
    } catch (e) {
      setError(describeError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button variant={on ? "secondary" : "primary"} onClick={toggle} disabled={busy}>
        {on ? (
          <>
            <Check className="size-4" /> In your Journey
          </>
        ) : (
          <>
            Add to Journey <Plus className="size-4" />
          </>
        )}
      </Button>
      {error && <p className="type-caption text-accent-pink">{error}</p>}
    </div>
  );
}
