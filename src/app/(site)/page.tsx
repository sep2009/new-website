import { Camera, ChevronDown, Route, Sparkles } from "lucide-react";
import Link from "next/link";
import { HeroArt } from "@/components/site/HeroArt";
import { Reveal } from "@/components/site/Reveal";
import { ButtonLink } from "@/components/ui/Button";

const FEATURES = [
  {
    icon: Camera,
    kicker: "Save memories",
    text: "Capture meaningful moments with photos, videos, and personal notes.",
  },
  {
    icon: Route,
    kicker: "Your journey",
    text: "See your life unfold through a beautiful personal timeline.",
  },
  {
    icon: Sparkles,
    kicker: "Relive moments",
    text: "Rediscover the memories and experiences that matter.",
  },
];

const STEPS = [
  { title: "Capture a moment", text: "Add a photo, a video, or just a few words." },
  { title: "Organize your memories", text: "Dates, places and tags keep everything findable." },
  { title: "Relive your story", text: "Watch your life take shape on your own timeline." },
];

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative isolate flex min-h-dvh items-start overflow-hidden md:items-center">
        <HeroArt className="absolute inset-0 -z-20 size-full" />
        {/* keeps text readable: dark behind the text, clear where the scene is */}
        <div className="absolute inset-0 -z-10 bg-linear-to-b from-base/90 via-base/55 via-55% to-transparent md:bg-linear-to-r md:from-base/90 md:via-base/55 md:to-transparent" />

        <div className="mx-auto w-full max-w-7xl px-5 pb-28 pt-28 sm:px-8 md:pb-0 md:pt-0 lg:px-12">
          <div className="max-w-2xl">
            <h1 className="type-display">
              Capture. Remember.
              <br />
              <span className="text-brand">Live More.</span>
            </h1>
            <p className="type-body mt-6 max-w-md text-lg text-fg-muted">
              Your personal space to save memories, track your journey and never forget what
              matters.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/signup" size="lg">
                Start for Free
              </ButtonLink>
              <ButtonLink href="/#features" variant="secondary" size="lg">
                Explore Features
              </ButtonLink>
            </div>
          </div>
        </div>

        <Link
          href="/#features"
          aria-label="Scroll to features"
          className="la-bob absolute bottom-8 left-1/2 hidden -translate-x-1/2 text-fg-muted md:block"
        >
          <ChevronDown className="size-6" />
        </Link>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-5 py-28 sm:px-8 md:py-36 lg:px-12">
        <Reveal>
          <p className="type-caption uppercase tracking-[0.18em] text-accent-2">Features</p>
          <h2 className="type-title mt-4 max-w-xl">A private home for everything you want to keep.</h2>
        </Reveal>

        <div className="mt-16 grid gap-12 md:grid-cols-3 md:gap-0">
          {FEATURES.map(({ icon: Icon, kicker, text }, i) => (
            <Reveal
              key={kicker}
              delay={i * 0.12}
              className="md:border-l md:border-line md:px-10 md:first:border-l-0 md:first:pl-0"
            >
              <Icon className="size-7 text-accent-2" strokeWidth={1.5} />
              <h3 className="type-caption mt-8 uppercase tracking-[0.18em] text-fg">{kicker}</h3>
              <p className="type-heading mt-4 max-w-xs font-normal text-fg-muted">{text}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* How it works / About */}
      <section id="about" className="border-y border-line bg-raised/40">
        <div className="mx-auto max-w-7xl px-5 py-28 sm:px-8 md:py-36 lg:px-12">
          <Reveal>
            <p className="type-caption uppercase tracking-[0.18em] text-accent-2">About LifeArchive</p>
            <h2 className="type-title mt-4 max-w-xl">Three simple steps. One lasting story.</h2>
          </Reveal>

          <ol className="relative mt-16 grid gap-12 md:grid-cols-3 md:gap-10">
            {/* connecting line */}
            <span
              aria-hidden
              className="absolute left-[0.65rem] top-2 h-[calc(100%-1rem)] w-px bg-linear-to-b from-accent via-accent-2/40 to-transparent md:left-0 md:top-[0.65rem] md:h-px md:w-full md:bg-linear-to-r"
            />
            {STEPS.map((s, i) => (
              <li key={s.title} className="relative pl-10 md:pl-0 md:pt-10">
                <Reveal delay={i * 0.12}>
                  <span className="absolute left-0 top-1 size-[1.35rem] rounded-full border border-accent-2/60 bg-base md:top-0">
                    <span className="absolute inset-[5px] rounded-full bg-brand" />
                  </span>
                  <p className="type-caption text-fg-subtle">0{i + 1}</p>
                  <h3 className="type-heading mt-2">{s.title}</h3>
                  <p className="type-small mt-2 max-w-xs text-fg-muted">{s.text}</p>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </section>

    </>
  );
}
