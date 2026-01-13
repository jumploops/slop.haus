"use client";

import Image from "next/image";

interface ScreenshotPreviewProps {
  url: string;
}

export function ScreenshotPreview({ url }: ScreenshotPreviewProps) {
  return (
    <div className="screenshot-preview">
      <div className="screenshot-preview-image">
        <Image
          src={url}
          alt="Project screenshot"
          width={640}
          height={400}
          style={{ objectFit: "cover", width: "100%", height: "auto" }}
          unoptimized
        />
      </div>
    </div>
  );
}
