import { redirect } from "next/navigation";
import { createServerClient, type Tables } from "@app/db";

export interface SessionUser {
  id: string;
  email: string;
  profile: Tables<"profiles"> | null;
}

/** Returns the current user + profile, or null if not authenticated. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  return { id: user.id, email: user.email ?? "", profile };
}

/** Use in authed pages/actions: redirects to /login if there is no session. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}
