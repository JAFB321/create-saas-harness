import type { createServerClient } from "@app/db";

type ServerClient = Awaited<ReturnType<typeof createServerClient>>;

export async function countItemsFor(supabase: ServerClient, ownerId: string): Promise<number> {
  const { count } = await supabase
    .from("items")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", ownerId);
  return count ?? 0;
}
