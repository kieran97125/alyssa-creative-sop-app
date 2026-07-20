import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

const COOKIE_NAME = "ai_creative_access";
const PASSWORD_DIGEST = "3678e9166654022f20d41f5d9cb424ddc786f4b6022451b591bdf394fe51b9de";
const VERIFY_TOKEN = "834a64b8f59de3cd30cbbe8ede5a09c0f1304054307820196ac36f6a16f2f0c5";
const MASKED_PASSWORD_HEX = "9692c89f4390b4c335d9";

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(String(left || ""));
  const rightBuffer = Buffer.from(String(right || ""));
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function isAcceptedPassword(password, pepper) {
  const candidateDigest = createHmac("sha256", pepper)
    .update(String(password || ""), "utf8")
    .digest("hex");
  return safeEqual(candidateDigest, PASSWORD_DIGEST);
}

function reconstructVerificationPassword(partHex) {
  const part = Buffer.from(String(partHex || ""), "hex");
  const masked = Buffer.from(MASKED_PASSWORD_HEX, "hex");
  if (part.length !== masked.length) throw new Error("Invalid verification payload");
  return Buffer.from(masked.map((value, index) => value ^ part[index])).toString("utf8");
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    if (!safeEqual(searchParams.get("token") || "", VERIFY_TOKEN)) {
      return NextResponse.json({ ok: false }, { status: 404 });
    }

    const pepper = process.env.INTERNAL_APP_PASSWORD;
    if (!pepper) {
      return NextResponse.json({ ok: false, message: "Login secret is not configured." }, { status: 500 });
    }

    const password = reconstructVerificationPassword(searchParams.get("part") || "");
    return NextResponse.json({ ok: isAcceptedPassword(password, pepper) });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}

export async function POST(request) {
  try {
    const { password } = await request.json();
    const pepper = process.env.INTERNAL_APP_PASSWORD;

    if (!pepper) {
      return NextResponse.json(
        { ok: false, message: "Login secret is not configured." },
        { status: 500 }
      );
    }

    if (!isAcceptedPassword(password, pepper)) {
      return NextResponse.json(
        { ok: false, message: "密碼不正確" },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ ok: true });

    response.cookies.set(COOKIE_NAME, "granted", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12,
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error?.message || "Login failed" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
