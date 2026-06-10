import { NextResponse } from "next/server";

const COOKIE_NAME = "ai_creative_access";

export async function POST(request) {
  try {
    const { password } = await request.json();
    const correctPassword = process.env.INTERNAL_APP_PASSWORD;

    if (!correctPassword) {
      return NextResponse.json(
        { ok: false, message: "INTERNAL_APP_PASSWORD is not set." },
        { status: 500 }
      );
    }

    if (password !== correctPassword) {
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
