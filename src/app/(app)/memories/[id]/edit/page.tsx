import { notFound, redirect } from "next/navigation";
import { BackLink } from "@/components/layout/BackLink";
import { Container, PageHeader } from "@/components/layout/AppShell";
import { MemoryForm } from "@/components/memories/MemoryForm";
import { getMemory, getStorageUsage } from "@/lib/memories/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Edit Memory" };

export default async function EditMemoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  // RLS guarantees this only returns the signed-in user's own memory.
  const found = await getMemory(id);
  if (!found) notFound();

  const usage = await getStorageUsage();

  return (
    <Container size="wide">
      <div className="pt-6 md:pt-12">
        <BackLink href={`/memories/${id}`} />
      </div>
      <PageHeader title="Edit Memory" subtitle="Change anything about this moment." />
      <MemoryForm userId={user.id} usage={usage} initial={found} />
    </Container>
  );
}
