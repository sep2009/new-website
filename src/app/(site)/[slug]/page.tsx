import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ButtonLink } from "@/components/ui/Button";

/** Honest placeholders for pages that are linked but not built yet. */
const PAGES: Record<string, { title: string; text: string }> = {
  privacy: { title: "Privacy", text: "Our privacy policy will be published here." },
  terms: { title: "Terms", text: "Our terms of service will be published here." },
  contact: { title: "Contact", text: "Contact details will be published here." },
  help: { title: "Help Center", text: "Help articles will be published here." },
};

export function generateStaticParams() {
  return Object.keys(PAGES).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: PAGES[slug]?.title };
}

export default function PlaceholderPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<div className="min-h-[70dvh]" />}>
      <PlaceholderContent params={params} />
    </Suspense>
  );
}

async function PlaceholderContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = PAGES[slug];
  if (!page) notFound();

  return (
    <section className="mx-auto flex min-h-[70dvh] max-w-3xl flex-col justify-center px-5 pb-16 pt-40 sm:px-8">
      <h1 className="type-title">{page.title}</h1>
      <p className="type-body mt-4 text-fg-muted">{page.text}</p>
      <ButtonLink href="/" variant="secondary" className="mt-10 self-start">
        Back to home
      </ButtonLink>
    </section>
  );
}
