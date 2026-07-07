import { requireUser } from "@/lib/auth";
import { createServerClient } from "@app/db";
import { t } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NewItemForm } from "./_components/new-item-form";
import { deleteItemAction } from "./_actions";

export default async function ItemsPage() {
  const user = await requireUser();
  const supabase = await createServerClient();
  const { data: items } = await supabase
    .from("items")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">{t("items.title")}</h1>
      <NewItemForm />

      {!items?.length ? (
        <p className="text-[var(--color-muted-foreground)]">{t("items.empty")}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li key={item.id}>
              <Card className="flex items-center gap-3 py-3">
                <div className="flex-1">
                  <p className="font-medium">{item.title}</p>
                  {item.description && (
                    <p className="text-sm text-[var(--color-muted-foreground)]">
                      {item.description}
                    </p>
                  )}
                </div>
                <span className="rounded border border-[var(--color-border)] px-2 py-0.5 text-xs">
                  {item.status}
                </span>
                <form action={deleteItemAction}>
                  <input type="hidden" name="id" value={item.id} />
                  <Button variant="ghost" type="submit" className="h-8 px-2 text-sm text-red-600">
                    {t("items.delete")}
                  </Button>
                </form>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
