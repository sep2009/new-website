export type MediaKind = "image" | "video";

export type MemoryMedia = {
  id: string;
  memory_id: string;
  storage_path: string;
  thumb_path: string | null;
  kind: MediaKind;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  sort_order: number;
};

export type Memory = {
  id: string;
  title: string;
  memory_date: string; // YYYY-MM-DD
  location_name: string | null;
  latitude: number | null;
  longitude: number | null;
  note: string | null;
  tags: string[];
  is_favorite: boolean;
  in_journey: boolean;
  visibility: "private" | "shared";
  created_at: string;
  updated_at: string;
};

/** A media item with short-lived signed URLs attached. */
export type SignedMedia = MemoryMedia & { url: string; thumb_url: string | null };

/** Row shown in galleries: only what a card needs. */
export type MemoryCardData = Pick<
  Memory,
  "id" | "title" | "memory_date" | "location_name" | "is_favorite"
> & {
  cover_url: string | null;
  cover_kind: MediaKind | null;
  media_count: number;
};

export type MemoryInput = {
  title: string;
  memory_date: string;
  location_name: string | null;
  note: string | null;
  tags: string[];
  in_journey: boolean;
  /** Set to null when the place name changes so the map never shows a stale spot. */
  latitude?: number | null;
  longitude?: number | null;
};
