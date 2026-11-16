/**
 * Client-side upload rules. The database and storage bucket enforce the same
 * limits server-side (see supabase/migrations/0002_memories.sql); these exist
 * so people get a clear message before anything is uploaded.
 */
export const MEDIA_LIMITS = {
  /** Matches the bucket's file_size_limit (50 MB). */
  maxFileBytes: 50 * 1024 * 1024,
  maxFilesPerMemory: 20,
  imageMimes: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/heic",
    "image/heif",
  ],
  videoMimes: ["video/mp4", "video/quicktime", "video/webm"],
  /** Photos larger than this long edge are downscaled before upload. */
  maxImageEdge: 2400,
  thumbEdge: 640,
} as const;

export const ACCEPT_ATTR = [...MEDIA_LIMITS.imageMimes, ...MEDIA_LIMITS.videoMimes].join(",");

export const TEXT_LIMITS = {
  title: 120,
  location: 160,
  note: 5000,
  tag: 30,
  tags: 20,
} as const;
