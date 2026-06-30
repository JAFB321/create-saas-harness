"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { t } from "@/lib/i18n";
import { type AuthState, loginAction, signupAction } from "../_actions";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const action = mode === "login" ? loginAction : signupAction;
  const [state, formAction, pending] = useActionState<AuthState, FormData>(action, {});

  return (
    <form action={formAction} className="flex w-full max-w-sm flex-col gap-3">
      <h1 className="mb-2 text-2xl font-semibold">
        {mode === "login" ? t("auth.login") : t("auth.signup")}
      </h1>

      {mode === "signup" && (
        <label className="flex flex-col gap-1 text-sm">
          {t("auth.fullName")}
          <Input name="fullName" autoComplete="name" />
        </label>
      )}

      <label className="flex flex-col gap-1 text-sm">
        {t("auth.email")}
        <Input name="email" type="email" required autoComplete="email" />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        {t("auth.password")}
        <Input name="password" type="password" required autoComplete="current-password" />
      </label>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "…" : mode === "login" ? t("auth.login") : t("auth.signup")}
      </Button>

      <p className="text-center text-sm text-[var(--color-muted-foreground)]">
        {mode === "login" ? (
          <>
            {t("auth.noAccount")} <Link href="/signup" className="underline">{t("auth.signup")}</Link>
          </>
        ) : (
          <>
            {t("auth.haveAccount")} <Link href="/login" className="underline">{t("auth.login")}</Link>
          </>
        )}
      </p>
    </form>
  );
}
