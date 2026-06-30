import { type CookieOptions, createServerClient as createSsrServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./database.types";
import { cookieSecure, getPublicEnv } from "./env";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

/**
 * Supabase client for Next `middleware.ts`. Reads request cookies and writes the refreshed cookies
 * onto a NextResponse the middleware MUST return (otherwise the session refresh is lost).
 */
export function createMiddlewareClient(request: NextRequest) {
  const env = getPublicEnv();
  let response = NextResponse.next({ request });

  const supabase = createSsrServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          const secure = cookieSecure();
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, { ...options, secure });
          }
        },
      },
    },
  );

  return {
    supabase,
    get response() {
      return response;
    },
  };
}
