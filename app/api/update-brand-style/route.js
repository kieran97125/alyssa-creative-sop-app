import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

function cleanHtmlToText(html) {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 12000);
}

async function fetchUrlText(url) {
  if (!url) return null;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; BrandStyleAnalyzer/1.0; +https://localhost)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        url,
        ok: false,
        status: response.status,
        text: "",
      };
    }

    const html = await response.text();

    return {
      url,
      ok: true,
      status: response.status,
      text: cleanHtmlToText(html),
    };
  } catch (error) {
    return {
      url,
      ok: false,
      status: 0,
      text: "",
      error: error?.message || "Fetch failed",
    };
  }
}

function buildPrompt({ brandConfig, fetchedSources }) {
  return `
你是一位香港本地美容 / 服務業品牌文案策略師。

請根據以下品牌現有資料、Website / Social link 可讀取內容，整理品牌風格，並回填成可以放入品牌資料庫的設定。

注意：Instagram / Facebook 很可能因登入或反爬蟲而讀不到完整 caption。如果讀不到，不要亂作；請根據既有品牌資料、可讀內容、URL context 及品牌定位整理一份可用設定。

【現有品牌資料】
Brand code：${brandConfig?.code || ""}
品牌名稱：${brandConfig?.name || ""}
原本品牌語氣：${brandConfig?.tone || ""}
原本 Footer：${brandConfig?.footer || ""}
原本 CTA：${brandConfig?.cta || ""}
原本 AI 出稿要求：${brandConfig?.promptRules || ""}
原本禁用字：${brandConfig?.bannedWords || ""}
原本安全講法：${brandConfig?.safePhrases || ""}
原本 Hook 規則：${brandConfig?.hookRule || ""}

【Links】
Website：${brandConfig?.websiteUrl || ""}
Instagram：${brandConfig?.instagramUrl || ""}
Facebook：${brandConfig?.facebookUrl || ""}

【可讀取內容】
${fetchedSources
  .map(
    (source) => `
URL：${source.url}
讀取狀態：${source.ok ? "成功" : `失敗 / ${source.status || ""} ${source.error || ""}`}
內容：
${source.text || "(沒有可用文字內容)"}
`
  )
  .join("\n\n")}

請只輸出 JSON，不要 markdown，不要解釋。

格式：
{
  "tone": "",
  "promptRules": "",
  "brandStyleSummary": "",
  "commonWords": "",
  "footerExamples": "",
  "commonCtaPatterns": "",
  "captionRules": "",
  "notes": []
}

要求：
1. 用香港廣東話廣告實戰角度整理，不要太學術。
2. commonWords 要係品牌常用 / 建議常用文案字眼，用逗號分隔。
3. footerExamples 可以根據原本 footer + 可讀內容整理，不要亂加不存在的電話或地址。
4. commonCtaPatterns 要可以直接用於廣告結尾。
5. captionRules 要簡短清晰，方便之後 AI 生成 caption 跟。
6. 不要覆蓋禁用字 / 安全講法，除非現有資料明顯不足；這次主要整理風格、常用字、footer、CTA。
`;
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return {
      tone: "",
      promptRules: "",
      brandStyleSummary: "",
      commonWords: "",
      footerExamples: "",
      commonCtaPatterns: "",
      captionRules: "",
      notes: ["AI response JSON parse failed"],
    };
  }
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
    const brandConfig = payload?.brandConfig || {};

    const urls = [
      brandConfig.websiteUrl,
      brandConfig.instagramUrl,
      brandConfig.facebookUrl,
    ].filter(Boolean);

    const fetchedSources = await Promise.all(urls.map(fetchUrlText));

    if (urls.length === 0) {
      fetchedSources.push({
        url: "no-url-provided",
        ok: false,
        status: 0,
        text: "",
        error: "No Website / Instagram / Facebook URL provided",
      });
    }

    const client = new OpenAI({ apiKey, baseURL: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1" });

    const completion = await client.chat.completions.create({
      model: process.env.OPENROUTER_MODEL || process.env.OPENAI_MODEL || "openai/gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "你是一個品牌文案風格分析器，只輸出 valid JSON，不要 markdown。",
        },
        {
          role: "user",
          content: buildPrompt({ brandConfig, fetchedSources }),
        },
      ],
      temperature: 0.35,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices?.[0]?.message?.content || "{}";
    const data = safeJsonParse(raw);

    return NextResponse.json({
      ok: true,
      source: "brand-style-update",
      fetchedSources: fetchedSources.map((source) => ({
        url: source.url,
        ok: source.ok,
        status: source.status,
        textLength: source.text?.length || 0,
        error: source.error || "",
      })),
      data,
    });
  } catch (error) {
    console.error("update-brand-style error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Failed to update brand style",
        message: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
