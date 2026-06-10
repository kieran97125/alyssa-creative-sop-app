import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMPTY_ANALYSIS = {
  title: "",
  competitorBrand: "",
  offer: "",
  angle: "",
  hookNotes: "",
  visualNotes: "",
  captionNotes: "",
  productionNotes: "",
  tags: "",
};

function extractJson(text) {
  const cleaned = String(text || "")
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return cleaned.slice(firstBrace, lastBrace + 1);
  }

  return cleaned || "{}";
}

function safeJsonParse(text) {
  try {
    const parsed = JSON.parse(extractJson(text));

    return {
      title: String(parsed?.title || ""),
      competitorBrand: String(parsed?.competitorBrand || ""),
      offer: String(parsed?.offer || ""),
      angle: String(parsed?.angle || ""),
      hookNotes: String(parsed?.hookNotes || ""),
      visualNotes: String(parsed?.visualNotes || ""),
      captionNotes: String(parsed?.captionNotes || ""),
      productionNotes: String(parsed?.productionNotes || ""),
      tags: String(parsed?.tags || ""),
    };
  } catch {
    return EMPTY_ANALYSIS;
  }
}

function buildPrompt() {
  return `
你是一位香港 Marketing team 的 Facebook / Meta 廣告參考分析助手。

請分析使用者上載的廣告截圖，抽取可以交給 Marketer / Designer 使用的參考資料。

只輸出 valid JSON，不要 markdown，不要解釋，不要額外文字。

JSON 格式必須完全如下：
{
  "title": "",
  "competitorBrand": "",
  "offer": "",
  "angle": "",
  "hookNotes": "",
  "visualNotes": "",
  "captionNotes": "",
  "productionNotes": "",
  "tags": ""
}

欄位指引：
- title：用繁體中文寫一個短標題。
- competitorBrand：如截圖中看到品牌名稱才填寫，否則留空。
- offer：抽取優惠、價格、trial、限時字眼。
- angle：判斷廣告角度，例如痛點型、優惠型、Before After、專業檢測、見證、節日推廣。
- hookNotes：片頭 / 第一眼吸引位。
- visualNotes：畫面、構圖、素材、人物、產品、字卡、顏色等。
- captionNotes：caption / post copy / CTA 觀察。
- productionNotes：給 Designer / Editor 的製作參考。
- tags：用逗號分隔 3-8 個短 tag。

如果截圖內容不清楚，請保守描述，不要憑空編造。
`;
}

export async function POST(request) {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    const baseURL = process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";
    const model = process.env.OPENROUTER_VISION_MODEL;

    if (!apiKey || !model) {
      return NextResponse.json(
        {
          error: "Missing OPENROUTER_API_KEY or OPENROUTER_VISION_MODEL",
        },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("image");

    if (!file || typeof file.arrayBuffer !== "function") {
      return NextResponse.json({ error: "Missing image file" }, { status: 400 });
    }

    const mimeType = file.type || "image/jpeg";
    const buffer = Buffer.from(await file.arrayBuffer());
    const dataUrl = `data:${mimeType};base64,${buffer.toString("base64")}`;

    const client = new OpenAI({
      apiKey,
      baseURL,
    });

    const completion = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: "你只輸出 valid JSON，不輸出 markdown 或解釋。",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: buildPrompt(),
            },
            {
              type: "image_url",
              image_url: {
                url: dataUrl,
              },
            },
          ],
        },
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices?.[0]?.message?.content || "{}";

    return NextResponse.json(safeJsonParse(raw));
  } catch (error) {
    console.error("analyze-reference-screenshot error:", error);

    return NextResponse.json(
      {
        error: error?.message || "Failed to analyze reference screenshot",
      },
      { status: 500 }
    );
  }
}
