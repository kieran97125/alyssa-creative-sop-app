import { GoogleAuth } from "google-auth-library";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function credentialError(message) {
  const error = new Error(message);
  error.status = 503;
  error.code = "DRIVE_CREDENTIALS_MISSING";
  return error;
}

function getCredentials() {
  const raw = String(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || "").trim();
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.type !== "service_account" || !parsed?.client_email || !parsed?.private_key) {
        throw new Error("Missing required service account fields");
      }
      return parsed;
    } catch {
      throw credentialError(
        "Google Drive 認證 JSON 格式不正確。請重新下載 Service Account JSON，完整貼入 Vercel 嘅 GOOGLE_SERVICE_ACCOUNT_JSON。"
      );
    }
  }

  const encoded = String(process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 || "").trim();
  if (!encoded) {
    throw credentialError(
      "Google Drive 尚未連接。請先喺 Vercel Environment Variables 加入 GOOGLE_SERVICE_ACCOUNT_JSON，再重新部署。"
    );
  }

  try {
    return JSON.parse(Buffer.from(encoded, "base64").toString("utf8"));
  } catch {
    throw credentialError(
      "GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 格式不正確。建議改用 GOOGLE_SERVICE_ACCOUNT_JSON，直接貼完整 JSON。"
    );
  }
}

async function getAccessToken() {
  const auth = new GoogleAuth({
    credentials: getCredentials(),
    scopes: ["https://www.googleapis.com/auth/drive"],
  });
  const client = await auth.getClient();
  const response = await client.getAccessToken();
  const token = typeof response === "string" ? response : response?.token;
  if (!token) throw new Error("Unable to obtain Google Drive access token");
  return token;
}

async function driveFetch(path, options = {}) {
  const token = await getAccessToken();
  const response = await fetch(`https://www.googleapis.com/drive/v3${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    cache: "no-store",
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(payload?.error?.message || `Google Drive request failed with ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return payload;
}

export async function POST(request) {
  try {
    const payload = await request.json();
    const fileId = String(payload?.fileId || "").trim();
    const targetFolderId = String(payload?.targetFolderId || "").trim();

    if (!fileId || !targetFolderId) {
      return NextResponse.json(
        { ok: false, error: "Missing fileId or targetFolderId" },
        { status: 400 }
      );
    }

    const current = await driveFetch(
      `/files/${encodeURIComponent(fileId)}?fields=id,mimeType,parents&supportsAllDrives=true`
    );

    if (!String(current?.mimeType || "").startsWith("video/")) {
      return NextResponse.json(
        { ok: false, error: "Only video footage can be moved" },
        { status: 400 }
      );
    }

    const currentParents = Array.isArray(current.parents) ? current.parents : [];
    const params = new URLSearchParams({
      addParents: targetFolderId,
      fields: "id,parents",
      supportsAllDrives: "true",
    });

    if (currentParents.length) params.set("removeParents", currentParents.join(","));

    const result = await driveFetch(`/files/${encodeURIComponent(fileId)}?${params.toString()}`, {
      method: "PATCH",
      body: JSON.stringify({}),
    });

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    console.error("footage move error:", error);
    const status = Number(error?.status || 500);
    const setupRequired = status === 503 || String(error?.code || "").startsWith("DRIVE_CREDENTIALS");
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Failed to move footage",
        setupRequired,
        hint: setupRequired
          ? "請先完成 Google Drive Service Account 設定，再重新部署。"
          : status === 403
            ? "請確認 Root Folder 及影片已分享 Editor 權限予系統 Service Account。"
            : "",
      },
      { status: status >= 400 && status < 600 ? status : 500 }
    );
  }
}
