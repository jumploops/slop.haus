import * as fs from "fs/promises";
import * as path from "path";
import * as crypto from "crypto";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

export interface StorageProvider {
  upload(key: string, data: Buffer, contentType: string): Promise<string>;
  delete(key: string): Promise<void>;
  getUrl(key: string): string;
}

// Local filesystem storage for MVP
export class LocalStorage implements StorageProvider {
  private basePath: string;
  private publicUrl: string;

  constructor(basePath: string, publicUrl: string) {
    this.basePath = basePath;
    this.publicUrl = publicUrl;
  }

  async upload(key: string, data: Buffer, contentType: string): Promise<string> {
    const filePath = path.join(this.basePath, key);
    const dir = path.dirname(filePath);

    // Ensure directory exists
    await fs.mkdir(dir, { recursive: true });

    // Write file
    await fs.writeFile(filePath, data);

    return this.getUrl(key);
  }

  async delete(key: string): Promise<void> {
    const filePath = path.join(this.basePath, key);
    try {
      await fs.unlink(filePath);
    } catch (error: any) {
      if (error.code !== "ENOENT") {
        throw error;
      }
    }
  }

  getUrl(key: string): string {
    return `${this.publicUrl}/${key}`;
  }
}

class S3Storage implements StorageProvider {
  private client: S3Client;
  private bucket: string;
  private publicUrl: string;

  constructor() {
    const bucket = process.env.S3_BUCKET;
    if (!bucket) {
      throw new Error("S3_BUCKET environment variable is required");
    }

    const region = process.env.S3_REGION || "us-east-1";
    const endpoint = process.env.S3_ENDPOINT;
    const publicUrl = resolvePublicUrl(bucket, region, endpoint);

    this.client = new S3Client({
      region,
      endpoint,
      forcePathStyle: !!endpoint,
    });
    this.bucket = bucket;
    this.publicUrl = publicUrl;
  }

  async upload(key: string, data: Buffer, contentType: string): Promise<string> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: data,
        ContentType: contentType,
      })
    );

    return this.getUrl(key);
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })
    );
  }

  getUrl(key: string): string {
    return `${this.publicUrl}/${key}`;
  }
}

function resolvePublicUrl(bucket: string, region: string, endpoint?: string): string {
  const explicit = process.env.S3_PUBLIC_URL;
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }

  if (endpoint) {
    return `${endpoint.replace(/\/$/, "")}/${bucket}`;
  }

  return `https://${bucket}.s3.${region}.amazonaws.com`;
}

// Generate a unique key for uploaded files
export function generateStorageKey(prefix: string, extension: string): string {
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString("hex");
  return `${prefix}/${timestamp}-${random}.${extension}`;
}

// Get storage provider based on environment
export function getStorage(): StorageProvider {
  const storageType = process.env.STORAGE_TYPE || "local";

  if (storageType === "local") {
    const basePath = process.env.STORAGE_LOCAL_PATH || "./uploads";
    const publicUrl = process.env.STORAGE_PUBLIC_URL || "http://localhost:3001/uploads";
    return new LocalStorage(basePath, publicUrl);
  }

  if (storageType === "s3") {
    return new S3Storage();
  }

  throw new Error(`Unknown storage type: ${storageType}`);
}
