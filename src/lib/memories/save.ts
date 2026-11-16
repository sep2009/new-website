"use client";

import { createClient } from "@/lib/supabase/client";
import { extFor, makeImageThumb, makeVideoThumb, prepareImage, uploadWithProgress } from "./media";
import type { MediaKind, MemoryInput, MemoryMedia } from "./types";

export type UploadItem = {
  id: string;
  file: File;
  kind: MediaKind;
  previewUrl: string;
  status: "queued" | "preparing" | "uploading" | "done" | "error";
  progress: number; // 0..1
  error?: string;
};

export type ItemPatch = (id: string, patch: Partial<UploadItem>) => void;

type NewMediaRow = {
  memory_id: string;
  user_id: string;
  storage_path: string;
  thumb_path: string | null;
  kind: MediaKind;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  sort_order: number;
};

/** Turn a Supabase/network error into something a person can act on. */
export function describeError(err: unknown): string {
  const msg = err instanceof Error ? err.message : typeof err === "object" && err && "message" in err ? String((err as { message: unknown }).message) : "";
  if (/schema cache|could not find the table|bucket not found/i.test(msg)) {
    return "Your LifeArchive database isn't set up yet. In Supabase, run supabase/setup.sql in the SQL Editor, then try again.";
  }
  if (/row-level security|violates/i.test(msg)) {
    return "That would go over your storage limit, or you don't have permission to do that.";
  }
  if (/payload too large|too large|exceeded the maximum/i.test(msg)) return "A file is too large for storage.";
  if (/mime type|not supported/i.test(msg)) return "One of the files isn't a supported type.";
  if (/network|fetch/i.test(msg)) return "We couldn't reach the server. Check your connection and try again.";
  return msg || "Something went wrong. Please try again.";
}

async function accessToken() {
  const { data } = await createClient().auth.getSession();
  if (!data.session) throw new Error("Your session has expired. Please sign in again.");
  return data.session.access_token;
}

/**
 * Prepare and upload files one at a time. Paths are pushed onto `uploaded` as they land
 * so the caller can clean up if a later step fails.
 */
async function uploadItems(args: {
  userId: string;
  memoryId: string;
  items: UploadItem[];
  startOrder: number;
  patch: ItemPatch;
  uploaded: string[];
}): Promise<NewMediaRow[]> {
  const { userId, memoryId, items, startOrder, patch, uploaded } = args;
  const token = await accessToken();
  const rows: NewMediaRow[] = [];

  for (const [index, item] of items.entries()) {
    try {
      patch(item.id, { status: "preparing", progress: 0, error: undefined });

      let blob: Blob = item.file;
      let mime = item.file.type;
      let width: number | null = null;
      let height: number | null = null;
      let thumb: Blob | null;

      if (item.kind === "image") {
        const prepared = await prepareImage(item.file);
        blob = prepared.blob;
        mime = prepared.mime;
        width = prepared.width;
        height = prepared.height;
        thumb = await makeImageThumb(blob);
      } else {
        thumb = await makeVideoThumb(item.file);
      }

      const base = `${userId}/${memoryId}/${crypto.randomUUID()}`;
      const mainPath = `${base}.${extFor(mime)}`;

      patch(item.id, { status: "uploading" });
      await uploadWithProgress({
        path: mainPath,
        blob,
        contentType: mime,
        accessToken: token,
        onProgress: (f) => patch(item.id, { progress: f * (thumb ? 0.92 : 1) }),
      });
      uploaded.push(mainPath);

      let thumbPath: string | null = null;
      if (thumb) {
        const path = `${base}-thumb.${extFor(thumb.type)}`;
        try {
          await uploadWithProgress({ path, blob: thumb, contentType: thumb.type, accessToken: token });
          uploaded.push(path);
          thumbPath = path;
        } catch {
          // A missing thumbnail is not fatal; the gallery falls back to the full file.
        }
      }

      rows.push({
        memory_id: memoryId,
        user_id: userId,
        storage_path: mainPath,
        thumb_path: thumbPath,
        kind: item.kind,
        mime_type: mime,
        size_bytes: blob.size,
        width,
        height,
        sort_order: startOrder + index,
      });
      patch(item.id, { status: "done", progress: 1 });
    } catch (err) {
      patch(item.id, { status: "error", error: describeError(err) });
      throw err;
    }
  }
  return rows;
}

async function removeObjects(paths: string[]) {
  if (paths.length === 0) return;
  const { error } = await createClient().storage.from("memories").remove(paths);
  if (error) throw error;
}

export async function createMemory(args: {
  userId: string;
  input: MemoryInput;
  items: UploadItem[];
  patch: ItemPatch;
}): Promise<string> {
  const { userId, input, items, patch } = args;
  const supabase = createClient();

  const { data: memory, error } = await supabase
    .from("memories")
    .insert({ ...input, user_id: userId })
    .select("id")
    .single();
  if (error || !memory) throw error ?? new Error("Couldn't create the memory.");

  const uploaded: string[] = [];
  try {
    if (items.length > 0) {
      const rows = await uploadItems({ userId, memoryId: memory.id, items, startOrder: 0, patch, uploaded });
      const { error: mediaError } = await supabase.from("memory_media").insert(rows);
      if (mediaError) throw mediaError;
    }
    return memory.id;
  } catch (err) {
    // Roll back so a failed save never leaves half a memory or orphaned files behind.
    await removeObjects(uploaded).catch(() => {});
    await supabase.from("memories").delete().eq("id", memory.id);
    throw err;
  }
}

export async function updateMemory(args: {
  userId: string;
  id: string;
  input: MemoryInput;
  newItems: UploadItem[];
  removed: Pick<MemoryMedia, "id" | "storage_path" | "thumb_path">[];
  nextOrder: number;
  patch: ItemPatch;
}): Promise<void> {
  const { userId, id, input, newItems, removed, nextOrder, patch } = args;
  const supabase = createClient();

  const { error } = await supabase.from("memories").update(input).eq("id", id);
  if (error) throw error;

  const uploaded: string[] = [];
  try {
    if (newItems.length > 0) {
      const rows = await uploadItems({ userId, memoryId: id, items: newItems, startOrder: nextOrder, patch, uploaded });
      const { error: mediaError } = await supabase.from("memory_media").insert(rows);
      if (mediaError) throw mediaError;
    }
  } catch (err) {
    await removeObjects(uploaded).catch(() => {});
    throw err;
  }

  if (removed.length > 0) {
    const { error: delError } = await supabase
      .from("memory_media")
      .delete()
      .in("id", removed.map((m) => m.id));
    if (delError) throw delError;
    await removeObjects(removed.flatMap((m) => [m.storage_path, m.thumb_path ?? ""]).filter(Boolean)).catch(() => {});
  }
}

/** Remove files first so a failure never leaves orphaned storage behind a deleted row. */
export async function deleteMemory(id: string, media: Pick<MemoryMedia, "storage_path" | "thumb_path">[]) {
  const paths = media.flatMap((m) => [m.storage_path, m.thumb_path ?? ""]).filter(Boolean);
  await removeObjects(paths);
  const { error } = await createClient().from("memories").delete().eq("id", id);
  if (error) throw error;
}

export async function setFavorite(id: string, value: boolean) {
  const { error } = await createClient().from("memories").update({ is_favorite: value }).eq("id", id);
  if (error) throw error;
}

export async function setInJourney(id: string, value: boolean) {
  const { error } = await createClient().from("memories").update({ in_journey: value }).eq("id", id);
  if (error) throw error;
}
