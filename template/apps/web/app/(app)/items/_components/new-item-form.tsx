"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type ItemActionState, createItemAction } from "../_actions";

export function NewItemForm() {
  const [state, action, pending] = useActionState<ItemActionState, FormData>(createItemAction, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!pending && !state.error) formRef.current?.reset();
  }, [pending, state.error]);

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-2 sm:flex-row">
      <Input name="title" placeholder="New item title" required className="sm:flex-1" />
      <Button type="submit" disabled={pending}>
        {pending ? "…" : "Add"}
      </Button>
      {state.error && <p className="text-sm text-red-600 sm:w-full">{state.error}</p>}
    </form>
  );
}
