import OpenAI from "openai";
import { NextResponse } from "next/server";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import ffmpegPath from "ffmpeg-static";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_VIDEO_BYTES = Number(process.env.REMIX_VIDEO_MAX_MB || 90) * 1024 * 1024;

function getFfmpegBinaryPath() {
  const candidates = [
    process.env.FFMPEG_PATH,
    ffmpegPath,
    "/var/task/node_modules/ffmpeg-static/ffmpeg",
    path.join(process.cwd(), "node_modules", "ffmpeg-static", "ffmpeg"),
  ].filter(Boolean);

  const resolved = candidates.find((candidate) => {
    try {
      return existsSync(candidate);
    } catch {
      return false;
    }
  });

  if (!resolved) throw new Error("ffmpeg binary not available");
  return resolved;
}

function runFfmpeg(args, timeoutMs = 45000) {
  return new Promise((resolve, reject) => {
    const child = spawn(getFfmpegBinaryPath(), args, { windowsHide: true });
    let stderr = "";
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill("SIGKILL");
      reject(new Error("Video frame extraction timed out"));
    }, timeoutMs);

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(error);
    });

    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (code === 0) resolve();
      else reject(new Error(stderr || `ffmpeg exited with ${code}`));
    });
  });
}

async function extractReferenceFrames(videoUrl) {
  if (!videoUrl) return [];

  const tempDir = path.join(os.tmpdir(), `reference-remix-${randomUUID()}`);
  await mkdir(tempDir, { recursive: true });

  try {
    const response = await fetch(videoUrl, { cache: "no-store" });
    if (!response.ok) throw new Error(`Unable to download reference video (${response.status})`);

    const contentLength = Number(response.headers.get("content-length") || 0);
    if (contentLength > MAX_VIDEO_BYTES) throw new Error("Reference video is too large for AI analysis");

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length > MAX_VIDEO_BYTES) throw new Error("Reference video is too large for AI analysis");

    const inputPath = path.join(tempDir, "reference-video");
    const outputPattern = path.join(tempDir, "frame-%02d.jpg");
    await writeFile(inputPath, buffer);

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

    return Promise.all(
      files.map(async (file) => {
        const image = await readFile(path.join(tempDir, file));
        return `data:image/jpeg;base64,${image.toString("base64")}`;
      })
    );
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

function extractJson(text) {
  const cleaned = String(text || "")
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  return start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned;
}

function fallbackResult(message) {
  return {
    referenceDNA: {
      coreIdea: "",
      hookMechanism: "",
      storyStructure: [],
      visualGrammar: "",
      pacing: "",
      whatToBorrow: [],
      whatNotToCopy: ["競品品牌、Logo、原句、獨有 claim 不可照抄"],
    },
    materialPlan: {
      availableFootageSummary: "",
      reuseStrategy: [],
      gaps: [],
    },
    versions: [],
    riskNotes: [message || "AI response could not be parsed"],
  };
}

function buildPrompt({ reference, treatment, availableFootage, versionAngles, extraBrief, frameCount }) {
  return `
你係香港美容品牌短影片 Creative Strategist。你要做嘅唔係抄競品內容，而係拆解佢嘅「創作結構」，再完全轉化成 Ineffable Beauty 自己嘅療程廣告。

你已收到 ${frameCount} 張由競品影片抽出嘅畫面。只能根據實際畫面同以下資料分析，不可以幻想片中不存在嘅內容。

【Reference】
名稱：${reference?.title || ""}
來源平台：${reference?.platform || ""}
原片網址：${reference?.sourceUrl || ""}
已有備註：${reference?.visualNotes || ""}

【要套用嘅品牌／療程】
品牌：Ineffable Beauty
療程：${treatment?.name || ""}
價錢：${treatment?.price || ""}
主要客群：${treatment?.audience || ""}
主要問題：${treatment?.painPoints || ""}
核心賣點：${treatment?.sellingPoints || ""}
安全表達：${treatment?.safeLanguage || ""}
CTA：WhatsApp 查詢及預約

【現時已有療程過程素材】
${Array.isArray(availableFootage) ? availableFootage.map((item) => `- ${item}`).join("\n") : ""}

【要生成嘅版本切入點】
${Array.isArray(versionAngles) ? versionAngles.map((item) => `- ${item.name}：${item.description}`).join("\n") : ""}

【額外要求】
${extraBrief || ""}

核心原則：
1. 借用 Hook 機制、敘事次序、節奏、構圖邏輯、字幕密度、轉場方法；不可逐字抄文案、品牌名、Logo、專有 claim 或獨有視覺識別。
2. 每個版本都要盡量使用「現時已有療程過程素材」，清楚寫明每一幕應該套邊一類片。
3. 如現有素材不足，將缺口寫入 gaps，但唔好將整條片變成全部重新拍攝。
4. 語言用香港廣東話書面語，直接、自然、轉化導向，避免誇張醫療聲稱。
5. 每個版本必須有 5 段：0–3秒、4–8秒、9–16秒、17–24秒、25–30秒。
6. 版本之間必須真係有不同切入點及設計語言，不可以只換一句 Hook。

只輸出 valid JSON：
{
  "referenceDNA": {
    "coreIdea": "呢條片真正吸引人嘅核心 idea",
    "hookMechanism": "片頭點樣截停觀眾",
    "storyStructure": ["第一步", "第二步"],
    "visualGrammar": "鏡頭、字卡、構圖、轉場規律",
    "pacing": "節奏描述",
    "whatToBorrow": ["可以借用嘅結構"],
    "whatNotToCopy": ["不可照抄嘅元素"]
  },
  "materialPlan": {
    "availableFootageSummary": "現有素材可以支撐到邊部分",
    "reuseStrategy": ["點樣重用療程過程片而唔似同一條片"],
    "gaps": ["真正需要補拍／補設計嘅小量素材"]
  },
  "versions": [
    {
      "id": "angle-id",
      "name": "版本名稱",
      "angle": "切入點",
      "whyItWorks": "點解適合呢個療程及受眾",
      "designDirection": "整體設計語言、字卡、色調、剪接手法",
      "hook": "0–3秒 Hook",
      "timeline": [
        {
          "time": "0–3秒",
          "role": "Hook / Problem / Process / Proof / CTA",
          "referenceIdea": "借用 reference 邊種結構，而非照抄內容",
          "ownFootage": "應使用邊段現有療程素材／需要補咩畫面",
          "subtitleVo": "字幕／VO",
          "visualDesign": "畫面、字卡、線條、crop、movement、轉場",
          "editorNote": "Designer／Editor 實際執行指令"
        }
      ],
      "designerBrief": "可直接交 Designer 嘅一段 Brief",
      "caption": "廣東話廣告 Caption",
      "cta": "結尾 CTA"
    }
  ],
  "riskNotes": ["風險或需要人手確認嘅地方"]
}

versions 數量必須同「要生成嘅版本切入點」數量完全一致，id 使用對應 angle id。
`;
}

export async function POST(request) {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ ok: false, error: "AI API key is not configured" }, { status: 500 });
    }

    const body = await request.json();
    const reference = body?.reference || {};
    const treatment = body?.treatment || {};
    const availableFootage = Array.isArray(body?.availableFootage) ? body.availableFootage : [];
    const versionAngles = Array.isArray(body?.versionAngles) ? body.versionAngles.slice(0, 5) : [];
    const extraBrief = String(body?.extraBrief || "").trim();

    if (!reference?.assetUrl) {
      return NextResponse.json({ ok: false, error: "請先錄製並儲存一條 Reference 影片" }, { status: 400 });
    }
    if (!treatment?.name) {
      return NextResponse.json({ ok: false, error: "請先選擇療程" }, { status: 400 });
    }
    if (!versionAngles.length) {
      return NextResponse.json({ ok: false, error: "請至少選擇一個版本切入點" }, { status: 400 });
    }

    let frames = [];
    let frameError = "";
    try {
      frames = await extractReferenceFrames(reference.assetUrl);
    } catch (error) {
      frameError = error?.message || "Unable to extract reference frames";
    }

    const client = new OpenAI({
      apiKey,
      baseURL: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
    });

    const userContent = [
      {
        type: "text",
        text: buildPrompt({ reference, treatment, availableFootage, versionAngles, extraBrief, frameCount: frames.length }),
      },
      ...frames.map((url) => ({ type: "image_url", image_url: { url } })),
    ];

    const completion = await client.chat.completions.create({
      model:
        process.env.OPENROUTER_VISION_MODEL ||
        process.env.OPENROUTER_MODEL ||
        process.env.OPENAI_MODEL ||
        "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content:
            "你係嚴謹嘅香港廣告影片策略師。你只輸出 valid JSON，必須將 reference 轉化而唔係照抄。",
        },
        { role: "user", content: userContent },
      ],
      temperature: 0.65,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices?.[0]?.message?.content || "{}";
    let data;
    try {
      data = JSON.parse(extractJson(raw));
    } catch (error) {
      data = fallbackResult(error?.message);
    }

    data.riskNotes = [
      ...(Array.isArray(data.riskNotes) ? data.riskNotes : []),
      ...(frameError ? [`畫面抽取未完整：${frameError}`] : []),
      ...(frames.length ? [] : ["未能抽取 Reference 畫面，請人手確認 AI 拆解結果。"]),
    ];

    return NextResponse.json({
      ok: true,
      source: "openrouter-vision-remix",
      frameCount: frames.length,
      data,
    });
  } catch (error) {
    console.error("generate-remix-versions error:", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "未能生成 Remix 影片版本" },
      { status: 500 }
    );
  }
}
