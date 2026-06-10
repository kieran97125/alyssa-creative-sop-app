import OpenAI from "openai";
import { NextResponse } from "next/server";

function buildPrompt(payload) {
  const { form, brandConfig, videoAnalysis, isRevision, revisionInstruction, previousScript } = payload || {};

  return `
你是一位香港本地服務業廣告影片策略師，專長是美容、頭皮護理、養生、眼部護理等品牌短片廣告。

請根據以下資料，生成一份可以直接交給 Designer / Marketer 使用的廣告影片稿。

【品牌資料】
品牌代號：${brandConfig?.code || ""}
品牌名稱：${brandConfig?.name || ""}
品牌語氣：${brandConfig?.tone || ""}
品牌 CTA：${brandConfig?.cta || ""}
分店：${brandConfig?.branches || ""}
Footer：${brandConfig?.footer || ""}
不可講字眼：${brandConfig?.defaultAvoid || ""}
品牌稿件規則：${brandConfig?.scriptRule || ""}

【品牌自訂 AI 出稿要求】
${brandConfig?.promptRules || ""}

【品牌 Social / Website 參考】
Website：${brandConfig?.websiteUrl || ""}
Instagram：${brandConfig?.instagramUrl || ""}
Facebook：${brandConfig?.facebookUrl || ""}

【品牌語氣摘要】
${brandConfig?.brandStyleSummary || ""}

【品牌常用字眼】
${brandConfig?.commonWords || ""}

【Footer 例子】
${brandConfig?.footerExamples || ""}

【常見 CTA】
${brandConfig?.commonCtaPatterns || ""}

【Caption 結構】
${brandConfig?.captionRules || ""}

【品牌禁用字】
以下字眼不可使用於 storyboard、vo、subtitle、caption、designerBrief：
${brandConfig?.bannedWords || ""}

【安全替代表達】
如遇到高風險字眼，請改用以下較安全講法：
${brandConfig?.safePhrases || ""}

【片頭 Hook 規則】
${brandConfig?.hookRule || ""}

【Campaign 資料】
項目名稱：${form?.projectName || ""}
平台：${form?.platform || ""}
片長：${form?.length || ""}
影片角度：${form?.angle || ""}
生成模式：${form?.generationMode || ""}
療程 / 產品：${form?.treatment || ""}
療程分類：${form?.treatmentCategory || ""}
療程資料庫簡介：${form?.treatmentSummary || ""}
療程建議畫面：${form?.treatmentSuggestedVisuals || ""}
療程素材方向：${form?.treatmentMaterialDirection || ""}
療程安全講法：${form?.treatmentSafePhrases || ""}
Landing Page URL：${form?.treatmentLandingPageUrl || ""}
Landing Page Notes：${form?.treatmentLandingPageNotes || ""}
目標客群：${form?.targetAudience || ""}
主要痛點：${form?.painPoints || ""}
核心賣點：${form?.sellingPoints || ""}
優惠 / 價錢：${form?.offer || ""}
CTA：${form?.cta || ""}
Reference path：${form?.referencePath || ""}
一定要出現：${form?.mustInclude || ""}
不可講：${form?.avoidWords || ""}
備註：${form?.notes || ""}

【MP4 分析資料】
狀態：${videoAnalysis?.status || "未分析"}
摘要：${videoAnalysis?.summary || ""}
Transcript：${videoAnalysis?.transcript || ""}
Hook Moment：${videoAnalysis?.hookMoment || ""}
節奏建議：${videoAnalysis?.pacing || ""}
畫面風格：${videoAnalysis?.visualStyle || ""}
Key Frames：${JSON.stringify(videoAnalysis?.keyFrames || [], null, 2)}

${isRevision ? `
【改稿模式】
你現在不是由零開始重新創作，而是要根據「現有分鏡稿」和「使用者改稿指令」去優化。
請盡量保留原本分鏡結構，只修改需要調整的部分。
如果使用者只指定某一段，例如 0–3秒、CTA、VO、Designer Notes，請集中修改該部分，不要無故重寫全部方向。
必須繼續遵守品牌禁用字、安全替代表達、Hook 規則、CTA 及 Footer 規則。
如果現有分鏡稿內容與目前品牌、療程、痛點或 Campaign 資料不一致，必須以目前 form 及 brandConfig 為準，移除舊稿中不相關內容。
例如目前療程不是頭皮護理，就不得保留頭皮、毛囊、頭油、頭痕等舊稿內容；目前品牌不是 Angel Beauty，就不得保留 Angel Beauty 專屬賣點。

【使用者改稿指令】
${revisionInstruction || ""}

【現有分鏡稿】
${JSON.stringify(previousScript || {}, null, 2)}
` : ""}

請只輸出 JSON，不要 markdown，不要解釋。

格式：
{
  "strategySummary": {
    "brand": "",
    "treatment": "",
    "targetAudience": "",
    "mainPainPoint": "",
    "creativeAngle": "",
    "recommendedPlatform": "",
    "recommendedLength": "",
    "conversionDirection": ""
  },
  "scores": {
    "hookScore": 0,
    "clarityScore": 0,
    "ctaScore": 0,
    "conversionPotentialScore": 0
  },
  "storyboard": [
    {
      "time": "0–3秒",
      "materialType": "真人 Footage / AI Gen 圖 / AI Gen 片 / 現有素材 / B-roll / 文字動畫 / Screen Recording",
      "referenceMapping": "說明此段如何對應 reference video 的畫面節奏、構圖、字幕或轉場。例如：參考 6s 工具 close-up → 今次改成療程儀器 close-up。",
      "suggestedFileName": "REAL_BRAND_素材描述_01.mp4 或 AI_GEN_素材描述_01",
      "visual": "",
      "subtitleVo": "",
      "subtitle": "",
      "vo": "",
      "purpose": "",
      "designerNote": ""
    }
  ],
  "designerBrief": "",
  "caption": "",
  "improvementIdeas": [],
  "riskNotes": []
}

要求：
1. 請嚴格跟隨品牌自訂 AI 出稿要求。
2. 禁用字不可出現在 storyboard、vo、subtitle、caption、designerBrief。
3. 如內容涉及高風險表達，請改用品牌提供的安全替代表達。
4. 如果品牌設定與通用規則衝突，以較保守、較安全的講法為準。
5. 請參考品牌語氣摘要、常用字眼、Footer 例子及 Caption 結構，模仿語氣與格式，但不要逐字抄襲。
6. 內容要偏向轉化，不要只做品牌介紹。
7. 分鏡稿要 Designer 可直接開工，不能只寫抽象方向。
8. storyboard 必須輸出 5 段：0–3秒、4–8秒、9–18秒、19–25秒、26–30秒。
9. 每段 storyboard 必須填寫 materialType，明確標示「真人 Footage / AI Gen 圖 / AI Gen 片 / 現有素材 / B-roll / 文字動畫 / Screen Recording」其中一類或混合類型。
10. 每段 storyboard 必須填寫 referenceMapping，說明該段如何由 reference video 轉化而來；如果沒有可對應位置，請寫「根據今次 brief 補充」。
11. 每段 storyboard 必須填寫 suggestedFileName，方便 Designer / Editor 對素材；真人素材用 REAL_ 開頭，AI素材用 AI_GEN_ 開頭，文字動畫用 TEXT_ANIM_ 開頭。
12. subtitleVo 為主要對白 / 字幕欄位。除非字幕與 VO 明顯不同，否則 subtitle、vo 可與 subtitleVo 保持一致。
13. 禁用字不可出現在 subtitleVo、subtitle、vo、caption、designerBrief。
14. scores 用 0–100 分。
`;
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch (error) {
    return {
      strategySummary: {
        brand: "",
        treatment: "",
        targetAudience: "",
        mainPainPoint: "",
        creativeAngle: "",
        recommendedPlatform: "",
        recommendedLength: "",
        conversionDirection: "",
      },
      scores: {
        hookScore: 0,
        clarityScore: 0,
        ctaScore: 0,
        conversionPotentialScore: 0,
      },
      storyboard: [],
      designerBrief: text || "",
      caption: "",
      improvementIdeas: ["AI 回傳內容未能成功解析成 JSON，請檢查 prompt 或模型回覆。"],
      riskNotes: [error?.message || "JSON parse failed"],
    };
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "generate-script route exists. Use POST to generate script.",
  });
}

export async function POST(request) {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing OPENROUTER_API_KEY (or OPENAI_API_KEY) in .env.local",
        },
        { status: 500 }
      );
    }

    const payload = await request.json();

    const client = new OpenAI({
      apiKey,
      baseURL: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
    });

    const completion = await client.chat.completions.create({
      model: process.env.OPENROUTER_MODEL || process.env.OPENAI_MODEL || "openai/gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "你是一個嚴謹的廣告影片稿生成器。你必須只輸出 valid JSON，不要輸出 markdown，不要輸出解釋文字。",
        },
        {
          role: "user",
          content: buildPrompt(payload),
        },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices?.[0]?.message?.content || "{}";
    const data = safeJsonParse(raw);

    return NextResponse.json({
      ok: true,
      source: "openrouter",
      data,
    });
  } catch (error) {
    console.error("generate-script error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Failed to generate script",
        message: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
