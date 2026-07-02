import { NextResponse } from "next/server";
import { createServerClient } from "@app/db";

/**
 * OAuth / email-link callback: exchanges the `code` for a session, then redirects.
 * Wire this URL into your Supabase Auth redirect allow-list.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Only same-origin paths: "/x" is fine, "//evil.com" is a protocol-relative open redirect.
  const rawNext = searchParams.get("next") ?? "";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/dashboard";

  if (code) {
    const supabase = await createServerClient();
    await supabase.auth.exchangeCodeForSession(code);
  }
  return NextResponse.redirect(`${origin}${next}`);
}
