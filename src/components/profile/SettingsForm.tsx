"use client";

import { Check, Download, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Notice } from "@/components/ui/Notice";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Switch } from "@/components/ui/Switch";
import { friendlyAuthError } from "@/lib/auth-errors";
import { cn } from "@/lib/cn";
import { describeError } from "@/lib/memories/save";
import { isUnder18, type Preferences } from "@/lib/preferences";
import { createClient } from "@/lib/supabase/client";
import { PASSWORD_MIN, validateConfirm, validatePassword } from "@/lib/validation";

type Props = {
  userId: string;
  email: string | null;
  hasPassword: boolean;
  birthYear: number | null;
  prefs: Preferences;
};

function Section({ id, title, description, children }: { id: string; title: string; description?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="rounded-3xl border border-line bg-surface/50 p-6 sm:p-8">
      <h2 className="type-heading">{title}</h2>
      {description && <p className="type-small mt-1 text-fg-muted">{description}</p>}
      <div className="mt-6 flex flex-col gap-5">{children}</div>
    </section>
  );
}

export function SettingsForm({ userId, email, hasPassword, birthYear: initialYear, prefs: initialPrefs }: Props) {
  const router = useRouter();
  const [prefs, setPrefs] = useState(initialPrefs);
  const [saved, setSaved] = useState(false);
  const [prefError, setPrefError] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const [birthYear, setBirthYear] = useState(initialYear ? String(initialYear) : "");
  const [yearError, setYearError] = useState<string>();
  const [yearSaved, setYearSaved] = useState(false);
  const under18 = isUnder18(birthYear ? Number(birthYear) : initialYear);

  const [pw, setPw] = useState<{ password?: string; confirm?: string; form?: string; ok?: boolean; busy?: boolean }>({});
  const [delOpen, setDelOpen] = useState(false);
  const [delConfirm, setDelConfirm] = useState("");
  const [delPassword, setDelPassword] = useState("");
  const [delError, setDelError] = useState("");
  const [deleting, setDeleting] = useState(false);

  /** Save a preference immediately; roll the switch back if saving fails. */
  const savePref = useCallback(
    async (patch: Partial<Preferences>) => {
      const before = prefs;
      setPrefs({ ...prefs, ...patch });
      setPrefError("");
      const { error } = await createClient()
        .from("user_preferences")
        .upsert({ user_id: userId, ...patch }, { onConflict: "user_id" });
      if (error) {
        setPrefs(before);
        setPrefError(describeError(error));
        return;
      }
      setSaved(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setSaved(false), 1800);
      router.refresh();
    },
    [prefs, userId, router],
  );

  async function saveYear() {
    setYearSaved(false);
    const n = birthYear ? Number(birthYear) : null;
    const thisYear = new Date().getFullYear();
    if (n !== null && (!Number.isInteger(n) || n < 1900 || n > thisYear)) {
      setYearError("Enter a valid year, like 2001.");
      return;
    }
    setYearError(undefined);
    const { error } = await createClient().from("profiles").update({ birth_year: n }).eq("id", userId);
    if (error) {
      setYearError(describeError(error));
      return;
    }
    // Under 18: location sharing is locked off.
    if (isUnder18(n) && prefs.share_location) await savePref({ share_location: false });
    setYearSaved(true);
    router.refresh();
  }

  async function changePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const password = String(f.get("password") ?? "");
    const confirm = String(f.get("confirm") ?? "");
    const errs = { password: validatePassword(password), confirm: validateConfirm(password, confirm) };
    if (errs.password || errs.confirm) return setPw(errs);
    setPw({ busy: true });
    const { error } = await createClient().auth.updateUser({ password });
    if (error) return setPw({ form: friendlyAuthError(error) });
    (e.target as HTMLFormElement).reset();
    setPw({ ok: true });
  }

  async function deleteAccount() {
    setDelError("");
    if (delConfirm !== "DELETE") return setDelError('Type DELETE (in capitals) to confirm.');
    if (hasPassword && !delPassword) return setDelError("Enter your password to confirm.");
    setDeleting(true);
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: delConfirm, password: delPassword || undefined }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "We couldn't delete your account. Please try again.");
      router.replace("/signin?notice=account-deleted");
      router.refresh();
    } catch (e) {
      setDelError(e instanceof Error ? e.message : "Something went wrong.");
      setDeleting(false);
    }
  }

  const viewBtn = (value: "grid" | "list", label: string) => (
    <button
      type="button"
      role="radio"
      aria-checked={prefs.default_view === value}
      onClick={() => savePref({ default_view: value })}
      className={cn(
        "h-10 rounded-full border px-5 text-sm transition",
        prefs.default_view === value
          ? "border-accent/50 bg-accent/20 text-fg"
          : "border-line bg-surface/50 text-fg-muted hover:text-fg",
      )}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-col gap-6">
      <div aria-live="polite" className="h-6">
        {saved && (
          <p className="type-small inline-flex items-center gap-1.5 text-[#7ff5d2]">
            <Check className="size-4" /> Saved
          </p>
        )}
      </div>
      {prefError && <Notice tone="error">{prefError}</Notice>}

      <Section id="account" title="Account" description={email ? `Signed in as ${email}` : undefined}>
        {hasPassword ? (
          <form onSubmit={changePassword} noValidate className="flex flex-col gap-4">
            <h3 className="type-small font-medium">Change password</h3>
            {pw.form && <Notice tone="error">{pw.form}</Notice>}
            {pw.ok && <Notice tone="success">Your password has been updated.</Notice>}
            <PasswordInput name="password" label="New password" autoComplete="new-password" hint={`At least ${PASSWORD_MIN} characters, with a letter and a number.`} error={pw.password} />
            <PasswordInput name="confirm" label="Confirm new password" autoComplete="new-password" error={pw.confirm} />
            <Button type="submit" variant="secondary" className="self-start" disabled={pw.busy}>
              {pw.busy ? "Updating…" : "Update password"}
            </Button>
          </form>
        ) : (
          <p className="type-small text-fg-muted">You sign in with a connected account, so manage your password there.</p>
        )}
        <p className="type-small text-fg-subtle">
          To change your name, bio or photo, use <strong className="font-medium text-fg-muted">Edit Profile</strong> on your profile page.
        </p>
      </Section>

      <Section
        id="privacy"
        title="Privacy"
        description="Your memories are private by default. Only you can see them, and nothing is published."
      >
        <div>
          <Input
            label="Birth year"
            optional
            type="number"
            inputMode="numeric"
            min={1900}
            max={new Date().getFullYear()}
            value={birthYear}
            onChange={(e) => {
              setBirthYear(e.target.value);
              setYearSaved(false);
            }}
            placeholder="e.g. 2001"
            hint="Used only to apply stricter privacy defaults if you're under 18. Never shown to anyone."
            error={yearError}
            className="max-w-48"
          />
          <div className="mt-3 flex items-center gap-3">
            <Button variant="secondary" size="sm" onClick={saveYear}>
              Save birth year
            </Button>
            {yearSaved && <span className="type-caption text-[#7ff5d2]">Saved</span>}
          </div>
        </div>

        {under18 && (
          <Notice tone="success">
            Because you&apos;re under 18, your memories stay private, sharing options are turned off, and place names are
            never included.
          </Notice>
        )}

        <Switch
          checked={under18 ? false : prefs.share_location}
          onChange={(v) => savePref({ share_location: v })}
          disabled={under18}
          label="Include place names when I share a memory"
          description={under18 ? "Locked off for your age." : "Off by default. Location is optional and never shared unless you turn this on."}
        />
      </Section>

      <Section id="notifications" title="Notifications" description="Choose what LifeArchive may tell you about.">
        <Switch checked={prefs.notify_on_this_day} onChange={(v) => savePref({ notify_on_this_day: v })} label="On This Day" description="A reminder when a memory from a past year matches today." />
        <Switch checked={prefs.notify_future_messages} onChange={(v) => savePref({ notify_future_messages: v })} label="Future Messages" description="When a message to your future self is ready to open." />
        <Switch checked={prefs.notify_account} onChange={(v) => savePref({ notify_account: v })} label="Account" description="Security and account notices." />
        <p className="type-caption text-fg-subtle">
          Your choices are saved now. Delivery switches on as each feature launches.
        </p>
      </Section>

      <Section id="appearance" title="Appearance">
        <div>
          <p className="type-small mb-3 font-medium">Show my memories as</p>
          <div role="radiogroup" aria-label="Default memories view" className="flex gap-2">
            {viewBtn("grid", "Grid")}
            {viewBtn("list", "List")}
          </div>
        </div>
        <Switch checked={prefs.reduce_motion} onChange={(v) => savePref({ reduce_motion: v })} label="Reduce motion" description="Turns off most animations and transitions." />
      </Section>

      <Section id="data" title="Data management" description="Your data is yours. Take a copy, or remove it entirely.">
        <div className="flex flex-col gap-3 rounded-2xl border border-line bg-base/40 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[0.95rem] font-medium">Export my data</p>
            <p className="type-caption mt-1 text-fg-subtle">
              A JSON file with your profile, preferences, memories and file links (links expire after 7 days).
            </p>
          </div>
          <a
            href="/api/export"
            download
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-line-strong bg-surface px-6 text-sm font-medium transition hover:bg-surface-2"
          >
            <Download className="size-4" /> Export
          </a>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-accent-pink/30 bg-accent-pink/5 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[0.95rem] font-medium text-accent-pink">Delete my account</p>
            <p className="type-caption mt-1 text-fg-subtle">
              Permanently removes your account, memories, photos and videos. This can&apos;t be undone.
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={() => setDelOpen(true)}
            className="border-accent-pink/40 text-accent-pink hover:border-accent-pink hover:bg-accent-pink/10"
          >
            <Trash2 className="size-4" /> Delete account
          </Button>
        </div>
      </Section>

      <Modal
        open={delOpen}
        onClose={() => !deleting && setDelOpen(false)}
        title="Delete your account?"
        description="Everything you've saved, including every photo and video, will be permanently erased."
      >
        <div className="flex flex-col gap-4">
          {delError && <Notice tone="error">{delError}</Notice>}
          <Input label='Type "DELETE" to confirm' value={delConfirm} onChange={(e) => setDelConfirm(e.target.value)} autoComplete="off" disabled={deleting} />
          {hasPassword && (
            <PasswordInput label="Your password" value={delPassword} onChange={(e) => setDelPassword(e.target.value)} autoComplete="current-password" disabled={deleting} />
          )}
          <p className="type-caption text-fg-subtle">Want a copy first? Close this and use Export my data.</p>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => setDelOpen(false)} disabled={deleting}>
              Keep my account
            </Button>
            <Button onClick={deleteAccount} disabled={deleting} className="bg-accent-pink/90 text-base shadow-none hover:bg-accent-pink">
              {deleting ? "Deleting…" : "Delete permanently"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
