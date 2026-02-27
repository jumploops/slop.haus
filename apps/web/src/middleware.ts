import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * TEMPORARY geo header verification log.
 * Remove after confirming whether Render/Cloudflare forwards CF-IPCountry.
 */
export function middleware(request: NextRequest) {
  const country = request.headers.get("cf-ipcountry") ?? "missing";
  const requestId =
    request.headers.get("x-request-id") ??
    request.headers.get("cf-ray") ??
    "missing";

  console.info(
    `[geo-debug] method=${request.method} path=${request.nextUrl.pathname} cf-ipcountry=${country} request-id=${requestId}`
  );

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
