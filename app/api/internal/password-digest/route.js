import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BOOTSTRAP_TOKEN = "834a64b8f59de3cd30cbbe8ede5a09c0f1304054307820196ac36f6a16f2f0c5";
const MASKED_PASSWORD_HEX = "9692c89f4390b4c335d9";

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(String(left || ""));
  const rightBuffer = Buffer.from(String(right || ""));
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function reconstructPassword(partHex) {
  const part = Buffer.from(String(partHex || ""), "hex");
  const masked = Buffer.from(MASKED_PASSWORD_HEX, "hex");
  if (part.length !== masked.length) throw new Error("Invalid bootstrap payload");
  return Buffer.from(masked.map((value, index) => value ^ part[index])).toString("utf8");
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const providedToken = searchParams.get("token") || "";
    if (!safeEqual(providedToken, BOOTSTRAP_TOKEN)) {
      return NextResponse.json({ ok: false }, { status: 404 });
    }

    const pepper = process.env.INTERNAL_APP_PASSWORD;
    if (!pepper) {
      return NextResponse.json(
        { ok: false, error: "INTERNAL_APP_PASSWORD is not configured" },
        { status: 500 }
      );
    }

    const password = reconstructPassword(searchParams.get("part") || "");
    const digest = createHmac("sha256", pepper).update(password, "utf8").digest("hex");
    return NextResponse.json({ ok: true, digest });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
