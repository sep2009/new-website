"use client";

import { MEDIA_LIMITS } from "@/config/limits";
import { formatBytes } from "./format";
import type { MediaKind } from "./types";

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/heic": "heic",
  "image/heif": "heif",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
};

export const extFor = (mime: string) => EXT[mime] ?? "bin";

/** Some browsers report HEIC as an empty type; fall back to the extension. */
function mimeOf(file: File): string {
  if (file.type) return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "heic") return "image/heic";
  if (ext === "heif") return "image/heif";
  return "";
}

export function kindOf(file: File): MediaKind | null {
  const mime = mimeOf(file);
  if ((MEDIA_LIMITS.imageMimes as readonly string[]).includes(mime)) return "image";
  if ((MEDIA_LIMITS.videoMimes as readonly string[]).includes(mime)) return "video";
  return null;
}

/** Returns a user-facing error, or undefined if the file is acceptable. */
export function validateFile(file: File): string | undefined {
  if (!kindOf(file)) {
    return `"${file.name}" isn't a supported file. Use JPG, PNG, WebP, GIF or HEIC photos, or MP4, MOV or WebM videos.`;
  }
  if (file.size === 0) return `"${file.name}" is empty.`;
  if (file.size > MEDIA_LIMITS.maxFileBytes) {
    return `"${file.name}" is ${formatBytes(file.size)}. The limit is ${formatBytes(MEDIA_LIMITS.maxFileBytes)} per file.`;
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
}

async function decode(file: Blob): Promise<ImageBitmap | null> {
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return null; // HEIC and some formats can't be decoded in every browser
  }
}

async function scaleTo(bitmap: ImageBitmap, edge: number, quality: number) {
  const scale = Math.min(1, edge / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(bitmap, 0, 0, w, h);

  let blob = await canvasToBlob(canvas, "image/webp", quality);
  if (!blob || blob.type !== "image/webp") blob = await canvasToBlob(canvas, "image/jpeg", quality);
  return blob ? { blob, width: w, height: h } : null;
}

export type PreparedImage = {
  blob: Blob;
  mime: string;
  width: number | null;
  height: number | null;
};

/**
 * Optimise a photo before upload: large photos are scaled down so galleries stay fast
 * and storage lasts longer. GIFs and formats the browser can't decode are uploaded as-is.
 */
export async function prepareImage(file: File): Promise<PreparedImage> {
  const mime = mimeOf(file);
  const original: PreparedImage = { blob: file, mime, width: null, height: null };
  if (mime === "image/gif") return original;

  const bitmap = await decode(file);
  if (!bitmap) return original;

  const longEdge = Math.max(bitmap.width, bitmap.height);
  const small = longEdge <= MEDIA_LIMITS.maxImageEdge && file.size <= 3 * 1024 * 1024;
  if (small) {
    const dims = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return { ...original, ...dims };
  }

  const scaled = await scaleTo(bitmap, MEDIA_LIMITS.maxImageEdge, 0.86);
  bitmap.close();
  if (!scaled || scaled.blob.size >= file.size) return original;
  return { blob: scaled.blob, mime: scaled.blob.type, width: scaled.width, height: scaled.height };
}

/** Small WebP/JPEG preview used by galleries. Null if the browser can't make one. */
export async function makeImageThumb(source: Blob): Promise<Blob | null> {
  const bitmap = await decode(source);
  if (!bitmap) return null;
  const scaled = await scaleTo(bitmap, MEDIA_LIMITS.thumbEdge, 0.78);
  bitmap.close();
  return scaled?.blob ?? null;
}

/** A still frame from a video, used as its poster. Best effort; times out after 8s. */
export function makeVideoThumb(file: File): Promise<Blob | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    let settled = false;
    const done = (blob: Blob | null) => {
      if (settled) return;
      settled = true;
      URL.revokeObjectURL(url);
      video.removeAttribute("src");
      video.load();
      resolve(blob);
    };
    const timer = setTimeout(() => done(null), 8000);

    video.muted = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.onerror = () => {
      clearTimeout(timer);
      done(null);
    };
    video.onloadeddata = () => {
      video.currentTime = Math.min(0.5, (video.duration || 1) / 2);
    };
    video.onseeked = async () => {
      clearTimeout(timer);
      try {
        const long = Math.max(video.videoWidth, video.videoHeight) || 1;
        const scale = Math.min(1, MEDIA_LIMITS.thumbEdge / long);
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
        canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
        canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
        done(await canvasToBlob(canvas, "image/jpeg", 0.78));
      } catch {
        done(null);
      }
    };
    video.src = url;
  });
}

/**
 * Upload one object to the private bucket with real byte-level progress.
 * (supabase-js's upload() has no progress events, so this talks to the Storage REST API.)
 */
export function uploadWithProgress(args: {
  path: string;
  blob: Blob;
  contentType: string;
  accessToken: string;
  onProgress?: (fraction: number) => void;
}): Promise<void> {
  const { path, blob, contentType, accessToken, onProgress } = args;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
  const encoded = path.split("/").map(encodeURIComponent).join("/");

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${base}/storage/v1/object/memories/${encoded}`);
    xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
    xhr.setRequestHeader("apikey", key);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.setRequestHeader("cache-control", "max-age=31536000");

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(e.loaded / e.total);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(1);
        resolve();
        return;
      }
      let message = "Upload failed.";
      try {
        const body = JSON.parse(xhr.responseText);
        if (body?.message) message = String(body.message);
      } catch {}
      if (xhr.status === 413) message = "That file is too large for storage.";
      reject(new Error(message));
    };
    xhr.onerror = () => reject(new Error("Network error during upload. Check your connection."));
    xhr.onabort = () => reject(new Error("Upload cancelled."));
    xhr.send(blob);
  });
}
