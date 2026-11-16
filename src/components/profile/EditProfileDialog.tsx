"use client";

import { Camera, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Notice } from "@/components/ui/Notice";
import { describeError } from "@/lib/memories/save";
import { uploadWithProgress } from "@/lib/memories/media";
import { createClient } from "@/lib/supabase/client";
import { initials } from "@/lib/user";
import { validateName } from "@/lib/validation";

type Props = {
  userId: string;
  name: string | null;
  email: string | null;
  bio: string | null;
  avatarPath: string | null;
  avatarUrl: string | null;
};

const MAX_AVATAR_BYTES = 8 * 1024 * 1024;

/** Centre-crop to a square and shrink to 512px so avatars stay small and sharp. */
async function squareAvatar(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = Math.min(512, side);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Couldn't process that photo.");
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", 0.88));
  if (!blob || blob.type !== "image/webp") {
    const jpeg = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.88));
    if (!jpeg) throw new Error("Couldn't process that photo.");
    return jpeg;
  }
  return blob;
}

export function EditProfileDialog({ userId, name, email, bio, avatarPath, avatarUrl }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState(name ?? "");
  const [about, setAbout] = useState(bio ?? "");
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(avatarUrl);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [nameError, setNameError] = useState<string>();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function pick(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Please choose an image file.");
    if (file.size > MAX_AVATAR_BYTES) return setError("That photo is over 8 MB. Choose a smaller one.");
    setError("");
    setPhoto(file);
    setRemovePhoto(false);
    setPreview(URL.createObjectURL(file));
  }

  async function save() {
    const invalid = validateName(displayName);
    setNameError(invalid);
    setError("");
    if (invalid) return;
    if (about.length > 280) return setError("Keep your bio under 280 characters.");

    setSaving(true);
    const supabase = createClient();
    try {
      let nextPath = avatarPath;
      if (photo) {
        const { data } = await supabase.auth.getSession();
        if (!data.session) throw new Error("Your session has expired. Please sign in again.");
        const blob = await squareAvatar(photo);
        nextPath = `${userId}/avatar-${crypto.randomUUID()}.${blob.type === "image/webp" ? "webp" : "jpg"}`;
        await uploadWithProgress({ path: nextPath, blob, contentType: blob.type, accessToken: data.session.access_token });
      } else if (removePhoto) {
        nextPath = null;
      }

      const { error: err } = await supabase
        .from("profiles")
        .update({ display_name: displayName.trim(), bio: about.trim() || null, avatar_url: nextPath })
        .eq("id", userId);
      if (err) throw err;

      // Tidy up the previous photo once the new one is saved.
      if (avatarPath && avatarPath !== nextPath) {
        await supabase.storage.from("memories").remove([avatarPath]).catch(() => {});
      }

      setOpen(false);
      setPhoto(null);
      router.refresh();
    } catch (e) {
      setError(describeError(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <Pencil className="size-4" /> Edit Profile
      </Button>

      <Modal open={open} onClose={() => !saving && setOpen(false)} title="Edit profile" description="Update how you appear in LifeArchive.">
        <div className="flex flex-col gap-5">
          {error && <Notice tone="error">{error}</Notice>}

          <div className="flex items-center gap-5">
            <div className="relative size-20 shrink-0 overflow-hidden rounded-full bg-brand">
              {preview && !removePhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="" className="size-full object-cover" />
              ) : (
                <span className="flex size-full items-center justify-center text-2xl font-semibold text-white">
                  {initials({ name: displayName || name, email })}
                </span>
              )}
            </div>
            <div className="flex flex-col items-start gap-2">
              <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()} disabled={saving}>
                <Camera className="size-4" /> {preview && !removePhoto ? "Change photo" : "Add photo"}
              </Button>
              {(preview || photo) && !removePhoto && (
                <button
                  type="button"
                  onClick={() => {
                    setRemovePhoto(true);
                    setPhoto(null);
                  }}
                  className="type-caption text-fg-subtle underline underline-offset-4 hover:text-fg"
                >
                  Remove photo
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                tabIndex={-1}
                onChange={(e) => {
                  pick(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </div>
          </div>

          <Input label="Display name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} error={nameError} disabled={saving} autoComplete="name" />
          <Textarea
            label="Short bio"
            optional
            rows={3}
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            hint={`${about.length}/280`}
            placeholder="A line about you."
            disabled={saving}
          />

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
