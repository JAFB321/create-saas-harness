// The "real" (non-mock) storage provider, selected at scaffold time. Default: Supabase Storage.
// The scaffolder repoints this re-export and prunes the other adapter (and its SDK dependency).
export {
  SupabaseStorageProvider as RealStorageProvider,
  PROVIDER_NAME as REAL_STORAGE_PROVIDER,
  isConfigured as isRealStorageConfigured,
} from "./supabase";
