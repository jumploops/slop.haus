const MAGIC_BYTES = {
  png: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  jpg: [0xff, 0xd8, 0xff],
  webp: [0x52, 0x49, 0x46, 0x46],
} as const;

export type ImageType = "image/png" | "image/jpeg" | "image/webp";

export function detectImageType(buffer: Buffer): ImageType | null {
  if (buffer.length >= 8) {
    const png = MAGIC_BYTES.png;
    if (png.every((byte, i) => buffer[i] === byte)) {
      return "image/png";
    }
  }

  if (buffer.length >= 3) {
    const jpg = MAGIC_BYTES.jpg;
    if (jpg.every((byte, i) => buffer[i] === byte)) {
      return "image/jpeg";
    }
  }

  if (buffer.length >= 12) {
    const riff = MAGIC_BYTES.webp;
    if (riff.every((byte, i) => buffer[i] === byte)) {
      const signature = buffer.toString("ascii", 8, 12);
      if (signature === "WEBP") {
        return "image/webp";
      }
    }
  }

  return null;
}

export function getImageExtension(type: ImageType): string {
  switch (type) {
    case "image/png":
      return "png";
    case "image/jpeg":
      return "jpg";
    case "image/webp":
      return "webp";
  }
}
