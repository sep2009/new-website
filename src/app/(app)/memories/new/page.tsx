import { redirect } from "next/navigation";
import { BackLink } from "@/components/layout/BackLink";
import { Container, PageHeader } from "@/components/layout/AppShell";
import { MemoryForm } from "@/components/memories/MemoryForm";
import { getStorageUsage } from "@/lib/memories/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Create a Memory" };

export default async function NewMemoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  const usage = await getStorageUsage();

  return (
    <Container size="wide">
      <div className="pt-6 md:pt-12">
        <BackLink href="/memories" />
      </div>
      <PageHeader title="Create a Memory" subtitle="Capture what matters to you.." />
      <MemoryForm userId={user.id} usage={usage} />
    </Container>
  );
}
