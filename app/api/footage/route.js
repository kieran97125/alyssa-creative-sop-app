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

function errorResponse(error, fallback = "Footage library request failed") {
  const message = error?.message || fallback;
  const status = Number(error?.status || 500);

  return NextResponse.json(
    {
      ok: false,
      error: message,
      hint:
        status === 403 || status === 404
          ? "請確認 Google Drive Root Folder 已分享 Editor 權限予系統 Service Account。"
          : "",
    },
    { status: status >= 400 && status < 600 ? status : 500 }
  );
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const rootFolderInput =
      searchParams.get("rootFolder") || process.env.FOOTAGE_ROOT_FOLDER_ID || "";
    const rootFolderId = normalizeDriveFolderId(rootFolderInput);
    const serviceAccountEmail = await getFootageServiceAccountEmail();

    if (!rootFolderId) {
      return NextResponse.json({
        ok: true,
        configured: false,
        serviceAccountEmail,
        library: null,
      });
    }

    const library = await scanFootageLibrary(rootFolderId);

    return NextResponse.json({
      ok: true,
      configured: true,
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
