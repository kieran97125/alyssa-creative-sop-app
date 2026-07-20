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
      "8",
      "-q:v",
      "3",
      outputPattern,
    ]);

    const files = (await readdir(tempDir))
      .filter((file) => /^frame-\d+\.jpg$/i.test(file))
      .sort()
      .slice(0, 8);

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

function parseJson(text, fallback) {
  try {
    return JSON.parse(extractJson(text));
  } catch (error) {
    return typeof fallback === "function" ? fallback(error?.message) : fallback;
  }
}

function fallbackPlan(message) {
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
    productAdaptation: {
      productIdea: "",
      masterHook: "",
      audienceAngle: "",
      masterStory: "",
      designSystem: "",
      recommendedLength: "30 秒",
    },
    shotPlan: [],
    suggestedAngles: [],
    riskNotes: [message || "AI planning response could not be parsed"],
  };
}

function fallbackFinal(message) {
  return {
    finalizationSummary: {
      footageCoverage: "",
      voStrategy: "",
      designStrategy: "",
    },
    versions: [],
    missingMaterials: [],
    riskNotes: [message || "AI finalization response could not be parsed"],
  };
}

function buildPlanningPrompt({ reference, treatment, extraBrief, frameCount }) {
  return `
你係香港美容品牌嘅 Creative Director。你已睇到一條競品 Reference 影片嘅 ${frameCount} 張實際畫面。

你而家唔係即刻出最終稿，亦唔係叫 Marketer 先提供素材。你要先主動提出：
1. 我哋成品每一幕應該用咩自家療程畫面去對應 Reference 嘅功能。
2. 如果搵唔到首選畫面，可以用咩替代片、文字動畫、B-roll 或補拍方式。
3. 每一幕需唔需要 VO，點解；如果需要，先提供一句暫定 VO。
4. 字卡、線條、crop、movement、轉場、速度同畫面效果應該點做。
5. Marketer 去素材 Folder 搵片時應該搜尋咩關鍵字。

【Reference】
名稱：${reference?.title || ""}
平台：${reference?.platform || ""}
原片網址：${reference?.sourceUrl || ""}
現有備註：${reference?.visualNotes || ""}

【品牌／療程】
品牌：Ineffable Beauty
療程：${treatment?.name || ""}
價錢：${treatment?.price || ""}
客群：${treatment?.audience || ""}
問題：${treatment?.painPoints || ""}
賣點：${treatment?.sellingPoints || ""}
安全表達：${treatment?.safeLanguage || ""}
CTA：WhatsApp 查詢及預約

【額外方向】
${extraBrief || ""}

原則：
- 借 Hook 機制、敘事次序、節奏、構圖、字幕密度同轉場邏輯；不可照抄競品文案、品牌、Logo、專有 claim。
- 先提出一個最合理嘅 30 秒 Master Concept，再拆成 5 幕素材需求。
- 你要似 Creative Director 咁作決定，唔好只寫「可考慮」。
- VO 建議必須係「需要」、「可選」或「唔需要」其中一個。
- 語言用香港廣東話書面語，直接、自然、可執行。

只輸出 valid JSON：
{
  "referenceDNA": {
    "coreIdea": "原片真正吸引人嘅核心 idea",
    "hookMechanism": "片頭點截停觀眾",
    "storyStructure": ["原片第一步", "原片第二步"],
    "visualGrammar": "鏡頭、字卡、構圖、轉場規律",
    "pacing": "節奏描述",
    "whatToBorrow": ["可借用結構"],
    "whatNotToCopy": ["不可照抄元素"]
  },
  "productAdaptation": {
    "productIdea": "將原片方法轉化成呢個療程後嘅成品核心 idea",
    "masterHook": "建議成品片頭",
    "audienceAngle": "對應受眾情境",
    "masterStory": "整條成品嘅故事線",
    "designSystem": "整體字卡、線條、構圖、色調、速度方向",
    "recommendedLength": "建議片長"
  },
  "shotPlan": [
    {
      "id": "shot-1",
      "time": "0–3秒",
      "purpose": "Hook",
      "referencePattern": "原片呢個位置發揮咩功能／採用咩方法",
      "recommendedOwnFootage": "首選應搵咩自家療程片，描述畫面內容、角度同動作",
      "alternativeFootage": "搵唔到首選時用咩替代片／文字動畫／B-roll／補拍",
      "searchPrompt": "去素材 Folder 搜尋嘅關鍵字或檔名提示",
      "voRecommendation": "需要 / 可選 / 唔需要",
      "voReason": "點解呢幕需要或唔需要 VO",
      "draftVoiceover": "暫定 VO；唔需要就留空",
      "onScreenText": "建議字卡",
      "visualEffect": "線條、crop、movement、速度、轉場、特效",
      "editInstruction": "Editor 可直接執行嘅指令"
    }
  ],
  "suggestedAngles": [
    {
      "id": "pain / contrast / process / offer",
      "name": "版本名稱",
      "reason": "點解值得再出呢個版本"
    }
  ],
  "riskNotes": ["需要人手確認嘅地方"]
}

shotPlan 必須有 5 幕：0–3秒、4–8秒、9–16秒、17–24秒、25–30秒。
`;
}

