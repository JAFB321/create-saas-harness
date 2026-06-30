import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { getPublicEnv, getServiceEnv } from "./env";

/**
 * Supabase client with the SERVICE ROLE: bypasses RLS. SERVER ONLY (route handlers, server actions,
 * node/tsx scripts). The `typeof window` guard throws if called in the browser. (Guard preferred over
 * `server-only` so node/vitest/tsx imports don't break.)
 *
 * Every privileged write (orders, subscriptions, payment_events) goes through a client like this,
 * after validating the user's session/ownership.
 */
export function createServiceClient(): SupabaseClient<Database> {
  if (typeof window !== "undefined") {
    throw new Error("[@app/db] createServiceClient cannot be used in the browser (service role).");
  }
  const { NEXT_PUBLIC_SUPABASE_URL } = getPublicEnv();
  const { SUPABASE_SERVICE_ROLE_KEY } = getServiceEnv();
  return createClient<Database>(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
