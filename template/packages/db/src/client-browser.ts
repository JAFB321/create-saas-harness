import { createBrowserClient as createSsrBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { getPublicEnv } from "./env";

/** Supabase client for the browser (anon key). Use in client components. */
export function createBrowserClient() {
  const env = getPublicEnv();
  return createSsrBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
