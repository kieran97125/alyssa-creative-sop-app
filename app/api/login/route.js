import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

const COOKIE_NAME = "ai_creative_access";
const PASSWORD_DIGEST = "3678e9166654022f20d41f5d9cb424ddc786f4b6022451b591bdf394fe51b9de";

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
