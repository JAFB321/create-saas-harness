import { NextResponse } from "next/server";
import { createServerClient } from "@app/db";

/**
 * OAuth / email-link callback: exchanges the `code` for a session, then redirects.
 * Wire this URL into your Supabase Auth redirect allow-list.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createServerClient();
    await supabase.auth.exchangeCodeForSession(code);
  }
  return NextResponse.redirect(`${origin}${next}`);
}
