import { GoogleAuth } from "google-auth-library";
import { NextResponse } from "next/server";
import { list, del } from "@vercel/blob";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import ffmpegPath from "ffmpeg-static";
import { existsSync } from "node:fs";


function getFfmpegBinaryPath() {
  const candidates = [
    process.env.FFMPEG_PATH,
    ffmpegPath,
    "/var/task/node_modules/ffmpeg-static/ffmpeg",
    "/var/task/node_modules/ffmpeg-static/ffmpeg.exe",
    path.join(process.cwd(), "node_modules", "ffmpeg-static", "ffmpeg"),
    path.join(process.cwd(), "node_modules", "ffmpeg-static", "ffmpeg.exe"),
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      if (existsSync(candidate)) return candidate;
    } catch {}
  }

  throw new Error(`ffmpeg binary not found. Tried: ${candidates.join(" | ")}`);
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function extractJson(text) {
  if (!text) return "{}";

  const cleaned = String(text)
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return cleaned.slice(firstBrace, lastBrace + 1);
  }

  return cleaned;
}

function safeJsonParse(text, fallback = {}) {
  try {
    return JSON.parse(extractJson(text));
  } catch {
    return fallback;
  }
}

function parseImageDataUrl(imageBase64) {
  const value = String(imageBase64 || "");
  const match = value.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);

  if (match) {
    return {
      mimeType: match[1],
      data: match[2],
    };
  }

  return {
    mimeType: "image/jpeg",
    data: value,
  };
}


function frameToDataUrl(frame) {
  if (!frame) return "";
  if (frame.imageUrl) return frame.imageUrl;
  if (String(frame.imageBase64 || "").startsWith("data:image/")) return frame.imageBase64;

  const mimeType = frame.mimeType || "image/jpeg";
  const data = frame.data || frame.imageBase64 || "";

  return data ? `data:${mimeType};base64,${data}` : "";
}

function attachFrameImagesToAnalysisKeyFrames(keyFrames, frames) {
  const safeFrames = Array.isArray(frames) ? frames : [];
  const safeKeyFrames = Array.isArray(keyFrames) && keyFrames.length
    ? keyFrames
    : safeFrames.map((frame, index) => ({
        time: frame.time || `${index * 3}s`,
        role: "Reference",
        imageDescription: "",
        referencePattern: "",
        suggestedUse: "可用作分鏡 reference",
        designerNote: "",
      }));

  return safeKeyFrames.map((frame, index) => {
    const matchedFrame =
      safeFrames.find((item) => String(item.time || "") === String(frame?.time || "")) ||
      safeFrames[index] ||
      {};

    const imageUrl = frame?.imageUrl || frame?.imageBase64 || frameToDataUrl(matchedFrame);

    return {
      ...frame,
      imageUrl,
      imageBase64: imageUrl,
      referenceFrameIndex: index,
    };
  });
}

function normalizeFrames(frames) {
  if (!Array.isArray(frames)) return [];

  return frames
    .filter((frame) => frame && typeof frame.imageBase64 === "string")
    .slice(0, 8)
    .map((frame, index) => ({
      time: frame.time || `${index}s`,
      ...parseImageDataUrl(frame.imageBase64),
    }))
    .filter((frame) => frame.data && frame.data.length > 100);
}


const SERVER_FRAME_EXTRACT_MAX_MB = Number(process.env.SERVER_FRAME_EXTRACT_MAX_MB || 80);
const SERVER_FRAME_EXTRACT_MAX_BYTES = SERVER_FRAME_EXTRACT_MAX_MB * 1024 * 1024;

