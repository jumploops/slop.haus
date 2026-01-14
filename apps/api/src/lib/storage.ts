import * as fs from "fs/promises";
import * as path from "path";
import * as crypto from "crypto";

export interface StorageProvider {
  upload(key: string, data: Buffer, contentType: string): Promise<string>;
  delete(key: string): Promise<void>;
  getUrl(key: string): string;
}

// Local filesystem storage for MVP
class LocalStorage implements StorageProvider {
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

  // TODO: Add S3/R2 provider for production
  throw new Error(`Unknown storage type: ${storageType}`);
}
