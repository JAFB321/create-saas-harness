import type {
  SignedUpload,
  SignedUrlOpts,
  StorageObject,
  StorageProvider,
} from "../types";

/**
 * Mock storage provider — the default. Keeps objects in an in-memory map so the app runs with no
 * storage keys. NOT durable (resets on restart) and NOT shared across processes — for local dev only.
 */
export class MockStorageProvider implements StorageProvider {
  private store = new Map<string, { buf: Buffer; contentType: string; createdAt: string }>();

  async createSignedUploadUrl(key: string): Promise<SignedUpload> {
    return { path: key, signedUrl: `mock://upload/${encodeURIComponent(key)}` };
  }

  async putObject(path: string, buf: Buffer, contentType: string): Promise<void> {
    this.store.set(path, { buf, contentType, createdAt: new Date().toISOString() });
  }

  async downloadObject(path: string): Promise<Buffer> {
    const obj = this.store.get(path);
    if (!obj) throw new Error(`Mock storage: object not found: ${path}`);
    return obj.buf;
  }

  async signedUrl(path: string, _ttlSeconds: number, opts?: SignedUrlOpts): Promise<string> {
    const dl = opts?.downloadFilename ? `?download=${encodeURIComponent(opts.downloadFilename)}` : "";
    return `mock://get/${encodeURIComponent(path)}${dl}`;
  }

  async deleteObject(path: string): Promise<void> {
    this.store.delete(path);
  }

  async statObject(path: string): Promise<{ size: number; lastModified: string } | null> {
    const obj = this.store.get(path);
    if (!obj) return null;
    return { size: obj.buf.byteLength, lastModified: obj.createdAt };
  }

  async listObjects(prefix: string): Promise<StorageObject[]> {
    const out: StorageObject[] = [];
    for (const [path, obj] of this.store) {
      if (path.startsWith(prefix)) out.push({ path, createdAt: obj.createdAt });
    }
    return out;
  }
}
