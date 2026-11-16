import { AppShell, Container } from "@/components/layout/AppShell";

/** Shared frame for the sample-data previews. */
export function DemoFrame({ children, narrow }: { children: React.ReactNode; narrow?: boolean }) {
  return (
    <AppShell demo user={{ name: "Maya Lindqvist", email: "maya@example.com" }}>
      <Container size={narrow ? "default" : "wide"}>
        <p className="mb-5 rounded-2xl border border-accent-2/30 bg-accent/10 px-5 py-3 text-sm text-accent-3 print:hidden">
          <strong className="font-semibold">Design preview.</strong> Sample content for a fictional user, Maya
          Lindqvist. Changes here aren&apos;t saved. It&apos;s not your data.
        </p>
        {children}
      </Container>
    </AppShell>
  );
}
