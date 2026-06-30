import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { signoutAction } from "../(auth)/_actions";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--color-border)]">
        <div className="mx-auto flex max-w-5xl items-center gap-6 px-6 py-3">
          <Link href="/dashboard" className="font-semibold">
            {t("app.name")}
          </Link>
          <nav className="flex gap-4 text-sm text-[var(--color-muted-foreground)]">
            <Link href="/dashboard">{t("nav.dashboard")}</Link>
            <Link href="/items">{t("nav.items")}</Link>
            <Link href="/billing">{t("nav.billing")}</Link>
            <Link href="/settings">{t("nav.settings")}</Link>
          </nav>
          <form action={signoutAction} className="ml-auto flex items-center gap-3">
            <span className="text-sm text-[var(--color-muted-foreground)]">{user.email}</span>
            <Button variant="ghost" type="submit" className="h-8 px-2 text-sm">
              {t("nav.signout")}
            </Button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
