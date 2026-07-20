import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BOOTSTRAP_TOKEN = "834a64b8f59de3cd30cbbe8ede5a09c0f1304054307820196ac36f6a16f2f0c5";

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(String(left || ""));
  const rightBuffer = Buffer.from(String(right || ""));
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export async function POST(request) {
  try {
    const providedToken = request.headers.get("x-bootstrap-token") || "";
    if (!safeEqual(providedToken, BOOTSTRAP_TOKEN)) {
      return NextResponse.json({ ok: false }, { status: 404 });
    }

    const { password } = await request.json();
    const pepper = process.env.INTERNAL_APP_PASSWORD;

    if (!pepper) {
      return NextResponse.json(
        { ok: false, error: "INTERNAL_APP_PASSWORD is not configured" },
        { status: 500 }
      );
    }

    const digest = createHmac("sha256", pepper)
      .update(String(password || ""), "utf8")
      .digest("hex");

    return NextResponse.json({ ok: true, digest });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
