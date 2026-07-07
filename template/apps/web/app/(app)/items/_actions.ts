"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { canCreateItem, createItemSchema } from "@app/core";
import { createServerClient } from "@app/db";
import { requireUser } from "@/lib/auth";
import { countItemsFor } from "@/lib/items";
import { t } from "@/lib/i18n";

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
  // Count-then-insert is race-prone (fine for a template); revenue-gating limits belong in the DB.
  const count = await countItemsFor(supabase, user.id);
  if (!canCreateItem(user.profile?.plan, count)) {
    return { error: t("items.limitReached") };
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
