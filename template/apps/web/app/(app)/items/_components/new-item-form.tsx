"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { t } from "@/lib/i18n";
import { type ItemActionState, createItemAction } from "../_actions";

export function NewItemForm() {
  const [state, action, pending] = useActionState<ItemActionState, FormData>(createItemAction, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!pending && !state.error) formRef.current?.reset();
  }, [pending, state.error]);

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-2 sm:flex-row">
      <Input name="title" placeholder={t("items.newPlaceholder")} required className="sm:flex-1" />
      <Button type="submit" disabled={pending}>
        {pending ? "…" : t("items.add")}
      </Button>
      {state.error && <p className="text-sm text-red-600 sm:w-full">{state.error}</p>}
    </form>
  );
}
