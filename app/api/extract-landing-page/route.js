import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

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

  return cleaned;
}

function safeJsonParse(text, fallback = {}) {
  try {
    return JSON.parse(extractJson(text));
  } catch {
    return fallback;
  }
}

function cleanHtmlText(html) {
  const text = String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();

  return text.slice(0, 18000);
}

function extractMeta(html) {
  const source = String(html || "");
  const title = source.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() || "";
  const description =
    source.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)?.[1]?.trim() ||
    source.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)?.[1]?.trim() ||
    "";

  return { title, description };
}

function normalizeUrl(value) {
  const url = new URL(String(value || "").trim());

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("只支援 http / https landing page URL");
  }

  return url.toString();
}

function buildPrompt({ url, title, description, pageText, brandConfig, currentTreatment }) {
  return `
你是一位香港美容 / 服務業 Landing Page 內容整理助手。

請根據以下 landing page 內容，整理成「療程資料庫」可用資料。
不要幻想頁面沒有提及的療效，不要使用醫療承諾或保證式字眼。
如頁面資訊不足，請根據頁面文字保守整理。

品牌：
${brandConfig?.code || ""}｜${brandConfig?.name || ""}

品牌禁用字：
${brandConfig?.bannedWords || brandConfig?.defaultAvoid || ""}

安全替代表達：
${brandConfig?.safePhrases || ""}

目前療程資料：
${JSON.stringify(currentTreatment || {}, null, 2)}

Landing Page URL：
${url}

Title：
${title}

Description：
${description}

頁面文字：
${pageText}

請只輸出 valid JSON，不要 markdown。landingPageNotes 請精簡，只保留頁面重點，不要貼大段網站文字：

{
  "treatment": {
    "name": "",
    "category": "",
    "summary": "",
    "painPoints": "",
    "sellingPoints": "",
    "targetAudience": "",
    "offer": "",
    "cta": "",
    "suggestedVisuals": "",
    "materialDirection": "",
    "avoidWords": "",
    "safePhrases": "",
    "landingPageNotes": ""
  }
}
`;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const url = normalizeUrl(body?.url);
    const brandConfig = body?.brandConfig || {};
    const currentTreatment = body?.currentTreatment || {};

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; AI Creative Script Generator; +https://vercel.app)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    clearTimeout(timer);

    if (!response.ok) {
      throw new Error(`讀取 Landing Page 失敗：HTTP ${response.status}`);
    }

    const html = await response.text();
    const { title, description } = extractMeta(html);
    const pageText = cleanHtmlText(html);

    if (!pageText || pageText.length < 120) {
      throw new Error("Landing Page 可讀文字太少，可能係動態頁面或被網站阻擋。請手動貼頁面重點。");
    }

    const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        ok: true,
        source: "landing-page-basic-extract",
        treatment: {
          name: currentTreatment?.name || title || "",
          category: currentTreatment?.category || "",
          summary: description || pageText.slice(0, 220),
          painPoints: currentTreatment?.painPoints || "",
          sellingPoints: currentTreatment?.sellingPoints || "",
          targetAudience: currentTreatment?.targetAudience || "",
          offer: currentTreatment?.offer || "",
          cta: currentTreatment?.cta || brandConfig?.cta || "",
          suggestedVisuals: currentTreatment?.suggestedVisuals || "",
          materialDirection: currentTreatment?.materialDirection || "",
          avoidWords: currentTreatment?.avoidWords || brandConfig?.defaultAvoid || "",
          safePhrases: currentTreatment?.safePhrases || brandConfig?.safePhrases || "",
          landingPageNotes: `Title：${title}\nDescription：${description}\n\n${pageText.slice(0, 500)}`,
        },
      });
    }

    const client = new OpenAI({
      apiKey,
      baseURL: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
    });

    const completion = await client.chat.completions.create({
      model: process.env.OPENROUTER_MODEL || process.env.OPENAI_MODEL || "openai/gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: buildPrompt({
            url,
            title,
            description,
            pageText,
            brandConfig,
            currentTreatment,
          }),
        },
      ],
    });

    const text = completion.choices?.[0]?.message?.content || "{}";
    const parsed = safeJsonParse(text, {});
    const treatment = parsed?.treatment || {};

    return NextResponse.json({
      ok: true,
      source: "ai-landing-page-extract",
      title,
      description,
      treatment: {
        name: treatment.name || currentTreatment?.name || title || "",
        category: treatment.category || currentTreatment?.category || "",
        summary: treatment.summary || description || "",
        painPoints: treatment.painPoints || "",
        sellingPoints: treatment.sellingPoints || "",
        targetAudience: treatment.targetAudience || "",
        offer: treatment.offer || "",
        cta: treatment.cta || brandConfig?.cta || "",
        suggestedVisuals: treatment.suggestedVisuals || "",
        materialDirection: treatment.materialDirection || "",
        avoidWords: treatment.avoidWords || brandConfig?.defaultAvoid || "",
        safePhrases: treatment.safePhrases || brandConfig?.safePhrases || "",
        landingPageNotes:
          treatment.landingPageNotes ||
          `Title：${title}\nDescription：${description}\n\n${pageText.slice(0, 500)}`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error?.message || "Landing Page 讀取失敗",
      },
      { status: 400 }
    );
  }
}