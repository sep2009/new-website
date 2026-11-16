"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Camera, Lock, Mail, MailOpen, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Notice } from "@/components/ui/Notice";
import { prepareImage, uploadWithProgress, validateFile } from "@/lib/memories/media";
import { extFor } from "@/lib/memories/media";
import { createClient } from "@/lib/supabase/client";

export type MessageRow = {
  id: string;
  open_at: string;
  opened_at: string | null;
  created_at: string;
  photo_path: string | null;
};

type Opened = { title: string | null; body: string; photoUrl: string | null; open_at: string; created_at: string };

type Props = {
  userId: string;
  /** Server clock at render time, so "sealed" never depends on the browser's clock. */
  nowIso: string;
  rows: MessageRow[];
  limit: number;
  demo?: boolean;
};

const DEMO_CONTENT: Record<string, Opened> = {
  "demo-ready": {
    title: "Dear future me,",
    body: "By the time you read this, the studio should be a year old. I hope you still stop to photograph the light on the stairs. Remember why you started: not for the likes, but for the moments you almost missed.\n\nBe kind to the version of me who was scared. She did it anyway.",
    photoUrl: null,
    open_at: "2026-11-15T00:00:00Z",
    created_at: "2025-11-15T10:00:00Z",
  },
  "demo-old": {
    title: "Two years from now",
    body: "I just moved to Lisbon. The boxes are still in the hallway and I can hear the tram outside. Tell me it feels like home by now.",
    photoUrl: null,
    open_at: "2026-02-01T00:00:00Z",
    created_at: "2024-02-01T20:00:00Z",
  },
};

const longDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

function daysUntil(openIso: string, nowIso: string) {
  return Math.max(0, Math.ceil((new Date(openIso).getTime() - new Date(nowIso).getTime()) / 86_400_000));
}

