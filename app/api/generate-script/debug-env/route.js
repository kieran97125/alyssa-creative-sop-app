import { NextResponse } from "next/server";

export async function GET() {
  const key = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || "";

  return NextResponse.json({
    hasApiKey: Boolean(key),
    keyPrefix: key ? key.slice(0, 7) : null,
    keyLength: key.length,
    model: process.env.OPENROUTER_MODEL || process.env.OPENAI_MODEL || null,
    baseURL: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
  });
}