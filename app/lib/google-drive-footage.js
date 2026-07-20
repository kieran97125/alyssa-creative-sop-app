import { GoogleAuth } from "google-auth-library";

const DRIVE_API_BASE = "https://www.googleapis.com/drive/v3";
const DRIVE_UPLOAD_BASE = "https://www.googleapis.com/upload/drive/v3";
const FOLDER_MIME_TYPE = "application/vnd.google-apps.folder";
const SHORTCUT_MIME_TYPE = "application/vnd.google-apps.shortcut";

export const STANDARD_FOOTAGE_FOLDERS = [
  "01_DEP無針水光Combo",
  "02_BTL_EXION面眼提拉",
  "03_柔清舒敏面部護理",
  "04_S-Lite水感輕腿管理",
  "90_品牌通用素材",
];

function getServiceAccountCredentials() {
  const encoded = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64;

  if (!encoded) {
    throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_JSON_BASE64");
  }

  try {
    return JSON.parse(Buffer.from(encoded, "base64").toString("utf8"));
  } catch {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 is not valid base64 JSON");
  }
}

async function getDriveAccessToken() {
  const credentials = getServiceAccountCredentials();
  const auth = new GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/drive"],
  });
  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  const token = typeof tokenResponse === "string" ? tokenResponse : tokenResponse?.token;

  if (!token) {
    throw new Error("Unable to obtain Google Drive access token");
  }

  return token;
}

async function driveRequest(path, options = {}) {
  const token = await getDriveAccessToken();
  const response = await fetch(`${DRIVE_API_BASE}${path}`, {
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
    const message =
      payload?.error?.message ||
      payload?.message ||
      `Google Drive request failed with ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return payload;
}

export function normalizeDriveFolderId(value) {
  const input = String(value || "").trim();
  if (!input) return "";

  const folderMatch = input.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch?.[1]) return folderMatch[1];

  const idMatch = input.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch?.[1]) return idMatch[1];

  return /^[a-zA-Z0-9_-]{10,}$/.test(input) ? input : "";
}

function escapeDriveQuery(value) {
  return String(value || "").replaceAll("\\", "\\\\").replaceAll("'", "\\'");
}

function buildListQuery(parentId) {
  return `'${escapeDriveQuery(parentId)}' in parents and trashed = false`;
}

async function getDriveFile(fileId) {
  const fields = [
    "id",
    "name",
    "mimeType",
    "parents",
    "thumbnailLink",
    "webViewLink",
    "createdTime",
    "modifiedTime",
    "size",
    "videoMediaMetadata",
    "appProperties",
  ].join(",");

  return driveRequest(
    `/files/${encodeURIComponent(fileId)}?fields=${encodeURIComponent(fields)}&supportsAllDrives=true`
  );
}

async function listFolderChildren(folderId) {
  const fields = [
    "nextPageToken",
    "files(id,name,mimeType,parents,thumbnailLink,webViewLink,createdTime,modifiedTime,size,videoMediaMetadata,appProperties,shortcutDetails)",
  ].join(",");

  const files = [];
  let pageToken = "";

  do {
    const params = new URLSearchParams({
      q: buildListQuery(folderId),
      fields,
      pageSize: "1000",
      orderBy: "folder,name_natural",
      supportsAllDrives: "true",
      includeItemsFromAllDrives: "true",
    });

    if (pageToken) params.set("pageToken", pageToken);

    const page = await driveRequest(`/files?${params.toString()}`);
    files.push(...(Array.isArray(page?.files) ? page.files : []));
    pageToken = page?.nextPageToken || "";
  } while (pageToken);

  return files;
}

function isVideoFile(file) {
  return String(file?.mimeType || "").startsWith("video/");
}

function normalizeFootage(file, folder) {
  const appProperties = file?.appProperties || {};
  const metadata = file?.videoMediaMetadata || {};

  return {
    id: file.id,
    name: file.name || "Untitled footage",
    displayName: appProperties.alyssaDisplayName || file.name || "Untitled footage",
    mimeType: file.mimeType || "video/*",
    folderId: folder.id,
    folderName: folder.name,
    folderPath: folder.path,
    treatment: folder.treatment || folder.name,
    usageType: appProperties.alyssaUsageType || "未分類",
    notes: appProperties.alyssaNotes || "",
    thumbnailLink: file.thumbnailLink || "",
    webViewLink: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
    createdTime: file.createdTime || "",
    modifiedTime: file.modifiedTime || "",
    size: Number(file.size || 0),
    durationMillis: Number(metadata.durationMillis || 0),
    width: Number(metadata.width || 0),
    height: Number(metadata.height || 0),
  };
}

export async function scanFootageLibrary(rootFolderInput) {
  const rootFolderId = normalizeDriveFolderId(rootFolderInput);
  if (!rootFolderId) throw new Error("Invalid Google Drive footage root folder");

  const root = await getDriveFile(rootFolderId);
  if (root?.mimeType !== FOLDER_MIME_TYPE) {
    throw new Error("The supplied Google Drive item is not a folder");
  }

  const folders = [];
  const footage = [];
  const queue = [
    {
      id: rootFolderId,
      name: root.name || "Footage Library",
      path: root.name || "Footage Library",
      treatment: "未分類",
      depth: 0,
    },
  ];

  while (queue.length) {
    const folder = queue.shift();
    const children = await listFolderChildren(folder.id);

    for (const item of children) {
      if (item.mimeType === FOLDER_MIME_TYPE && folder.depth < 3) {
        const childFolder = {
          id: item.id,
          name: item.name || "Untitled folder",
          path: `${folder.path}/${item.name || "Untitled folder"}`,
          treatment: folder.depth === 0 ? item.name || "未分類" : folder.treatment,
          depth: folder.depth + 1,
        };
        folders.push(childFolder);
        queue.push(childFolder);
        continue;
      }

      if (item.mimeType === SHORTCUT_MIME_TYPE) continue;
      if (isVideoFile(item)) footage.push(normalizeFootage(item, folder));
    }
  }

  return {
    root: {
      id: rootFolderId,
      name: root.name || "Footage Library",
      webViewLink: root.webViewLink || `https://drive.google.com/drive/folders/${rootFolderId}`,
    },
    folders: folders.sort((a, b) => a.path.localeCompare(b.path, "zh-HK")),
    footage: footage.sort((a, b) => {
      const folderCompare = a.folderPath.localeCompare(b.folderPath, "zh-HK");
      return folderCompare || a.displayName.localeCompare(b.displayName, "zh-HK");
    }),
  };
}

