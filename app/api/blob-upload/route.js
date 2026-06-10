import { handleUpload } from "@vercel/blob/client";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
];

export async function POST(request) {
  const body = await request.json();

  try {
    const jsonResponse = await handleUpload({
      body,
      request,

      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const payload = safeJsonParse(clientPayload, {});
        const originalName = payload.fileName || pathname || "video";
        const safeName = String(originalName).replace(/[^a-zA-Z0-9._-]/g, "_");

        return {
          allowedContentTypes: ALLOWED_VIDEO_TYPES,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({
            fileName: safeName,
            uploadedFrom: "ai-creative-script-generator",
            createdAt: new Date().toISOString(),
          }),
        };
      },

      
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Blob upload failed",
      },
      { status: 400 }
    );
  }
}

function safeJsonParse(text, fallback) {
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}