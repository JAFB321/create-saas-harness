/**
 * Demo seed. Creates a demo user (demo@example.com / demo1234) and a few example items.
 * Run with: pnpm seed  (requires Supabase env in .env.local; safe to run repeatedly).
 */
import { createServiceClient } from "./client-service";

const DEMO_EMAIL = "demo@example.com";
const DEMO_PASSWORD = "demo1234";

async function main() {
  const db = createServiceClient();

  // 1) Demo user (idempotent: reuse if it already exists).
  let userId: string | undefined;
  const created = await db.auth.admin.createUser({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: "Demo User" },
  });
  if (created.data.user) {
    userId = created.data.user.id;
  } else {
    const { data } = await db.auth.admin.listUsers();
    userId = data.users.find((u) => u.email === DEMO_EMAIL)?.id;
  }
  if (!userId) throw new Error("Could not create or find the demo user.");

  // 2) Profile (the on-signup trigger usually creates it; upsert to be safe).
  await db.from("profiles").upsert({
    id: userId,
    email: DEMO_EMAIL,
    full_name: "Demo User",
    plan: "pro",
  });

  // 3) Example items.
  const { count } = await db
    .from("items")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", userId);
  if (!count) {
    await db.from("items").insert([
      { owner_id: userId, title: "First item", description: "Created by the seed.", status: "active" },
      { owner_id: userId, title: "Draft item", description: "A work in progress.", status: "draft" },
    ]);
  }

  console.log(`✓ Seed complete. Login: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

main().catch((e) => {
  console.error("Seed failed:", e instanceof Error ? e.message : e);
  process.exit(1);
});
