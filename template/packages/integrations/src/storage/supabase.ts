import { createServiceClient } from "@app/db";
import type {
  SignedUpload,
  SignedUrlOpts,
  StorageObject,
  StorageProvider,
} from "../types";
import { ProviderConfigError } from "../errors";

/** Env value that selects this provider + its readiness check (used by status.ts). */
export const PROVIDER_NAME = "supabase";
export function isConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

/**
 * Supabase Storage provider. Talks to a PRIVATE bucket (STORAGE_BUCKET, default "uploads" —
 * created by the storage migration) through the service-role client, server-side only.
 * The browser never touches the bucket directly: uploads/downloads go through signed URLs,
 * so no storage.objects RLS policies are needed for anon/authenticated roles.
 */
export class SupabaseStorageProvider implements StorageProvider {
  private client;
  private bucket: string;

  constructor() {
    if (!isConfigured()) {
      throw new ProviderConfigError(
        "Supabase storage requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
      );
    }
    this.client = createServiceClient();
    this.bucket = process.env.STORAGE_BUCKET ?? "uploads";
  }

  private from() {
    return this.client.storage.from(this.bucket);
  }

  // Note: Supabase signed upload URLs have a fixed 2h TTL; `ttlSeconds` is accepted for
  // interface parity but not configurable here.
  async createSignedUploadUrl(key: string): Promise<SignedUpload> {
    const { data, error } = await this.from().createSignedUploadUrl(key);
    if (error) throw new Error(`Supabase storage: signed upload failed: ${error.message}`);
    return { path: key, signedUrl: data.signedUrl };
  }

  async putObject(path: string, buf: Buffer, contentType: string): Promise<void> {
    const { error } = await this.from().upload(path, buf, { contentType, upsert: true });
    if (error) throw new Error(`Supabase storage: upload failed: ${error.message}`);
  }

  async downloadObject(path: string): Promise<Buffer> {
    const { data, error } = await this.from().download(path);
    if (error || !data) {
      throw new Error(`Supabase storage: object not found: ${path}`);
    }
    return Buffer.from(await data.arrayBuffer());
  }

  async signedUrl(path: string, ttlSeconds: number, opts?: SignedUrlOpts): Promise<string> {
    const { data, error } = await this.from().createSignedUrl(path, ttlSeconds, {
      download: opts?.downloadFilename ?? undefined,
    });
    if (error || !data) {
      throw new Error(`Supabase storage: signed URL failed: ${error?.message ?? path}`);
    }
    return data.signedUrl;
  }

  async deleteObject(path: string): Promise<void> {
    // remove() is idempotent: missing objects are simply absent from the result.
    const { error } = await this.from().remove([path]);
    if (error) throw new Error(`Supabase storage: delete failed: ${error.message}`);
  }

  async statObject(path: string): Promise<{ size: number; lastModified: string } | null> {
    const cut = path.lastIndexOf("/");
    const folder = cut === -1 ? "" : path.slice(0, cut);
    const name = cut === -1 ? path : path.slice(cut + 1);
    const { data, error } = await this.from().list(folder, { search: name });
    if (error || !data) return null;
    const found = data.find((o) => o.name === name);
    if (!found) return null;
    return {
      size: Number(found.metadata?.size ?? 0),
      lastModified: found.updated_at ?? found.created_at ?? new Date().toISOString(),
    };
  }

  async listObjects(prefix: string): Promise<StorageObject[]> {
    const folder = prefix.replace(/\/+$/, "");
    const { data, error } = await this.from().list(folder);
    if (error || !data) return [];
    return data
      .filter((o) => o.id !== null) // folder placeholders come back with a null id
      .map((o) => ({
        path: folder ? `${folder}/${o.name}` : o.name,
        createdAt: o.created_at ?? new Date().toISOString(),
      }));
  }
}
