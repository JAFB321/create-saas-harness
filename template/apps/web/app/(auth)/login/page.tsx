import { t } from "@/lib/i18n";
import { AuthForm } from "../_components/auth-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; message?: string }>;
}) {
  const { next, message } = await searchParams;
  const notice =
    message === "confirm-email"
      ? t("auth.confirmEmail")
      : message === "auth-error"
        ? t("auth.callbackError")
        : undefined;
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <AuthForm mode="login" next={next} notice={notice} />
    </main>
  );
}