function runFfmpeg(args, timeoutMs = 45000) {
  return new Promise((resolve, reject) => {
    const resolvedFfmpegPath = getFfmpegBinaryPath();

    const child = spawn(resolvedFfmpegPath, args, {
      windowsHide: true,
    });

    let stderr = "";
    let stdout = "";
    let finished = false;

    const timer = setTimeout(() => {
      if (finished) return;
      finished = true;
      child.kill("SIGKILL");
      reject(new Error(`ffmpeg timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      reject(error);
    });

    child.on("close", (code) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);

      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      reject(new Error(`ffmpeg exited with code ${code}: ${stderr || stdout || "Unknown ffmpeg error"}`));
    });
  });
}

async function downloadVideoToTemp(videoUrl, tempDir) {
  const response = await fetch(videoUrl);

  if (!response.ok) {
    throw new Error(`Failed to download video for server frame extraction: ${response.status}`);
  }

  const contentLength = Number(response.headers.get("content-length") || 0);

  if (contentLength > SERVER_FRAME_EXTRACT_MAX_BYTES) {
    throw new Error(`Video too large for server frame extraction. Limit: ${SERVER_FRAME_EXTRACT_MAX_MB}MB`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (buffer.length > SERVER_FRAME_EXTRACT_MAX_BYTES) {
    throw new Error(`Video too large for server frame extraction. Limit: ${SERVER_FRAME_EXTRACT_MAX_MB}MB`);
  }

  const inputPath = path.join(tempDir, "input-video");

  await writeFile(inputPath, buffer);

  return {
    inputPath,
    sizeBytes: buffer.length,
  };
}

async function extractFramesFromVideoUrl(videoUrl) {
  const tempDir = path.join(os.tmpdir(), `ai-video-frames-${randomUUID()}`);

  await mkdir(tempDir, { recursive: true });

  try {
    const { inputPath, sizeBytes } = await downloadVideoToTemp(videoUrl, tempDir);
    const outputPattern = path.join(tempDir, "frame-%03d.jpg");

    await runFfmpeg([
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-i",
      inputPath,
      "-vf",
      "fps=1/3,scale=720:-2:force_original_aspect_ratio=decrease",
      "-frames:v",
      "6",
      "-q:v",
      "3",
      outputPattern,
    ]);

    const files = (await readdir(tempDir))
      .filter((file) => /^frame-\d+\.jpg$/i.test(file))
      .sort()
      .slice(0, 6);

    const extractedFrames = await Promise.all(
      files.map(async (file, index) => {
        const buffer = await readFile(path.join(tempDir, file));

        return {
          time: `${index * 3}s`,
          imageBase64: `data:image/jpeg;base64,${buffer.toString("base64")}`,
        };
      })
    );

    return {
      ok: extractedFrames.length > 0,
      source: "server",
      frameCount: extractedFrames.length,
      sizeBytes,
      frames: normalizeFrames(extractedFrames),
    };
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

function getServiceAccountCredentials() {
  const encoded = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64;

  if (!encoded) {
    throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_JSON_BASE64");
  }

  const jsonText = Buffer.from(encoded, "base64").toString("utf8");
  return JSON.parse(jsonText);
}

async function getGoogleAccessToken() {
  const credentials = getServiceAccountCredentials();

  const auth = new GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });

  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();

  const token =
    typeof tokenResponse === "string" ? tokenResponse : tokenResponse?.token;

  if (!token) {
    throw new Error("Failed to get Google access token");
  }

  return token;
}


async function cleanupVideoBlobsKeepLatest() {
  const enabled = process.env.CLEANUP_VIDEO_BLOBS !== "false";

  if (!enabled) {
    return {
      ok: true,
      skipped: true,
      reason: "CLEANUP_VIDEO_BLOBS=false",
    };
  }

  const prefix = process.env.VIDEO_BLOB_PREFIX || "videos/";
  const keepLatest = Math.max(1, Number(process.env.VIDEO_BLOB_KEEP_LATEST || 20));

  try {
    let cursor;
    const blobs = [];

    do {
      const page = await list({
        prefix,
        limit: 1000,
        cursor,
      });

      blobs.push(...(Array.isArray(page.blobs) ? page.blobs : []));
      cursor = page.cursor;
    } while (cursor);

    const sorted = blobs
      .filter((blob) => blob?.url)
      .sort((a, b) => {
        const bTime = new Date(b.uploadedAt || 0).getTime();
        const aTime = new Date(a.uploadedAt || 0).getTime();
        return bTime - aTime;
      });

    const toDelete = sorted.slice(keepLatest);

    if (toDelete.length > 0) {
      await del(toDelete.map((blob) => blob.url));
    }

    return {
      ok: true,
      prefix,
      keepLatest,
      total: sorted.length,
      deleted: toDelete.length,
    };
  } catch (error) {
    console.warn("Blob cleanup failed:", error);

    return {
      ok: false,
      prefix,
      keepLatest,
      error: error?.message || "Unknown blob cleanup error",
    };
  }
}

function buildPrompt({ videoUrl, payload, frames }) {
  const form = payload?.form || {};
  const brandConfig = payload?.brandConfig || {};

  return `
你是一位香港本地服務業廣告影片分析師，專門分析 reference video，並將影片節奏、畫面、Hook、字幕邏輯、CTA 結構，轉化成可套用到新品牌 / 新療程的拍攝建議。

你現在會收到：
1. 影片 storage URL
2. 前端從影片抽出的 key frame 圖片
3. 品牌資料及影片生成表單

請你根據 key frames 真實畫面進行分析，不要假裝看到不存在的畫面。
如果 key frames 數量是 0，請明確指出「未收到 key frames」。

影片 URL：
${videoUrl || ""}

表單資料：
- Project Name：${form.projectName || ""}
- Brand：${brandConfig.code || ""}｜${brandConfig.name || ""}
- Treatment / Offer：${form.treatment || ""}
- Target Audience：${form.targetAudience || ""}
- Pain Points：${form.painPoints || ""}
- Selling Points：${form.sellingPoints || ""}
- Offer / CTA：${form.offer || ""}｜${form.cta || ""}
- Platform：${form.platform || ""}
- Length：${form.length || ""}
- Generation Mode：${form.generationMode || ""}

品牌規則：
- Brand Tone：${brandConfig.tone || ""}
- Prompt Rules：${brandConfig.promptRules || ""}
- Banned Words：${brandConfig.bannedWords || ""}
- Safe Phrases：${brandConfig.safePhrases || ""}
- Hook Rule：${brandConfig.hookRule || ""}
- Script Rule：${brandConfig.scriptRule || ""}
- Caption Rules：${brandConfig.captionRules || ""}

分析目標：
1. 拆解 reference video 的 Hook 手法。
2. 拆解畫面節奏，例如幾多秒轉一次畫面、是否快切、是否有字幕 punchline。
3. 分析每個 key frame 的畫面內容、角色、可套用用途。
4. 提取可套用到新品牌的 reference pattern。
5. 分析是否有風險字眼、誇大療效、醫療化表述。
6. 給出可用於影片稿生成的素材方向。
7. Transcript 暫時只可根據畫面文字 / 字幕推斷；如果沒有清晰字幕或聲音轉錄，請填空字串，並在 riskNotes / improvementIdeas 說明尚未完成 audio transcription。

請只輸出 valid JSON，不要 markdown，不要解釋文字。

JSON 格式必須如下：
{
  "summary": "",
  "transcript": "",
  "keyFrames": [
    {
      "time": "0s",
      "role": "Hook / Problem / Demo / Proof / CTA",
      "imageDescription": "",
      "referencePattern": "",
      "suggestedUse": "",
      "designerNote": ""
    }
  ],
  "hookMoment": "",
  "visualStyle": "",
  "pacing": "",
  "referenceStructure": "",
  "improvementIdeas": [],
  "creativeAngles": [],
  "riskNotes": []
}

目前收到 key frames 數量：${frames.length}
`;
}

function buildVertexParts({ videoUrl, payload, frames }) {
  const parts = [
    {
      text: buildPrompt({ videoUrl, payload, frames }),
    },
  ];

  for (const frame of frames) {
    parts.push({
      text: `Key frame time: ${frame.time}`,
    });

    parts.push({
      inlineData: {
        mimeType: frame.mimeType || "image/jpeg",
        data: frame.data,
      },
    });
  }

  return parts;
}

const AUDIO_TRANSCRIPT_MAX_MB = Number(process.env.AUDIO_TRANSCRIPT_MAX_MB || 18);
const AUDIO_TRANSCRIPT_MAX_BYTES = AUDIO_TRANSCRIPT_MAX_MB * 1024 * 1024;

const AUDIO_SOURCE_MAX_MB = Number(process.env.AUDIO_SOURCE_MAX_MB || 150);
const AUDIO_SOURCE_MAX_BYTES = AUDIO_SOURCE_MAX_MB * 1024 * 1024;
const AUDIO_TRANSCRIPT_SECONDS = Number(process.env.AUDIO_TRANSCRIPT_SECONDS || 90);
const AUDIO_TRANSCRIPT_BITRATE = process.env.AUDIO_TRANSCRIPT_BITRATE || "32k";

async function fetchAudioTranscriptInlineData(videoUrl) {
  const tempDir = path.join(os.tmpdir(), `ai-audio-${randomUUID()}`);

  await mkdir(tempDir, { recursive: true });

  try {
    const response = await fetch(videoUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch video for audio extraction: ${response.status}`);
    }

    const contentLength = Number(response.headers.get("content-length") || 0);

    if (contentLength > AUDIO_SOURCE_MAX_BYTES) {
      throw new Error(`Video too large for audio extraction. Limit: ${AUDIO_SOURCE_MAX_MB}MB`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    if (inputBuffer.length > AUDIO_SOURCE_MAX_BYTES) {
      throw new Error(`Video too large for audio extraction. Limit: ${AUDIO_SOURCE_MAX_MB}MB`);
    }

    const inputPath = path.join(tempDir, "input-video");
    const audioPath = path.join(tempDir, "audio-transcript.mp3");

    await writeFile(inputPath, inputBuffer);

    await runFfmpeg(
      [
        "-hide_banner",
        "-loglevel",
        "error",
        "-y",
        "-i",
        inputPath,
        "-vn",
        "-t",
        String(AUDIO_TRANSCRIPT_SECONDS),
        "-ac",
        "1",
        "-ar",
        "16000",
        "-b:a",
        AUDIO_TRANSCRIPT_BITRATE,
        audioPath,
      ],
      45000
    );

    const audioBuffer = await readFile(audioPath);

    if (!audioBuffer.length) {
      throw new Error("No audio data extracted from video.");
    }

    if (audioBuffer.length > AUDIO_TRANSCRIPT_MAX_BYTES) {
      throw new Error(`Extracted audio too large for inline transcript. Limit: ${AUDIO_TRANSCRIPT_MAX_MB}MB`);
    }

    return {
      mimeType: "audio/mpeg",
      data: audioBuffer.toString("base64"),
      sizeBytes: audioBuffer.length,
      sourceVideoSizeBytes: inputBuffer.length,
      extractedSeconds: AUDIO_TRANSCRIPT_SECONDS,
    };
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

function guessVideoMimeType(videoUrl) {
  const cleanUrl = String(videoUrl || "").split("?")[0].toLowerCase();

  if (cleanUrl.endsWith(".mov")) return "video/mov";
  if (cleanUrl.endsWith(".webm")) return "video/webm";
  if (cleanUrl.endsWith(".mpeg")) return "video/mpeg";
  if (cleanUrl.endsWith(".mpg")) return "video/mpg";
  if (cleanUrl.endsWith(".avi")) return "video/avi";
  if (cleanUrl.endsWith(".wmv")) return "video/wmv";

  return "video/mp4";
}

async function fetchVideoAsInlineData(videoUrl) {
  const response = await fetch(videoUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch video for audio transcript: ${response.status}`);
  }

  const contentLength = Number(response.headers.get("content-length") || 0);

  if (contentLength > AUDIO_TRANSCRIPT_MAX_BYTES) {
    throw new Error(`Video too large for inline audio transcript. Limit: ${AUDIO_TRANSCRIPT_MAX_MB}MB`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (buffer.length > AUDIO_TRANSCRIPT_MAX_BYTES) {
    throw new Error(`Video too large for inline audio transcript. Limit: ${AUDIO_TRANSCRIPT_MAX_MB}MB`);
  }

  return {
    mimeType: guessVideoMimeType(videoUrl),
    data: buffer.toString("base64"),
    sizeBytes: buffer.length,
  };
}

function buildAudioTranscriptPrompt({ payload }) {
  const form = payload?.form || {};
  const brandConfig = payload?.brandConfig || {};

  return [
    "你是一位香港廣告影片 VO / 音軌分析師。",
    "",
    "請專注分析影片中的聲音內容：",
    "1. 轉錄可聽到的旁白、對白、口播、VO。",
    "2. 如果是廣東話，請用繁體中文 / 香港廣東話方式轉錄。",
    "3. 如果只有音樂、環境聲、無人聲，transcript 請填空字串。",
    "4. 不要幻想沒有聽到的內容。",
    "5. 如音質差、聽不清，請用一句 audioNotes 說明。",
    "6. 簡短分析 VO 節奏、語氣及是否適合廣告使用；不要輸出冗長警告。",
    "",
    `品牌：${brandConfig.code || ""}｜${brandConfig.name || ""}`,
    `療程 / 產品：${form.treatment || ""}`,
    `主力痛點：${form.painPoints || ""}`,
    `賣點：${form.sellingPoints || ""}`,
    `CTA：${form.cta || ""}`,
    "",
    "請只輸出 valid JSON，不要 markdown：",
    "{",
    "  \"transcript\": \"\",",
    "  \"audioSummary\": \"\",",
    "  \"voStyle\": \"\",",
    "  \"audioPacing\": \"\",",
    "  \"audioNotes\": [],",
    "  \"riskNotes\": []",
    "}"
  ].join("\n");
}

async function callVertexVideoTranscript({ videoUrl, payload }) {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const location = process.env.VERTEX_AI_LOCATION || "global";
  const model = process.env.VERTEX_AI_MODEL || "gemini-2.5-flash";

  if (!projectId) {
    throw new Error("Missing GOOGLE_CLOUD_PROJECT_ID");
  }

  const videoInlineData = await fetchAudioTranscriptInlineData(videoUrl);
  const accessToken = await getGoogleAccessToken();

  const endpoint = `https://aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:generateContent`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            { text: buildAudioTranscriptPrompt({ payload }) },
            {
              inlineData: {
                mimeType: videoInlineData.mimeType,
                data: videoInlineData.data,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json",
      },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(JSON.stringify(data));
  }

  const text =
    data?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("") || "{}";

  const parsed = safeJsonParse(text, {});

  return {
    available: true,
    model,
    location,
    sizeBytes: videoInlineData.sizeBytes,
    transcript: parsed.transcript || "",
    audioSummary: parsed.audioSummary || "",
    voStyle: parsed.voStyle || "",
    audioPacing: parsed.audioPacing || "",
    audioNotes: Array.isArray(parsed.audioNotes) ? parsed.audioNotes : [],
    riskNotes: Array.isArray(parsed.riskNotes) ? parsed.riskNotes : [],
  };
}
async function callVertexGemini({ videoUrl, payload, frames }) {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const location = process.env.VERTEX_AI_LOCATION || "global";
  const model = process.env.VERTEX_AI_MODEL || "gemini-2.5-flash";

  if (!projectId) {
    throw new Error("Missing GOOGLE_CLOUD_PROJECT_ID");
  }

  const accessToken = await getGoogleAccessToken();

  const endpoint = `https://aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:generateContent`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: buildVertexParts({ videoUrl, payload, frames }),
        },
      ],
      generationConfig: {
        temperature: 0.25,
        responseMimeType: "application/json",
      },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(JSON.stringify(data));
  }

  const text =
    data?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("") || "{}";

  return {
    model,
    location,
    raw: text,
    analysis: safeJsonParse(text, {}),
  };
}

function createFallbackAnalysis({ videoUrl, frames, error }) {
  return {
    ok: true,
    source: "vertex-gemini-video-frame-analysis-fallback",
    model: process.env.VERTEX_AI_MODEL || "gemini-2.5-flash",
    location: process.env.VERTEX_AI_LOCATION || "global",
    visionAvailable: false,
    visionError: {
      message: error?.message || "Unknown error",
    },
    videoUrl,
    frameCount: frames.length,
    frameSource: typeof frameSource !== "undefined" ? frameSource : undefined,
    summary:
      frames.length > 0
        ? `已成功收到 ${frames.length} 張 key frames，但 Vertex Gemini vision analysis 暫時失敗，未能完成逐格畫面分析。`
        : "未收到 key frames，未能完成逐格畫面分析。",
    transcript: "",
    keyFrames: attachFrameImagesToAnalysisKeyFrames([], frames),
    hookMoment: "",
    visualStyle: "",
    pacing: "",
    referenceStructure: "",
    improvementIdeas: [
      frames.length > 0
        ? "已抽取 key frames，但 Vertex AI vision 分析暫時失敗。請檢查 Vertex AI API、billing、service account 權限及 env 設定。"
        : "未收到 key frames。請確認前端 extractFramesFromVideoFile 是否成功產生 imageBase64。",
    ],
    creativeAngles: [],
    riskNotes: [
      "Audio transcription 尚未接入；目前只會用 key frames 做畫面分析。",
      error?.message ? `Vertex error: ${error.message}` : "",
    ].filter(Boolean),
  };
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    message:
      "analyze-video route exists. Use POST with JSON { videoUrl, payload, frames }. Vertex Gemini vision is enabled.",
    hasServiceAccount: Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64),
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || "",
    vertexLocation: process.env.VERTEX_AI_LOCATION || "global",
    vertexModel: process.env.VERTEX_AI_MODEL || "gemini-2.5-flash",
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const videoUrl = String(body?.videoUrl || "").trim();
    const payload = body?.payload || {};
    const clientFrames = normalizeFrames(body?.frames);
    let frames = clientFrames;
    let frameSource = frames.length ? "client" : "none";
    let serverFrameError = "";

    if (!videoUrl) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Missing videoUrl. Upload file to storage first, then pass URL to backend.",
        },
        { status: 400 }
      );
    }

    const blobCleanupResult = await cleanupVideoBlobsKeepLatest();
    console.log("Blob cleanup result:", blobCleanupResult);

    if (frames.length === 0) {
      try {
        const serverFrameResult = await extractFramesFromVideoUrl(videoUrl);
        frames = Array.isArray(serverFrameResult?.frames) ? serverFrameResult.frames : [];
        frameSource = frames.length ? "server" : "none";
      } catch (error) {
        serverFrameError = error?.message || "Unknown server frame extraction error";
        console.warn("Server-side frame extraction failed:", error);
      }
    }

    if (frames.length === 0) {
      return NextResponse.json({
        ok: true,
        source: "vertex-gemini-video-frame-analysis-no-frames",
        model: process.env.VERTEX_AI_MODEL || "gemini-2.5-flash",
        location: process.env.VERTEX_AI_LOCATION || "global",
        visionAvailable: false,
        videoUrl,
        frameSource,
        serverFrameError,
        frameCount: 0,
        summary:
          "未能從前端或後端抽取 key frames，無法根據實際畫面進行分析。",
        transcript: "",
        keyFrames: attachFrameImagesToAnalysisKeyFrames([], frames),
        hookMoment: "",
        visualStyle: "",
        pacing: "",
        referenceStructure: "",
        improvementIdeas: [
          "前端未有傳入 frames，後端亦未能用 ffmpeg 從 videoUrl 抽取畫面。請重新匯出 MP4、壓縮影片，或確認影片 URL 可被伺服器讀取。",
        ],
        creativeAngles: [],
        riskNotes: [
          "未能取得 reference video 畫面，生成稿不應視為已跟足 reference。",
          serverFrameError ? `Server frame extraction error: ${serverFrameError}` : "",
        ].filter(Boolean),
      });
    }

    let audioTranscriptResult = null;

    try {
      audioTranscriptResult = await callVertexVideoTranscript({ videoUrl, payload });
    } catch (error) {
      audioTranscriptResult = {
        available: false,
        error: error?.message || "Unknown audio transcript error",
      };
    }

    let vertexResult;

    try {
      vertexResult = await callVertexGemini({ videoUrl, payload, frames });
    } catch (error) {
      return NextResponse.json(
        createFallbackAnalysis({ videoUrl, frames, error })
      );
    }

    const analysis = vertexResult.analysis || {};
    const mergedTranscript =
      audioTranscriptResult?.transcript ||
      analysis.transcript ||
      "";

    return NextResponse.json({
      ok: true,
      source: "vertex-gemini-video-frame-analysis",
      model: vertexResult.model,
      location: vertexResult.location,
      visionAvailable: true,
      videoUrl,
      frameCount: frames.length,
    frameSource: typeof frameSource !== "undefined" ? frameSource : undefined,
      audioAvailable: Boolean(audioTranscriptResult?.available),
      audioTranscript: audioTranscriptResult?.transcript || "",
      audioSummary: audioTranscriptResult?.audioSummary || "",
      voStyle: audioTranscriptResult?.voStyle || "",
      audioPacing: audioTranscriptResult?.audioPacing || "",
      audioNotes: Array.isArray(audioTranscriptResult?.audioNotes) ? audioTranscriptResult.audioNotes : [],
      summary: analysis.summary || "",
      transcript: mergedTranscript,
      keyFrames: attachFrameImagesToAnalysisKeyFrames(analysis.keyFrames, frames),
      hookMoment: analysis.hookMoment || "",
      visualStyle: analysis.visualStyle || "",
      pacing: analysis.pacing || "",
      referenceStructure: analysis.referenceStructure || "",
      improvementIdeas: Array.isArray(analysis.improvementIdeas)
        ? analysis.improvementIdeas
        : [],
      creativeAngles: Array.isArray(analysis.creativeAngles)
        ? analysis.creativeAngles
        : [],
      riskNotes: [
        ...(Array.isArray(analysis.riskNotes) ? analysis.riskNotes : []),
        ...(Array.isArray(audioTranscriptResult?.riskNotes) ? audioTranscriptResult.riskNotes : []),
        ...(audioTranscriptResult?.error ? [`音軌轉錄未完成：${audioTranscriptResult.error}`] : []),
      ],
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to analyze video",
        message: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}