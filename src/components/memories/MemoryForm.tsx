"use client";

import { ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { MEDIA_LIMITS, TEXT_LIMITS } from "@/config/limits";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Notice } from "@/components/ui/Notice";
import { Switch } from "@/components/ui/Switch";
import { formatBytes, todayISO } from "@/lib/memories/format";
import { kindOf, validateFile } from "@/lib/memories/media";
import {
  createMemory,
  describeError,
  updateMemory,
  type UploadItem,
} from "@/lib/memories/save";
import type { Memory, MemoryInput, SignedMedia } from "@/lib/memories/types";
import { MediaDropzone } from "./MediaDropzone";
import { TagInput } from "./TagInput";

type Props = {
  userId: string;
  usage: { used: number; limit: number } | null;
  initial?: { memory: Memory; media: SignedMedia[] };
};

type FieldErrors = Partial<Record<"title" | "date" | "location" | "note", string>>;

export function MemoryForm({ userId, usage, initial }: Props) {
  const router = useRouter();
  const editing = !!initial;

  const [title, setTitle] = useState(initial?.memory.title ?? "");
  const [date, setDate] = useState(initial?.memory.memory_date ?? todayISO());
  const [location, setLocation] = useState(initial?.memory.location_name ?? "");
  const [note, setNote] = useState(initial?.memory.note ?? "");
  const [tags, setTags] = useState<string[]>(initial?.memory.tags ?? []);
  const [inJourney, setInJourney] = useState(initial?.memory.in_journey ?? true);

  const [items, setItems] = useState<UploadItem[]>([]);
  const [existing, setExisting] = useState<SignedMedia[]>(initial?.media ?? []);
  const [removed, setRemoved] = useState<SignedMedia[]>([]);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [mediaErrors, setMediaErrors] = useState<string[]>([]);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  // Object URLs for previews must be released.
  const urls = useRef<Set<string>>(new Set());
  useEffect(() => {
    const set = urls.current;
    return () => set.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  const patch = useCallback((id: string, p: Partial<UploadItem>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...p } : it)));
  }, []);

  function addFiles(files: File[]) {
    const problems: string[] = [];
    const accepted: UploadItem[] = [];
    let count = items.length + existing.length;
    let bytes = items.reduce((s, i) => s + i.file.size, 0);

    for (const file of files) {
      const dup = items.some(
        (i) => i.file.name === file.name && i.file.size === file.size && i.file.lastModified === file.lastModified,
      );
      if (dup) continue;

      const invalid = validateFile(file);
      if (invalid) {
        problems.push(invalid);
        continue;
      }
      if (count >= MEDIA_LIMITS.maxFilesPerMemory) {
        problems.push(`A memory can have up to ${MEDIA_LIMITS.maxFilesPerMemory} photos and videos.`);
        break;
      }
      if (usage && usage.used + bytes + file.size > usage.limit) {
        problems.push(
          `Adding "${file.name}" would go over your storage (${formatBytes(usage.used)} of ${formatBytes(usage.limit)} used).`,
        );
        continue;
      }

      const previewUrl = URL.createObjectURL(file);
      urls.current.add(previewUrl);
      accepted.push({
        id: crypto.randomUUID(),
        file,
        kind: kindOf(file)!,
        previewUrl,
        status: "queued",
        progress: 0,
      });
      count++;
      bytes += file.size;
    }

    setMediaErrors([...new Set(problems)]);
    if (accepted.length) setItems((prev) => [...prev, ...accepted]);
  }

  function removeItem(id: string) {
    setItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) {
        URL.revokeObjectURL(item.previewUrl);
        urls.current.delete(item.previewUrl);
      }
      return prev.filter((i) => i.id !== id);
    });
  }

  function removeExisting(id: string) {
    const m = existing.find((e) => e.id === id);
    if (!m) return;
    setExisting((prev) => prev.filter((e) => e.id !== id));
    setRemoved((prev) => [...prev, m]);
  }

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    const t = title.trim();
    if (!t) next.title = "Give your memory a title.";
    else if (t.length > TEXT_LIMITS.title) next.title = `Keep the title under ${TEXT_LIMITS.title} characters.`;
    if (!date) next.date = "Choose the date of this memory.";
    else if (date > todayISO()) next.date = "Memories can't be dated in the future.";
    if (location.length > TEXT_LIMITS.location) next.location = `Keep the location under ${TEXT_LIMITS.location} characters.`;
    if (note.length > TEXT_LIMITS.note) next.note = `Keep the note under ${TEXT_LIMITS.note} characters.`;
    return next;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fieldErrors = validate();
    setErrors(fieldErrors);
    setFormError("");
    if (Object.keys(fieldErrors).length) return;

    const input: MemoryInput = {
      title: title.trim(),
      memory_date: date,
      location_name: location.trim() || null,
      note: note.trim() || null,
      tags,
      in_journey: inJourney,
      // A changed place name means the old map position is wrong; it can be found again on the Map page.
      ...(initial && (location.trim() || null) !== (initial.memory.location_name ?? null)
        ? { latitude: null, longitude: null }
        : {}),
    };

    setSaving(true);
    try {
      if (initial) {
        const nextOrder = Math.max(-1, ...existing.map((m) => m.sort_order)) + 1;
        await updateMemory({ userId, id: initial.memory.id, input, newItems: items, removed, nextOrder, patch });
        router.push(`/memories/${initial.memory.id}`);
        router.refresh();
        return;
      }
      const id = await createMemory({ userId, input, items, patch });
      setSavedId(id);
      router.refresh();
    } catch (err) {
      setFormError(describeError(err));
      // Rolled back server-side: let people retry without re-picking files.
      setItems((prev) => prev.map((i) => (i.status === "error" ? i : { ...i, status: "queued", progress: 0 })));
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    items.forEach((i) => URL.revokeObjectURL(i.previewUrl));
    urls.current.clear();
    setTitle("");
    setDate(todayISO());
    setLocation("");
    setNote("");
    setTags([]);
    setInJourney(true);
    setItems([]);
    setErrors({});
    setMediaErrors([]);
    setFormError("");
    setSavedId(null);
  }

  if (savedId) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-6 rounded-panel border border-line bg-surface/60 px-8 py-14 text-center">
        <span className="inline-flex size-16 items-center justify-center rounded-full bg-accent/20 text-accent-3">
          <CheckCircle2 className="size-8" />
        </span>
        <div>
          <h2 className="type-title">Your memory has been saved.</h2>
          <p className="type-body mt-2 text-fg-muted">It&apos;s safe in your private archive.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <ButtonLink href={`/memories/${savedId}`} size="lg">
            View Memory
          </ButtonLink>
          <Button variant="secondary" size="lg" onClick={reset}>
            Create another
          </Button>
        </div>
      </div>
    );
  }

  const usagePct = usage ? Math.min(100, Math.round((usage.used / Math.max(1, usage.limit)) * 100)) : 0;

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-8 lg:grid-cols-[1.15fr_auto_1fr] lg:gap-6">
      <div className="flex flex-col gap-4">
        <MediaDropzone
          items={items}
          existing={existing}
          onFiles={addFiles}
          onRemoveItem={removeItem}
          onRemoveExisting={editing ? removeExisting : undefined}
          disabled={saving}
        />
        {mediaErrors.length > 0 && (
          <Notice tone="error">
            <ul className="flex flex-col gap-1">
              {mediaErrors.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </Notice>
        )}
        {usage && (
          <div>
            <div className="h-1.5 overflow-hidden rounded-full bg-surface-2" aria-hidden>
              <div className="h-full rounded-full bg-brand" style={{ width: `${usagePct}%` }} />
            </div>
            <p className="type-caption mt-2 text-fg-subtle">
              {formatBytes(usage.used)} of {formatBytes(usage.limit)} storage used · up to{" "}
              {formatBytes(MEDIA_LIMITS.maxFileBytes)} per file
            </p>
          </div>
        )}
      </div>

      <div className="hidden items-center lg:flex" aria-hidden>
        <div className="flex h-full flex-col items-center gap-3">
          <span className="w-px flex-1 bg-line" />
          <span className="rounded-full border border-line bg-surface px-3 py-1.5 type-caption text-fg-muted">or</span>
          <span className="w-px flex-1 bg-line" />
        </div>
      </div>

      <div className="glass flex flex-col gap-5 rounded-panel p-6 sm:p-8">
        {formError && <Notice tone="error">{formError}</Notice>}

        <Input
          label="Add a title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Best day ever..."
          maxLength={TEXT_LIMITS.title + 20}
          error={errors.title}
          disabled={saving}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="Date"
            type="date"
            value={date}
            max={todayISO()}
            onChange={(e) => setDate(e.target.value)}
            error={errors.date}
            disabled={saving}
          />
          <Input
            label="Location"
            optional
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Istanbul, Türkiye"
            error={errors.location}
            disabled={saving}
          />
        </div>
        <Textarea
          label="Add a note"
          optional
          rows={5}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Write your thoughts..."
          hint={note.length > TEXT_LIMITS.note - 300 ? `${note.length}/${TEXT_LIMITS.note}` : undefined}
          error={errors.note}
          disabled={saving}
        />
        <TagInput value={tags} onChange={setTags} disabled={saving} />
        <Switch
          checked={inJourney}
          onChange={setInJourney}
          label="Add to my Journey"
          description="Shows this memory on your personal timeline."
          disabled={saving}
        />

        <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
          <Link
            href={initial ? `/memories/${initial.memory.id}` : "/memories"}
            className="type-small px-4 py-2 text-center text-fg-muted transition-colors hover:text-fg"
          >
            Cancel
          </Link>
          <Button type="submit" size="lg" disabled={saving}>
            {saving ? (editing ? "Saving changes…" : "Saving memory…") : editing ? "Save Changes" : "Save Memory"}
            {!saving && <ArrowRight className="size-4" />}
          </Button>
        </div>
      </div>
    </form>
  );
}
