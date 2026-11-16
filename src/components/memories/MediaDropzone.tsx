"use client";

import { AlertCircle, CloudUpload, Film, Loader2, X } from "lucide-react";
import { useRef, useState } from "react";
import { ACCEPT_ATTR } from "@/config/limits";
import { cn } from "@/lib/cn";
import { formatBytes } from "@/lib/memories/format";
import type { UploadItem } from "@/lib/memories/save";
import type { SignedMedia } from "@/lib/memories/types";

type Props = {
  items: UploadItem[];
  existing?: SignedMedia[];
  onFiles: (files: File[]) => void;
  onRemoveItem: (id: string) => void;
  onRemoveExisting?: (id: string) => void;
  disabled?: boolean;
  className?: string;
};

export function MediaDropzone({
  items,
  existing = [],
  onFiles,
  onRemoveItem,
  onRemoveExisting,
  disabled,
  className,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const hasAny = items.length + existing.length > 0;

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Upload photos or videos"
        aria-disabled={disabled}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (!disabled && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!disabled) onFiles(Array.from(e.dataTransfer.files));
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-panel border border-dashed px-6 text-center transition duration-300 ease-calm",
          hasAny ? "min-h-40 py-8" : "min-h-72 py-12 lg:min-h-80",
          dragging
            ? "border-accent-2 bg-accent/15"
            : "border-accent-2/40 bg-surface/40 hover:border-accent-2/70 hover:bg-surface/70",
          disabled && "pointer-events-none opacity-60",
        )}
      >
        <CloudUpload className="size-10 text-accent-2" strokeWidth={1.5} />
        <div>
          <p className="type-small font-semibold text-fg">Upload Photos or Videos</p>
          <p className="type-caption mt-1 text-fg-subtle">Drag &amp; drop or click to browse</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT_ATTR}
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => {
            onFiles(Array.from(e.target.files ?? []));
            e.target.value = ""; // allow re-selecting the same file
          }}
        />
      </div>

      {hasAny && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3" aria-label="Selected media">
          {existing.map((m) => (
            <li key={m.id} className="relative aspect-square overflow-hidden rounded-card border border-line bg-surface">
              {m.thumb_url || m.kind === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.thumb_url ?? m.url} alt="" className="size-full object-cover" />
              ) : (
                <div className="flex size-full items-center justify-center text-fg-subtle">
                  <Film className="size-8" />
                </div>
              )}
              {m.kind === "video" && <VideoBadge />}
              {onRemoveExisting && (
                <RemoveButton label="Remove this media" onClick={() => onRemoveExisting(m.id)} disabled={disabled} />
              )}
            </li>
          ))}

          {items.map((it) => (
            <li key={it.id} className="relative aspect-square overflow-hidden rounded-card border border-line bg-surface">
              {it.kind === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={it.previewUrl} alt="" className="size-full object-cover" />
              ) : (
                <video src={it.previewUrl} muted playsInline preload="metadata" className="size-full object-cover" />
              )}
              {it.kind === "video" && <VideoBadge />}

              <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-base/90 to-transparent p-2 pt-6">
                <p className="type-caption truncate text-fg">{it.file.name}</p>
                <p className="type-caption text-fg-muted">{formatBytes(it.file.size)}</p>
                {(it.status === "uploading" || it.status === "preparing" || it.status === "done") && (
                  <div
                    className="mt-1.5 h-1 overflow-hidden rounded-full bg-surface-2"
                    role="progressbar"
                    aria-valuenow={Math.round(it.progress * 100)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Uploading ${it.file.name}`}
                  >
                    <div
                      className="h-full rounded-full bg-brand transition-[width] duration-200"
                      style={{ width: `${Math.round(it.progress * 100)}%` }}
                    />
                  </div>
                )}
              </div>

              {(it.status === "uploading" || it.status === "preparing") && (
                <span className="absolute left-2 top-2 inline-flex size-6 items-center justify-center rounded-full bg-base/70">
                  <Loader2 className="size-3.5 animate-spin text-accent-3" />
                </span>
              )}
              {it.status === "error" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-base/80 p-3 text-center">
                  <AlertCircle className="size-5 text-accent-pink" />
                  <p className="type-caption text-accent-pink">{it.error ?? "Upload failed"}</p>
                </div>
              )}
              {it.status !== "uploading" && it.status !== "preparing" && (
                <RemoveButton label={`Remove ${it.file.name}`} onClick={() => onRemoveItem(it.id)} disabled={disabled} />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function VideoBadge() {
  return (
    <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-base/70 px-2 py-0.5 text-[0.7rem] text-fg">
      <Film className="size-3" /> Video
    </span>
  );
}

function RemoveButton({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="absolute right-2 top-2 inline-flex size-7 items-center justify-center rounded-full bg-base/70 text-fg transition hover:bg-base disabled:opacity-50"
    >
      <X className="size-4" />
    </button>
  );
}
