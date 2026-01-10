import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://slop.haus";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/settings/", "/favorites"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
