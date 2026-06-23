import { type NextRequest, NextResponse } from "next/server";

function isAllowedAssetUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return false;
    }
    if (parsed.hostname.endsWith(".r2.dev")) {
      return true;
    }
    const apiOrigin = new URL(process.env.API_URL ?? "http://localhost:4000");
    return parsed.origin === apiOrigin.origin;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get("url");
  if (!rawUrl) {
    return NextResponse.json({ message: "Missing url parameter" }, { status: 400 });
  }

  let targetUrl: URL;
  try {
    targetUrl = new URL(rawUrl);
  } catch {
    return NextResponse.json({ message: "Invalid url" }, { status: 400 });
  }

  if (!isAllowedAssetUrl(targetUrl.toString())) {
    return NextResponse.json({ message: "URL not allowed" }, { status: 403 });
  }

  const upstream = await fetch(targetUrl.toString(), { cache: "force-cache" });
  if (!upstream.ok) {
    return NextResponse.json({ message: "Failed to fetch asset" }, { status: upstream.status });
  }

  const contentType = upstream.headers.get("content-type") ?? "application/octet-stream";
  const body = await upstream.arrayBuffer();

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400",
    },
  });
}
