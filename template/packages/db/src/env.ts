import { z } from "zod";

/**
 * Supabase env validation. Throws a clear error if something is missing.
 * NEXT_PUBLIC_* are safe in the browser; SUPABASE_SERVICE_ROLE_KEY is server-only.
 */
const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
});

const serviceSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),
});

export function getPublicEnv() {
  const parsed = publicSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
  if (!parsed.success) {
    throw new Error(
      `[@app/db] invalid public env: ${parsed.error.issues.map((i) => i.message).join("; ")}`,
    );
  }
  return parsed.data;
}

export function getServiceEnv() {
  const parsed = serviceSchema.safeParse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });
  if (!parsed.success) {
    throw new Error(
      `[@app/db] invalid service env: ${parsed.error.issues.map((i) => i.message).join("; ")}`,
    );
  }
  return parsed.data;
}

/**
 * App base URL, used in payment return URLs and notification links.
 * - local/dev (VERCEL_ENV undefined or "development"): APP_BASE_URL or fallback to localhost.
 * - preview/production: APP_BASE_URL is REQUIRED and must be a valid URL; throws otherwise
 *   (a localhost fallback in prod would generate broken links / return URLs).
 */
export function getAppBaseUrl(): string {
  const raw = process.env.APP_BASE_URL?.trim();
  const vercelEnv = process.env.VERCEL_ENV;
  const isDeployed = vercelEnv === "preview" || vercelEnv === "production";

  if (!isDeployed) {
    return raw && raw.length > 0 ? raw : "http://localhost:3000";
  }

  const parsed = z.string().url("APP_BASE_URL must be a valid URL").safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `[@app/db] APP_BASE_URL is required in ${vercelEnv}: ${parsed.error.issues
        .map((i) => i.message)
        .join("; ")}`,
    );
  }
  return parsed.data;
}

/**
 * Whether session cookies should be marked `secure`. Only on deployed HTTPS envs
 * (Vercel preview/production). Positive list on purpose: locally VERCEL_ENV is undefined,
 * and a negation would set secure:true over http and break local login / e2e.
 */
export function cookieSecure(): boolean {
  return process.env.VERCEL_ENV === "production" || process.env.VERCEL_ENV === "preview";
}