async function createDriveFolder(parentId, name) {
  return driveRequest("/files?supportsAllDrives=true", {
    method: "POST",
    body: JSON.stringify({
      name,
      mimeType: FOLDER_MIME_TYPE,
      parents: [parentId],
    }),
  });
}

export async function ensureStandardFootageFolders(rootFolderInput) {
  const rootFolderId = normalizeDriveFolderId(rootFolderInput);
  if (!rootFolderId) throw new Error("Invalid Google Drive footage root folder");

  const children = await listFolderChildren(rootFolderId);
  const existingFolders = new Map(
    children
      .filter((item) => item.mimeType === FOLDER_MIME_TYPE)
      .map((item) => [item.name, item])
  );

  const created = [];
  const existing = [];

  for (const folderName of STANDARD_FOOTAGE_FOLDERS) {
    if (existingFolders.has(folderName)) {
      existing.push(existingFolders.get(folderName));
      continue;
    }

    const folder = await createDriveFolder(rootFolderId, folderName);
    created.push(folder);
  }

  return { created, existing };
}

export async function updateFootageMetadata(fileId, updates = {}) {
  if (!fileId) throw new Error("Missing Google Drive file ID");

  const current = await getDriveFile(fileId);
  if (!isVideoFile(current)) throw new Error("Only video footage metadata can be updated");

  const appProperties = {
    ...(current.appProperties || {}),
    alyssaDisplayName: String(updates.displayName || current.name || "").slice(0, 180),
    alyssaUsageType: String(updates.usageType || "未分類").slice(0, 80),
    alyssaNotes: String(updates.notes || "").slice(0, 500),
  };

  const updated = await driveRequest(`/files/${encodeURIComponent(fileId)}?supportsAllDrives=true`, {
    method: "PATCH",
    body: JSON.stringify({ appProperties }),
  });

  return {
    id: updated.id || fileId,
    displayName: appProperties.alyssaDisplayName,
    usageType: appProperties.alyssaUsageType,
    notes: appProperties.alyssaNotes,
  };
}

export async function getFootageServiceAccountEmail() {
  return getServiceAccountCredentials()?.client_email || "";
}

export async function uploadRecordedReference({ name, mimeType, buffer }) {
  const token = await getDriveAccessToken();
  const boundary = `alyssa-${Date.now()}`;
  const metadata = JSON.stringify({ name, mimeType });
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`),
    Buffer.from(`--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`),
    buffer,
    Buffer.from(`\r\n--${boundary}--`),
  ]);

  const response = await fetch(`${DRIVE_UPLOAD_BASE}/files?uploadType=multipart&fields=id,name,webViewLink`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body,
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.error?.message || "Failed to upload recorded reference");
  return payload;
}
