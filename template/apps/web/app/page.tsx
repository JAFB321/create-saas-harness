import Link from "next/link";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-8 px-6 text-center">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{t("app.name")}</h1>
      <p className="text-lg text-[var(--color-muted-foreground)]">{t("landing.tagline")}</p>
      <div className="flex gap-3">
        <Link href="/signup">
          <Button>{t("landing.cta")}</Button>
        </Link>
        <Link href="/login">
          <Button variant="secondary">{t("auth.login")}</Button>
        </Link>
      </div>
      <p className="text-sm text-[var(--color-muted-foreground)]">
        Built with create-saas-harness · runs mock-first
      </p>
    </main>
  );
}
