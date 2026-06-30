"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { canCreateItem, createItemSchema } from "@app/core";
import { createServerClient } from "@app/db";
import { requireUser } from "@/lib/auth";

export interface ItemActionState {
  error?: string;
}

export async function createItemAction(
  _prev: ItemActionState,
  formData: FormData,
): Promise<ItemActionState> {
  const user = await requireUser();
  const parsed = createItemSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createServerClient();
  const { count } = await supabase
    .from("items")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", user.id);

  if (!canCreateItem(user.profile?.plan, count ?? 0)) {
    return { error: "You've reached your plan's item limit. Upgrade to add more." };
  }

  const { error } = await supabase
    .from("items")
    .insert({ owner_id: user.id, title: parsed.data.title, description: parsed.data.description });
  if (error) return { error: error.message };

  revalidatePath("/items");
  return {};
}

export async function deleteItemAction(formData: FormData): Promise<void> {
  await requireUser();
  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success) return;
  const supabase = await createServerClient();
  await supabase.from("items").delete().eq("id", id.data);
  revalidatePath("/items");
}