function buildFinalizePrompt({ reference, treatment, proposal, materialDecisions, versionAngles, extraBrief }) {
  return `
你係香港美容品牌 Creative Director。第一階段你已經提出成品方案同逐幕素材需求；Marketer 亦已經回報實際搵到咩片、邊啲位要替代或補拍。

你而家要根據「真實素材回報」鎖定最終影片稿。你要主動決定：
- 每一幕最終用邊段片。
- VO 最終係需要、可選定唔需要，並解釋原因。
- 字幕同 VO 是否同一句。
- 畫面效果、crop、movement、字卡、線條及轉場。
- 同一批素材點樣剪成真正不同嘅版本，而唔係只換 Hook。

【Reference】
名稱：${reference?.title || ""}
來源：${reference?.sourceUrl || reference?.assetUrl || ""}

【品牌／療程】
品牌：Ineffable Beauty
療程：${treatment?.name || ""}
價錢：${treatment?.price || ""}
客群：${treatment?.audience || ""}
問題：${treatment?.painPoints || ""}
賣點：${treatment?.sellingPoints || ""}
安全表達：${treatment?.safeLanguage || ""}

【第一階段 AI 方案】
${JSON.stringify(proposal || {}, null, 2)}

【實際素材回報】
${JSON.stringify(materialDecisions || [], null, 2)}

【要生成嘅版本】
${Array.isArray(versionAngles) ? versionAngles.map((item) => `- ${item.id}｜${item.name}：${item.description || item.reason || ""}`).join("\n") : ""}

【額外要求】
${extraBrief || ""}

規則：
1. 不可以聲稱使用一段未搵到嘅片。status 係「已搵到」或「用替代片」先可當作現有素材。
2. status 係「需要補拍」或「無法提供」，要提出最細可行補拍／文字動畫替代。
3. 每個版本必須有 5 幕：0–3秒、4–8秒、9–16秒、17–24秒、25–30秒。
4. 每幕都要寫 VO 最終決策、原因、字幕／VO、畫面效果同 Editor 指令。
5. 版本之間要改變敘事次序、素材重點、字卡密度、視覺語言或節奏，唔可以只換片頭。
6. 借 Reference 結構但不可抄競品文案、品牌、Logo、claim。
7. 語言用香港廣東話書面語，避免誇張醫療聲稱。

只輸出 valid JSON：
{
  "finalizationSummary": {
    "footageCoverage": "現有素材覆蓋程度同主要缺口",
    "voStrategy": "整體 VO 策略，邊啲位靠 VO、邊啲位靠畫面／字卡",
    "designStrategy": "共用設計系統同版本差異化方法"
  },
  "versions": [
    {
      "id": "angle-id",
      "name": "版本名稱",
      "angle": "切入點",
      "whyItWorks": "點解適合療程及受眾",
      "designDirection": "整體視覺同剪接方向",
      "hook": "0–3秒 Hook",
      "timeline": [
        {
          "time": "0–3秒",
          "role": "Hook / Problem / Process / Proof / CTA",
          "referenceIdea": "借用 Reference 邊種功能或結構",
          "ownFootage": "最終使用嘅真實素材／替代／補拍要求",
          "sourceStatus": "已搵到 / 用替代片 / 需要補拍 / 文字動畫補足",
          "voRequired": "需要 / 可選 / 唔需要",
          "voReason": "最終 VO 決策原因",
          "subtitleVo": "最終字幕／VO；如兩者不同要清楚分開",
          "visualDesign": "字卡、線條、crop、movement、速度、轉場、特效",
          "editorNote": "Editor 可直接執行指令"
        }
      ],
      "designerBrief": "可直接交 Designer 嘅 Brief",
      "caption": "廣東話廣告 Caption",
      "cta": "結尾 CTA"
    }
  ],
  "missingMaterials": ["仍需搵／補拍／補設計嘅素材"],
  "riskNotes": ["需要人手確認嘅地方"]
}

versions 數量必須同指定版本數量一致，id 使用對應 angle id。
`;
}

