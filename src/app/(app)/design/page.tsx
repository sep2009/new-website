"use client";

import { Heart, Plus } from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { Container, PageHeader } from "@/components/layout/AppShell";
import { Button, IconButton } from "@/components/ui/Button";
import { Card, MediaCard } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";

const COLORS = [
  ["base", "#080A20", "bg-base"],
  ["raised", "#111438", "bg-raised"],
  ["surface", "#191B45", "bg-surface"],
  ["surface-2", "#22234D", "bg-surface-2"],
  ["accent", "#9465FF", "bg-accent"],
  ["accent-2", "#B58AFF", "bg-accent-2"],
  ["accent-3", "#D4B5FF", "bg-accent-3"],
  ["pink", "#F0A8E8", "bg-accent-pink"],
] as const;

export default function DesignSystemPage() {
  const [open, setOpen] = useState(false);

  return (
    <Container>
      <PageHeader
        title="Design system"
        subtitle="Foundation reference. Not part of the product navigation."
      />

      <div className="flex flex-col gap-14">
        <Section title="Brand">
          <div className="flex items-center gap-10">
            <Logo />
            <p className="type-display text-brand">Live More.</p>
          </div>
        </Section>

        <Section title="Color">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {COLORS.map(([name, hex, cls]) => (
              <div key={name} className="flex flex-col gap-2">
                <div className={`${cls} h-16 rounded-control border border-line-strong`} />
                <p className="type-caption text-fg-muted">
                  {name} · {hex}
                </p>
              </div>
            ))}
            <div className="col-span-2 flex flex-col gap-2 sm:col-span-4">
              <div className="h-12 rounded-control bg-brand" />
              <p className="type-caption text-fg-muted">gradient · 110deg #7956FF → #B36CFF → #E2A0F5</p>
            </div>
          </div>
        </Section>

        <Section title="Typography">
          <div className="flex flex-col gap-3">
            <p className="type-display">Capture. Remember.</p>
            <p className="type-title">A beautiful sunset</p>
            <p className="type-heading">My Memories</p>
            <p className="type-body text-fg-muted">
              Your personal space to save memories, track your journey and never forget what matters.
            </p>
            <p className="type-small text-fg-subtle">Jun 14, 2025 · Maspalomas, Spain</p>
          </div>
        </Section>

        <Section title="Buttons">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Add a Memory</Button>
            <Button variant="secondary">Edit Profile</Button>
            <Button variant="ghost">Cancel</Button>
            <Button size="sm">Small</Button>
            <Button size="lg">Large</Button>
            <IconButton label="Favorite">
              <Heart className="size-4" />
            </IconButton>
          </div>
        </Section>

        <Section title="Inputs">
          <div className="grid gap-5 sm:grid-cols-2">
            <Input label="Add a title" optional placeholder="e.g. Best day ever..." />
            <Input label="Email" error="Enter a valid email address" defaultValue="alex@" />
            <Textarea
              label="Add a note"
              optional
              placeholder="Write your thoughts..."
              className="sm:col-span-2"
            />
          </div>
        </Section>

        <Section title="Cards">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <p className="type-heading">Flat</p>
              <p className="type-small mt-1 text-fg-muted">Default surface for grouped content.</p>
            </Card>
            <Card tone="raised">
              <p className="type-heading">Raised</p>
              <p className="type-small mt-1 text-fg-muted">For the one thing that needs focus.</p>
            </Card>
            <Card interactive>
              <p className="type-heading">Interactive</p>
              <p className="type-small mt-1 text-fg-muted">Lifts gently on hover.</p>
            </Card>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <MediaCard
              src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=70"
              alt="Sunset over the sea"
              className="aspect-4/3"
            >
              <span>Jun 14, 2025</span>
              <Heart className="size-4" />
            </MediaCard>
            <MediaCard
              src="https://images.unsplash.com/photo-1522383225653-ed111181a951?w=800&q=70"
              alt="Cherry blossoms"
              className="aspect-4/3"
            >
              <span>Apr 17, 2025</span>
              <Heart className="size-4" />
            </MediaCard>
          </div>
        </Section>

        <Section title="Modal">
          <Button onClick={() => setOpen(true)}>
            Open modal <Plus className="size-4" />
          </Button>
          <Modal
            open={open}
            onClose={() => setOpen(false)}
            title="Create a Memory"
            description="Capture what matters to you."
          >
            <div className="flex flex-col gap-4">
              <Input label="Add a title" optional placeholder="e.g. Best day ever..." />
              <Textarea label="Add a note" optional placeholder="Write your thoughts..." />
              <Button className="mt-2 self-end" onClick={() => setOpen(false)}>
                Save Memory
              </Button>
            </div>
          </Modal>
        </Section>
      </div>
    </Container>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="type-caption mb-4 uppercase tracking-[0.14em] text-fg-subtle">{title}</h2>
      {children}
    </section>
  );
}
