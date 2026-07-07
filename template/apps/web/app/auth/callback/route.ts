import { NextResponse } from "next/server";
import { createServerClient } from "@app/db";
import { safeInternalPath } from "@/lib/utils";

/**
 * OAuth / email-link callback: exchanges the `code` for a session, then redirects.
 * Wire this URL into your Supabase Auth redirect allow-list.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeInternalPath(searchParams.get("next"));

  if (code) {
    const supabase = await createServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(`${origin}/login?message=auth-error`);
    }
    return NextResponse.redirect(`${origin}${next}`);
  }
  return NextResponse.redirect(`${origin}/login?message=auth-error`);
}