function createClient() {
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("AI API key is not configured");
  return new OpenAI({
    apiKey,
    baseURL: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
  });
}

function getModel() {
  return (
    process.env.OPENROUTER_VISION_MODEL ||
    process.env.OPENROUTER_MODEL ||
    process.env.OPENAI_MODEL ||
    "google/gemini-2.5-flash"
  );
}

async function runModel({ text, frames = [], temperature = 0.55 }) {
  const client = createClient();
  const userContent = [
    { type: "text", text },
    ...frames.map((url) => ({ type: "image_url", image_url: { url } })),
  ];

  const completion = await client.chat.completions.create({
    model: getModel(),
    messages: [
      {
        role: "system",
        content:
          "你係嚴謹嘅香港廣告影片 Creative Director。你只輸出 valid JSON，必須基於真實資料作決定，將 Reference 轉化而唔係照抄。",
      },
      { role: "user", content: userContent },
    ],
    temperature,
    response_format: { type: "json_object" },
  });

  return completion.choices?.[0]?.message?.content || "{}";
}

export async function POST(request) {
  try {
    const body = await request.json();
    const action = String(body?.action || "plan");
    const reference = body?.reference || {};
    const treatment = body?.treatment || {};
    const extraBrief = String(body?.extraBrief || "").trim();

    if (!reference?.assetUrl) {
      return NextResponse.json({ ok: false, error: "請先錄製並儲存一條 Reference 影片" }, { status: 400 });
    }
    if (!treatment?.name) {
      return NextResponse.json({ ok: false, error: "請先選擇療程" }, { status: 400 });
    }

    if (action === "plan") {
      let frames = [];
      let frameError = "";
      try {
        frames = await extractReferenceFrames(reference.assetUrl);
      } catch (error) {
        frameError = error?.message || "Unable to extract reference frames";
      }

      const raw = await runModel({
        text: buildPlanningPrompt({ reference, treatment, extraBrief, frameCount: frames.length }),
        frames,
        temperature: 0.5,
      });
      const data = parseJson(raw, fallbackPlan);
      data.riskNotes = [
        ...(Array.isArray(data.riskNotes) ? data.riskNotes : []),
        ...(frameError ? [`畫面抽取未完整：${frameError}`] : []),
        ...(frames.length ? [] : ["未能抽取 Reference 畫面，請人手確認 AI 提議。"]),
      ];

      return NextResponse.json({
        ok: true,
        mode: "plan",
        source: "openrouter-vision-remix-plan",
        frameCount: frames.length,
        data,
      });
    }

    if (action === "finalize") {
      const proposal = body?.proposal || null;
      const materialDecisions = Array.isArray(body?.materialDecisions) ? body.materialDecisions : [];
      const versionAngles = Array.isArray(body?.versionAngles) ? body.versionAngles.slice(0, 5) : [];

      if (!proposal || !Array.isArray(proposal?.shotPlan) || !proposal.shotPlan.length) {
        return NextResponse.json({ ok: false, error: "請先由 AI 生成成品方案同素材對應表" }, { status: 400 });
      }
      if (!versionAngles.length) {
        return NextResponse.json({ ok: false, error: "請至少選擇一個版本切入點" }, { status: 400 });
      }

      const raw = await runModel({
        text: buildFinalizePrompt({
          reference,
          treatment,
          proposal,
          materialDecisions,
          versionAngles,
          extraBrief,
        }),
        temperature: 0.62,
      });
      const data = parseJson(raw, fallbackFinal);

      return NextResponse.json({
        ok: true,
        mode: "finalize",
        source: "openrouter-remix-finalize",
        data,
      });
    }

    return NextResponse.json({ ok: false, error: "Unsupported remix action" }, { status: 400 });
  } catch (error) {
    console.error("generate-remix-versions error:", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "未能生成 Remix 方案" },
      { status: 500 }
    );
  }
}
