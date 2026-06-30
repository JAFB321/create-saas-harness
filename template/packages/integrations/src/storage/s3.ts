import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type {
  SignedUpload,
  SignedUrlOpts,
  StorageObject,
  StorageProvider,
} from "../types";
import { ProviderConfigError } from "../errors";

/**
 * S3-compatible storage. Works with AWS S3, Cloudflare R2, and MinIO (local) — all via S3_ENDPOINT.
 * `path` is the object key within S3_BUCKET. Requires S3_ENDPOINT, S3_ACCESS_KEY_ID,
 * S3_SECRET_ACCESS_KEY, S3_BUCKET.
 */
export class S3StorageProvider implements StorageProvider {
  private client: S3Client;
  private bucket: string;

  constructor() {
    const endpoint = process.env.S3_ENDPOINT;
    const accessKeyId = process.env.S3_ACCESS_KEY_ID;
    const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
    const bucket = process.env.S3_BUCKET;
    if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
      throw new ProviderConfigError(
        "S3 storage requires S3_ENDPOINT, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_BUCKET.",
      );
    }
    this.bucket = bucket;
    this.client = new S3Client({
      region: process.env.S3_REGION ?? "auto",
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true, // required by MinIO and R2
    });
  }

  async createSignedUploadUrl(
    key: string,
    contentType?: string,
    ttlSeconds = 3600,
  ): Promise<SignedUpload> {
    const url = await getSignedUrl(
      this.client,
      new PutObjectCommand({ Bucket: this.bucket, Key: key, ContentType: contentType }),
      { expiresIn: ttlSeconds },
    );
    return { path: key, signedUrl: url };
  }

  async putObject(path: string, buf: Buffer, contentType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({ Bucket: this.bucket, Key: path, Body: buf, ContentType: contentType }),
    );
  }

  async downloadObject(path: string): Promise<Buffer> {
    const res = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: path }));
    const bytes = await res.Body?.transformToByteArray();
    if (!bytes) throw new Error(`S3: empty object: ${path}`);
    return Buffer.from(bytes);
  }

  async signedUrl(path: string, ttlSeconds: number, opts?: SignedUrlOpts): Promise<string> {
    const cmd = new GetObjectCommand({
      Bucket: this.bucket,
      Key: path,
      ResponseContentDisposition: opts?.downloadFilename
        ? `attachment; filename="${opts.downloadFilename.replace(/["\\]/g, "")}"`
        : undefined,
      ResponseContentType: opts?.contentType,
    });
    return getSignedUrl(this.client, cmd, { expiresIn: ttlSeconds });
  }

  async deleteObject(path: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: path }));
  }

  async statObject(path: string): Promise<{ size: number; lastModified: string } | null> {
    try {
      const res = await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: path }));
      return {
        size: res.ContentLength ?? 0,
        lastModified: (res.LastModified ?? new Date()).toISOString(),
      };
    } catch {
      return null;
    }
  }

  async listObjects(prefix: string): Promise<StorageObject[]> {
    const res = await this.client.send(
      new ListObjectsV2Command({ Bucket: this.bucket, Prefix: prefix }),
    );
    return (res.Contents ?? []).map((o) => ({
      path: o.Key ?? "",
      createdAt: (o.LastModified ?? new Date()).toISOString(),
    }));
  }
}
