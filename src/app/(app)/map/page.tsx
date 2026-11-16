import { Container, PageHeader } from "@/components/layout/AppShell";
import { MemoryMap } from "@/components/map/MemoryMap";
import { listMapMemories } from "@/lib/memories/queries";

export const metadata = { title: "Memory Map" };

export default async function MapPage() {
  // Only the signed-in person's own memories; coordinates are never exposed to anyone else.
  const { memories, error } = await listMapMemories();

  return (
    <Container>
      <PageHeader title="Memory Map" subtitle="Explore your memories around the world." />
      <MemoryMap memories={memories} loadError={!!error} />
    </Container>
  );
}
