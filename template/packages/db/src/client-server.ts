import { type CookieOptions, createServerClient as createSsrServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";
import { cookieSecure, getPublicEnv } from "./env";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

/**
 * Supabase client for server components / route handlers with the user's session
 * (anon key + cookies). Next 15: cookies() is async.
 */
export async function createServerClient() {
  const env = getPublicEnv();
  const cookieStore = await cookies();

  return createSsrServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            const secure = cookieSecure();
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, { ...options, secure });
            }
          } catch {
            // setAll called from a Server Component (read-only cookies).
            // Session refresh is handled by the middleware.
          }
        },
      },
    },
  );
}
