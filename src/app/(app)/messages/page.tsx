import { redirect } from "next/navigation";
import { Container } from "@/components/layout/AppShell";
import { FutureMessages, type MessageRow } from "@/components/features/FutureMessages";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Future Messages" };

export default async function MessagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  // Only non-secret columns are selectable: the text, title and photo stay sealed in the database
  // until the opening time (see supabase/migrations/0006_signature_features.sql).
  const [{ data }, limit] = await Promise.all([
    supabase.from("future_messages").select("id,open_at,opened_at,created_at,photo_path").order("open_at", { ascending: true }),
    supabase.rpc("future_message_limit"),
  ]);

  return (
    <Container>
      <FutureMessages
        userId={user.id}
        nowIso={new Date().toISOString()}
        rows={(data ?? []) as MessageRow[]}
        limit={typeof limit.data === "number" ? limit.data : 20}
      />
    </Container>
  );
}
