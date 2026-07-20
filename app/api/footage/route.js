import { NextResponse } from "next/server";
import {
  ensureStandardFootageFolders,
  getFootageServiceAccountEmail,
  normalizeDriveFolderId,
  scanFootageLibrary,
  updateFootageMetadata,
} from "../../lib/google-drive-footage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SETUP_MESSAGE =
  "Google Drive 尚未連接。請先喺 Vercel Environment Variables 加入 GOOGLE_SERVICE_ACCOUNT_JSON（可直接貼上 Google 下載嘅完整 JSON），再重新部署。";

function credentialError(message, code = "DRIVE_CREDENTIALS_INVALID") {
  const error = new Error(message);
  error.status = 503;
  error.code = code;
  return error;
}

function ensureDriveCredentialCompatibility() {
  const encoded = String(process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 || "").trim();
  if (encoded) return true;

  const raw = String(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || "").trim();
  if (!raw) return false;

  try {
    const parsed = JSON.parse(raw);
    if (parsed?.type !== "service_account" || !parsed?.client_email || !parsed?.private_key) {
      throw new Error("Missing required service account fields");
    }
  } catch {
    throw credentialError(
      "Google Drive 認證 JSON 格式不正確。請重新下載 Service Account JSON，完整貼入 Vercel 嘅 GOOGLE_SERVICE_ACCOUNT_JSON。"
    );
  }

  process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 = Buffer.from(raw, "utf8").toString("base64");
  return true;
}

function errorResponse(error, fallback = "Footage library request failed") {
  const message = error?.message || fallback;
  const status = Number(error?.status || 500);
  const setupRequired = status === 503 || String(error?.code || "").startsWith("DRIVE_CREDENTIALS");

  return NextResponse.json(
    {
      ok: false,
      error: setupRequired ? message || SETUP_MESSAGE : message,
      code: error?.code || "",
      setupRequired,
      hint: setupRequired
        ? SETUP_MESSAGE
        : status === 403 || status === 404
          ? "請確認 Google Drive Root Folder 已分享 Editor 權限予系統 Service Account。"
          : "",
    },
    { status: status >= 400 && status < 600 ? status : 500 }
  );
}

export async function GET(request) {
  try {
    const credentialsConfigured = ensureDriveCredentialCompatibility();

    if (!credentialsConfigured) {
      return NextResponse.json({
        ok: true,
        configured: false,
        credentialsConfigured: false,
        setupRequired: true,
        setupMessage: SETUP_MESSAGE,
        serviceAccountEmail: "",
        library: null,
      });
    }

    const { searchParams } = new URL(request.url);
    const rootFolderInput =
      searchParams.get("rootFolder") || process.env.FOOTAGE_ROOT_FOLDER_ID || "";
    const rootFolderId = normalizeDriveFolderId(rootFolderInput);
    const serviceAccountEmail = await getFootageServiceAccountEmail();

    if (!rootFolderId) {
      return NextResponse.json({
        ok: true,
        configured: false,
        credentialsConfigured: true,
        setupRequired: false,
        serviceAccountEmail,
        library: null,
      });
    }

    const library = await scanFootageLibrary(rootFolderId);

    return NextResponse.json({
      ok: true,
      configured: true,
      credentialsConfigured: true,
      setupRequired: false,
      serviceAccountEmail,
      library,
    });
  } catch (error) {
    console.error("footage GET error:", error);
    return errorResponse(error);
  }
}

export async function POST(request) {
  try {
    if (!ensureDriveCredentialCompatibility()) {
      throw credentialError(SETUP_MESSAGE, "DRIVE_CREDENTIALS_MISSING");
    }

    const payload = await request.json();
    const action = String(payload?.action || "");
    const rootFolderInput = payload?.rootFolder || process.env.FOOTAGE_ROOT_FOLDER_ID || "";

    if (action === "ensure-folders") {
      const result = await ensureStandardFootageFolders(rootFolderInput);
      return NextResponse.json({ ok: true, result });
    }

    if (action === "update-metadata") {
      const result = await updateFootageMetadata(payload?.fileId, {
        displayName: payload?.displayName,
        usageType: payload?.usageType,
        notes: payload?.notes,
      });
      return NextResponse.json({ ok: true, result });
    }

    return NextResponse.json(
      { ok: false, error: "Unsupported footage action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("footage POST error:", error);
    return errorResponse(error);
  }
}
