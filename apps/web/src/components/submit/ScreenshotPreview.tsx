"use client";

import Image from "next/image";

interface ScreenshotPreviewProps {
  url: string;
}

export function ScreenshotPreview({ url }: ScreenshotPreviewProps) {
  return (
    <div className="border-2 border-[color:var(--border)] bg-bg-secondary shadow-[2px_2px_0_var(--foreground)] p-1">
      <div className="bg-bg border-2 border-[color:var(--foreground)]">
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
