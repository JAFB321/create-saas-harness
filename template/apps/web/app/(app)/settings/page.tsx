import { requireUser } from "@/lib/auth";
import { t } from "@/lib/i18n";
import { Card } from "@/components/ui/card";

export default async function SettingsPage() {
  const user = await requireUser();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">{t("settings.title")}</h1>
      <Card className="flex flex-col gap-3">
        <div>
          <p className="text-sm text-[var(--color-muted-foreground)]">{t("auth.email")}</p>
          <p>{user.email}</p>
        </div>
        <div>
          <p className="text-sm text-[var(--color-muted-foreground)]">{t("auth.fullName")}</p>
          <p>{user.profile?.full_name ?? "—"}</p>
        </div>
      </Card>
    </div>
  );
}