const tomorrowLocal = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export function FutureMessages({ userId, nowIso, rows: initial, limit, demo }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState(initial);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [date, setDate] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [errors, setErrors] = useState<{ body?: string; date?: string; photo?: string }>({});
  const [formError, setFormError] = useState("");
  const [sealed, setSealed] = useState(false);
  const [busy, setBusy] = useState(false);

  const [letter, setLetter] = useState<Opened | null>(null);
  const [opening, setOpening] = useState<string | null>(null);
  const [openError, setOpenError] = useState("");
  const [toDelete, setToDelete] = useState<MessageRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const now = new Date(nowIso).getTime();
  const ready = rows.filter((r) => !r.opened_at && new Date(r.open_at).getTime() <= now);
  const sealedRows = rows.filter((r) => !r.opened_at && new Date(r.open_at).getTime() > now);
  const opened = rows.filter((r) => r.opened_at);
  const unopenedCount = ready.length + sealedRows.length;

  async function seal(e: React.FormEvent) {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!body.trim()) errs.body = "Write something to your future self.";
    if (!date) errs.date = "Choose the day it should open.";
    else if (date < tomorrowLocal()) errs.date = "Pick tomorrow or a later date.";
    if (photo) errs.photo = validateFile(photo) ?? (photo.type.startsWith("image/") ? undefined : "Please choose a photo.");
    setErrors(errs);
    setFormError("");
    if (Object.values(errs).some(Boolean)) return;
    if (unopenedCount >= limit) return setFormError(`You can keep up to ${limit} unopened messages. Open or delete one to write another.`);

    setBusy(true);
    const [y, m, d] = date.split("-").map(Number);
    // Opens at the start of that day in the writer's own time zone.
    const openAt = new Date(y, m - 1, d, 0, 0, 0).toISOString();

    if (demo) {
      setRows((r) => [...r, { id: `demo-${Date.now()}`, open_at: openAt, opened_at: null, created_at: nowIso, photo_path: null }]);
      setTitle(""); setBody(""); setDate(""); setPhoto(null); setSealed(true); setBusy(false);
      return;
    }

    const supabase = createClient();
    let photoPath: string | null = null;
    try {
      if (photo) {
        const { data } = await supabase.auth.getSession();
        if (!data.session) throw new Error("Your session has expired. Please sign in again.");
        const prepared = await prepareImage(photo);
        photoPath = `${userId}/future/${crypto.randomUUID()}.${extFor(prepared.mime)}`;
        await uploadWithProgress({ path: photoPath, blob: prepared.blob, contentType: prepared.mime, accessToken: data.session.access_token });
      }
      const { data, error } = await supabase
        .from("future_messages")
        .insert({ title: title.trim() || null, body: body.trim(), photo_path: photoPath, open_at: openAt })
        .select("id,open_at,opened_at,created_at,photo_path")
        .single();
      if (error || !data) throw error ?? new Error("Couldn't seal that message.");
      setRows((r) => [...r, data as MessageRow]);
      setTitle(""); setBody(""); setDate(""); setPhoto(null); setSealed(true);
      router.refresh();
    } catch (err) {
      if (photoPath) await supabase.storage.from("memories").remove([photoPath]).catch(() => {});
      const msg = err instanceof Error ? err.message : (err as { message?: string })?.message ?? "";
      setFormError(
        /row-level security|violates/i.test(msg)
          ? `Couldn't seal that. The date must be in the future, and you can keep up to ${limit} unopened messages.`
          : msg || "Something went wrong. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function openMessage(id: string) {
    setOpening(id);
    setOpenError("");
    if (demo) {
      setLetter(DEMO_CONTENT[id] ?? DEMO_CONTENT["demo-ready"]);
      setRows((r) => r.map((x) => (x.id === id ? { ...x, opened_at: nowIso } : x)));
      setOpening(null);
      return;
    }
    const supabase = createClient();
    // The database checks the opening time itself; it refuses early requests.
    const { data, error } = await supabase.rpc("read_future_message", { p_id: id });
    setOpening(null);
    const row = Array.isArray(data) ? data[0] : data;
    if (error || !row) {
      setOpenError(/sealed/i.test(error?.message ?? "") ? "This message is still sealed. It will open on its date." : "We couldn't open that message. Please try again.");
      return;
    }
    let photoUrl: string | null = null;
    if (row.photo_path) {
      const { data: signed } = await supabase.storage.from("memories").createSignedUrl(row.photo_path, 3600);
      photoUrl = signed?.signedUrl ?? null;
    }
    setLetter({ title: row.title, body: row.body, photoUrl, open_at: row.open_at, created_at: row.created_at });
    setRows((r) => r.map((x) => (x.id === id ? { ...x, opened_at: x.opened_at ?? new Date().toISOString() } : x)));
    router.refresh();
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    if (!demo) {
      const supabase = createClient();
      const { error } = await supabase.from("future_messages").delete().eq("id", toDelete.id);
      if (error) {
        setDeleting(false);
        setOpenError("Couldn't delete that message. Please try again.");
        setToDelete(null);
        return;
      }
      if (toDelete.photo_path) await supabase.storage.from("memories").remove([toDelete.photo_path]).catch(() => {});
      router.refresh();
    }
    setRows((r) => r.filter((x) => x.id !== toDelete.id));
    setDeleting(false);
    setToDelete(null);
  }

  const card = "rounded-[2rem] border border-line bg-surface/50 p-6 sm:p-8";

  return (
    <div>
      <div className="pb-6 pt-2 md:pt-4">
        <h1 className="type-title">Future Messages</h1>
        <p className="type-body mt-2 text-fg-muted">Write to the person you&apos;ll be. Seal it, and open it on the day.</p>
      </div>

      {openError && <Notice tone="error" className="mb-5">{openError}</Notice>}

      {ready.length > 0 && (
        <section aria-label="Ready to open" className="mb-6 rounded-[2rem] border border-accent-pink/40 bg-linear-to-br from-accent-pink/15 to-accent/15 p-6 sm:p-8">
          <h2 className="type-heading flex items-center gap-2">
            <Mail className="size-5 text-accent-pink" /> {ready.length === 1 ? "A message is ready to open" : `${ready.length} messages are ready to open`}
          </h2>
          <ul className="mt-5 flex flex-col gap-3">
            {ready.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-base/40 p-4">
                <span className="text-sm">
                  Written {longDate(r.created_at)} <span className="text-fg-subtle">· opened up on {longDate(r.open_at)}</span>
                </span>
                <Button size="sm" onClick={() => openMessage(r.id)} disabled={opening === r.id}>
                  {opening === r.id ? "Opening…" : "Open it"}
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <section className={card} aria-label="Write a message">
          {sealed ? (
            <div className="flex flex-col items-start gap-4 py-6">
              <span className="inline-flex size-14 items-center justify-center rounded-full bg-accent/20 text-accent-3"><Lock className="size-6" /></span>
              <h2 className="type-title">Sealed.</h2>
              <p className="type-body text-fg-muted">Your message is safely locked away until its day. Not even you can read it before then.</p>
              <Button variant="secondary" onClick={() => setSealed(false)}>Write another</Button>
            </div>
          ) : (
            <form onSubmit={seal} noValidate className="flex flex-col gap-5">
              <h2 className="type-heading">Dear future me…</h2>
              {formError && <Notice tone="error">{formError}</Notice>}
              <Input label="Title" optional value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Dear future me," maxLength={120} disabled={busy} />
              <Textarea label="Your message" rows={8} value={body} onChange={(e) => setBody(e.target.value)} placeholder="What do you want to tell yourself?" maxLength={10000} error={errors.body} disabled={busy} />
              <Input label="Open on" type="date" min={tomorrowLocal()} value={date} onChange={(e) => setDate(e.target.value)} error={errors.date} hint="It opens at the start of that day, in your time zone." disabled={busy} className="max-w-56" />

              <div>
                <p className="type-small mb-2 font-medium">Photo <span className="font-normal text-fg-subtle">(optional)</span></p>
                <div className="flex items-center gap-3">
                  <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()} disabled={busy}>
                    <Camera className="size-4" /> {photo ? "Change photo" : "Add a photo"}
                  </Button>
                  {photo && (
                    <span className="type-caption flex items-center gap-2 text-fg-muted">
                      {photo.name}
                      <button type="button" aria-label="Remove photo" onClick={() => setPhoto(null)} className="text-fg-subtle hover:text-fg"><X className="size-4" /></button>
                    </span>
                  )}
                  <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" tabIndex={-1} onChange={(e) => { setPhoto(e.target.files?.[0] ?? null); e.target.value = ""; }} />
                </div>
                {errors.photo && <p role="alert" className="type-caption mt-2 text-accent-pink">{errors.photo}</p>}
              </div>

              <div className="flex flex-col items-start gap-3">
                <Button type="submit" size="lg" disabled={busy}>
                  <Lock className="size-4" /> {busy ? "Sealing…" : "Seal message"}
                </Button>
                <p className="type-caption text-fg-subtle">
                  Once sealed, a message can&apos;t be read or edited until its day. You can delete it any time. {unopenedCount}/{limit} unopened.
                </p>
              </div>
            </form>
          )}
        </section>

        <div className="flex flex-col gap-6">
          <section className={card} aria-label="Sealed messages">
            <h2 className="type-heading">Sealed</h2>
            {sealedRows.length === 0 ? (
              <p className="type-small mt-3 text-fg-muted">No sealed messages yet.</p>
            ) : (
              <ul className="mt-5 flex flex-col gap-3">
                {sealedRows.sort((a, b) => a.open_at.localeCompare(b.open_at)).map((r) => {
                  const days = daysUntil(r.open_at, nowIso);
                  return (
                    <li key={r.id} className="flex items-center gap-4 rounded-2xl border border-line bg-base/40 p-4">
                      <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent-3"><Lock className="size-5" /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium">Opens {longDate(r.open_at)}</span>
                        <span className="type-caption text-fg-subtle">In {days} {days === 1 ? "day" : "days"} · written {longDate(r.created_at)}</span>
                      </span>
                      <button type="button" onClick={() => setToDelete(r)} aria-label="Delete this message" className="inline-flex size-9 items-center justify-center rounded-full text-fg-subtle transition hover:bg-surface hover:text-accent-pink">
                        <Trash2 className="size-4" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className={card} aria-label="Opened messages">
            <h2 className="type-heading">Opened</h2>
            {opened.length === 0 ? (
              <p className="type-small mt-3 text-fg-muted">Messages you&apos;ve opened will stay here to reread.</p>
            ) : (
              <ul className="mt-5 flex flex-col gap-3">
                {opened.map((r) => (
                  <li key={r.id}>
                    <button type="button" onClick={() => openMessage(r.id)} className="flex w-full items-center gap-4 rounded-2xl border border-line bg-base/40 p-4 text-left transition hover:border-line-strong hover:bg-surface-2/60">
                      <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-[#35e0c2]/15 text-[#7ff5d2]"><MailOpen className="size-5" /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium">Opened {longDate(r.opened_at ?? r.open_at)}</span>
                        <span className="type-caption text-fg-subtle">Written {longDate(r.created_at)}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      <LetterOverlay letter={letter} onClose={() => setLetter(null)} />

      <Modal open={!!toDelete} onClose={() => !deleting && setToDelete(null)} title="Delete this sealed message?" description="It will be permanently erased and can't be recovered.">
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={() => setToDelete(null)} disabled={deleting}>Keep it</Button>
          <Button onClick={confirmDelete} disabled={deleting} className="bg-accent-pink/90 text-base shadow-none hover:bg-accent-pink">
            {deleting ? "Deleting…" : "Delete permanently"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

/** The opening: an envelope unfolds and the letter rises into view. */
function LetterOverlay({ letter, onClose }: { letter: Opened | null; onClose: () => void }) {
  return (
    <AnimatePresence>
      {letter && (
        <motion.div
          key="letter"
          role="dialog"
          aria-modal="true"
          aria-label="Your message"
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-base/90 p-4 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <button type="button" aria-label="Close" onClick={onClose} className="absolute right-4 top-4 inline-flex size-11 items-center justify-center rounded-full bg-surface/80 hover:bg-surface-2">
            <X className="size-5" />
          </button>

          <div className="relative w-full max-w-xl" onClick={(e) => e.stopPropagation()}>
            <motion.div
              aria-hidden
              className="mx-auto mb-[-3rem] h-24 w-40 origin-top rounded-b-2xl bg-linear-to-br from-[#ffd7bd] to-[#f08a9e] shadow-lift"
              initial={{ rotateX: 0, opacity: 1 }}
              animate={{ rotateX: 180, opacity: 0 }}
              transition={{ duration: 0.9, delay: 0.15 }}
            />
            <motion.article
              initial={{ y: 80, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="relative rounded-[2rem] border border-line-strong bg-linear-to-b from-surface-2 to-surface p-7 shadow-lift sm:p-10"
            >
              <p className="type-caption uppercase tracking-[0.18em] text-accent-pink">
                From you, {longDate(letter.created_at)}
              </p>
              <h2 className="type-title mt-3">{letter.title || "Dear future me,"}</h2>
              {letter.photoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={letter.photoUrl} alt="" className="mt-6 max-h-72 w-full rounded-2xl object-cover" />
              )}
              <p className="type-body mt-6 whitespace-pre-wrap text-lg leading-relaxed text-fg/90">{letter.body}</p>
              <p className="type-caption mt-8 text-fg-subtle">Opened {longDate(letter.open_at)}</p>
            </motion.article>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
