// @app/db — Supabase clients (browser/server/service/middleware), env helpers, generated types.
export type { Database, Json, Tables, TablesInsert, TablesUpdate, Enums } from "./database.types";
export { Constants } from "./database.types";

export { createBrowserClient } from "./client-browser";
export { createServerClient } from "./client-server";
export { createServiceClient } from "./client-service";
export { createMiddlewareClient } from "./client-middleware";
export {
  getPublicEnv,
  getServiceEnv,
  getAppBaseUrl,
  cookieSecure,
  publicEnvSchema,
  serviceEnvSchema,
} from "./env";

export const DB_PACKAGE = "@app/db" as const;
