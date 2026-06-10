"use client";

import React, { useEffect, useMemo, useState } from "react";
import { upload } from "@vercel/blob/client";

const initialBrandRecords = [
  {
    code: "HH",
    name: "HairHealth 髮生社",
    tone: "專業、清爽、可信、頭皮健康導向",
    footer:
      "🌿 HairHealth 髮生社｜養髮．育髮．活髮\n📍 荃灣｜旺角｜觀塘｜銅鑼灣｜元朗\n📲 5秒WhatsApp預約：9728 7380",
    defaultAvoid: "避免使用：根治、保證生髮、醫療承諾、誇大療效",
    cta: "WhatsApp 預約頭皮檢測",
    branches: "荃灣、旺角、觀塘、銅鑼灣、元朗",
    whatsapp: "9728 7380",
    scriptRule: "片頭要先放頭皮問題 close-up，再帶入檢測及清潔流程。",
    promptRules:
      "必須用香港廣東話廣告口吻，避免台式/大陸式書面語。字幕要短、直接、似 IG Reels / Facebook 廣告。",
    bannedWords: "徹底、告別、精準、保證、根治、治療、生髮、永久改善",
    safePhrases:
      "了解頭皮狀態、幫助清潔毛囊污垢、改善頭皮清爽感、減少頭皮負擔、針對頭皮狀態護理",
    hookRule: "0–3秒必須用直接痛點疑問句，例如：洗完頭都好快油？頭痕頭皮屑反覆？",
    websiteUrl: "https://www.hairhealthhk.com/",
    instagramUrl: "",
    facebookUrl: "",
    brandStyleSummary: "頭皮護理專業感、清爽、可信，偏香港廣東話轉化文案。",
    commonWords: "AI頭皮檢測、頭皮清爽感、幫助清潔毛囊污垢、減少頭皮負擔、WhatsApp預約",
    footerExamples:
      "🌿 HairHealth 髮生社｜養髮．育髮．活髮\n📍 荃灣｜旺角｜觀塘｜銅鑼灣｜元朗\n📲 5秒WhatsApp預約：9728 7380",
    commonCtaPatterns: "WhatsApp預約｜了解邊款護理適合你｜5秒WhatsApp預約",
    captionRules: "痛點開場 → 檢測/療程價值 → 優惠 → WhatsApp CTA → Footer",
  },
  {
    code: "AB",
    name: "Angel Beauty",
    tone: "女性化、精緻、修身輪廓、痛點直接",
    footer: "Angel Beauty｜專業美容護理｜Inbox / WhatsApp 預約",
    defaultAvoid: "避免使用：醫療承諾、永久改善、誇大效果",
    cta: "Inbox 查詢及預約",
    branches: "按實際分店填寫",
    whatsapp: "",
    scriptRule: "要聚焦身形、線條、肩頸背痛點，不要過度醫療化。",
    promptRules:
      "必須用香港廣東話廣告口吻，語氣可以直接但不要製造身材焦慮。字幕要短、清楚、偏向查詢轉化。",
    bannedWords: "治療、醫治、永久改善、保證瘦身、即時瘦、徹底改善、醫療功效",
    safePhrases: "改善線條觀感、提升放鬆感、針對肩頸背繃緊狀態護理、令身體感覺更輕鬆",
    hookRule: "0–3秒用身體痛點或線條痛點開場，例如：肩頸背長期繃緊？背厚線條唔順？",
    websiteUrl: "",
    instagramUrl: "",
    facebookUrl: "",
    brandStyleSummary: "女性美容、線條感、肩頸背痛點直接，但避免製造身材焦慮。",
    commonWords: "線條觀感、肩頸背繃緊、放鬆感、修身輪廓、Inbox查詢",
    footerExamples: "Angel Beauty｜專業美容護理｜Inbox / WhatsApp 預約",
    commonCtaPatterns: "Inbox查詢｜預約體驗｜了解優惠",
    captionRules: "痛點/狀態開場 → 療程賣點 → 優惠 → Inbox CTA",
  },
  {
    code: "AE",
    name: "Aeye Beauty",
    tone: "眼部護理、年輕化、精緻感、輕奢",
    footer: "Aeye Beauty｜眼部護理專門店｜Inbox 預約",
    defaultAvoid: "避免使用：醫療承諾、保證效果、過度貶低外貌",
    cta: "Inbox 查詢眼部護理優惠",
    branches: "按實際分店填寫",
    whatsapp: "",
    scriptRule: "要講精緻感、眼部狀態、放鬆感；避免令人覺得焦慮或貶低外貌。",
    promptRules:
      "必須用香港廣東話廣告口吻，語氣精緻、輕奢、溫和，不要貶低外貌或製造焦慮。",
    bannedWords: "醜、老、殘、永久改善、保證效果、醫療承諾、治療、根治",
    safePhrases: "改善眼周觀感、提升精神感、針對眼周狀態護理、放鬆眼周疲勞感、令眼神感覺更精神",
    hookRule: "0–3秒用溫和狀態句開場，例如：眼周望落好攰？想眼神更精神？",
    websiteUrl: "",
    instagramUrl: "",
    facebookUrl: "",
    brandStyleSummary: "眼部護理、精緻、輕奢、溫和，避免外貌貶低。",
    commonWords: "眼周觀感、精神感、眼周狀態、放鬆眼周疲勞感、Inbox預約",
    footerExamples: "Aeye Beauty｜眼部護理專門店｜Inbox 預約",
    commonCtaPatterns: "Inbox查詢｜了解眼部護理優惠｜預約體驗",
    captionRules: "眼周狀態開場 → 精緻護理價值 → 優惠 → Inbox CTA",
  },
  {
    code: "IB",
    name: "Inzpire / IB",
    tone: "養生、經絡、放鬆、身體狀態改善",
    footer: "IB｜養生護理｜WhatsApp 預約",
    defaultAvoid: "避免使用：治療疾病、醫療功效、保證改善",
    cta: "WhatsApp 預約體驗",
    branches: "按實際分店填寫",
    whatsapp: "",
    scriptRule: "要講身體狀態、繃緊、放鬆、護理體驗；不要講治療疾病。",
    promptRules: "必須用香港廣東話廣告口吻，語氣偏養生、放鬆、可信，不要醫療化。",
    bannedWords: "治療、醫治、疾病、痛症根治、保證改善、醫療功效、永久改善",
    safePhrases: "放鬆繃緊感、改善身體舒適感、針對身體狀態護理、提升放鬆體驗、令身體感覺更鬆一鬆",
    hookRule: "0–3秒用身體狀態痛點開場，例如：成日覺得肩頸好繃緊？放工後成個人好攰？",
    websiteUrl: "",
    instagramUrl: "",
    facebookUrl: "",
    brandStyleSummary: "養生、放鬆、身體狀態改善，語氣可信但不要醫療化。",
    commonWords: "放鬆繃緊感、身體舒適感、養生護理、放工後放鬆、WhatsApp預約",
    footerExamples: "IB｜養生護理｜WhatsApp 預約",
    commonCtaPatterns: "WhatsApp預約｜預約體驗｜了解護理",
    captionRules: "身體狀態痛點 → 護理體驗 → 放鬆感 → WhatsApp CTA",
  },
];

const BRAND_RECORDS_STORAGE_KEY = "aiCreativeScriptGenerator.brandRecords.v1";
const TREATMENT_LIBRARY_STORAGE_KEY = "ai_creative_treatment_library_v1";
const CONTENT_JOBS_STORAGE_KEY = "alyssaCreativeSop.contentJobs.v1";
const REFERENCE_ADS_STORAGE_KEY = "alyssaCreativeSop.referenceAds.v1";

const JOB_STATUS_OPTIONS = [
  "Draft",
  "Ready to Assign",
  "Assigned",
  "In Progress",
  "Need Review",
  "Revision Needed",
  "Completed",
  "Archived",
];

const JOB_PRIORITY_OPTIONS = ["Low", "Normal", "High", "Urgent"];

const DESIGNER_OPTIONS = [
  "Unassigned",
  "Designer A",
  "Designer B",
  "Designer C",
  "Freelance Designer",
];

const ALYSSA_CONTENT_TYPE_OPTIONS = [
  "AI Video",
  "Treatment Video",
  "Graphic",
  "Ad Creative",
  "Reels / Short Video",
  "Story",
  "Feed Post",
];

function createDefaultJobDraft() {
  return {
    draftTitle: "",
    contentType: "AI Video",
    priority: "Normal",
    assignedDesigner: "Unassigned",
    deadline: "",
    marketerNotes: "",
  };
}

function loadContentJobsFromStorage() {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(CONTENT_JOBS_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveContentJobsToStorage(jobs) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(CONTENT_JOBS_STORAGE_KEY, JSON.stringify(Array.isArray(jobs) ? jobs : []));
  } catch {
    // localStorage may be unavailable in private mode or restricted browsers.
  }
}

function formatJobDate(value) {
  if (!value) return "No deadline";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-HK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getJobStatusMeta(status) {
  const styles = {
    Draft: "bg-slate-100 text-slate-600",
    "Ready to Assign": "bg-amber-100 text-amber-800",
    Assigned: "bg-sky-100 text-sky-800",
    "In Progress": "bg-indigo-100 text-indigo-800",
    "Need Review": "bg-purple-100 text-purple-800",
    "Revision Needed": "bg-rose-100 text-rose-800",
    Completed: "bg-emerald-100 text-emerald-800",
    Archived: "bg-zinc-200 text-zinc-600",
  };

  return {
    label: JOB_STATUS_OPTIONS.includes(status) ? status : "Draft",
    className: styles[status] || styles.Draft,
  };
}

function createJobTitle({ draftTitle, brandCode, form }) {
  const explicitTitle = String(draftTitle || "").trim();
  if (explicitTitle) return explicitTitle;

  return [brandCode, form?.projectName || form?.treatment || "Creative Job"].filter(Boolean).join(" - ");
}

function createProductionChecklist({ contentType, brandCode }) {
  const base = [
    `Confirm ${brandCode || "brand"} rules and restricted claims`,
    "Review storyboard sequence",
    "Prepare source materials and references",
    "Export designer output",
    "Paste Google Drive output link",
  ];

  if (contentType === "Graphic" || contentType === "Feed Post") {
    return ["Confirm format and dimensions", ...base, "Check copy legibility on mobile"];
  }

  if (contentType === "AI Video" || contentType === "Treatment Video" || contentType === "Reels / Short Video") {
    return ["Confirm video length and hook", ...base, "Check caption and VO timing"];
  }

  return base;
}

function getJobPreviewRows(job) {
  return Array.isArray(job?.storyboardRows) ? job.storyboardRows.slice(0, 5) : [];
}

function createDefaultReferenceDraft() {
  return {
    title: "",
    platform: "Facebook",
    sourceUrl: "",
    competitorBrand: "",
    targetBrand: "",
    offer: "",
    angle: "",
    hookNotes: "",
    visualNotes: "",
    captionNotes: "",
    productionNotes: "",
    tags: "",
  };
}

function loadReferenceAdsFromStorage() {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(REFERENCE_ADS_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveReferenceAdsToStorage(references) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(REFERENCE_ADS_STORAGE_KEY, JSON.stringify(Array.isArray(references) ? references : []));
  } catch {
    // localStorage may be unavailable in private mode or restricted browsers.
  }
}

function createReferenceTitle(draft) {
  const explicitTitle = String(draft?.title || "").trim();
  if (explicitTitle) return explicitTitle;

  return [draft?.competitorBrand, draft?.angle, draft?.offer].filter(Boolean).join(" - ") || "Untitled Reference";
}

function formatReferenceBrief(reference) {
  if (!reference) return "";

  return [
    `Title: ${reference.title || "Untitled Reference"}`,
    `Platform: ${reference.platform || "Facebook"}`,
    `Source URL: ${reference.sourceUrl || "None"}`,
    `Competitor brand: ${reference.competitorBrand || "None"}`,
    `Target brand: ${reference.targetBrand || "None"}`,
    `Offer: ${reference.offer || "None"}`,
    `Angle: ${reference.angle || "None"}`,
    `Hook notes: ${reference.hookNotes || "None"}`,
    `Visual notes: ${reference.visualNotes || "None"}`,
    `Caption notes: ${reference.captionNotes || "None"}`,
    `Production notes: ${reference.productionNotes || "None"}`,
    `Tags: ${reference.tags || "None"}`,
  ].join("\n");
}

function getMetaAdLibraryCountryCode(country) {
  const normalized = String(country || "").trim().toLowerCase();
  const countryMap = {
    "hong kong": "HK",
    hk: "HK",
    singapore: "SG",
    sg: "SG",
    taiwan: "TW",
    tw: "TW",
    "united states": "US",
    us: "US",
    usa: "US",
    malaysia: "MY",
    my: "MY",
  };

  return countryMap[normalized] || "HK";
}

function normalizeDiscoveryQuery(query) {
  const text = String(query || "").replace(/\s+/g, " ").trim();
  if (!text) return "";

  const words = text.split(" ").filter(Boolean);
  if (words.length > 4) return words.slice(0, 4).join(" ");

  return text;
}

function uniqueDiscoveryQueries(queries) {
  const seen = new Set();
  const cleanQueries = [];

  queries.forEach((query) => {
    const cleanQuery = normalizeDiscoveryQuery(query);
    const key = cleanQuery.toLowerCase();
    if (!cleanQuery || seen.has(key)) return;

    seen.add(key);
    cleanQueries.push(cleanQuery);
  });

  return cleanQueries;
}

function buildServiceQueryVariants(keyword) {
  const cleanKeyword = String(keyword || "").trim();
  const lowerKeyword = cleanKeyword.toLowerCase();

  if (cleanKeyword.includes("頭皮")) {
    return [
      cleanKeyword,
      "頭皮檢測",
      "頭皮清潔",
      "頭皮油",
      "頭痕頭皮屑",
      `${cleanKeyword} 優惠`,
      "頭皮檢測 優惠",
      "scalp care",
      "scalp treatment",
      "head spa hong kong",
      "scalp treatment hong kong",
    ];
  }

  if (lowerKeyword.includes("scalp")) {
    return [
      cleanKeyword,
      "scalp care",
      "scalp check",
      "oily scalp",
      "itchy scalp",
      "dandruff scalp",
      "hair spa",
      "head spa",
      `${cleanKeyword} hong kong`,
      "hair spa hong kong",
      "scalp care offer",
    ];
  }

  if (!cleanKeyword) {
    return ["beauty treatment", "facial treatment", "hair treatment", "body treatment", "beauty offer"];
  }

  return [
    cleanKeyword,
    `${cleanKeyword} 優惠`,
    `${cleanKeyword} hong kong`,
    `${cleanKeyword} offer`,
    `${cleanKeyword} review`,
  ];
}

function buildDiscoveryQueries(input = {}) {
  const keyword = String(input.discoveryKeyword || "").trim();
  const competitor = String(input.discoveryCompetitor || "").trim();
  const serviceQueries = uniqueDiscoveryQueries(buildServiceQueryVariants(keyword));

  const primaryQueries = serviceQueries.slice(0, 5);

  const angleQueries = serviceQueries.slice(5);

  const competitorQueries = competitor
    ? [
        competitor,
        [competitor, keyword].filter(Boolean).join(" "),
        `${competitor} 優惠`,
      ]
    : [];

  return {
    primaryQueries: uniqueDiscoveryQueries(primaryQueries),
    angleQueries: uniqueDiscoveryQueries(angleQueries),
    competitorQueries: uniqueDiscoveryQueries(competitorQueries),
  };
}

function buildMetaAdLibrarySearchUrl(query, country) {
  const countryCode = getMetaAdLibraryCountryCode(country);
  const params = new URLSearchParams({
    active_status: "all",
    ad_type: "all",
    country: countryCode,
    q: query,
    search_type: "keyword_unordered",
    media_type: "all",
  });

  return `https://www.facebook.com/ads/library/?${params.toString()}`;
}

function buildFacebookSearchUrl(query) {
  return `https://www.facebook.com/search/top/?q=${encodeURIComponent(query)}`;
}

function buildDiscoveryPlan(input = {}) {
  const queries = buildDiscoveryQueries(input);
  const allQueries = [...queries.primaryQueries, ...queries.angleQueries, ...queries.competitorQueries];
  const keyword = String(input.discoveryKeyword || "").trim() || "service";
  const competitor = String(input.discoveryCompetitor || "").trim();
  const country = String(input.discoveryCountry || "").trim() || "Hong Kong";
  const industry = String(input.discoveryIndustry || "").trim() || "Beauty";
  const objective = String(input.discoveryObjective || "").trim() || "Lead generation";
  const offerType = String(input.discoveryOfferType || "").trim() || "Trial offer";
  const suggestedTags = [...new Set([keyword, industry, objective, offerType, competitor].filter(Boolean))];

  return {
    ...queries,
    metaLinks: allQueries.map((query) => ({
      query,
      url: buildMetaAdLibrarySearchUrl(query, country),
    })),
    facebookLinks: allQueries.map((query) => ({
      query,
      url: buildFacebookSearchUrl(query),
    })),
    suggestedTags,
    searchBrief: [
      `搜尋服務：${keyword}`,
      `地區：${country}`,
      `行業：${industry}`,
      `廣告目標：${objective}`,
      `優惠類型：${offerType}`,
      competitor ? `競爭品牌：${competitor}` : "競爭品牌：開放搜尋",
      "搜尋連結會集中用服務、痛點、優惠及本地關鍵字；行業、目標及優惠類型只作內部 planning 參考。",
    ].join("\n"),
  };
}

function loadBrandRecordsFromStorage() {
  if (typeof window === "undefined") return initialBrandRecords;

  try {
    const raw = window.localStorage.getItem(BRAND_RECORDS_STORAGE_KEY);
    if (!raw) return initialBrandRecords;

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : initialBrandRecords;
  } catch {
    return initialBrandRecords;
  }
}

function saveBrandRecordsToStorage(records) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(BRAND_RECORDS_STORAGE_KEY, JSON.stringify(records));
  } catch {
    // localStorage may be unavailable in private mode or restricted browsers.
  }
}

function resetBrandRecordsStorage() {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(BRAND_RECORDS_STORAGE_KEY);
  } catch {
    // ignore
  }
}

const platformOptions = ["Reels", "Story", "Feed", "TikTok", "小紅書", "YouTube Shorts"];
const lengthOptions = ["15秒", "30秒", "45秒", "60秒"];
const angleOptions = ["痛點型", "個案型", "療程過程型", "優惠轉化型", "教育型", "Before / After 型"];
const generationModeOptions = ["CTWA 強轉化版", "CONV 專業信任版", "自然教育版", "優惠導向版", "Designer 快剪版"];

const iconMap = {
  app: "✦",
  upload: "⬆",
  magic: "✨",
  doc: "▤",
  copy: "⧉",
  video: "▶",
  settings: "⚙",
  alert: "!",
  check: "✓",
  play: "▷",
  message: "✉",
  layers: "▦",
  target: "◎",
  megaphone: "◉",
  plus: "+",
  close: "×",
  db: "▣",
  frame: "▥",
  cloud: "☁",
};

const emptyVideoAnalysis = {
  source: "manual",
  status: "未分析",
  summary: "未進行 AI影片分析。可以先填表生成稿，或先上傳到 storage 取得 videoUrl 後按「AI分析影片」。",
  transcript: "",
  keyFrames: [],
  hookMoment: "未分析",
  visualStyle: "未分析",
  pacing: "未分析",
  improvementIdeas: [],
  creativeAngles: [],
  riskNotes: [],
  metadata: null,
  backendFallback: false,
};

function Card({ children, className = "" }) {
  return <div className={`rounded-3xl border border-slate-200 bg-white shadow-sm ${className}`}>{children}</div>;
}

function Button({ children, onClick, variant = "primary", className = "", type = "button", disabled = false }) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50";
  const styles =
    variant === "outline"
      ? "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
      : variant === "ghost"
      ? "bg-transparent text-slate-700 hover:bg-slate-100"
      : variant === "danger"
      ? "bg-red-600 text-white hover:bg-red-700"
      : "bg-slate-950 text-white hover:bg-slate-800";

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${styles} ${className}`}>
      {children}
    </button>
  );
}

function Icon({ name, className = "" }) {
  return (
    <span aria-hidden="true" className={`inline-flex h-5 w-5 items-center justify-center text-base leading-none ${className}`}>
      {iconMap[name] || "•"}
    </span>
  );
}

const HIDDEN_QUICK_MODE_TEXT_INPUT_LABELS = new Set([
  "Reference path / Drive link",
  "額外不可講 / 今次限制",
  "品牌語氣摘要",
  "常用字眼 / Common Words",
  "Footer 樣本 / Footer Examples",
  "常見 CTA / CTA Patterns",
  "Caption 結構 / Caption Rules",
  "不可講 / 風險字眼",
  "AI 出稿要求 / Prompt Rules"
]);

function TextInput({ label, value, onChange, placeholder, textarea = false, rows = 3 }) {
  return (
    <label className="block">
      <div className="mb-2 text-sm font-medium text-slate-700">{label}</div>
      {textarea ? (
        <textarea
          value={value || ""}
          rows={rows}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
        />
      ) : (
        <input
          value={value || ""}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
        />
      )}
    </label>
  );
}

function SelectInput({ label, value, onChange, options }) {
  return (
    <label className="block">
      <div className="mb-2 text-sm font-medium text-slate-700">{label}</div>
      <select
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
      >
        {options.map((option) => {
          const valueOption = typeof option === "string" ? option : option.value;
          const labelOption = typeof option === "string" ? option : option.label;
          return (
            <option key={valueOption} value={valueOption}>
              {labelOption}
            </option>
          );
        })}
      </select>
    </label>
  );
}

function Pill({ children, active = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm transition ${
        active ? "bg-slate-900 text-white shadow-sm" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
      }`}
    >
      {children}
    </button>
  );
}

function StatCard({ icon, title, value, note }) {
  return (
    <Card>
      <div className="p-5">
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
          <Icon name={icon} />
        </div>
        <div className="text-sm text-slate-500">{title}</div>
        <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{value}</div>
        <div className="mt-2 text-xs leading-relaxed text-slate-500">{note}</div>
      </div>
    </Card>
  );
}

function SectionTitle({ icon, title, desc }) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white">
        <Icon name={icon} />
      </div>
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-slate-950">{title}</h2>
        <p className="mt-1 text-sm leading-relaxed text-slate-500">{desc}</p>
      </div>
    </div>
  );
}

function toScore(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}


function cleanRepeatedLines(value) {
  const lines = String(value || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const cleaned = [];
  const seen = new Set();

  for (const line of lines) {
    const key = line.replace(/[\s　。！？!?.,，、：:；;]/g, "").toLowerCase();
    if (!key || seen.has(key)) continue;

    seen.add(key);
    cleaned.push(line);
  }

  return cleaned.join("\n");
}

function cleanStoryboardPurpose(value) {
  let text = String(value || "").trim();

  const noisyPhrases = [
    "改善觀感，提升即時查詢意欲",
    "改善觀感、提升即時查詢意欲",
    "改善觀感，提升查詢意欲",
    "改善觀感、提升查詢意欲",
    "提升即時查詢意欲",
    "提升查詢意欲",
  ];

  for (const phrase of noisyPhrases) {
    text = text.replaceAll(phrase, "");
  }

  text = text
    .replace(/^[、，。\s]+|[、，。\s]+$/g, "")
    .replace(/。。+/g, "。")
    .trim();

  if (!text) return "推動查詢 / 預約";
  return text;
}

function buildCleanSubtitleVo(row) {
  const candidates = [
    row?.subtitleVo,
    row?.subtitle,
    row?.vo,
  ]
    .filter(Boolean)
    .join("\n");

  return cleanRepeatedLines(candidates);
}


function getReferenceFrameImageSrc(frame) {
  if (!frame) return "";
  return frame.imageUrl || frame.imageBase64 || frame.thumbnailUrl || "";
}

function pickReferenceFrameForStoryboardRow(row, index, videoAnalysis) {
  const frames = Array.isArray(videoAnalysis?.keyFrames) ? videoAnalysis.keyFrames : [];
  if (!frames.length) return null;

  const wantedTime =
    row?.referenceFrameTime ||
    row?.referenceTime ||
    row?.frameTime ||
    "";

  if (wantedTime) {
    const exact = frames.find((frame) => String(frame.time || "") === String(wantedTime));
    if (exact) return exact;
  }

  const mappingText = String(row?.referenceMapping || row?.reference || row?.referencePattern || "").toLowerCase();

  if (mappingText) {
    const matched = frames.find((frame) => {
      const haystack = [
        frame.time,
        frame.role,
        frame.referencePattern,
        frame.suggestedUse,
        frame.designerNote,
        frame.imageDescription,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack && mappingText && (haystack.includes(mappingText) || mappingText.includes(haystack));
    });

    if (matched) return matched;
  }

  return frames[index % frames.length] || null;
}

function getStoryboardReferenceImageSrc(row) {
  return row?.referenceFrameImageUrl || row?.referenceFrameImageBase64 || row?.referenceImageUrl || "";
}

function adaptAiResponse(data, form, brandConfig, videoAnalysis) {
  const safeData = data || {};
  const scores = safeData.scores || {};
  const fallbackGenerated = buildScript(form, brandConfig, videoAnalysis);
  const storyboard =
    Array.isArray(safeData.storyboard) && safeData.storyboard.length
      ? safeData.storyboard
      : fallbackGenerated.rows || [];

  const rows = storyboard.map((row, index) => {
    const subtitle = row?.subtitle || "";
    const vo = row?.vo || "";
    const subtitleVo =
      row?.subtitleVo ||
      row?.captionVo ||
      row?.scriptLine ||
      [subtitle, vo].filter(Boolean).join("\n");

    return {
      time: row?.time || ["0–3秒", "4–8秒", "9–18秒", "19–25秒", "26–30秒"][index] || "",
      materialType:
        row?.materialType ||
        row?.productionType ||
        row?.assetType ||
        row?.sourceType ||
        "真人 Footage / 現有素材",
      referenceMapping:
        row?.referenceMapping ||
        row?.referencePattern ||
        row?.reference ||
        "",
      suggestedFileName:
        row?.suggestedFileName ||
        row?.fileName ||
        row?.assetName ||
        row?.recommendedAsset ||
        "",
      visual: row?.visual || "",
      subtitle,
      vo,
      subtitleVo,
      purpose: cleanStoryboardPurpose(row?.purpose) || "",
      note: row?.designerNote || row?.note || "",
    };
  });

  return {
    analysis: {
      hookScore: toScore(scores.hookScore, fallbackGenerated?.analysis?.hookScore || 0),
      clarityScore: toScore(scores.clarityScore, fallbackGenerated?.analysis?.clarityScore || 0),
      ctaScore: toScore(scores.ctaScore, fallbackGenerated?.analysis?.ctaScore || 0),
      conversionPotentialScore: toScore(
        scores.conversionPotentialScore,
        fallbackGenerated?.analysis?.conversionPotentialScore || 0
      ),
      mp4Score:
        videoAnalysis?.status && videoAnalysis.status !== "未分析"
          ? 90
          : 0,
    },
    strategy: safeData.strategySummary || {
      brand: brandConfig?.name || "",
      treatment: form?.treatment || "",
      targetAudience: form?.targetAudience || "",
      mainPainPoint: form?.painPoints || "",
      creativeAngle: form?.angle || "",
      recommendedPlatform: form?.platform || "",
      recommendedLength: form?.length || "",
      conversionDirection: form?.generationMode || "",
    },
    rows,
    brief: safeData.designerBrief || fallbackGenerated.brief || "",
    caption: safeData.caption || fallbackGenerated.caption || "",
    improvementIdeas: Array.isArray(safeData.improvementIdeas) ? safeData.improvementIdeas : [],
    riskNotes: Array.isArray(safeData.riskNotes) ? safeData.riskNotes : [],
  };
}


function truncatePromptText(value, limit = 2000) {
  const text = String(value || "").trim();

  if (text.length <= limit) return text;

  return text.slice(0, limit) + "…";
}

function compactPromptArray(items, limit = 8, textLimit = 600) {
  return Array.isArray(items)
    ? items.slice(0, limit).map((item) => truncatePromptText(item, textLimit)).filter(Boolean)
    : [];
}

function compactPromptKeyFrame(frame, index = 0) {
  return {
    index,
    time: truncatePromptText(frame?.time || "", 40),
    role: truncatePromptText(frame?.role || "畫面", 80),
    observation: truncatePromptText(
      frame?.observation ||
        frame?.imageDescription ||
        frame?.description ||
        "",
      500
    ),
    referencePattern: truncatePromptText(frame?.referencePattern || "", 500),
    suggestedUse: truncatePromptText(
      frame?.suggestedUse ||
        frame?.recommendedUse ||
        frame?.purpose ||
        "",
      500
    ),
    designerNote: truncatePromptText(frame?.designerNote || frame?.note || "", 500),
  };
}

function compactVideoAnalysisForPrompt(analysis) {
  const safeAnalysis = analysis || {};
  const keyFrames = Array.isArray(safeAnalysis.keyFrames)
    ? safeAnalysis.keyFrames.slice(0, 8).map(compactPromptKeyFrame)
    : [];

  return {
    status: safeAnalysis.status || "",
    source: safeAnalysis.source || "",
    visionAvailable: Boolean(safeAnalysis.visionAvailable),
    backendFallback: Boolean(safeAnalysis.backendFallback),
    frameCount: safeAnalysis.frameCount || keyFrames.length,
    frameSource: safeAnalysis.frameSource || "",
    summary: truncatePromptText(safeAnalysis.summary, 2000),
    transcript: truncatePromptText(safeAnalysis.transcript, 8000),
    hookMoment: truncatePromptText(safeAnalysis.hookMoment, 1000),
    visualStyle: truncatePromptText(safeAnalysis.visualStyle, 1000),
    pacing: truncatePromptText(safeAnalysis.pacing, 1000),
    referenceStructure: truncatePromptText(safeAnalysis.referenceStructure, 2000),
    creativeAngles: compactPromptArray(safeAnalysis.creativeAngles, 8, 700),
    improvementIdeas: compactPromptArray(safeAnalysis.improvementIdeas, 8, 700),
    riskNotes: compactPromptArray(getCleanRiskNotes(safeAnalysis), 8, 700),
    keyFrames,
  };
}

function compactScriptForPrompt(script) {
  const safeScript = script || {};

  return {
    analysis: safeScript.analysis || {},
    rows: Array.isArray(safeScript.rows)
      ? safeScript.rows.slice(0, 12).map((row) => ({
          time: truncatePromptText(row?.time, 60),
          materialType: truncatePromptText(row?.materialType, 120),
          referenceMapping: truncatePromptText(row?.referenceMapping, 500),
          referenceFrameTime: truncatePromptText(row?.referenceFrameTime, 60),
          suggestedFileName: truncatePromptText(row?.suggestedFileName, 160),
          visual: truncatePromptText(row?.visual, 1000),
          subtitleVo: truncatePromptText(
            row?.subtitleVo || [row?.subtitle, row?.vo].filter(Boolean).join("\n"),
            1000
          ),
          purpose: truncatePromptText(row?.purpose, 500),
          note: truncatePromptText(row?.note, 1000),
        }))
      : [],
    brief: truncatePromptText(safeScript.brief, 2500),
    caption: truncatePromptText(safeScript.caption, 1500),
  };
}


function buildAnalysisSuggestionItems(videoAnalysis) {
  const items = [];

  const addItems = (type, values) => {
    if (!Array.isArray(values)) return;

    values
      .map((value) => String(value || "").trim())
      .filter(Boolean)
      .slice(0, 8)
      .forEach((text, index) => {
        items.push({
          id: type + "-" + index + "-" + text.slice(0, 18),
          type,
          text,
        });
      });
  };

  addItems("創意角度", videoAnalysis?.creativeAngles);
  addItems("改片建議", videoAnalysis?.improvementIdeas);
  addItems("風險提醒", getCleanRiskNotes(videoAnalysis));

  return items;
}

function buildFormWithSelectedAnalysisSuggestions(form, selectedSuggestions) {
  const cleanSuggestions = Array.isArray(selectedSuggestions)
    ? selectedSuggestions.map((text) => String(text || "").trim()).filter(Boolean)
    : [];

  if (!cleanSuggestions.length) return form;

  const suggestionText = [
    "請優先採用以下 AI 影片分析建議：",
    ...cleanSuggestions.map((text, index) => String(index + 1) + ". " + text),
  ].join("\n");

  return {
    ...form,
    notes: [form?.notes || "", suggestionText].filter(Boolean).join("\n\n"),
  };
}


function getReferenceFrameKey(frame, index = 0) {
  return [
    frame?.time || "time",
    frame?.role || "frame",
    index,
  ]
    .join("-")
    .replace(/\s+/g, "_");
}

function resolveStoryboardReferenceFrame(row, index, rowCountOrVideoAnalysis, maybeVideoAnalysis, maybeSelectedReferenceFrameIds = []) {
  const rowCount = typeof rowCountOrVideoAnalysis === "number" ? rowCountOrVideoAnalysis : 0;
  const videoAnalysis = typeof rowCountOrVideoAnalysis === "number" ? maybeVideoAnalysis : rowCountOrVideoAnalysis;
  const selectedReferenceFrameIds = typeof rowCountOrVideoAnalysis === "number" ? maybeSelectedReferenceFrameIds : maybeVideoAnalysis || [];

  const frames = Array.isArray(videoAnalysis?.keyFrames) ? videoAnalysis.keyFrames : [];
  if (!frames.length) return null;

  const selectedFrames = getOrderedSelectedReferenceFrames(videoAnalysis, selectedReferenceFrameIds);

  if (selectedFrames.length && rowCount > 0) {
    const explicitOrder = Number(row?.referenceFrameOrder);

    if (Number.isFinite(explicitOrder) && explicitOrder > 0) {
      return selectedFrames[explicitOrder - 1]?.frame || null;
    }

    const anchorPositions = getReferenceAnchorPositions(selectedFrames.length, rowCount);
    const selectedIndex = anchorPositions.indexOf(index);

    if (selectedIndex >= 0) {
      return selectedFrames[selectedIndex]?.frame || null;
    }

    return null;
  }

  const wantedTime = row?.referenceFrameTime || row?.referenceTime || row?.frameTime || "";

  if (wantedTime) {
    const matchedByTime = frames.find((frame) => String(frame.time || "") === String(wantedTime));
    if (matchedByTime) return matchedByTime;
  }

  return null;
}

function buildSelectedReferenceFramePromptItems(videoAnalysis, selectedIds = [], usageNotes = {}) {
  const orderedFrames = getOrderedSelectedReferenceFrames(videoAnalysis, selectedIds);

  if (!orderedFrames.length) return [];

  const instructions = [
    "以下 Reference 畫面是使用者指定的分鏡 Shot Anchor，請按 #1、#2、#3 的順序使用。",
    "每張指定 Reference 原則上只用一次，不要機械式重複使用同一張圖。",
    "如果分鏡段數多於指定 Reference 數量，其他段落請根據影片分析、品牌資料及療程內容補充合理畫面。",
    "未指定 Reference 的段落，請標示為 AI 補充畫面，不要硬套舊圖。",
  ].join("\n");

  const frameItems = orderedFrames.map(({ frame, id }, orderIndex) => {
    const note = String(usageNotes[id] || "").trim();

    return [
      "#" + (orderIndex + 1) + " Reference Shot Anchor",
      "時間：" + (frame?.time || "未標示"),
      "角色：" + (frame?.role || "畫面"),
      "AI觀察：" + (frame?.observation || frame?.imageDescription || ""),
      "建議用途：" + (frame?.suggestedUse || frame?.referencePattern || ""),
      note ? "使用者指定用法：" + note : "",
    ]
      .filter(Boolean)
      .join("｜");
  });

  return [instructions, ...frameItems];
}



function getOrderedSelectedReferenceFrames(videoAnalysis, selectedIds = []) {
  const frames = Array.isArray(videoAnalysis?.keyFrames) ? videoAnalysis.keyFrames : [];

  return selectedIds
    .map((id) => {
      const index = frames.findIndex((frame, frameIndex) => getReferenceFrameKey(frame, frameIndex) === id);
      if (index < 0) return null;

      return {
        id,
        index,
        frame: frames[index],
      };
    })
    .filter(Boolean);
}

function getReferenceAnchorPositions(selectedCount, rowCount) {
  if (!selectedCount || !rowCount) return [];

  if (selectedCount === 1) return [0];

  const used = new Set();

  return Array.from({ length: selectedCount }, (_, orderIndex) => {
    let position = Math.round((orderIndex * (rowCount - 1)) / (selectedCount - 1));

    while (used.has(position) && position < rowCount - 1) {
      position += 1;
    }

    while (used.has(position) && position > 0) {
      position -= 1;
    }

    used.add(position);
    return position;
  });
}

function applyReferenceFramePlanToGenerated(generated, videoAnalysis, selectedIds = [], usageNotes = {}) {
  const rows = Array.isArray(generated?.rows) ? generated.rows : [];
  const orderedFrames = getOrderedSelectedReferenceFrames(videoAnalysis, selectedIds);

  if (!rows.length || !orderedFrames.length) return generated;

  const anchorPositions = getReferenceAnchorPositions(orderedFrames.length, rows.length);
  const anchorByRowIndex = new Map();

  orderedFrames.forEach((item, orderIndex) => {
    anchorByRowIndex.set(anchorPositions[orderIndex], {
      ...item,
      order: orderIndex + 1,
      usageNote: String(usageNotes[item.id] || "").trim(),
    });
  });

  return {
    ...generated,
    rows: rows.map((row, rowIndex) => {
      const planned = anchorByRowIndex.get(rowIndex);

      if (!planned) {
        return {
          ...row,
          referenceFrameOrder: null,
          referenceFrameTime: "",
          referenceFrameImageUrl: "",
          referenceFrameImageBase64: "",
          referenceMapping: row.referenceMapping || "AI 補充畫面",
        };
      }

      const frame = planned.frame;
      const src = getReferenceFrameImageSrc(frame);

      return {
        ...row,
        referenceFrameOrder: planned.order,
        referenceFrameTime: frame?.time || "",
        referenceFrameImageUrl: src,
        referenceFrameImageBase64: src,
        referenceMapping:
          planned.usageNote ||
          row.referenceMapping ||
          frame?.suggestedUse ||
          frame?.referencePattern ||
          "使用者指定 Reference",
      };
    }),
  };
}


const CAPTION_REGEN_STYLES = [
  {
    id: "conversion",
    label: "轉化銷售",
    desc: "痛點更直接，CTA 更強，適合落廣告。",
    instruction: "請重寫成高轉化 FB / IG caption：痛點開場，快速帶出療程價值、優惠、CTA，語氣香港廣東話、短句、有行動感。",
  },
  {
    id: "premium",
    label: "高級品牌感",
    desc: "語氣更精緻，少硬銷，適合品牌形象。",
    instruction: "請重寫成高級品牌感 caption：語氣克制、可信、有質感，不要太硬銷，但仍要自然引導查詢。",
  },
  {
    id: "xiaohongshu",
    label: "小紅書感",
    desc: "分享感、體驗感較強。",
    instruction: "請重寫成小紅書分享感 caption：像真實體驗分享，重視痛點代入、療程感受、前後狀態，但避免誇大承諾。",
  },
  {
    id: "short",
    label: "短版強 CTA",
    desc: "短、直接、方便同事快速用。",
    instruction: "請重寫成短版 caption：控制在 6–8 行內，每行短句，重點只保留痛點、療程、優惠、WhatsApp CTA。",
  },
  {
    id: "educational",
    label: "教育型",
    desc: "解釋問題同原理，適合暖 audience。",
    instruction: "請重寫成教育型 caption：先解釋客人痛點或常見誤解，再帶出療程如何幫助改善觀感或舒適感，最後加入 CTA。",
  },
];

function getCaptionStyleInstruction(styleId) {
  return (
    CAPTION_REGEN_STYLES.find((style) => style.id === styleId)?.instruction ||
    CAPTION_REGEN_STYLES[0].instruction
  );
}


function extractCaptionFromAiData(data) {
  if (!data) return "";

  if (typeof data === "string") {
    const trimmed = data.trim();

    try {
      const parsed = JSON.parse(trimmed);
      return extractCaptionFromAiData(parsed);
    } catch {
      return trimmed;
    }
  }

  return (
    data.caption ||
    data.fbCaption ||
    data.instagramCaption ||
    data.socialCaption ||
    data?.output?.caption ||
    data?.result?.caption ||
    ""
  );
}

function buildCaptionFallback(form, brandConfig, generated, styleId) {
  const styleLabel =
    CAPTION_REGEN_STYLES.find((style) => style.id === styleId)?.label ||
    "轉化銷售";

  const rows = Array.isArray(generated?.rows) ? generated.rows : [];
  const keyVisuals = rows
    .slice(0, 4)
    .map((row) => row.subtitleVo || row.visual || "")
    .filter(Boolean)
    .join("\n");

  return [
    form?.painPoints ? `${form.painPoints}` : "",
    form?.treatment ? `想改善狀態，可以了解 ${form.treatment}。` : "",
    form?.sellingPoints ? `重點：${form.sellingPoints}` : "",
    keyVisuals ? `影片重點：\n${keyVisuals}` : "",
    form?.offer ? `優惠：${form.offer}` : "",
    form?.cta || brandConfig?.cta || "WhatsApp 查詢 / 預約",
    brandConfig?.footer || "",
    `\n#${styleLabel}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

function safeClipboardWrite(text) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }
  return Promise.resolve(false);
}

function safeDocxText(value) {
  return String(value ?? "").replace(/\r\n/g, "\n").trim();
}

function isUsefulDocxLine(value) {
  const text = safeDocxText(value);
  return text && !["未分析", "未有", "未有 transcript", "N/A", "null", "undefined"].includes(text);
}

function splitDocxLines(value) {
  const text = safeDocxText(value);
  return text ? text.split("\n").map((line) => line.trim()).filter(isUsefulDocxLine) : [];
}

function normalizeCaptionFooter(caption, footer) {
  const text = safeDocxText(caption);
  const footerText = safeDocxText(footer);

  if (!text || !footerText) return text;

  const parts = text.split(footerText);

  if (parts.length <= 2) {
    return text;
  }

  const mainText = parts.slice(0, -1).join(footerText).trim();
  return `${mainText}\n\n${footerText}`.trim();
}

function makeDocxFileName(form, brandConfig) {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const brand = safeDocxText(brandConfig?.code || "BRAND").replace(/[^a-zA-Z0-9_-]/g, "");
  const project = safeDocxText(form?.projectName || "影片廣告稿")
    .replace(/[\\/:*?"<>|]/g, "_")
    .slice(0, 40);

  return `${brand}_${project}_${date}.docx`;
}

async function exportScriptToDocx({ form, brandConfig, generated, videoAnalysis, sourceLabel, selectedReferenceFrameIds = [], referenceFrameUsageNotes = {} }) {
  const {
    AlignmentType,
    BorderStyle,
    Document,
    HeadingLevel,
    ImageRun,
    Packer,
    Paragraph,
    Table,
    TableCell,
    TableRow,
    TextRun,
    WidthType,
  } = await import("docx");

  const makeHeading = (text, level = HeadingLevel.HEADING_1) =>
    new Paragraph({
      heading: level,
      spacing: { before: 360, after: 160 },
      children: [new TextRun({ text: safeDocxText(text), bold: true })],
    });

  const makeParagraph = (text, options = {}) =>
    new Paragraph({
      spacing: { after: options.after ?? 120 },
      alignment: options.alignment,
      children: [new TextRun({ text: safeDocxText(text), bold: Boolean(options.bold) })],
    });

  const makeBullet = (text) =>
    new Paragraph({
      spacing: { after: 80 },
      children: [new TextRun({ text: `• ${safeDocxText(text).replace(/^[-•]\s*/, "")}` })],
    });

  const makeCell = (text, options = {}) =>
    new TableCell({
      width: options.width ? { size: options.width, type: WidthType.PERCENTAGE } : undefined,
      shading: options.header ? { fill: "F1F5F9" } : undefined,
      margins: { top: 120, bottom: 120, left: 120, right: 120 },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
        left: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
        right: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
      },
      children: [
        new Paragraph({
          children: [new TextRun({ text: safeDocxText(text), bold: Boolean(options.header) })],
        }),
      ],
    });


  const getDocxImageType = (source) => {
    const text = String(source || "").toLowerCase();

    if (text.includes("image/png") || text.endsWith(".png")) return "png";
    if (text.includes("image/gif") || text.endsWith(".gif")) return "gif";
    if (text.includes("image/bmp") || text.endsWith(".bmp")) return "bmp";

    return "jpg";
  };

  const imageSourceToUint8Array = async (source) => {
    const src = String(source || "").trim();

    if (!src) return null;

    try {
      if (src.startsWith("data:image/")) {
        const match = src.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);

        if (!match) return null;

        const mimeType = match[1];
        const base64 = match[2];
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);

        for (let i = 0; i < binary.length; i += 1) {
          bytes[i] = binary.charCodeAt(i);
        }

        return {
          data: bytes,
          type: mimeType.includes("png")
            ? "png"
            : mimeType.includes("gif")
            ? "gif"
            : mimeType.includes("bmp")
            ? "bmp"
            : "jpg",
        };
      }

      const response = await fetch(src);

      if (!response.ok) return null;

      const arrayBuffer = await response.arrayBuffer();

      return {
        data: new Uint8Array(arrayBuffer),
        type: getDocxImageType(src),
      };
    } catch (error) {
      console.warn("Failed to load reference image for docx:", error);
      return null;
    }
  };

  const getDocxStoryboardImageSrc = (row) =>
    row?.referenceFrameImageUrl ||
    row?.referenceFrameImageBase64 ||
    row?.referenceImageUrl ||
    "";

  const getDocxKeyFrameImageSrc = (frame) =>
    frame?.imageUrl ||
    frame?.imageBase64 ||
    frame?.thumbnailUrl ||
    "";

  const makeImageCell = (image, label = "") =>
    new TableCell({
      width: { size: 14, type: WidthType.PERCENTAGE },
      margins: { top: 120, bottom: 120, left: 120, right: 120 },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
        left: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
        right: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
      },
      children: image?.data
        ? [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new ImageRun({
                  type: image.type || "jpg",
                  data: image.data,
                  transformation: {
                    width: 120,
                    height: 68,
                  },
                }),
              ],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: safeDocxText(label),
                  size: 16,
                }),
              ],
            }),
          ]
        : [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: safeDocxText(label || "未指定 reference"),
                  size: 16,
                }),
              ],
            }),
          ],
    });

  const makeStoryboardTable = (rows, referenceImages) =>
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            makeCell("時間", { header: true }),
            makeCell("Reference 畫面", { header: true }),
            makeCell("素材來源", { header: true }),
            makeCell("畫面", { header: true }),
            makeCell("字幕 / VO", { header: true }),
            makeCell("目的", { header: true }),
            makeCell("Designer Notes", { header: true }),
          ],
        }),
        ...rows.map(
          (row, index) =>
            new TableRow({
              children: [
                makeCell(row.time || ""),
                makeImageCell(
                  referenceImages[index],
                  [
                    row.referenceFrameOrder ? "#" + row.referenceFrameOrder : "",
                    row.referenceFrameTime || "",
                    row.referenceMapping || "",
                  ].filter(Boolean).join("｜")
                ),
                makeCell(row.materialType || "真人 Footage / 現有素材"),
                makeCell(row.visual || ""),
                makeCell(row.subtitleVo || [row.subtitle, row.vo].filter(Boolean).join("\n")),
                makeCell(row.purpose || ""),
                makeCell(row.note || ""),
              ],
            })
        ),
      ],
    });

  const makeReferenceFrameAppendix = (frames, frameImages) => {
    if (!Array.isArray(frames) || !frames.length) {
      return [makeParagraph("未有 key frames / vision analysis 暫不可用。")];
    }

    return frames.flatMap((frame, index) => {
      const image = frameImages[index];
      const label = [
        frame.time || "未標示",
        frame.role || "畫面",
      ].filter(Boolean).join("｜");

      const observation =
        frame.observation ||
        frame.imageDescription ||
        frame.suggestedUse ||
        frame.referencePattern ||
        "";

      return [
        makeParagraph(label, { bold: true }),
        image?.data
          ? new Paragraph({
              spacing: { after: 120 },
              children: [
                new ImageRun({
                  type: image.type || "jpg",
                  data: image.data,
                  transformation: {
                    width: 320,
                    height: 180,
                  },
                }),
              ],
            })
          : makeParagraph("未有 reference 圖。"),
        observation ? makeParagraph(observation) : makeParagraph(""),
      ];
    });
  };

  const makeTable = (headers, rows) =>
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: headers.map((header) => makeCell(header, { header: true })),
        }),
        ...rows.map(
          (row) =>
            new TableRow({
              children: row.map((cell) => makeCell(cell)),
            })
        ),
      ],
    });

  const plannedGeneratedForDocx = applyReferenceFramePlanToGenerated(
    generated,
    videoAnalysis,
    selectedReferenceFrameIds,
    referenceFrameUsageNotes
  );

  const storyboardRows = Array.isArray(plannedGeneratedForDocx?.rows) ? plannedGeneratedForDocx.rows : [];

  const keyFrameRows = Array.isArray(videoAnalysis?.keyFrames)
    ? videoAnalysis.keyFrames.map((frame) => [
        frame.time || "",
        frame.role || "",
        frame.observation || frame.imageDescription || "",
        frame.suggestedUse || frame.referencePattern || "",
      ])
    : [];

  const storyboardReferenceImages = await Promise.all(
    storyboardRows.map((row) => imageSourceToUint8Array(getDocxStoryboardImageSrc(row)))
  );

  const keyFrameImages = await Promise.all(
    (Array.isArray(videoAnalysis?.keyFrames) ? videoAnalysis.keyFrames : []).map((frame) =>
      imageSourceToUint8Array(getDocxKeyFrameImageSrc(frame))
    )
  );

  const safeWords = splitDocxLines(brandConfig?.safePhrases || "").join("、");
  const bannedWords = [brandConfig?.bannedWords, form?.avoidWords]
    .filter(Boolean)
    .map(safeDocxText)
    .join("、");

  const children = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [
        new TextRun({
          text: `${brandConfig?.name || "Brand"} 影片廣告稿｜固定格式`,
          bold: true,
          size: 32,
        }),
      ],
    }),

    makeParagraph(`項目：${form?.projectName || ""}`, { bold: true }),
    makeParagraph(`目前來源：${sourceLabel || ""}`),
    makeParagraph(`Reference Path：${form?.referencePath || ""}`),

    makeHeading("一、影片基本設定"),
    makeTable(
      ["項目", "設定", "項目", "設定"],
      [
        ["影片比例", "9:16 直片", "字幕", "有字幕｜大字為主，細字輔助"],
        ["Logo", "有｜建議右上角或結尾 CTA", "Banner", "建議底部固定優惠 bar"],
        ["主推療程", form?.treatment || "", "主打優惠", form?.offer || ""],
        ["主力痛點", form?.painPoints || "", "CTA", form?.cta || brandConfig?.cta || ""],
        ["不可出現", form?.avoidWords || brandConfig?.defaultAvoid || "", "改寫方向", form?.notes || "參考 reference 結構，套入品牌及療程"],
      ]
    ),

    makeHeading("二、Reference 結構理解"),
    ...[
      videoAnalysis?.referenceStructure || "根據 reference 影片節奏，拆解 Hook、痛點、療程展示、利益點及 CTA。",
      videoAnalysis?.hookMoment || brandConfig?.hookRule || "0–3秒先用痛點開場。",
      videoAnalysis?.pacing || "每 2–4 秒轉一次畫面，字幕短而直接。",
      videoAnalysis?.visualStyle || "畫面以 close-up、療程操作、客人反應及 CTA 結尾為主。",
      videoAnalysis?.visionAvailable === false && videoAnalysis?.frameCount
        ? `已抽取 ${videoAnalysis.frameCount} 張 key frames，但 Vision analysis 暫不可用；目前先以表單與品牌規則生成。`
        : "",
    ].filter(isUsefulDocxLine).map((line) => makeBullet(line)),

    makeHeading("三、30秒主版本｜Storyboard v2"),
    makeStoryboardTable(storyboardRows, storyboardReferenceImages),

    makeHeading("八、底部優惠 Bar 建議"),
    makeTable(
      ["版本", "底部 Bar 文字", "使用場景"],
      [
        ["簡短版", `${form?.treatment || "主推療程"}｜${form?.offer || "優惠"}`, "15秒 / 快節奏素材"],
        ["標準版", `${form?.treatment || "主推療程"}｜${form?.offer || "優惠"}`, "30秒主版本"],
        ["轉化版", `${form?.painPoints || "痛點"}？立即預約｜${brandConfig?.whatsapp || brandConfig?.cta || ""}`, "CTA尾段 / retargeting"],
      ]
    ),

    makeHeading("九、Designer Brief｜固定剪接規格"),
    ...[
      `品牌：${brandConfig?.name || ""}`,
      `療程：${form?.treatment || ""}`,
      `影片用途：${form?.platform || ""}｜片長：${form?.length || ""}｜模式：${form?.generationMode || ""}`,
      `Reference：${form?.referencePath || ""}`,
      "剪接節奏：0–3秒痛點直入，中段展示檢測 / 療程過程，尾段用優惠 + WhatsApp CTA 收口。",
      `片頭方向：${brandConfig?.hookRule || "0–3秒先用痛點開場。"}`,
      `必出療程：${form?.treatment || ""}`,
      `必出賣點：${form?.sellingPoints || ""}`,
      `必出優惠：${form?.offer || ""}`,
      `必出 CTA：${form?.cta || brandConfig?.cta || ""}`,
      `分店 / Footer：${brandConfig?.footer || ""}`,
      "畫面優先級：痛點 close-up → AI / 檢測畫面 → 療程操作 → 客人放鬆 / 清爽反應 → 優惠 CTA。",
      "字幕規格：大字、短句、每幕只打一個重點；避免一次過塞太多資料。",
      "安全區：全片 9:16，重要字眼避免貼底，預留 Reels / Story UI。",
      `禁用字：${brandConfig?.bannedWords || ""}`,
      `安全替代表達：${brandConfig?.safePhrases || ""}`,
      `注意事項：${form?.avoidWords || brandConfig?.defaultAvoid || ""}`,
    ].filter(isUsefulDocxLine).map((line) => makeBullet(line)),

    makeHeading("十、建議用字 / 避雷字眼"),
    makeTable(
      ["建議用字", "避開字眼"],
      [
        [safeWords || "了解狀態、改善觀感、提升舒適感", bannedWords || "根治、治療、永久改善、保證效果"],
        [brandConfig?.commonWords || "", brandConfig?.defaultAvoid || ""],
      ]
    ),

    makeHeading("十一、Reference Frames / 建議畫面"),
    ...makeReferenceFrameAppendix(videoAnalysis?.keyFrames || [], keyFrameImages),

    makeHeading("Caption"),
    makeParagraph(normalizeCaptionFooter(generated?.caption || "", brandConfig?.footer || "")),

  ];

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const fileName = makeDocxFileName(form, brandConfig);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

function createSafeBlobPath(file) {
  const originalName = file?.name || "video.mp4";
  const rawExtension = originalName.includes(".")
    ? originalName.split(".").pop().toLowerCase()
    : "mp4";

  const extension = ["mp4", "mov", "webm"].includes(rawExtension)
    ? rawExtension
    : "mp4";

  const safeBaseName = originalName
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 80);

  return `videos/${Date.now()}-${safeBaseName || "video"}.${extension}`;
}

async function uploadVideoToBlob(file) {
  if (!file) {
    throw new Error("Missing video file");
  }

  const allowedTypes = ["video/mp4", "video/quicktime", "video/webm"];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("只支援 MP4 / MOV / WEBM 影片格式。");
  }

  const maxSizeMb = 300;
  const fileSizeMb = file.size / 1024 / 1024;

  if (fileSizeMb > maxSizeMb) {
    throw new Error(`影片太大：${fileSizeMb.toFixed(1)}MB。請先壓縮至 ${maxSizeMb}MB 以下。`);
  }

  const blobPath = createSafeBlobPath(file);

  return upload(blobPath, file, {
    access: "public",
    contentType: file.type || "video/mp4",
    handleUploadUrl: "/api/blob-upload",
    clientPayload: JSON.stringify({
      originalFileName: file.name,
      blobPath,
      fileSize: file.size,
      fileType: file.type,
    }),
  });
}

function calculateFrameTimes(duration, targetCount = 6) {
  if (!Number.isFinite(duration) || duration <= 0) {
    return ["0s"];
  }

  const safeDuration = Math.max(duration - 0.25, 0.1);
  const baseTimes = [0, 3, 6, 10, 15, 22]
    .filter((time) => time <= safeDuration)
    .slice(0, targetCount);

  if (baseTimes.length >= Math.min(targetCount, 3)) {
    return baseTimes.map((time) => `${time.toFixed(time % 1 === 0 ? 0 : 1)}s`);
  }

  const generated = Array.from({ length: Math.min(targetCount, 6) }, (_, index) => {
    if (index === 0) return 0;
    return (safeDuration / Math.min(targetCount - 1, 5)) * index;
  });

  return generated.map((time) => `${Math.min(time, safeDuration).toFixed(1)}s`);
}

function waitForVideoEvent(video, eventName) {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      video.removeEventListener(eventName, onResolve);
      video.removeEventListener("error", onReject);
    };

    const onResolve = () => {
      cleanup();
      resolve();
    };

    const onReject = () => {
      cleanup();
      reject(new Error("影片載入失敗，未能抽取 key frames。"));
    };

    video.addEventListener(eventName, onResolve, { once: true });
    video.addEventListener("error", onReject, { once: true });
  });
}

async function seekVideo(video, secondsLabel) {
  const targetTime = Number(String(secondsLabel).replace("s", "")) || 0;

  return new Promise((resolve, reject) => {
    const cleanup = () => {
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
    };

    const onSeeked = () => {
      cleanup();
      resolve();
    };

    const onError = () => {
      cleanup();
      reject(new Error("影片 seek frame 失敗。"));
    };

    video.addEventListener("seeked", onSeeked, { once: true });
    video.addEventListener("error", onError, { once: true });
    video.currentTime = Math.min(Math.max(targetTime, 0), Math.max(video.duration - 0.25, 0));
  });
}

async function extractFramesFromVideoFile(file, options = {}) {
  if (!file) return [];

  const maxFrames = options.maxFrames || 6;
  const maxWidth = options.maxWidth || 720;
  const quality = options.quality || 0.72;

  const objectUrl = URL.createObjectURL(file);
  const video = document.createElement("video");

  video.src = objectUrl;
  video.muted = true;
  video.playsInline = true;
  video.preload = "metadata";

  try {
    await waitForVideoEvent(video, "loadedmetadata");

    const frameTimes = calculateFrameTimes(video.duration, maxFrames);
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("未能建立 canvas context。");
    }

    const ratio = video.videoWidth > maxWidth ? maxWidth / video.videoWidth : 1;
    canvas.width = Math.max(1, Math.round(video.videoWidth * ratio));
    canvas.height = Math.max(1, Math.round(video.videoHeight * ratio));

    const frames = [];

    for (const time of frameTimes) {
      await seekVideo(video, time);
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      frames.push({
        time,
        imageBase64: canvas.toDataURL("image/jpeg", quality),
      });
    }

    return frames;
  } finally {
    video.pause();
    video.removeAttribute("src");
    video.load();

    window.setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
    }, 1000);
  }
}

function getFrameObservation(frame) {
  return (
    frame?.observation ||
    frame?.imageDescription ||
    frame?.referencePattern ||
    ""
  );
}

function getFrameSuggestedUse(frame) {
  return (
    frame?.suggestedUse ||
    frame?.designerNote ||
    frame?.referencePattern ||
    "可用作分鏡參考"
  );
}

const BRAND_RULE_PRESETS = {
  scriptRule: [
    "片頭先放痛點",
    "先講客人狀態，再帶入解決方案",
    "中段展示療程過程",
    "加入真人情境",
    "結尾加入明確 CTA",
    "避免太多品牌介紹",
  ],
  bannedWords: [
    "治療",
    "醫治",
    "根治",
    "永久改善",
    "保證效果",
    "醫療功效",
    "徹底改善",
    "誇大比較",
  ],
  safePhrases: [
    "了解狀態",
    "針對需要",
    "改善觀感",
    "提升舒適感",
    "減少負擔",
    "協助維持狀態",
    "令整體感覺更自然",
  ],
  hookRule: [
    "痛點直入",
    "Before / After 對比",
    "一句疑問開場",
    "場景代入",
    "優惠直入",
    "先放最有衝擊畫面",
  ],
};

function splitBrandRuleText(value) {
  return String(value || "")
    .split(/[、,，\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinBrandRuleText(items) {
  return Array.from(new Set(items.filter(Boolean))).join("、");
}

function toggleBrandRulePreset(currentValue, preset) {
  const items = splitBrandRuleText(currentValue);
  const exists = items.includes(preset);

  if (exists) {
    return joinBrandRuleText(items.filter((item) => item !== preset));
  }

  return joinBrandRuleText([...items, preset]);
}

function BrandRulePresetField({ label, field, value, onChange, rows = 4 }) {
  const presets = BRAND_RULE_PRESETS[field] || [];
  const selectedItems = splitBrandRuleText(value);

  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">{label}</label>

      <div className="mb-3 flex flex-wrap gap-2">
        {presets.map((preset) => {
          const active = selectedItems.includes(preset);

          return (
            <button
              key={preset}
              type="button"
              onClick={() => onChange(toggleBrandRulePreset(value, preset))}
              className={
                active
                  ? "rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
                  : "rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-slate-400 hover:bg-slate-50"
              }
            >
              {active ? "✓ " : "+ "}
              {preset}
            </button>
          );
        })}
      </div>

      <textarea
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        placeholder="可留空，或按上方選項快速加入。"
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-800 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
      />

    </div>
  );
}

function cleanOptionalBrandText(value) {
  if (value === undefined || value === null) return "";

  const text = String(value).trim();

  if (!text) return "";
  if (text === "0") return "";

  return text;
}

function normalizeBrandRecord(record = {}) {
const code = String(record?.code || "").trim().toUpperCase();
  return {
    code: code || "NEW",
    name: String(record?.name || "新品牌").trim() || "新品牌",
    tone: String(record?.tone || "自然、清晰、可信").trim(),
    footer: String(record?.footer || "").trim(),
    defaultAvoid: cleanOptionalBrandText(record?.defaultAvoid),
    cta: String(record?.cta || "Inbox / WhatsApp 查詢").trim(),
    branches: String(record?.branches || "").trim(),
    whatsapp: String(record?.whatsapp || "").trim(),
    scriptRule: cleanOptionalBrandText(record?.scriptRule),
    promptRules: cleanOptionalBrandText(record?.promptRules),
    bannedWords: cleanOptionalBrandText(record?.bannedWords),
    safePhrases: cleanOptionalBrandText(record?.safePhrases),
    hookRule: cleanOptionalBrandText(record?.hookRule),
    websiteUrl: String(record?.websiteUrl || "").trim(),
    instagramUrl: String(record?.instagramUrl || "").trim(),
    facebookUrl: String(record?.facebookUrl || "").trim(),
    brandStyleSummary: cleanOptionalBrandText(record?.brandStyleSummary),
    commonWords: cleanOptionalBrandText(record?.commonWords),
    footerExamples: String(record?.footerExamples || record?.footer || "").trim(),
    commonCtaPatterns: String(record?.commonCtaPatterns || record?.cta || "").trim(),
    captionRules: cleanOptionalBrandText(record?.captionRules),
  };
}

function brandOptionsFromRecords(records) {
  return records.map(normalizeBrandRecord).map((brand) => ({ value: brand.code, label: `${brand.code} · ${brand.name}` }));
}

function getBrandConfig(records, code) {
  const normalized = records.map(normalizeBrandRecord);
  return normalized.find((brand) => brand.code === code) || normalized[0] || normalizeBrandRecord({ code: "NEW" });
}

function createDemoVideoAnalysis(file, form, brandConfig) {
  const fileSizeMb = file?.size ? (file.size / 1024 / 1024).toFixed(1) : "未知";
  const fileName = file?.name || "未命名影片";
  const pain = form.painPoints?.trim() || "主要痛點";
  const treatment = form.treatment?.trim() || "主打療程";

  return {
    source: "fallback-demo",
    status: "已生成示範分析",
    summary: `已讀取影片檔案「${fileName}」（約 ${fileSizeMb}MB）。目前未連接正式 backend，所以以下為根據檔名、表單資料及品牌設定生成的示範分析。正式上線後會由 /api/analyze-video 回傳 transcript、key frames 及畫面分析。`,
    transcript: `示範 transcript：影片應圍繞「${pain}」開場，帶入「${treatment}」作為解決方案，最後用「${brandConfig.cta}」收口。`,
    keyFrames: [
      { time: "0–2秒", observation: `建議使用最能呈現「${pain}」的 close-up 或客人狀態畫面。`, role: "Hook" },
      { time: "3–8秒", observation: `加入檢測 / 分析畫面，建立 ${brandConfig.name} 的專業感。`, role: "Problem framing" },
      { time: "9–20秒", observation: `展示 ${treatment} 過程，避免只放靜態畫面。`, role: "Solution" },
      { time: "21–30秒", observation: "放 CTA、優惠及 footer，清楚引導查詢。", role: "Conversion" },
    ],
    hookMoment: `0–3 秒要直接問「${pain}？」而不是先出長 logo。`,
    visualStyle: "建議用乾淨 close-up、快節奏字幕、重點位置加箭嘴 / 圈示。",
    pacing: "30 秒版本建議每 2–3 秒轉一次畫面，中段不可過長。",
    improvementIdeas: [
      "片頭用問題句，不要先品牌介紹。",
      "中段要講清楚問題成因與療程價值，避免變成純過程片。",
      "CTA 建議中段細出一次，結尾完整出一次。",
      "如有 before/after，要用觀感及狀態描述，避免保證式字眼。",
    ],
    creativeAngles: [
      "痛點直入版",
      "專業檢測信任版",
      "療程過程快剪版",
    ],
    riskNotes: [
      "避免保證式療效字眼。",
      "Before / After 只建議用觀感、狀態、感覺描述。",
    ],
    metadata: null,
    backendFallback: true,
  };
}

async function requestBackendVideoAnalysis({ videoUrl, form, brandConfig, frames = [] }) {
  const response = await fetch("/api/analyze-video", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ videoUrl, payload: { form, brandConfig }, frames }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || data?.ok === false) {
    throw new Error(
      data?.message ||
        data?.error ||
        `Backend analysis failed: ${response.status}`
    );
  }

  return {
    source: "backend",
    status: "已完成正式 AI影片分析",
    summary: data.summary || "Backend 已完成影片分析。",
    transcript: data.transcript || "",
    keyFrames: Array.isArray(data.keyFrames) ? data.keyFrames : [],
    hookMoment: data.hookMoment || "",
    visualStyle: data.visualStyle || "",
    pacing: data.pacing || "",
    improvementIdeas: Array.isArray(data.improvementIdeas)
      ? data.improvementIdeas
      : [],
    creativeAngles: Array.isArray(data.creativeAngles) ? data.creativeAngles : [],
    riskNotes: Array.isArray(data.riskNotes) ? data.riskNotes : [],
    metadata: data.metadata || null,
    backendFallback: false,
  };
}

function buildScript(form, brandConfig, videoAnalysis = emptyVideoAnalysis) {
  const pain = form.painPoints?.trim() || "目標客人面對的主要問題";
  const treatment = form.treatment?.trim() || "主打療程";
  const offer = form.offer?.trim() || "最新體驗優惠";
  const cta = form.cta?.trim() || brandConfig.cta;
  const selling = form.sellingPoints?.trim() || "檢測、分析、針對性處理、提升體驗感";
  const hookVisual = videoAnalysis.keyFrames?.[0]?.observation || "使用最有衝擊力的痛點畫面 / close-up / 客人狀態";
  const processVisual = videoAnalysis.keyFrames?.[2]?.observation || `展示 ${treatment} 的主要過程、手法、儀器或護理細節`;
  const modeNote =
    form.generationMode === "CONV 專業信任版"
      ? "加強檢測、流程、專業分析及信任感。"
      : form.generationMode === "CTWA 強轉化版"
      ? "片頭痛點要更直接，CTA 要更早出現。"
      : "保持自然流暢，同時保留轉化 CTA。";

  const rows = [
    {
      time: "0–3秒",
      visual: hookVisual,
      subtitle: `${pain}？`,
      vo: `你有冇試過${pain}，但一直唔知真正原因？`,
      purpose: "Hook：立即擊中痛點，令觀眾停低睇",
      note: `字幕要大，第一句要直接。${modeNote} Hook 規則：${brandConfig.hookRule}`,
    },
    {
      time: "4–8秒",
      visual: videoAnalysis.keyFrames?.[1]?.observation || "展示檢測 / 專業分析 / 療程前狀態",
      subtitle: "先睇清問題，再針對處理",
      vo: "好多時問題唔係表面咁簡單，所以建議先了解實際狀態。",
      purpose: "建立問題：由痛點轉入專業分析",
      note: "加簡單圖示或箭嘴標示問題位，令畫面更易明。",
    },
    {
      time: "9–18秒",
      visual: processVisual,
      subtitle: treatment,
      vo: `${brandConfig.name} 的 ${treatment}，重點係${selling}。`,
      purpose: "解決方案：講清楚療程做咩同點解有價值",
      note: `品牌規則：${brandConfig.scriptRule} 禁用字：${brandConfig.bannedWords}`,
    },
    {
      time: "19–25秒",
      visual: videoAnalysis.keyFrames?.[3]?.observation || "療程後感覺 / Before After / 客人反應 / 乾淨舒服畫面",
      subtitle: "改善觀感，提升即時查詢意欲",
      vo: "完成後可以感受到狀態更清爽、舒服，亦更清楚自己下一步應該點護理。",
      purpose: "信任感：令觀眾感覺這不是硬 sell，而是有流程有根據",
      note: `安全替代表達：${brandConfig.safePhrases}`,
    },
    {
      time: "26–30秒",
      visual: "品牌 logo + 優惠 + WhatsApp / Inbox CTA + 分店資訊",
      subtitle: `${offer}｜${cta}`,
      vo: `而家可以${cta}，了解 ${offer}。`,
      purpose: "轉化：清楚叫觀眾下一步做咩",
      note: "CTA 要簡單，唔好一次過放太多資訊。",
    },
  ];

  const caption = `${pain}？\n\n可能唔止係表面問題，而係需要先了解實際狀態，再針對性處理。\n\n${brandConfig.name}｜${treatment}\n重點包括：${selling}\n\n適合：\n✓ ${pain}\n✓ 想了解自己狀態\n✓ 想搵針對性方案\n\n${offer}\n📲 ${cta}\n\n${brandConfig.footer}`;

  const brief = `【Designer Brief】

品牌：${brandConfig.name}
療程：${treatment}
影片用途：${form.platform}
目標片長：${form.length}
影片角度：${form.angle}
生成模式：${form.generationMode}
Reference：${form.referencePath || "未提供"}

片頭建議：
- 0–3 秒直接使用最明顯痛點畫面
- Hook 規則：${brandConfig.hookRule}

必出資訊：
- ${treatment}
- ${selling}
- ${offer}
- ${cta}
- 分店：${brandConfig.branches || "按品牌設定"}

品牌 AI 出稿要求：
${brandConfig.promptRules}

品牌社交 / 網站參考：
Website：${brandConfig.websiteUrl || "未提供"}
Instagram：${brandConfig.instagramUrl || "未提供"}
Facebook：${brandConfig.facebookUrl || "未提供"}

品牌語氣摘要：
${brandConfig.brandStyleSummary || "按品牌語氣及同事 brief 判斷"}

常用字眼：
${brandConfig.commonWords || "按品牌資料判斷"}

Footer 例子：
${brandConfig.footerExamples || brandConfig.footer || "未提供"}

常見 CTA：
${brandConfig.commonCtaPatterns || brandConfig.cta || "未提供"}

Caption 結構：
${brandConfig.captionRules || "痛點開場 → 療程/服務價值 → 優惠 → CTA → Footer"}

品牌禁用字：
${brandConfig.bannedWords}

安全替代表達：
${brandConfig.safePhrases}

注意事項：
- ${form.avoidWords || brandConfig.defaultAvoid}
- 不要使用保證、根治、醫療承諾等字眼
- 如用 Before / After，文案要用「觀感」、「狀態」、「感覺」而非絕對效果`;

  return {
    rows,
    caption,
    brief,
    analysis: {
      hookScore: form.painPoints?.trim() ? (videoAnalysis.status !== "未分析" ? 88 : 82) : 62,
      ctaScore: form.cta?.trim() || form.offer?.trim() ? 78 : 55,
      clarityScore: form.sellingPoints?.trim() ? (videoAnalysis.status !== "未分析" ? 88 : 84) : 60,
      mp4Score: videoAnalysis.status !== "未分析" ? (videoAnalysis.backendFallback ? 65 : 90) : 0,
      recommendation:
        form.angle === "痛點型"
          ? "片頭應直接放痛點畫面，適合 CTWA / Inbox 查詢。"
          : form.angle === "療程過程型"
          ? "中段要加快節奏，避免變成純療程介紹。"
          : "建議保持清晰 Hook，再用優惠或個案感推動查詢。",
    },
  };
}

function adaptAiOutput(aiData, latestVideoAnalysis = emptyVideoAnalysis) {
  if (!aiData) return null;
  const hasVideoAnalysis = latestVideoAnalysis.status !== "未分析";
  const record = aiData?.record || aiData?.brandRecord || {};
  return {
    rows: Array.isArray(aiData.storyboard)
      ? aiData.storyboard.map((row) => ({
          time: row.time || "",
          visual: row.visual || "",
          subtitle: row.subtitle || "",
          vo: row.vo || "",
          purpose: row.purpose || "",
          note: row.designerNote || row.note || "",
        }))
      : [],
    caption: aiData.caption || "",
    brief: aiData.designerBrief || "",
    analysis: {
      hookScore: aiData.scores?.hookScore ?? 0,
      ctaScore: aiData.scores?.ctaScore ?? 0,
      clarityScore: aiData.scores?.clarityScore ?? 0,
      mp4Score: hasVideoAnalysis ? (latestVideoAnalysis.backendFallback ? 65 : 90) : 0,
      recommendation: aiData.strategySummary?.conversionDirection || "AI 已完成生成。",
    },
    treatments: Array.isArray(record?.treatments) ? record.treatments : [],
    activeTreatmentIndex: Number.isFinite(Number(record?.activeTreatmentIndex)) ? Number(record.activeTreatmentIndex) : 0,
  };
}

function makeTreatmentId(name, fallback = "treatment") {
  return String(name || fallback)
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9\-\u4e00-\u9fff]/gi, "")
    .slice(0, 80);
}

function createBlankTreatment(brandCode = "BRAND") {
  return {
    id: `${String(brandCode || "brand").toLowerCase()}-new-treatment-${Date.now()}`,
    name: "新療程",
    category: "",
    summary: "",
    painPoints: "",
    sellingPoints: "",
    targetAudience: "",
    offer: "",
    cta: "",
    suggestedVisuals: "",
    materialDirection: "",
    avoidWords: "",
    safePhrases: "",
    landingPageUrl: "",
    landingPageNotes: "",
  };
}

function normalizeTreatmentRecord(record = {}, index = 0, brandCode = "BRAND") {
  const name = record.name || record.treatment || `療程 ${index + 1}`;

  return {
    id: record.id || makeTreatmentId(name, `${brandCode}-treatment-${index + 1}`),
    name,
    category: record.category || "",
    summary: record.summary || "",
    painPoints: record.painPoints || "",
    sellingPoints: record.sellingPoints || "",
    targetAudience: record.targetAudience || "",
    offer: record.offer || "",
    cta: record.cta || "",
    suggestedVisuals: record.suggestedVisuals || "",
    materialDirection: record.materialDirection || "",
    avoidWords: record.avoidWords || "",
    safePhrases: record.safePhrases || "",
    landingPageUrl: record.landingPageUrl || "",
    landingPageNotes: record.landingPageNotes || "",
  };
}

function getDefaultTreatmentRecords(brandCode) {
  const code = String(brandCode || "").toUpperCase();

  if (code === "HH") {
    return [
      normalizeTreatmentRecord(
        {
          id: "hh-oxygen-scalp-cleanse",
          name: "高氧滲透頭皮淨化",
          category: "頭皮清潔 / 頭皮護理",
          summary:
            "透過 AI 頭皮檢測了解頭皮狀態，再以高氧滲透技術幫助清潔毛囊污垢，減少頭皮負擔，提升清爽感。",
          painPoints: "洗完頭都好快油、頭皮痕、頭皮屑反覆、頭皮焗促",
          sellingPoints: "AI頭皮檢測、高氧滲透、深層清潔毛囊污垢、頭皮清爽感",
          targetAudience: "頭油多、頭皮易痕、頭皮屑反覆、經常覺得頭皮唔清爽人士",
          offer: "$98 中醫頭皮檢測 / 最新 WhatsApp 預約優惠",
          cta: "WhatsApp 預約了解邊款護理適合你",
          suggestedVisuals:
            "頭皮問題 close-up、AI 檢測螢幕、高氧儀器操作、頭皮清潔過程、客人完成後清爽反應",
          materialDirection: "真人 Footage 優先；AI Gen 只作頭皮問題或科技感示意；療程操作盡量用真實 footage。",
          avoidWords: "根治、保證生髮、治療、永久改善",
          safePhrases: "了解頭皮狀態、幫助清潔毛囊污垢、改善頭皮清爽感、減少頭皮負擔",
          landingPageUrl: "https://www.hairhealthhk.com/",
          landingPageNotes: "",
        },
        0,
        "HH"
      ),
    ];
  }

  if (code === "AB") {
    return [
      normalizeTreatmentRecord(
        {
          id: "ab-acne-extraction-facial",
          name: "針清養膚 / 一清再清",
          category: "面部護理 / 針清 / 清潔",
          summary:
            "針對黑頭、粉刺、油脂粒及毛孔粗糙問題，以清潔、針清及養膚流程提升皮膚潔淨感與穩定感。",
          painPoints: "黑頭粉刺反覆、毛孔粗大、油脂粒、暗粒、面部焗促",
          sellingPoints: "專業針清、清潔毛孔污垢、舒緩養膚、提升肌膚乾淨感",
          targetAudience: "黑頭粉刺多、暗粒反覆、想改善肌膚乾淨感人士",
          offer: "$198/60分鐘 針清養膚體驗",
          cta: "立即網站登記預約",
          suggestedVisuals:
            "面部問題 close-up、治療師分析皮膚、針清工具 close-up、清潔過程、客人完成後乾淨透亮感",
          materialDirection: "真人 Footage 優先；AI Gen 只作情境圖或示意，不建議用 AI 生成針清細節。",
          avoidWords: "徹底清除、保證、治療、永久改善、零瑕疵",
          safePhrases: "改善肌膚乾淨感、幫助清潔毛孔污垢、提升肌膚舒適感、針對肌膚狀態護理",
          landingPageUrl: "",
          landingPageNotes: "",
        },
        0,
        "AB"
      ),
    ];
  }

  return [];
}

function readTreatmentLibraryStorage() {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(TREATMENT_LIBRARY_STORAGE_KEY);
    return raw ? JSON.parse(raw) || {} : {};
  } catch (error) {
    console.warn("Failed to read treatment library storage:", error);
    return {};
  }
}

function writeTreatmentLibraryForBrand(brandCode, treatments) {
  if (typeof window === "undefined" || !brandCode) return;

  try {
    const current = readTreatmentLibraryStorage();
    const code = String(brandCode || "").toUpperCase();
    window.localStorage.setItem(
      TREATMENT_LIBRARY_STORAGE_KEY,
      JSON.stringify({
        ...current,
        [code]: Array.isArray(treatments) ? treatments : [],
      })
    );
  } catch (error) {
    console.warn("Failed to write treatment library storage:", error);
  }
}

function getBrandTreatments(brand) {
  const code = String(brand?.code || "").toUpperCase();
  const storedLibrary = readTreatmentLibraryStorage();
  const storedTreatments = Array.isArray(storedLibrary?.[code]) ? storedLibrary[code] : [];
  const existing = Array.isArray(brand?.treatments) ? brand.treatments : [];

  const source = storedTreatments.length
    ? storedTreatments
    : existing.length
      ? existing
      : getDefaultTreatmentRecords(brand?.code);

  return source.map((treatment, index) => normalizeTreatmentRecord(treatment, index, brand?.code));
}

function TreatmentLibraryEditor({ editingBrand, updateEditingBrand, updateEditingBrandFields }) {
  const getInitialTreatments = () => {
    const source = getBrandTreatments(editingBrand);
    return source.length ? source : [createBlankTreatment(editingBrand?.code)];
  };

  const getInitialIndex = (items) => {
    const maxIndex = Math.max(0, items.length - 1);
    return Math.max(0, Math.min(Number(editingBrand?.activeTreatmentIndex || 0), maxIndex));
  };

  const [draftTreatments, setDraftTreatments] = useState(getInitialTreatments);
  const [draftIndex, setDraftIndex] = useState(() => getInitialIndex(getInitialTreatments()));
  const [draftDirty, setDraftDirty] = useState(false);
  const [landingReadStatus, setLandingReadStatus] = useState("idle");
  const [landingReadMessage, setLandingReadMessage] = useState("");

  useEffect(() => {
    const nextTreatments = getInitialTreatments();
    setDraftTreatments(nextTreatments);
    setDraftIndex(getInitialIndex(nextTreatments));
    setDraftDirty(false);
    setLandingReadStatus("idle");
    setLandingReadMessage("");
  }, [editingBrand?.code]);

  const currentTreatment =
    draftTreatments[draftIndex] ||
    draftTreatments[0] ||
    createBlankTreatment(editingBrand?.code);

  const commitTreatments = (nextTreatments, nextIndex = draftIndex) => {
    const normalizedTreatments = nextTreatments.map((item, index) =>
      normalizeTreatmentRecord(item, index, editingBrand?.code)
    );

    writeTreatmentLibraryForBrand(editingBrand?.code, normalizedTreatments);

    if (typeof updateEditingBrandFields === "function") {
      updateEditingBrandFields({
        treatments: normalizedTreatments,
        activeTreatmentIndex: nextIndex,
      });
    } else {
      updateEditingBrand("treatments", normalizedTreatments);
      updateEditingBrand("activeTreatmentIndex", nextIndex);
    }

    return normalizedTreatments;
  };

  const saveAllTreatments = () => {
    const normalizedTreatments = commitTreatments(draftTreatments, draftIndex);
    setDraftTreatments(normalizedTreatments);
    setDraftDirty(false);
  };

  const addTreatment = () => {
    const nextTreatment = createBlankTreatment(editingBrand?.code);

    setDraftTreatments((current) => {
      const next = [...current, nextTreatment];
      setDraftIndex(next.length - 1);
      return next;
    });

    setDraftDirty(true);
  };

  const removeTreatment = () => {
    if (!draftTreatments.length) return;

    setDraftTreatments((current) => {
      const next = current.filter((_, index) => index !== draftIndex);
      const safeNext = next.length ? next : [createBlankTreatment(editingBrand?.code)];
      setDraftIndex(Math.max(0, Math.min(draftIndex - 1, safeNext.length - 1)));
      return safeNext;
    });

    setDraftDirty(true);
  };

  const selectTreatment = (index) => {
    setDraftIndex(index);
    setLandingReadStatus("idle");
    setLandingReadMessage("");
  };

  const updateDraft = (key, value) => {
    setDraftTreatments((current) =>
      current.map((treatment, index) =>
        index === draftIndex ? { ...treatment, [key]: value } : treatment
      )
    );
    setDraftDirty(true);
  };

  const mergeLandingTreatment = (base, extracted) => {
    const shouldReplaceName = !base?.name || base.name === "新療程" || /^療程\s*\d+$/.test(base.name);

    return {
      ...base,
      name: shouldReplaceName ? extracted.name || base.name : base.name,
      category: extracted.category || base.category || "",
      summary: extracted.summary || base.summary || "",
      painPoints: extracted.painPoints || base.painPoints || "",
      sellingPoints: extracted.sellingPoints || base.sellingPoints || "",
      targetAudience: extracted.targetAudience || base.targetAudience || "",
      offer: extracted.offer || base.offer || "",
      cta: extracted.cta || base.cta || "",
      suggestedVisuals: extracted.suggestedVisuals || base.suggestedVisuals || "",
      materialDirection: extracted.materialDirection || base.materialDirection || "",
      avoidWords: extracted.avoidWords || base.avoidWords || "",
      safePhrases: extracted.safePhrases || base.safePhrases || "",
      landingPageNotes: extracted.landingPageNotes || base.landingPageNotes || "",
    };
  };

  const readLandingPage = async () => {
    const url = String(currentTreatment?.landingPageUrl || "").trim();

    if (!url) {
      setLandingReadStatus("error");
      setLandingReadMessage("請先輸入 Landing Page URL。");
      return;
    }

    setLandingReadStatus("loading");
    setLandingReadMessage("讀取中...");

    try {
      const response = await fetch("/api/extract-landing-page", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
          brandConfig: editingBrand,
          currentTreatment,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result?.message || "Landing Page 讀取失敗");
      }

      const extracted = result.treatment || {};
      const nextTreatments = draftTreatments.map((treatment, index) =>
        index === draftIndex ? mergeLandingTreatment(treatment, extracted) : treatment
      );
      const normalizedTreatments = commitTreatments(nextTreatments, draftIndex);

      setDraftTreatments(normalizedTreatments);
      setDraftDirty(false);
      setLandingReadStatus("done");
      setLandingReadMessage("已填寫並儲存。");
    } catch (error) {
      setLandingReadStatus("error");
      setLandingReadMessage(error?.message || "讀取失敗，請手動填寫。");
    }
  };

  const renderField = (label, field, options = {}) => {
    const value = currentTreatment?.[field] || "";
    const baseClass =
      "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-slate-400";

    return (
      <div key={field}>
        <label className="mb-2 block text-sm font-semibold text-slate-700">{label}</label>
        {options.textarea ? (
          <textarea
            value={value}
            onChange={(event) => updateDraft(field, event.target.value)}
            placeholder={options.placeholder || ""}
            className={baseClass + " min-h-24"}
          />
        ) : (
          <input
            value={value}
            onChange={(event) => updateDraft(field, event.target.value)}
            placeholder={options.placeholder || ""}
            className={baseClass}
          />
        )}
      </div>
    );
  };

  return (
    <div className="md:col-span-2 rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">療程資料庫</div>
          <div className="mt-1 text-xs text-slate-500">
            管理各品牌療程資料，輸入頁可直接套用。
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={addTreatment} className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
            + 新增療程
          </button>
          <button type="button" onClick={saveAllTreatments} className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
            儲存療程
          </button>
          <button type="button" onClick={removeTreatment} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600">
            刪除
          </button>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
        <span className={draftDirty ? "rounded-full bg-amber-100 px-3 py-1 font-semibold text-amber-700" : "rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-700"}>
          {draftDirty ? "有未儲存修改" : "已儲存"}
        </span>
        <span className="text-slate-500">
          完成後記得儲存。
        </span>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {draftTreatments.map((treatment, index) => (
          <button
            key={treatment.id || index}
            type="button"
            onClick={() => selectTreatment(index)}
            className={
              index === draftIndex
                ? "rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                : "rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600"
            }
          >
            {treatment.name || "療程 " + (index + 1)}
          </button>
        ))}
      </div>

      <div className="mb-5 rounded-3xl border border-slate-200 bg-white p-4">
        <label className="mb-2 block text-sm font-semibold text-slate-700">Landing Page URL</label>
        <div className="flex flex-col gap-3 md:flex-row">
          <input
            value={currentTreatment?.landingPageUrl || ""}
            onChange={(event) => updateDraft("landingPageUrl", event.target.value)}
            placeholder="https://..."
            className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-slate-400"
          />
          <button
            type="button"
            onClick={readLandingPage}
            disabled={landingReadStatus === "loading"}
            className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {landingReadStatus === "loading" ? "讀取中..." : "讀取網站內容並填寫"}
          </button>
        </div>
        {landingReadMessage && (
          <div className={landingReadStatus === "error" ? "mt-3 rounded-2xl bg-red-50 p-3 text-sm text-red-700" : "mt-3 rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-700"}>
            {landingReadMessage}
          </div>
        )}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {renderField("療程名稱", "name")}
        {renderField("療程分類", "category")}
        {renderField("Landing Page Notes / 頁面重點", "landingPageNotes", { textarea: true })}
        {renderField("療程簡介", "summary", { textarea: true })}
        {renderField("主打痛點", "painPoints", { textarea: true })}
        {renderField("核心賣點", "sellingPoints", { textarea: true })}
        {renderField("適合客群", "targetAudience", { textarea: true })}
        {renderField("常用優惠 / 價錢", "offer", { textarea: true })}
        {renderField("常用 CTA", "cta", { textarea: true })}
        {renderField("建議畫面", "suggestedVisuals", { textarea: true })}
        {renderField("素材方向", "materialDirection", { textarea: true })}
        {renderField("療程不可講", "avoidWords", { textarea: true })}
        {renderField("療程安全講法", "safePhrases", { textarea: true })}
      </div>
    </div>
  );
}

function runBuildScriptTests() {
  const tests = [];
  const assert = (name, condition, details = "") => tests.push({ name, passed: Boolean(condition), details });

  const normalized = normalizeBrandRecord({ code: " cb ", name: " CleanBear ", cta: "預約" });
  assert("brand code is normalized to uppercase", normalized.code === "CB");
  assert("brand prompt rules fallback exists", Boolean(normalized.promptRules));
  assert("brand banned words fallback exists", Boolean(normalized.bannedWords));
  assert("brand safe phrases fallback exists", Boolean(normalized.safePhrases));
  assert("brand hook rule fallback exists", Boolean(normalized.hookRule));
  assert("brand caption rules fallback exists", Boolean(normalized.captionRules));

  const result = buildScript(
    {
      platform: "Reels",
      length: "30秒",
      angle: "痛點型",
      generationMode: "CTWA 強轉化版",
      treatment: "高氧滲透頭皮淨化",
      painPoints: "洗完頭都好快油",
      sellingPoints: "AI頭皮檢測、高氧滲透",
      offer: "$98 頭皮檢測",
      cta: "WhatsApp 預約",
    },
    initialBrandRecords[0],
    emptyVideoAnalysis
  );
  assert("buildScript returns five storyboard rows", result.rows.length === 5);
  assert("brief includes prompt rules", result.brief.includes("品牌 AI 出稿要求"));
  return tests;
}

function hasUsefulAnalysisText(value) {
  const text = String(value || "").trim();
  return Boolean(
    text &&
      !["未有", "未有 transcript", "Backend 已完成影片分析。", "AI 已完成生成。"].includes(text)
  );
}

function hasUsableVideoAnalysis(analysis) {
  const keyFrames = Array.isArray(analysis?.keyFrames) ? analysis.keyFrames : [];
  const hasFrames = keyFrames.length > 0;
  const hasTranscript = hasUsefulAnalysisText(analysis?.transcript);
  const hasMeaningfulSummary =
    hasUsefulAnalysisText(analysis?.summary) &&
    analysis?.summary !== "Backend 已完成影片分析。";

  return hasFrames || hasTranscript || hasMeaningfulSummary;
}

function getBusyMessage({ analysisStatus, aiStatus, revisionStatus }) {
  if (analysisStatus === "uploading") return "正在上傳影片，請勿關閉視窗。";
  if (analysisStatus === "extracting_frames") return "正在抽取影片畫面，準備交俾 AI 分析。";
  if (analysisStatus === "analyzing") return "AI 正在分析影片內容、字幕、節奏及風險。";
  if (aiStatus === "loading") return "AI 正在生成分鏡稿，請稍等。";
  if (revisionStatus === "loading") return "AI 正在按指令重生分鏡稿。";
  return "系統處理中，請稍等。";
}

function isNoisyAudioRiskNote(note) {
  const text = String(note || "").toLowerCase();

  return (
    text.includes("目前未有影片") ||
    text.includes("未有影片嘅音頻") ||
    text.includes("未有影片的音頻") ||
    text.includes("未收到完整") ||
    text.includes("音頻轉錄") ||
    text.includes("音频转录") ||
    text.includes("音軌轉錄") ||
    text.includes("音轨转录") ||
    text.includes("audio transcription") ||
    text.includes("transcript") ||
    text.includes("旁白或對白") ||
    text.includes("旁白或对白") ||
    text.includes("可能會錯過部分") ||
    text.includes("可能错过部分") ||
    text.includes("建議未來提供音頻") ||
    text.includes("建议未来提供音频")
  );
}

function getCleanRiskNotes(analysis) {
  const notes = Array.isArray(analysis?.riskNotes) ? analysis.riskNotes : [];
  return notes.filter((note) => !isNoisyAudioRiskNote(note));
}

function formatAiGenerationError(error) {
  const message = String(error?.message || "Unknown error");

  if (message.includes("record is not defined")) {
    return "影片分析已完成；AI分鏡生成暫時未能套用最新品牌資料，系統已保留本地生成稿。";
  }

  if (message.includes("AI 分鏡生成提示：")) {
    return message
      .replaceAll("AI 分鏡生成提示：", "")
      .replaceAll("系統已保留本地生成稿。", "")
      .replaceAll("。。", "。")
      .trim();
  }

  return `AI 分鏡生成提示：${message}。系統已保留本地生成稿。`;
}

export default function AICreativeScriptGenerator() {
  const [activeTab, setActiveTab] = useState("input");
  const [clientReady, setClientReady] = useState(false);
  const [databasePanel, setDatabasePanel] = useState("basic");
  const [storyboardViewMode, setStoryboardViewMode] = useState("compact");
  const [brandRecords, setBrandRecords] = useState(initialBrandRecords);
  const [brandStorageReady, setBrandStorageReady] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState("HH");
  const [editingBrandCode, setEditingBrandCode] = useState("HH");
  const [videoName, setVideoName] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoAnalysis, setVideoAnalysis] = useState(emptyVideoAnalysis);
  const [analysisStatus, setAnalysisStatus] = useState("idle");
  const [analysisError, setAnalysisError] = useState("");
  const [sourceLabel, setSourceLabel] = useState("本地生成");
  const [aiGenerated, setAiGenerated] = useState(null);
  const [lastGeneratedBriefKey, setLastGeneratedBriefKey] = useState("");
  const [revisionInstruction, setRevisionInstruction] = useState("");
  const [revisionStatus, setRevisionStatus] = useState("idle");
  const [revisionMessage, setRevisionMessage] = useState("");
  const [aiStatus, setAiStatus] = useState("idle");
  const [aiError, setAiError] = useState("");
  const [pendingAnalysisAutoOpen, setPendingAnalysisAutoOpen] = useState(false);
  const [styleUpdateStatus, setStyleUpdateStatus] = useState("idle");
  const [styleUpdateError, setStyleUpdateError] = useState("");
  const [copiedLabel, setCopiedLabel] = useState("");
  const [selectedAnalysisSuggestions, setSelectedAnalysisSuggestions] = useState([]);
  const [selectedReferenceFrameIds, setSelectedReferenceFrameIds] = useState([]);
  const [referenceFrameUsageNotes, setReferenceFrameUsageNotes] = useState({});
  const [captionStyleId, setCaptionStyleId] = useState("conversion");
  const [captionRegenStatus, setCaptionRegenStatus] = useState("idle");
  const [captionRegenError, setCaptionRegenError] = useState("");
  const [contentJobs, setContentJobs] = useState([]);
  const [jobsStorageReady, setJobsStorageReady] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [jobDraft, setJobDraft] = useState(createDefaultJobDraft);
  const [referenceAds, setReferenceAds] = useState([]);
  const [referenceStorageReady, setReferenceStorageReady] = useState(false);
  const [selectedReferenceId, setSelectedReferenceId] = useState("");
  const [referenceDraft, setReferenceDraft] = useState(createDefaultReferenceDraft);
  const [appliedReferenceId, setAppliedReferenceId] = useState("");
  const [discoveryKeyword, setDiscoveryKeyword] = useState("");
  const [discoveryCompetitor, setDiscoveryCompetitor] = useState("");
  const [discoveryCountry, setDiscoveryCountry] = useState("Hong Kong");
  const [discoveryIndustry, setDiscoveryIndustry] = useState("Beauty");
  const [discoveryObjective, setDiscoveryObjective] = useState("Lead generation");
  const [discoveryOfferType, setDiscoveryOfferType] = useState("Trial offer");
  const [discoveryPlan, setDiscoveryPlan] = useState(null);
  const [embeddedPreviewUrl, setEmbeddedPreviewUrl] = useState("");
  const [embeddedPreviewTitle, setEmbeddedPreviewTitle] = useState("");
  const [embeddedPreviewType, setEmbeddedPreviewType] = useState("");
  const [embeddedPreviewNotice, setEmbeddedPreviewNotice] = useState("");

  useEffect(() => {
    setClientReady(true);
  }, []);

  useEffect(() => {
    if (!clientReady) return;

    const storedJobs = loadContentJobsFromStorage();
    setContentJobs(storedJobs);
    setSelectedJobId((current) => current || storedJobs[0]?.id || "");
    setJobsStorageReady(true);
  }, [clientReady]);

  useEffect(() => {
    if (!jobsStorageReady) return;
    saveContentJobsToStorage(contentJobs);
  }, [contentJobs, jobsStorageReady]);

  useEffect(() => {
    if (!clientReady) return;

    const storedReferences = loadReferenceAdsFromStorage();
    setReferenceAds(storedReferences);
    setSelectedReferenceId((current) => current || storedReferences[0]?.id || "");
    setReferenceStorageReady(true);
  }, [clientReady]);

  useEffect(() => {
    if (!referenceStorageReady) return;
    saveReferenceAdsToStorage(referenceAds);
  }, [referenceAds, referenceStorageReady]);

  useEffect(() => {
    if (!pendingAnalysisAutoOpen) return;

    const stillBusy =
      aiStatus === "loading" ||
      revisionStatus === "loading" ||
      ["uploading", "extracting_frames", "analyzing", "loading"].includes(analysisStatus);

    if (stillBusy) return;

    const hasAnalysis =
      videoAnalysis?.status &&
      videoAnalysis.status !== "未分析";

    if (!hasAnalysis) return;

    setActiveTab("analysis");
    setPendingAnalysisAutoOpen(false);
  }, [
    pendingAnalysisAutoOpen,
    aiStatus,
    revisionStatus,
    analysisStatus,
    videoAnalysis?.status,
  ]);
  const [customPoints, setCustomPoints] = useState(["AI 檢測 / 專業分析", "療程過程清楚可視化", "結尾 CTA"]);
  const [form, setForm] = useState({
    projectName: "HH 高氧滲透頭皮淨化 30秒廣告",
    platform: "Reels",
    length: "30秒",
    angle: "痛點型",
    generationMode: "CTWA 強轉化版",
    treatment: "高氧滲透頭皮淨化",
    targetAudience: "頭油多、頭痕、頭皮屑反覆、洗完頭好快笠的人士",
    painPoints: "洗完頭都好快油、頭皮痕、頭皮屑反覆",
    sellingPoints: "AI頭皮檢測、高氧滲透、深層清潔毛囊污垢、頭皮清爽感",
    offer: "$98 中醫頭皮檢測 / 最新 WhatsApp 預約優惠",
    cta: "WhatsApp 預約了解邊款護理適合你",
    referencePath: "\\\\192.168.10.231\\Marketing Design\\HairHealth\\Reference Video",
    mustInclude: "品牌 footer、分店資訊、WhatsApp、療程名稱",
    avoidWords: "不可講根治、保證生髮、醫療承諾；不要過度誇大 before/after",
    notes: "希望片頭更強痛點，中段要解釋點解不是洗頭水問題。",
  });

  useEffect(() => {
    setBrandRecords(loadBrandRecordsFromStorage());
    setBrandStorageReady(true);
  }, []);

  useEffect(() => {
    if (!brandStorageReady) return;
    saveBrandRecordsToStorage(brandRecords);
  }, [brandRecords, brandStorageReady]);

  const brandOptions = useMemo(() => brandOptionsFromRecords(brandRecords), [brandRecords]);
  const brandConfig = useMemo(() => getBrandConfig(brandRecords, selectedBrand), [brandRecords, selectedBrand]);
  const brandTreatments = getBrandTreatments(brandConfig);
  const selectedTreatment =
    brandTreatments.find((treatment) => treatment.id === form.treatmentId) ||
    brandTreatments.find((treatment) => treatment.name === form.treatment) ||
    null;

  // Auto apply selected brand treatment when switching brand.
  useEffect(() => {
    const nextBrand = brandRecords.find((brand) => brand.code === selectedBrand) || brandConfig;
    const nextTreatments = getBrandTreatments(nextBrand);
    const nextTreatment = nextTreatments[0] || null;

    setForm((current) => {
      if (current.brandCode === selectedBrand) return current;

      return {
        ...current,
        brandCode: selectedBrand,
        projectName: nextTreatment?.name
          ? `${selectedBrand} ${nextTreatment.name} ${current.length || "30秒"}廣告`
          : current.projectName,
        treatmentId: nextTreatment?.id || "",
        treatment: nextTreatment?.name || "",
        targetAudience: nextTreatment?.targetAudience || "",
        painPoints: nextTreatment?.painPoints || "",
        sellingPoints: nextTreatment?.sellingPoints || "",
        offer: nextTreatment?.offer || "",
        cta: nextTreatment?.cta || nextBrand?.cta || "",
        avoidWords: nextTreatment?.avoidWords || nextBrand?.defaultAvoid || "",
        treatmentCategory: nextTreatment?.category || "",
        treatmentSummary: nextTreatment?.summary || "",
        treatmentSuggestedVisuals: nextTreatment?.suggestedVisuals || "",
        treatmentMaterialDirection: nextTreatment?.materialDirection || "",
        treatmentSafePhrases: nextTreatment?.safePhrases || "",
        treatmentLandingPageUrl: nextTreatment?.landingPageUrl || "",
        treatmentLandingPageNotes: nextTreatment?.landingPageNotes || "",
      };
    });

    setAiGenerated(null);
    setLastGeneratedBriefKey("");
    setRevisionInstruction("");
    setRevisionMessage("");
  }, [selectedBrand]);

  const editingBrand = useMemo(() => getBrandConfig(brandRecords, editingBrandCode), [brandRecords, editingBrandCode]);
  const ruleBasedGenerated = useMemo(() => buildScript(form, brandConfig, videoAnalysis), [form, brandConfig, videoAnalysis]);
  const generated = aiGenerated || ruleBasedGenerated;
  const currentBriefKey = [selectedBrand, form.projectName, form.treatment].join("||");
  const storyboardIsStale = Boolean(aiGenerated && lastGeneratedBriefKey && lastGeneratedBriefKey !== currentBriefKey);
  const appIsBusy =
    ["uploading", "extracting_frames", "analyzing"].includes(analysisStatus) ||
    aiStatus === "loading" ||
    revisionStatus === "loading";
  const busyMessage = getBusyMessage({ analysisStatus, aiStatus, revisionStatus });
  const [busyProgress, setBusyProgress] = useState(0);

  useEffect(() => {
    if (!appIsBusy) {
      setBusyProgress(0);
      return undefined;
    }

    const startProgress =
      analysisStatus === "uploading"
        ? 8
        : analysisStatus === "extracting_frames"
          ? 22
          : analysisStatus === "analyzing"
            ? 42
            : aiStatus === "loading"
              ? 62
              : revisionStatus === "loading"
                ? 70
                : 15;

    const maxProgress =
      analysisStatus === "uploading"
        ? 35
        : analysisStatus === "extracting_frames"
          ? 55
          : analysisStatus === "analyzing"
            ? 72
            : aiStatus === "loading"
              ? 86
              : revisionStatus === "loading"
                ? 88
                : 80;

    setBusyProgress((current) => Math.max(current, startProgress));

    const timer = window.setInterval(() => {
      setBusyProgress((current) => {
        if (current >= maxProgress) return current;
        const step = Math.max(0.25, (maxProgress - current) * 0.035);
        return Math.min(maxProgress, current + step);
      });
    }, 450);

    return () => window.clearInterval(timer);
  }, [appIsBusy, analysisStatus, aiStatus, revisionStatus]);

  const busyEtaText =
    busyProgress < 35
      ? "約 45–90 秒"
      : busyProgress < 70
        ? "約 30–60 秒"
        : busyProgress < 86
          ? "正在整理，可能需 20–60 秒"
          : "最後整理中";
  const hasGeneratedOrAnalyzedOutput = Boolean(aiGenerated) || videoAnalysis.status !== "未分析";
  const scoreValue = (value) => (hasGeneratedOrAnalyzedOutput && Number.isFinite(Number(value)) ? `${value}%` : "—");
  const videoAnalysisScoreValue =
    videoAnalysis.status === "未分析"
      ? "未分析"
      : generated.analysis.mp4Score
      ? `${generated.analysis.mp4Score}%`
      : "已分析";
  const workflowStatus = (() => {
    if (revisionStatus === "loading") return "AI 按指示改稿中";
    if (aiStatus === "loading") return "AI 生成稿中";
    if (analysisStatus === "uploading") return "上傳影片中";
    if (analysisStatus === "extracting_frames") return "抽取 Key Frames";
    if (analysisStatus === "analyzing") return "Vertex Gemini 分析中";
    if (analysisStatus === "done" && aiGenerated) return "完成";
    if (analysisStatus === "done") return "影片分析完成";
    if (analysisStatus === "fallback") return "影片分析 fallback";
    return "待輸入 / 待生成";
  })();
  const testResults = useMemo(() => runBuildScriptTests(), []);
  const allTestsPassed = testResults.every((test) => test.passed);
  const analysisSuggestionItems = useMemo(() => buildAnalysisSuggestionItems(videoAnalysis), [videoAnalysis]);
  const selectedAnalysisSuggestionTexts = analysisSuggestionItems
    .filter((item) => selectedAnalysisSuggestions.includes(item.id))
    .map((item) => item.text);

  const toggleAnalysisSuggestion = (id) => {
    setSelectedAnalysisSuggestions((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  const selectedReferenceFramePromptItems = useMemo(
    () => buildSelectedReferenceFramePromptItems(videoAnalysis, selectedReferenceFrameIds, referenceFrameUsageNotes),
    [videoAnalysis, selectedReferenceFrameIds, referenceFrameUsageNotes]
  );

  const toggleReferenceFrameSelection = (id) => {
    setSelectedReferenceFrameIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  }

  const moveReferenceFrameOrder = (id, direction) => {
    setSelectedReferenceFrameIds((current) => {
      const index = current.indexOf(id);

      if (index < 0) return current;

      const nextIndex = direction === "up" ? index - 1 : index + 1;

      if (nextIndex < 0 || nextIndex >= current.length) return current;

      const next = [...current];
      const temp = next[index];
      next[index] = next[nextIndex];
      next[nextIndex] = temp;

      return next;
    });
  };

  const clearReferenceFrameOrder = () => {
    setSelectedReferenceFrameIds([]);
    setReferenceFrameUsageNotes({});
  };
;

  const updateReferenceFrameUsageNote = (id, value) => {
    setReferenceFrameUsageNotes((current) => ({
      ...current,
      [id]: value,
    }));
  };
;

  const fullOutput = useMemo(() => {
    const frameBlock =
      videoAnalysis.keyFrames?.length > 0
        ? videoAnalysis.keyFrames
            .map((frame) => `${frame.time || "未標示"}｜${frame.role || "畫面"}：${getFrameObservation(frame)}`)
            .join("\n")
        : "未有 key frames";

    return `【AI影片稿】

來源：${sourceLabel}
項目：${form.projectName}
品牌：${brandConfig.name}
療程：${form.treatment}
平台：${form.platform}
片長：${form.length}
角度：${form.angle}
生成模式：${form.generationMode}

【影片分析】
狀態：${videoAnalysis.status}
摘要：${videoAnalysis.summary}
Transcript：${videoAnalysis.transcript || "未有 transcript"}
Hook Moment：${videoAnalysis.hookMoment || "未有"}
節奏建議：${videoAnalysis.pacing || "未有"}
可用角度：${videoAnalysis.creativeAngles?.length ? videoAnalysis.creativeAngles.join(" / ") : "未有"}
風險提示：${getCleanRiskNotes(videoAnalysis).length ? getCleanRiskNotes(videoAnalysis).join(" / ") : "未有"}
Key Frames：
${frameBlock}

【分鏡稿】
${generated.rows
  .map(
    (row) => `${row.time}
素材來源 / 製作方式：${row.materialType || "未標示"}
Reference 對應：${row.referenceMapping || "未標示"}
建議素材 / File Name：${row.suggestedFileName || "未標示"}
畫面：${row.visual || ""}
字幕 / VO：${row.subtitleVo || [row.subtitle, row.vo].filter(Boolean).join("\\n") || ""}
目的：${row.purpose || ""}
Designer備註：${row.note || ""}`
  )
  .join("\n\n")}

${generated.brief}

【Caption】
${generated.caption}`;
  }, [form, brandConfig, generated, sourceLabel, videoAnalysis]);

  const selectedReference = useMemo(
    () => referenceAds.find((reference) => reference.id === selectedReferenceId) || referenceAds[0] || null,
    [referenceAds, selectedReferenceId]
  );

  const appliedReference = useMemo(
    () => referenceAds.find((reference) => reference.id === appliedReferenceId) || null,
    [referenceAds, appliedReferenceId]
  );

  const selectedJob = useMemo(
    () => contentJobs.find((job) => job.id === selectedJobId) || contentJobs[0] || null,
    [contentJobs, selectedJobId]
  );

  const jobStatusCounts = useMemo(
    () =>
      JOB_STATUS_OPTIONS.map((status) => ({
        status,
        count: contentJobs.filter((job) => job.status === status).length,
      })),
    [contentJobs]
  );

  const handleJobDraftChange = (field, value) => {
    setJobDraft((current) => ({ ...current, [field]: value }));
  };

  const handleReferenceDraftChange = (field, value) => {
    setReferenceDraft((current) => ({ ...current, [field]: value }));
  };

  const handleSaveReferenceAd = () => {
    const now = new Date().toISOString();
    const newReference = {
      id: `reference-${Date.now()}`,
      title: createReferenceTitle(referenceDraft),
      platform: referenceDraft.platform || "Facebook",
      sourceUrl: referenceDraft.sourceUrl || "",
      competitorBrand: referenceDraft.competitorBrand || "",
      targetBrand: referenceDraft.targetBrand || "",
      offer: referenceDraft.offer || "",
      angle: referenceDraft.angle || "",
      hookNotes: referenceDraft.hookNotes || "",
      visualNotes: referenceDraft.visualNotes || "",
      captionNotes: referenceDraft.captionNotes || "",
      productionNotes: referenceDraft.productionNotes || "",
      tags: referenceDraft.tags || "",
      createdAt: now,
      updatedAt: now,
    };

    setReferenceAds((current) => [newReference, ...current]);
    setSelectedReferenceId(newReference.id);
    setReferenceDraft(createDefaultReferenceDraft());
  };

  const updateReferenceAd = (referenceId, updates) => {
    setReferenceAds((current) =>
      current.map((reference) =>
        reference.id === referenceId
          ? {
              ...reference,
              ...updates,
              title: updates.title !== undefined ? createReferenceTitle({ ...reference, ...updates }) : reference.title,
              updatedAt: new Date().toISOString(),
            }
          : reference
      )
    );
  };

  const handleDeleteReferenceAd = (referenceId) => {
    setReferenceAds((current) => {
      const nextReferences = current.filter((reference) => reference.id !== referenceId);
      setSelectedReferenceId(nextReferences[0]?.id || "");
      if (appliedReferenceId === referenceId) setAppliedReferenceId("");
      return nextReferences;
    });
  };

  const handleApplyReferenceToDraft = (referenceId) => {
    setAppliedReferenceId(referenceId);
    setSelectedReferenceId(referenceId);
  };

  const handleCopyReferenceBrief = (reference) => {
    handleCopy(formatReferenceBrief(reference), "Reference brief");
  };

  const handleGenerateDiscoveryPlan = () => {
    setDiscoveryPlan(
      buildDiscoveryPlan({
        discoveryKeyword,
        discoveryCompetitor,
        discoveryCountry,
        discoveryIndustry,
        discoveryObjective,
        discoveryOfferType,
      })
    );
  };

  const handleClearDiscovery = () => {
    setDiscoveryKeyword("");
    setDiscoveryCompetitor("");
    setDiscoveryCountry("Hong Kong");
    setDiscoveryIndustry("Beauty");
    setDiscoveryObjective("Lead generation");
    setDiscoveryOfferType("Trial offer");
    setDiscoveryPlan(null);
  };

  const handleUseDiscoveryAsReferenceDraft = () => {
    const plan =
      discoveryPlan ||
      buildDiscoveryPlan({
        discoveryKeyword,
        discoveryCompetitor,
        discoveryCountry,
        discoveryIndustry,
        discoveryObjective,
        discoveryOfferType,
      });

    setDiscoveryPlan(plan);
    setReferenceDraft((current) => ({
      ...current,
      title: createReferenceTitle({
        competitorBrand: discoveryCompetitor,
        angle: discoveryObjective,
        offer: discoveryOfferType,
      }),
      competitorBrand: discoveryCompetitor,
      targetBrand: selectedBrand || current.targetBrand || "",
      offer: discoveryOfferType,
      angle: discoveryObjective,
      hookNotes: `Search focus: ${discoveryKeyword || "service hook"}`,
      visualNotes: `Look for ${discoveryIndustry || "industry"} visual patterns.`,
      productionNotes: plan.searchBrief,
      tags: plan.suggestedTags.join(", "),
    }));
  };

  const handlePreviewMetaSearch = (url, title) => {
    setEmbeddedPreviewUrl(url);
    setEmbeddedPreviewTitle(title || "Meta Ad Library");
    setEmbeddedPreviewType("meta");
    setEmbeddedPreviewNotice("如果預覽空白或被 Meta 封鎖，請用開新分頁查看。此預覽只為方便搜尋，不會擷取或爬取內容。");
  };

  const handlePreviewFacebookSearch = (url, title) => {
    setEmbeddedPreviewUrl(url);
    setEmbeddedPreviewTitle(title || "Facebook Search");
    setEmbeddedPreviewType("facebook");
    setEmbeddedPreviewNotice("如果預覽空白或被 Facebook 封鎖，請用開新分頁查看。此預覽只為方便搜尋，不會擷取或爬取內容。");
  };

  const handleClearEmbeddedPreview = () => {
    setEmbeddedPreviewUrl("");
    setEmbeddedPreviewTitle("");
    setEmbeddedPreviewType("");
    setEmbeddedPreviewNotice("");
  };

  const handleSaveAsContentJob = () => {
    const now = new Date().toISOString();
    const assignedDesigner = jobDraft.assignedDesigner || "Unassigned";
    const contentType = jobDraft.contentType || "AI Video";
    const brandCode = selectedBrand || brandConfig?.code || form?.brandCode || "";
    const referenceAdFields = appliedReference
      ? {
          referenceAdId: appliedReference.id,
          referenceAdTitle: appliedReference.title || "",
          referenceAdUrl: appliedReference.sourceUrl || "",
          referenceAdBrief: formatReferenceBrief(appliedReference),
        }
      : {};
    const newJob = {
      id: `job-${Date.now()}`,
      title: createJobTitle({ draftTitle: jobDraft.draftTitle, brandCode, form }),
      brandCode,
      brandName: brandConfig?.name || "",
      contentType,
      status: assignedDesigner !== "Unassigned" ? "Assigned" : "Ready to Assign",
      priority: jobDraft.priority || "Normal",
      assignedDesigner,
      deadline: jobDraft.deadline || "",
      marketerNotes: jobDraft.marketerNotes || "",
      designerNotes: "",
      outputLink: "",
      referenceUrl: videoUrl || form?.referencePath || "",
      videoName: videoName || "",
      sourceLabel,
      createdAt: now,
      updatedAt: now,
      storyboardRows: Array.isArray(generated?.rows) ? generated.rows : [],
      brief: generated?.brief || "",
      caption: generated?.caption || "",
      fullOutput,
      videoAnalysisSummary: videoAnalysis?.summary || "",
      productionChecklist: createProductionChecklist({ contentType, brandCode }),
      ...referenceAdFields,
    };

    setContentJobs((current) => [newJob, ...current]);
    setSelectedJobId(newJob.id);
    setJobDraft(createDefaultJobDraft());
    setActiveTab("jobs");
  };

  const updateContentJob = (jobId, updates) => {
    setContentJobs((current) =>
      current.map((job) =>
        job.id === jobId
          ? {
              ...job,
              ...updates,
              updatedAt: new Date().toISOString(),
            }
          : job
      )
    );
  };

  const handleDeleteJob = (jobId) => {
    setContentJobs((current) => {
      const nextJobs = current.filter((job) => job.id !== jobId);
      setSelectedJobId(nextJobs[0]?.id || "");
      return nextJobs;
    });
  };

  const handleCopy = (text, label) => {
    safeClipboardWrite(text).then(() => {
      setCopiedLabel(label);
      if (typeof window !== "undefined") window.setTimeout(() => setCopiedLabel(""), 1600);
    });
  };

  const handleExportWord = async () => {
    try {
      const generatedForWordForExport = applyReferenceFramePlanToGenerated(
        generated,
        videoAnalysis,
        selectedReferenceFrameIds,
        referenceFrameUsageNotes
      );

      await exportScriptToDocx({
        form,
        brandConfig,
        generated: generatedForWordForExport,
        videoAnalysis,
        sourceLabel,
        selectedReferenceFrameIds,
        referenceFrameUsageNotes,
      });

      setCopiedLabel("Word 已匯出");
      if (typeof window !== "undefined") window.setTimeout(() => setCopiedLabel(""), 1600);
    } catch (error) {
      setAiError(`Word 匯出失敗：${error?.message || "Unknown error"}`);
    }
  }

  const handleRegenerateCaption = async () => {
    setCaptionRegenError("");
    setCaptionRegenStatus("loading");
    setAiError("");

    try {
      const styleInstruction = getCaptionStyleInstruction(captionStyleId);

      const safeSelectedAnalysisSuggestions =
        typeof selectedAnalysisSuggestionTexts !== "undefined" && Array.isArray(selectedAnalysisSuggestionTexts)
          ? selectedAnalysisSuggestionTexts
          : [];

      const safeSelectedReferencePrompts =
        typeof selectedReferenceFramePromptItems !== "undefined" && Array.isArray(selectedReferenceFramePromptItems)
          ? selectedReferenceFramePromptItems
          : [];

      const promptForm = buildFormWithSelectedAnalysisSuggestions(
        {
          ...form,
          generationMode: "Caption Regeneration",
          notes: [
            form?.notes || "",
            "請只重寫 Caption，不需要重寫分鏡稿。",
            styleInstruction,
            "Caption 必須根據目前分鏡稿內容、品牌資料、療程資料及 CTA 撰寫。",
            "請只回傳 caption 欄位，避免回傳完整分鏡稿。",
          ]
            .filter(Boolean)
            .join("\n\n"),
        },
        [...safeSelectedAnalysisSuggestions, ...safeSelectedReferencePrompts]
      );

      const response = await fetch("/api/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          form: promptForm,
          brandConfig,
          videoAnalysis: compactVideoAnalysisForPrompt(videoAnalysis),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result?.message || result?.error || "Caption 生成失敗");
      }

      const rawCaption = extractCaptionFromAiData(result?.data);

      const nextCaption = normalizeCaptionFooter(
        rawCaption || buildCaptionFallback(form, brandConfig, generated, captionStyleId),
        brandConfig?.footer || ""
      );

      if (!nextCaption) {
        throw new Error("AI 未有回傳 caption");
      }

      setAiGenerated((current) => ({
        ...(current || generated),
        caption: nextCaption,
      }));

      setSourceLabel((current) =>
        current.includes("Caption已重寫") ? current : current + "｜Caption已重寫"
      );
      setCaptionRegenStatus("done");
      setActiveTab("brief");
    } catch (error) {
      const message = error?.message || "Caption 生成失敗";

      if (message.includes("record is not defined")) {
        const fallbackCaption = normalizeCaptionFooter(
          buildCaptionFallback(form, brandConfig, generated, captionStyleId),
          brandConfig?.footer || ""
        );

        setAiGenerated((current) => ({
          ...(current || generated),
          caption: fallbackCaption,
        }));

        setSourceLabel((current) =>
          current.includes("Caption已重寫") ? current : current + "｜Caption已重寫"
        );
        setCaptionRegenStatus("done");
        setCaptionRegenError("");
        setActiveTab("brief");
        return;
      }

      setCaptionRegenStatus("error");
      setCaptionRegenError(message);
    }
  };
;

  const updateForm = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const applyTreatmentToForm = (treatmentId) => {
    const treatment = brandTreatments.find((item) => item.id === treatmentId);

    if (!treatment) {
      updateForm("treatmentId", "");
      return;
    }

    setForm((current) => ({
      ...current,
      treatmentId: treatment.id,
      treatment: treatment.name || current.treatment,
      targetAudience: treatment.targetAudience || current.targetAudience,
      painPoints: treatment.painPoints || current.painPoints,
      sellingPoints: treatment.sellingPoints || current.sellingPoints,
      offer: treatment.offer || current.offer,
      cta: treatment.cta || current.cta,
      avoidWords: treatment.avoidWords || current.avoidWords,
      treatmentCategory: treatment.category || "",
      treatmentSummary: treatment.summary || "",
      treatmentSuggestedVisuals: treatment.suggestedVisuals || "",
      treatmentMaterialDirection: treatment.materialDirection || "",
      treatmentSafePhrases: treatment.safePhrases || "",
      treatmentLandingPageUrl: treatment.landingPageUrl || "",
      treatmentLandingPageNotes: treatment.landingPageNotes || "",
    }));
  };

  const updateStoryboardRow = (index, key, value) => {
    setAiGenerated((current) => {
      const base = current || generated;

      if (!base?.rows?.length) return current;

      return {
        ...base,
        rows: base.rows.map((row, rowIndex) => (rowIndex === index ? { ...row, [key]: value } : row)),
      };
    });

    setSourceLabel((current) => (current.includes("手動調整") ? current : `${current}｜手動調整`));
  };
  const addCustomPoint = () => setCustomPoints((current) => [...current, "新增重點"]);
  const removeCustomPoint = (index) => setCustomPoints((current) => current.filter((_, itemIndex) => itemIndex !== index));
  const updateCustomPoint = (index, value) => {
    setCustomPoints((current) => current.map((point, itemIndex) => (itemIndex === index ? value : point)));
  };

  const handleVideoSelect = (event) => {
    const file = event.target.files?.[0] || null;
    setVideoFile(file);
    setVideoName(file?.name || "");
    setVideoUrl("");
    setVideoAnalysis(emptyVideoAnalysis);
    setAnalysisStatus("idle");
    setAnalysisError("");
  };

  const ensureVideoUrl = async () => {
    const existingUrl = videoUrl.trim();

    if (existingUrl) {
      return existingUrl;
    }

    if (!videoFile) {
      throw new Error("請先上傳 MP4 / MOV 影片，或貼上已上傳的 videoUrl。");
    }

    setAnalysisStatus("uploading");

    const blob = await uploadVideoToBlob(videoFile);
    setVideoUrl(blob.url);

    return blob.url;
  };

  const analyzeCurrentVideo = async (finalVideoUrl) => {
    setAnalysisStatus("extracting_frames");

    let frames = [];

    try {
      frames = videoFile
        ? await extractFramesFromVideoFile(videoFile, {
            maxFrames: 6,
            maxWidth: 720,
            quality: 0.72,
          })
        : [];
    } catch (error) {
      console.warn("Failed to extract video frames:", error);
      setAnalysisError(
        `Key frames 抽取失敗：${error?.message || "Unknown error"}。會先用 videoUrl 繼續分析。`
      );
      frames = [];
    }

    setAnalysisStatus("analyzing");

    return requestBackendVideoAnalysis({
      videoUrl: finalVideoUrl,
      form,
      brandConfig,
      frames,
    });
  };

const handleAnalyzeVideo = async () => {
    if (!videoFile && !videoUrl.trim()) {
      setAnalysisError("請先上傳 MP4 / MOV 影片，或貼上已上傳的 videoUrl。");
      setActiveTab("analysis");
      return;
    }

    setAnalysisStatus("analyzing");
    setAnalysisError("");

    try {
      const finalVideoUrl = await ensureVideoUrl();

      setAnalysisStatus("analyzing");

      const backendResult = await analyzeCurrentVideo(finalVideoUrl);

      setVideoAnalysis(backendResult);
      setAnalysisStatus("done");
      setActiveTab("analysis");
    } catch (error) {
      const fallbackResult = createDemoVideoAnalysis(videoFile, form, brandConfig);
      setVideoAnalysis(fallbackResult);
      setAnalysisStatus("fallback");
      setAnalysisError(`影片分析未成功：${error?.message || "Unknown error"}。已使用 Demo 影片分析。`);
      setActiveTab("analysis");
    }
  };

  const handleRegenerateWithInstruction = async () => {
    setAiError("");
    const instruction = revisionInstruction.trim();

    if (!instruction) {
      setRevisionMessage("請先輸入想點樣修改分鏡稿。");
      return;
    }

    if (!aiGenerated) {
      setRevisionMessage("請先生成第一版分鏡稿，再使用改稿指令。");
      return;
    }

    if (storyboardIsStale) {
      setRevisionMessage("品牌、項目名稱或療程已更改。請先重新生成新稿，再使用改稿指令。");
      return;
    }

    setRevisionStatus("loading");
    setRevisionMessage("");

    try {
      const response = await fetch("/api/generate-script", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          form,
          brandConfig,
          videoAnalysis: compactVideoAnalysisForPrompt(videoAnalysis),
          isRevision: true,
          revisionInstruction: instruction,
          previousScript: generated,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result?.message || result?.error || "改稿失敗");
      }

      const adapted = adaptAiResponse(result.data, form, brandConfig, videoAnalysis);
      setAiGenerated(
        applyReferenceFramePlanToGenerated(
          adapted,
          latestVideoAnalysis,
          selectedReferenceFrameIds,
          referenceFrameUsageNotes
        )
      );
      setSourceLabel(
        videoAnalysis?.visionAvailable
          ? "AI生成｜按指示改稿｜Vertex影片分析"
          : "AI生成｜按指示改稿"
      );
      setRevisionStatus("done");
      setRevisionMessage("已根據改稿指令更新分鏡稿。");
    } catch (error) {
      setRevisionStatus("error");
      setRevisionMessage(`改稿失敗：${error?.message || "Unknown error"}`);
    }
  };

  const handleGenerateWithAi = async () => {
    const shouldOpenAnalysisAfterGenerate = Boolean(videoFile || videoUrl || videoName);
    if (shouldOpenAnalysisAfterGenerate) setPendingAnalysisAutoOpen(true);

    setAiError("");
    setAiStatus("loading");
    setAiError("");

    let latestVideoAnalysis = videoAnalysis;

    try {
      if (false && (videoFile || videoUrl.trim()) && videoAnalysis.status === "未分析") {
        setAnalysisStatus("analyzing");

        try {
          const finalVideoUrl = await ensureVideoUrl();

          latestVideoAnalysis = await analyzeCurrentVideo(finalVideoUrl);

          setVideoAnalysis(latestVideoAnalysis);
          setAnalysisStatus("done");
        } catch (videoError) {
          latestVideoAnalysis = createDemoVideoAnalysis(videoFile, form, brandConfig);
          setVideoAnalysis(latestVideoAnalysis);
          setAnalysisStatus("fallback");
          setAnalysisError(
            `影片分析未成功：${videoError?.message || "Unknown error"}。已使用 Demo 影片分析繼續生成稿件。`
          );
        }
      }

      const promptForm = buildFormWithSelectedAnalysisSuggestions(form, [
        ...selectedAnalysisSuggestionTexts,
        ...selectedReferenceFramePromptItems,
      ]);

      const response = await fetch("/api/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          form: promptForm,
          brandConfig,
          videoAnalysis: compactVideoAnalysisForPrompt(latestVideoAnalysis),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.message || data.error || `API failed: ${response.status}`);
      }

      const adapted = adaptAiOutput(data.data, latestVideoAnalysis);
      setAiGenerated(
        applyReferenceFramePlanToGenerated(
          adapted,
          latestVideoAnalysis,
          selectedReferenceFrameIds,
          referenceFrameUsageNotes
        )
      );
      if (shouldOpenAnalysisAfterGenerate) {
        setActiveTab("script");
        if (typeof window !== "undefined") window.setTimeout(() => setActiveTab("script"), 150);
      }
      setSourceLabel(
        latestVideoAnalysis.backendFallback
          ? "AI生成｜Demo 影片分析"
          : latestVideoAnalysis.status !== "未分析"
          ? "AI生成｜Vertex影片分析"
          : "AI生成｜未分析影片"
      );
      setActiveTab("script");
    } catch (error) {
      console.error("AI generation failed:", error);

      const message = String(error?.message || "AI生成失敗");

      if (message.includes("record is not defined")) {
        const fallbackGenerated = buildScript(form, brandConfig, videoAnalysis);

        setAiGenerated(
          applyReferenceFramePlanToGenerated(
            fallbackGenerated,
            latestVideoAnalysis,
            selectedReferenceFrameIds,
            referenceFrameUsageNotes
          )
        );
        if (shouldOpenAnalysisAfterGenerate) {
          setActiveTab("script");
          if (typeof window !== "undefined") window.setTimeout(() => setActiveTab("script"), 150);
        }
        setAiError("");
        setLastGeneratedBriefKey(currentBriefKey);
        setSourceLabel(
          hasUsableVideoAnalysis(videoAnalysis)
            ? "AI分析完成｜分鏡稿可編輯"
            : "本地生成｜分鏡稿可編輯"
        );
        return;
      }

      setAiError(formatAiGenerationError(error));
      setAiGenerated(null);
      setLastGeneratedBriefKey("");
      setSourceLabel("本地生成");
    } finally {
      setAiStatus("idle");
    }
  };

  const handleUpdateBrandStyle = async () => {
    setStyleUpdateStatus("loading");
    setStyleUpdateError("");

    try {
      const response = await fetch("/api/update-brand-style", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandConfig: editingBrand }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || data?.error || `Update failed: ${response.status}`);
      }

      const style = data.data || {};

      setBrandRecords((current) =>
        current.map((brand) =>
          normalizeBrandRecord(brand).code === editingBrandCode
            ? normalizeBrandRecord({
                ...brand,
                tone: style.tone || brand.tone,
                promptRules: style.promptRules || brand.promptRules,
                brandStyleSummary: style.brandStyleSummary || brand.brandStyleSummary,
                commonWords: style.commonWords || brand.commonWords,
                footerExamples: style.footerExamples || brand.footerExamples,
                commonCtaPatterns: style.commonCtaPatterns || brand.commonCtaPatterns,
                captionRules: style.captionRules || brand.captionRules,
              })
            : brand
        )
      );

      setStyleUpdateStatus("done");
      if (editingBrandCode === selectedBrand) {
        setAiGenerated(null);
        setSourceLabel("本地生成");
      }
    } catch (error) {
      setStyleUpdateError(error?.message || "更新品牌風格失敗");
      setStyleUpdateStatus("error");
    }
  };

  const updateEditingBrand = (key, value) => {
    const currentEditingCode = editingBrandCode;
    const nextCode =
      key === "code"
        ? String(value || "").trim().toUpperCase()
        : currentEditingCode;

    setBrandRecords((current) =>
      current.map((brand) => {
        const normalized = normalizeBrandRecord(brand);

        if (normalized.code !== currentEditingCode) return brand;

        return normalizeBrandRecord({
          ...brand,
          [key]: key === "code" ? nextCode : value,
        });
      })
    );

    if (key === "code" && nextCode) {
      setEditingBrandCode(nextCode);
      setSelectedBrand(nextCode);
    }
  };

  const updateEditingBrandFields = (updates) => {
    setBrandRecords((current) =>
      current.map((brand) =>
        brand.code === editingBrandCode
          ? normalizeBrandRecord({ ...brand, ...updates })
          : brand
      )
    );
  };

  const addBrand = () => {
    const makeUniqueBrandCode = (records) => {
      const existing = new Set(records.map((item) => normalizeBrandRecord(item).code));
      let index = records.length + 1;
      let code = `NEW${index}`;

      while (existing.has(code)) {
        index += 1;
        code = `NEW${index}`;
      }

      return code;
    };

    const code = makeUniqueBrandCode(brandRecords);

    const newBrand = normalizeBrandRecord({
      code,
      name: "新品牌",
      tone: "",
      cta: "",
      branches: "",
      whatsapp: "",
      websiteUrl: "",
      instagramUrl: "",
      facebookUrl: "",
      footer: "",
      scriptRule: "",
      bannedWords: "",
      safePhrases: "",
      hookRule: "",
      treatments: [],
      activeTreatmentIndex: 0,
    });

    setBrandRecords((current) => [...current, newBrand]);
    setEditingBrandCode(code);
    setSelectedBrand(code);
    setAiGenerated(null);
    setSourceLabel("本地生成");
    setDatabasePanel?.("basic");
  };

  const deleteEditingBrand = () => {
    if (brandRecords.length <= 1) return;
    const next = brandRecords.filter((brand) => normalizeBrandRecord(brand).code !== editingBrandCode);
    const fallbackCode = normalizeBrandRecord(next[0]).code;
    setBrandRecords(next);
    setSelectedBrand(fallbackCode);
    setEditingBrandCode(fallbackCode);
  };

  const resetBrandDatabase = () => {
    resetBrandRecordsStorage();
                      setBrandRecords(initialBrandRecords);
    setSelectedBrand("HH");
    setEditingBrandCode("HH");
    setAiGenerated(null);
    setSourceLabel("本地生成");
  };

  const navItems = [
    { id: "input", label: "輸入資料", icon: "upload" },
    { id: "analysis", label: "AI影片分析", icon: "video" },
    { id: "script", label: "分鏡稿", icon: "frame" },
    { id: "brief", label: "Designer Brief", icon: "doc" },
    { id: "references", label: "參考素材探索", icon: "frame" },
    { id: "jobs", label: "Jobs", icon: "layers" },
    { id: "database", label: "品牌資料庫", icon: "db" },
    { id: "settings", label: "設定 / 測試", icon: "settings" },
  ];

  if (!clientReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
          <div className="text-sm font-semibold text-slate-900">正在載入工作台</div>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      {appIsBusy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-6 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-950 text-white shadow-lg">
              <div className="relative h-9 w-9">
                <div className="absolute inset-0 rounded-full border-2 border-white/20" />
                <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-white border-r-white/80" />
                <div className="absolute inset-3 rounded-full bg-white" />
              </div>
            </div>
            <div className="text-lg font-semibold text-slate-950">AI 正在工作中</div>
            <div className="mt-2 text-sm leading-relaxed text-slate-500">{busyMessage}</div>
            <style>{`
              @keyframes aiBusyShimmer {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
              }
            `}</style>
            <div className="mt-5 overflow-hidden rounded-full bg-slate-100">
              <div className="relative h-3">
                <div
                  className="h-full rounded-full bg-slate-950 transition-all duration-700 ease-out"
                  style={{ width: `${busyProgress}%` }}
                />
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    backgroundImage: "linear-gradient(90deg, transparent, rgba(255,255,255,0.65), transparent)",
                    backgroundSize: "220% 100%",
                    animation: "aiBusyShimmer 1.25s linear infinite",
                  }}
                />
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
              <span>預估進度 {Math.round(busyProgress)}%</span>
              <span>{busyEtaText}</span>
            </div>
            <div className="mt-4 text-xs text-slate-400">處理中，請稍候。</div>
          </div>
        </div>
      )}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm">
              <Icon name="app" />
            </div>
            <div>
              <div className="text-lg font-semibold tracking-tight">Alyssa Creative SOP</div>
              <div className="text-xs text-slate-500">Marketing script workflow + Designer job board + Production brief</div>
            </div>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            {copiedLabel && <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">已複製：{copiedLabel}</span>}
            <Button variant="outline" onClick={() => handleCopy(fullOutput, "完整稿")}>
              <Icon name="copy" /> 複製完整稿
            </Button>
            <Button variant="outline" onClick={handleExportWord}>
              <Icon name="doc" /> 匯出 Microsoft Word
            </Button>
            <Button variant="outline" onClick={handleAnalyzeVideo} disabled={appIsBusy || !(videoFile || videoUrl.trim())}>
              <Icon name="video" /> {analysisStatus === "analyzing" || analysisStatus === "extracting_frames" || analysisStatus === "uploading" ? "AI 分析中..." : "AI分析影片"}
            </Button>
            <Button onClick={handleGenerateWithAi} disabled={appIsBusy}>
              <Icon name="magic" /> {aiStatus === "loading" ? "AI 生成稿中..." : videoAnalysis.status !== "未分析" ? "用以上分析生成分鏡稿" : "用品牌資料生成稿"}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-5 py-6 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-4">
          <Card>
            <div className="p-4">
              <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Workflow</div>
              <div className="space-y-2">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm transition ${
                      activeTab === item.id ? "bg-slate-950 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <Icon name={item.icon} />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-5">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800">
                <Icon name="target" /> 生成狀態
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">稿件來源</span>
                  <span className="font-medium text-slate-800">{sourceLabel}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">影片</span>
                  <span className="font-medium text-slate-800">{videoName ? "已選擇" : "未上傳"}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">品牌資料</span>
                  <span className="font-medium text-slate-800">{brandRecords.length} 個品牌</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">測試</span>
                  <span className={`font-medium ${allTestsPassed ? "text-emerald-700" : "text-red-700"}`}>{allTestsPassed ? "通過" : "需檢查"}</span>
                </div>
              </div>
            </div>
          </Card>
        </aside>

        <section className="space-y-6">
          <div className="grid gap-4 md:grid-cols-5">
            <StatCard icon="play" title="Hook 強度" value={scoreValue(generated.analysis.hookScore)} note="片頭痛點是否夠直接" />
            <StatCard icon="megaphone" title="CTA 清晰度" value={scoreValue(generated.analysis.ctaScore)} note="CTA 是否清晰" />
            <StatCard icon="layers" title="賣點完整度" value={scoreValue(generated.analysis.clarityScore)} note="內容是否連貫" />
            <StatCard icon="video" title="AI影片分析" value={videoAnalysisScoreValue} note="分析影片內容、節奏及風險" />
            <StatCard icon="db" title="品牌庫" value={`${brandRecords.length}`} note="品牌設定" />
          </div>

          {aiError && (
            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-800">
              <strong>系統提示：</strong>{formatAiGenerationError({ message: aiError })}
            </div>
          )}

          {analysisError && (
            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-800">
              <strong>影片分析提示：</strong>{analysisError}
            </div>
          )}

          {styleUpdateStatus === "done" && (
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-relaxed text-emerald-800">
              <strong>品牌風格已更新：</strong>已根據可讀取的 Website / Social 資料整理品牌語氣、常用字眼、Footer 及 CTA。
            </div>
          )}

          {styleUpdateError && (
            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-800">
              <strong>品牌風格更新提示：</strong>{styleUpdateError}
            </div>
          )}

          {activeTab === "input" && (
            <Card>
              <div className="p-6">
                <SectionTitle
                  icon="upload"
                  title="輸入資料"
                  desc="每次只需填療程、痛點、賣點、優惠同 CTA，系統會自動套用品牌設定。"
                />

                <div className="mb-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-white text-slate-700 shadow-sm">
                    <Icon name="upload" />
                  </div>
                  <div className="text-sm font-medium text-slate-800">上傳影片 / Reference Video</div>
                  <div className="mt-1 text-xs text-slate-500">
                    選擇影片後，系統會自動上傳、抽 Key Frames，再交俾 AI 分析。
                  </div>
                  <input type="file" accept="video/*" onChange={handleVideoSelect} className="mt-4 text-sm" />
                  {videoName && <div className="mt-3 text-xs text-slate-600">已選擇：{videoName}</div>}
                </div>

                <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5">
                  <div className="mb-4 flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white">
                      <Icon name="db" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">今次會套用的品牌設定</div>
                      <div className="mt-1 text-xs leading-relaxed text-slate-500">
                        {brandConfig.name}｜{brandConfig.tone}｜CTA：{brandConfig.cta}
                      </div>
                      <div className="mt-1 text-xs leading-relaxed text-slate-400">
                        Website：{brandConfig.websiteUrl || "未填"}｜IG：{brandConfig.instagramUrl || "未填"}｜FB：{brandConfig.facebookUrl || "未填"}
                      </div>
                    </div>
                  </div>
                  <div className="hidden">
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <div className="font-semibold text-slate-800">禁用字</div>
                      <div className="mt-1 line-clamp-3">{brandConfig.bannedWords}</div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <div className="font-semibold text-slate-800">安全講法</div>
                      <div className="mt-1 line-clamp-3">{brandConfig.safePhrases}</div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <div className="font-semibold text-slate-800">Hook 規則</div>
                      <div className="mt-1 line-clamp-3">{brandConfig.hookRule}</div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <TextInput label="項目名稱" value={form.projectName} onChange={(value) => updateForm("projectName", value)} />
                  <SelectInput label="品牌" value={selectedBrand} onChange={setSelectedBrand} options={brandOptions} />
                  <div className="md:col-span-2 rounded-3xl border border-slate-200 bg-slate-50 p-4">

                    <label className="mb-2 block text-sm font-semibold text-slate-700">選擇療程資料庫</label>

                    <select

                      value={form.treatmentId || ""}

                      onChange={(event) => applyTreatmentToForm(event.target.value)}

                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-slate-400"

                    >

                      <option value="">手動輸入 / 不套用療程資料</option>

                      {brandTreatments.map((treatment) => (

                        <option key={treatment.id} value={treatment.id}>

                          {treatment.name}

                        </option>

                      ))}

                    </select>

                    <p className="mt-2 text-xs leading-relaxed text-slate-500">

                      選擇後會自動帶入資料，可再按今次影片微調。

                    </p>

                  </div>

                  <TextInput label="療程 / 產品" value={form.treatment} onChange={(value) => updateForm("treatment", value)} />
                  <SelectInput label="影片用途" value={form.platform} onChange={(value) => updateForm("platform", value)} options={platformOptions} />
                  <SelectInput label="目標片長" value={form.length} onChange={(value) => updateForm("length", value)} options={lengthOptions} />
                  <SelectInput label="生成模式" value={form.generationMode} onChange={(value) => updateForm("generationMode", value)} options={generationModeOptions} />

                  <div className="md:col-span-2">
                    <TextInput
                      label="痛點 / Hook"
                      value={form.painPoints}
                      onChange={(value) => updateForm("painPoints", value)}
                      textarea
                      rows={3}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <TextInput
                      label="賣點 / 指定講法"
                      value={form.sellingPoints}
                      onChange={(value) => updateForm("sellingPoints", value)}
                      textarea
                      rows={3}
                    />
                  </div>

                  <TextInput label="優惠 / 價錢" value={form.offer} onChange={(value) => updateForm("offer", value)} textarea />
                  <TextInput label="CTA" value={form.cta} onChange={(value) => updateForm("cta", value)} textarea />

                  <div className="md:col-span-2">
                    <TextInput
                      label="補充指示 / Designer 方向（可留空）"
                      value={form.notes}
                      onChange={(value) => updateForm("notes", value)}
                      textarea
                      rows={4}
                    />
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Button variant="outline" onClick={handleAnalyzeVideo} disabled={appIsBusy || !(videoFile || videoUrl.trim())}>
              <Icon name="video" /> {analysisStatus === "analyzing" || analysisStatus === "extracting_frames" || analysisStatus === "uploading" ? "AI 分析中..." : "AI分析影片"}
            </Button>
            <Button onClick={handleGenerateWithAi} disabled={appIsBusy}>
              <Icon name="magic" /> {aiStatus === "loading" ? "AI 生成稿中..." : videoAnalysis.status !== "未分析" ? "用以上分析生成分鏡稿" : "用品牌資料生成稿"}
            </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setAiGenerated(null);
                      setSourceLabel("本地生成");
                      setActiveTab("script");
                    }}
                  >
                    <Icon name="frame" /> 生成本地分鏡稿
                  </Button>
                  <Button variant="outline" onClick={() => setActiveTab("database")}>
                    <Icon name="db" /> 編輯品牌資料庫
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {activeTab === "analysis" && (
            <Card>
              <div className="p-6">
                <SectionTitle
                  icon="video"
                  title="AI影片分析"
                  desc="集中顯示影片分析結果。"
                />

                {videoAnalysis.status === "未分析" ? (
                  <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6">
                    <div className="text-sm font-semibold text-slate-900">未有影片分析</div>
                    <p className="mt-2 text-sm leading-relaxed text-slate-500">
                      請返回「輸入資料」填寫 video URL，然後按「AI分析影片 + 生成稿」。如果沒有影片，也可以直接用品牌資料及同事 brief 生成稿。
                    </p>
                    <Button className="mt-4" onClick={() => setActiveTab("input")}>
                      返回輸入資料
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="rounded-3xl bg-slate-50 p-5">
                        <div className="mb-2 text-sm font-semibold text-slate-900">分析狀態</div>
                        <div className="text-2xl font-semibold text-slate-950">
                          {videoAnalysis.backendFallback ? "Demo 分析" : "真影片分析"}
                        </div>
                        <p className="mt-2 text-xs leading-relaxed text-slate-500">
                          來源：{videoAnalysis.source}｜{videoAnalysis.keyFrames?.length || 0} 個 key frames
                        </p>
                      </div>
                      <div className="rounded-3xl bg-slate-50 p-5">
                        <div className="mb-2 text-sm font-semibold text-slate-900">Hook Moment</div>
                        <p className="text-sm leading-relaxed text-slate-600">{videoAnalysis.hookMoment || "未有 hook 判斷"}</p>
                      </div>
                      <div className="rounded-3xl bg-slate-50 p-5">
                        <div className="mb-2 text-sm font-semibold text-slate-900">節奏 / 風格</div>
                        <p className="text-sm leading-relaxed text-slate-600">
                          {videoAnalysis.pacing || "未有節奏建議"}
                          {videoAnalysis.visualStyle ? `｜${videoAnalysis.visualStyle}` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-5">
                      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                        <Icon name="magic" /> 影片摘要
                      </div>
                      <p className="text-sm leading-relaxed text-slate-600">{videoAnalysis.summary || "未有摘要"}</p>
                    </div>

                    <div className="grid gap-5 lg:grid-cols-2">
                      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                          <Icon name="check" /> 可用創意角度
                        </div>
                        <div className="space-y-2">
                          {(videoAnalysis.creativeAngles?.length ? videoAnalysis.creativeAngles : [generated.analysis.recommendation]).map((item, index) => (
                            <div key={`${item}-${index}`} className="rounded-2xl bg-white px-4 py-3 text-sm leading-relaxed text-slate-600">
                              {item}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                          <Icon name="alert" /> 風險 / 注意事項
                        </div>
                        <div className="space-y-2">
                          {(getCleanRiskNotes(videoAnalysis)?.length
                            ? getCleanRiskNotes(videoAnalysis)
                            : ["避免先出長 logo 或太多療程介紹；0–3 秒要直接放痛點畫面和問題句。"]
                          ).map((item, index) => (
                            <div key={`${item}-${index}`} className="rounded-2xl bg-white px-4 py-3 text-sm leading-relaxed text-slate-600">
                              {item}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-5">
                      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                        <Icon name="frame" /> Key Frames / 可用畫面
                      </div>
                      <div className="overflow-x-auto rounded-2xl border border-slate-200">
                        <table className="w-full min-w-[760px] text-left text-sm">
                          <thead className="bg-slate-100 text-xs uppercase tracking-wider text-slate-500">
                            <tr>
                              <th className="px-4 py-3">時間</th>
                              <th className="px-4 py-3">角色</th>
                              <th className="px-4 py-3">AI觀察</th>
                              <th className="px-4 py-3">建議用途</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {(videoAnalysis.keyFrames || []).map((frame, index) => (
                              <tr key={`${frame.time}-${index}`} className="align-top">
                                <td className="px-4 py-3 font-semibold text-slate-900">{frame.time || "未標示"}</td>
                                <td className="px-4 py-3 text-slate-600">{frame.role || "畫面"}</td>
                                <td className="px-4 py-3 text-slate-600">{getFrameObservation(frame)}</td>
                                <td className="px-4 py-3 text-slate-600">{frame.recommendedUse || frame.purpose || "可用作分鏡參考"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-slate-950 p-5 text-slate-100">
                      <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                        <Icon name="doc" /> Transcript / VO
                      </div>
                      <pre className="max-h-72 overflow-auto whitespace-pre-wrap text-sm leading-relaxed text-slate-200">
                        {videoAnalysis.transcript || "未有 transcript，可能影片沒有聲音，或轉錄未成功。"}
                      </pre>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-5">
                      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                        <Icon name="layers" /> 改片建議
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        {(videoAnalysis.improvementIdeas?.length ? videoAnalysis.improvementIdeas : ["片頭痛點要更直接。", "CTA 建議中段及結尾各出一次。"]).map((item, index) => (
                          <div key={`${item}-${index}`} className="rounded-2xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-600">
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}


          {activeTab === "analysis" && (
            <div className="space-y-6">
              <Card>
                <div className="p-6">
                  <SectionTitle
                    icon="frame"
                    title="Reference Frame Gallery / 可抄畫面"
                    desc="AI 從 reference 影片抽出的畫面；生成分鏡稿時可用作畫面參考。"
                  />

                  {videoAnalysis.keyFrames?.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-3">
                      {videoAnalysis.keyFrames.map((frame, index) => {
                        const src = getReferenceFrameImageSrc(frame);

                        return (
                          <div key={`${frame.time || index}-gallery`} className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
                            {src ? (
                              <img
                                src={src}
                                alt={frame.time || "Reference frame"}
                                className="h-36 w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-36 items-center justify-center bg-slate-50 text-xs text-slate-400">
                                未有圖片資料
                              </div>
                            )}

                            <div className="p-4 text-sm leading-relaxed">
                              <div className="font-semibold text-slate-900">
                                {frame.time || "未標示"}｜{frame.role || "畫面"}
                              </div>
                              <div className="mt-2 text-xs text-slate-500 line-clamp-3">
                                {getFrameObservation(frame)}
                              </div>
                              <div className="mt-2 text-xs font-medium text-slate-700">
                                {frame.suggestedUse || frame.referencePattern || "可用作分鏡 reference"}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                      暫時未有 reference frame 圖。請先完成 AI影片分析。
                    </div>
                  )}
                </div>
              </Card>

              <Card>
                <div className="p-6">
                  <SectionTitle
                    icon="frame"
                    title="Reference 畫面選擇 / 用法標註"
                    desc="勾選想套入分鏡稿的 reference 畫面，並可簡短標註應該點用。"
                  />

                  {videoAnalysis.keyFrames?.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {videoAnalysis.keyFrames.map((frame, index) => {
                        const id = getReferenceFrameKey(frame, index);
                        const src = getReferenceFrameImageSrc(frame);
                        const active = selectedReferenceFrameIds.includes(id);

                        return (
                          <div
                            key={id}
                            className={
                              active
                                ? "rounded-3xl border border-slate-950 bg-white p-4 shadow-sm"
                                : "rounded-3xl border border-slate-200 bg-white p-4"
                            }
                          >
                            <button
                              type="button"
                              onClick={() => toggleReferenceFrameSelection(id)}
                              className="block w-full text-left"
                            >
                              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                                {src ? (
                                  <img src={src} alt={frame.time || "Reference frame"} className="h-40 w-full object-cover" />
                                ) : (
                                  <div className="flex h-40 items-center justify-center text-xs text-slate-400">未有圖片</div>
                                )}
                              </div>

                              <div className="mt-3 flex items-center justify-between gap-3">
                                <div className="text-sm font-semibold text-slate-900">
                                  {frame.time || "未標示"}｜{frame.role || "畫面"}
                                </div>
                                <span className={active ? "rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white" : "rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500"}>
                                  {active ? "#" + (selectedReferenceFrameIds.indexOf(id) + 1) : "選用"}
                                </span>
                              </div>

                              <div className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-500">
                                {getFrameObservation(frame)}
                              </div>
                            </button>

                            {active && (
                              <div className="mt-3 flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => moveReferenceFrameOrder(id, "up")}
                                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                                >
                                  上移
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveReferenceFrameOrder(id, "down")}
                                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                                >
                                  下移
                                </button>
                                <span className="text-xs text-slate-400">按 #1 → #2 → #3 順序作為分鏡 anchor</span>
                              </div>
                            )}

                            {active && (
                              <textarea
                                value={referenceFrameUsageNotes[id] || ""}
                                onChange={(event) => updateReferenceFrameUsageNote(id, event.target.value)}
                                placeholder="例：用作 0–3 秒 hook close-up / CTA 尾段 / 療程操作參考"
                                className="mt-3 min-h-20 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-400"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                      暫時未有 reference frame。請先完成 AI影片分析。
                    </div>
                  )}
                </div>
              </Card>

              <Card>
                <div className="p-6">
                  
                  {selectedReferenceFrameIds.length > 0 && (
                    <div className="mb-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold text-slate-900">已選 Reference 順序</div>
                        <button
                          type="button"
                          onClick={clearReferenceFrameOrder}
                          className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500"
                        >
                          清空
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedReferenceFrameIds.map((id, index) => {
                          const frames = Array.isArray(videoAnalysis?.keyFrames) ? videoAnalysis.keyFrames : [];
                          const frameIndex = frames.findIndex((frame, itemIndex) => getReferenceFrameKey(frame, itemIndex) === id);
                          const frame = frameIndex >= 0 ? frames[frameIndex] : null;

                          return (
                            <span key={id} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                              #{index + 1} {frame?.time || "未標示"}｜{frame?.role || "畫面"}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

<SectionTitle
                    icon="check"
                    title="改片建議選項"
                    desc="勾選想採用的分析建議，再生成分鏡稿。"
                  />

                  {analysisSuggestionItems.length > 0 ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      {analysisSuggestionItems.map((item) => {
                        const active = selectedAnalysisSuggestions.includes(item.id);

                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => toggleAnalysisSuggestion(item.id)}
                            className={
                              active
                                ? "rounded-3xl border border-slate-950 bg-slate-950 p-4 text-left text-sm text-white"
                                : "rounded-3xl border border-slate-200 bg-white p-4 text-left text-sm text-slate-700 hover:border-slate-400"
                            }
                          >
                            <div className={active ? "text-xs font-semibold text-slate-200" : "text-xs font-semibold text-slate-400"}>
                              {active ? "✓ 已選" : "+ 可選"}｜{item.type}
                            </div>
                            <div className="mt-2 leading-relaxed">{item.text}</div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                      暫時未有可選建議。完成 AI影片分析後會在這裡顯示。
                    </div>
                  )}

                  <div className="mt-5 flex flex-wrap justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedAnalysisSuggestions([])}
                      disabled={!selectedAnalysisSuggestions.length}
                    >
                      清空選擇
                    </Button>
                    <Button onClick={handleGenerateWithAi} disabled={appIsBusy}>
                      <Icon name="magic" /> {selectedAnalysisSuggestions.length ? "用選取建議生成分鏡稿" : "用以上分析生成分鏡稿"}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeTab === "script" && (
            <Card>
              <div className="p-6">
                <SectionTitle icon="frame" title="分鏡影片稿" desc={`目前來源：${sourceLabel}`} />
                                                                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">分鏡顯示模式</div>
                    <div className="text-xs text-slate-500"></div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setStoryboardViewMode("compact")}
                      className={storyboardViewMode === "compact" ? "rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white" : "rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600"}
                    >
                      精簡模式
                    </button>
                    <button
                      type="button"
                      onClick={() => setStoryboardViewMode("detail")}
                      className={storyboardViewMode === "detail" ? "rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white" : "rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600"}
                    >
                      詳細模式
                    </button>
                  </div>
                </div>

                {storyboardViewMode === "compact" ? (
                  <div className="overflow-x-auto rounded-3xl border border-slate-200">
                    <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
                      <thead className="bg-slate-100 text-xs uppercase tracking-wider text-slate-500">
                        <tr>
                          <th className="px-4 py-3">秒數</th>
                          <th className="px-4 py-3">素材</th>
                          <th className="px-4 py-3">畫面</th>
                          <th className="px-4 py-3">字幕 / VO</th>
                          <th className="px-4 py-3">備註</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {generated.rows.map((row, index) => (
                          <tr key={`${row.time}-compact-${index}`} className="align-top">
                            <td className="px-4 py-4">
                              <input
                                value={row.time || ""}
                                onChange={(event) => updateStoryboardRow(index, "time", event.target.value)}
                                className="w-24 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-slate-400"
                              />
                            </td>
                            <td className="px-4 py-4">
                              <select
                                value={row.materialType || "真人 Footage / 現有素材"}
                                onChange={(event) => updateStoryboardRow(index, "materialType", event.target.value)}
                                className="w-40 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-slate-400"
                              >
                                {["真人 Footage", "AI Gen 圖", "AI Gen 片", "現有素材", "B-roll", "文字動畫", "Screen Recording", "真人 Footage / 現有素材"].map((option) => (
                                  <option key={option} value={option}>{option}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-4">
                              {(() => {
                                const refFrame = resolveStoryboardReferenceFrame(row, index, generated.rows.length, videoAnalysis, selectedReferenceFrameIds);
                                const src = getStoryboardReferenceImageSrc(row) || getReferenceFrameImageSrc(refFrame);

                                if (!src) return null;

                                return (
                                  <div className="mb-3 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                                    <img
                                      src={src}
                                      alt={row.referenceFrameTime || refFrame?.time || "Reference frame"}
                                      className="h-28 w-48 object-cover"
                                    />
                                    <div className="px-3 py-2 text-xs text-slate-500">
                                      {row.referenceFrameTime || refFrame?.time || "Reference"}
                                    </div>
                                  </div>
                                );
                              })()}
                              <textarea
                                value={row.visual || ""}
                                onChange={(event) => updateStoryboardRow(index, "visual", event.target.value)}
                                className="min-h-24 w-72 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-400"
                              />
                            </td>
                            <td className="px-4 py-4">
                              <textarea
                                value={row.subtitleVo || [row.subtitle, row.vo].filter(Boolean).join("\n")}
                                onChange={(event) => updateStoryboardRow(index, "subtitleVo", event.target.value)}
                                className="min-h-24 w-72 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-slate-400"
                              />
                            </td>
                            <td className="px-4 py-4">
                              <textarea
                                value={row.note || ""}
                                onChange={(event) => updateStoryboardRow(index, "note", event.target.value)}
                                className="min-h-24 w-72 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-400"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-3xl border border-slate-200">
                    <table className="w-full min-w-[1700px] border-collapse text-left text-sm">
                      <thead className="bg-slate-100 text-xs uppercase tracking-wider text-slate-500">
                        <tr>
                          <th className="px-4 py-3">秒數</th>
                          <th className="px-4 py-3">素材來源 / 製作方式</th>
                          <th className="px-4 py-3">Reference 對應</th>
                          <th className="px-4 py-3">建議素材 / File Name</th>
                          <th className="px-4 py-3">畫面</th>
                          <th className="px-4 py-3">字幕 / VO</th>
                          <th className="px-4 py-3">目的</th>
                          <th className="px-4 py-3">Designer 備註</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {generated.rows.map((row, index) => (
                          <tr key={`${row.time}-detail-${index}`} className="align-top">
                            <td className="px-4 py-4">
                              <input value={row.time || ""} onChange={(event) => updateStoryboardRow(index, "time", event.target.value)} className="w-24 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-slate-400" />
                            </td>
                            <td className="px-4 py-4">
                              <select value={row.materialType || "真人 Footage / 現有素材"} onChange={(event) => updateStoryboardRow(index, "materialType", event.target.value)} className="w-44 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-slate-400">
                                {["真人 Footage", "AI Gen 圖", "AI Gen 片", "現有素材", "B-roll", "文字動畫", "Screen Recording", "真人 Footage / 現有素材"].map((option) => (
                                  <option key={option} value={option}>{option}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-4">
                              <textarea value={row.referenceMapping || ""} onChange={(event) => updateStoryboardRow(index, "referenceMapping", event.target.value)} className="min-h-24 w-64 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-400" />
                            </td>
                            <td className="px-4 py-4">
                              <textarea value={row.suggestedFileName || ""} onChange={(event) => updateStoryboardRow(index, "suggestedFileName", event.target.value)} className="min-h-24 w-56 rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-700 outline-none focus:border-slate-400" />
                            </td>
                            <td className="px-4 py-4">
                              {getStoryboardReferenceImageSrc(row) && (
                                <img src={getStoryboardReferenceImageSrc(row)} alt={row.referenceFrameTime || "Reference frame"} className="mb-3 h-28 w-48 rounded-xl border border-slate-200 object-cover" />
                              )}
                              {(() => {
                                const refFrame = resolveStoryboardReferenceFrame(row, index, generated.rows.length, videoAnalysis, selectedReferenceFrameIds);
                                const src = getStoryboardReferenceImageSrc(row) || getReferenceFrameImageSrc(refFrame);

                                if (!src) return null;

                                return (
                                  <div className="mb-3 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                                    <img
                                      src={src}
                                      alt={row.referenceFrameTime || refFrame?.time || "Reference frame"}
                                      className="h-28 w-48 object-cover"
                                    />
                                    <div className="px-3 py-2 text-xs text-slate-500">
                                      {row.referenceFrameTime || refFrame?.time || "Reference"}
                                    </div>
                                  </div>
                                );
                              })()}
                              <textarea value={row.visual || ""} onChange={(event) => updateStoryboardRow(index, "visual", event.target.value)} className="min-h-28 w-72 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-400" />
                            </td>
                            <td className="px-4 py-4">
                              <textarea value={row.subtitleVo || [row.subtitle, row.vo].filter(Boolean).join("\n")} onChange={(event) => updateStoryboardRow(index, "subtitleVo", event.target.value)} className="min-h-28 w-64 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-slate-400" />
                            </td>
                            <td className="px-4 py-4">
                              <textarea value={row.purpose || ""} onChange={(event) => updateStoryboardRow(index, "purpose", event.target.value)} className="min-h-24 w-56 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-400" />
                            </td>
                            <td className="px-4 py-4">
                              <textarea value={row.note || ""} onChange={(event) => updateStoryboardRow(index, "note", event.target.value)} className="min-h-24 w-64 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-400" />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="mt-5 flex flex-wrap gap-3">
                  <Button onClick={() => handleCopy(fullOutput, "完整稿")}>
                    <Icon name="copy" /> 複製完整稿
                  </Button>
                  <Button variant="outline" onClick={handleSaveAsContentJob}>
                    <Icon name="layers" /> Save as Content Job
                  </Button>
                  <Button variant="outline" onClick={() => setActiveTab("brief")}>
                    睇 Brief / Caption
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {activeTab === "brief" && (
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <div className="p-6">
                  <SectionTitle icon="doc" title="Designer Brief" desc="這頁可直接複製俾 Designer 開工。" />
                  <pre className="whitespace-pre-wrap rounded-3xl bg-slate-950 p-5 text-sm leading-relaxed text-slate-100">{generated.brief}</pre>
                  <Button className="mt-4" onClick={() => handleCopy(generated.brief, "Brief")}>
                    <Icon name="copy" /> 複製 Brief
                  </Button>
                </div>
              </Card>

              <Card>
                <div className="p-6">
                  <SectionTitle icon="message" title="Caption" desc="可按品牌、影片內容同投放目的重新生成不同風格。" />

                  <div className="mb-4 grid gap-2 md:grid-cols-2">
                    {CAPTION_REGEN_STYLES.map((style) => (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => setCaptionStyleId(style.id)}
                        className={
                          captionStyleId === style.id
                            ? "rounded-2xl border border-slate-950 bg-slate-950 px-4 py-3 text-left text-sm text-white"
                            : "rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-700 hover:border-slate-400"
                        }
                      >
                        <div className="font-semibold">{style.label}</div>
                        <div className={captionStyleId === style.id ? "mt-1 text-xs text-slate-200" : "mt-1 text-xs text-slate-400"}>
                          {style.desc}
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="mb-4 flex flex-wrap gap-3">
                    <Button onClick={handleRegenerateCaption} disabled={appIsBusy || captionRegenStatus === "loading"}>
                      <Icon name="magic" /> {captionRegenStatus === "loading" ? "重新生成中..." : "按選擇風格重新生成 Caption"}
                    </Button>
                    <Button variant="outline" onClick={() => handleCopy(generated.caption, "Caption")}>
                      <Icon name="copy" /> 複製 Caption
                    </Button>
                  </div>

                  {captionRegenError && (
                    <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                      Caption 生成提示：{captionRegenError}
                    </div>
                  )}

                  {captionRegenStatus === "done" && (
                    <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                      Caption 已按選擇風格重新生成。
                    </div>
                  )}

                  <pre className="whitespace-pre-wrap rounded-3xl bg-slate-50 p-5 text-sm leading-relaxed text-slate-700">{generated.caption}</pre>
                </div>
              </Card>
            </div>
          )}

          {activeTab === "references" && (
            <div className="space-y-6">
              <Card>
                <div className="p-6">
                  <SectionTitle icon="frame" title="參考素材探索" desc="輸入服務關鍵字，快速生成 Meta / Facebook 搜尋方向、預覽及儲存流程。" />
                  <div className="mt-5 flex flex-col gap-3 lg:flex-row">
                    <input
                      value={discoveryKeyword}
                      onChange={(event) => setDiscoveryKeyword(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") handleGenerateDiscoveryPlan();
                      }}
                      placeholder="搜尋服務、痛點或療程，例如：頭皮護理、facial、scalp treatment"
                      className="min-h-14 flex-1 rounded-3xl border border-slate-200 bg-white px-5 text-lg font-semibold text-slate-950 outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                    />
                    <div className="flex gap-3">
                      <Button className="min-h-14 px-6" onClick={handleGenerateDiscoveryPlan}>
                        <Icon name="magic" /> 搜尋
                      </Button>
                      <Button className="min-h-14" variant="outline" onClick={handleClearDiscovery}>
                        清除
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3 text-sm leading-relaxed text-slate-500">
                    系統會產生適合 Meta Ad Library 及 Facebook Search 的短關鍵字、開新分頁連結及 App 內預覽。此版本不會 crawler、scrape 或擷取平台內容。
                  </div>

                  <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">搜尋設定</div>
                    <div className="grid gap-3 md:grid-cols-5">
                      <TextInput label="競爭品牌" value={discoveryCompetitor} onChange={setDiscoveryCompetitor} />
                      <TextInput label="地區" value={discoveryCountry} onChange={setDiscoveryCountry} />
                      <TextInput label="行業" value={discoveryIndustry} onChange={setDiscoveryIndustry} />
                      <TextInput label="廣告目標" value={discoveryObjective} onChange={setDiscoveryObjective} />
                      <TextInput label="優惠類型" value={discoveryOfferType} onChange={setDiscoveryOfferType} />
                    </div>
                  </div>
                </div>
              </Card>

              <div className="grid gap-6 xl:grid-cols-[1fr_390px]">
                <div className="space-y-6">
                  <Card>
                    <div className="p-6">
                      <SectionTitle icon="target" title="搜尋結果" desc={discoveryPlan ? "按以下候選關鍵字搜尋、預覽，再儲存選中的參考素材。" : "請先輸入服務關鍵字並按搜尋。"} />

                      {discoveryPlan ? (
                        <div className="space-y-5">
                          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                            <div className="mb-2 text-sm font-semibold text-slate-900">搜尋方向</div>
                            <pre className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{discoveryPlan.searchBrief}</pre>
                          </div>

                          {[
                            { title: "主要搜尋", type: "primary", queries: discoveryPlan.primaryQueries },
                            { title: "角度搜尋", type: "angle", queries: discoveryPlan.angleQueries },
                            { title: "競爭對手搜尋", type: "competitor", queries: discoveryPlan.competitorQueries },
                          ].map((section) => (
                            <div key={section.title}>
                              <div className="mb-3 flex items-center justify-between gap-3">
                                <div className="text-sm font-semibold text-slate-900">{section.title}</div>
                                <div className="text-xs text-slate-400">{section.queries.length} 個候選字</div>
                              </div>
                              {section.queries.length ? (
                                <div className="grid gap-3">
                                  {section.queries.map((query) => {
                                    const metaUrl = buildMetaAdLibrarySearchUrl(query, discoveryCountry);
                                    const facebookUrl = buildFacebookSearchUrl(query);
                                    const matchingReference = referenceAds.find(
                                      (reference) =>
                                        String(reference.title || "").trim().toLowerCase() === query.toLowerCase() ||
                                        String(reference.sourceUrl || "") === metaUrl ||
                                        String(reference.sourceUrl || "") === facebookUrl
                                    );

                                    return (
                                      <div key={`${section.type}-${query}`} className="rounded-3xl border border-slate-200 bg-white p-4 hover:border-slate-300">
                                        <div className="flex flex-wrap items-start justify-between gap-4">
                                          <div className="min-w-0 flex-1">
                                            <div className="text-base font-semibold text-slate-950">{query}</div>
                                            <div className="mt-1 text-sm leading-relaxed text-slate-500">
                                              {section.type === "competitor"
                                                ? "用競爭品牌搜尋，觀察 offer、hook 及素材方向。"
                                                : section.type === "angle"
                                                ? "用痛點或本地化角度搜尋，揾可參考的開場及畫面節奏。"
                                                : "用核心服務字搜尋，先建立 Meta / Facebook 參考素材池。"}
                                            </div>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                              {[section.title, ...discoveryPlan.suggestedTags.slice(0, 4)].map((tag) => (
                                                <span key={`${query}-${tag}`} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                                  {tag}
                                                </span>
                                              ))}
                                            </div>
                                          </div>
                                          {matchingReference && (
                                            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                                              已儲存
                                            </span>
                                          )}
                                        </div>

                                        <div className="mt-4 flex flex-wrap gap-2">
                                          <a
                                            href={metaUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                          >
                                            開啟 Meta
                                          </a>
                                          <a
                                            href={facebookUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                          >
                                            開啟 Facebook
                                          </a>
                                          <Button variant="outline" onClick={() => handlePreviewMetaSearch(metaUrl, query)}>
                                            App 內預覽
                                          </Button>
                                          <Button
                                            variant="outline"
                                            onClick={() =>
                                              setReferenceDraft((current) => ({
                                                ...current,
                                                title: query,
                                                platform: "Meta Ad Library",
                                                sourceUrl: metaUrl,
                                                competitorBrand: section.type === "competitor" ? discoveryCompetitor : current.competitorBrand,
                                                targetBrand: selectedBrand || current.targetBrand || "",
                                                offer: discoveryOfferType || current.offer,
                                                angle: section.title,
                                                hookNotes: `搜尋字：${query}`,
                                                productionNotes: discoveryPlan.searchBrief,
                                                tags: discoveryPlan.suggestedTags.join(", "),
                                              }))
                                            }
                                          >
                                            填入草稿
                                          </Button>
                                          {matchingReference && (
                                            <Button onClick={() => handleApplyReferenceToDraft(matchingReference.id)}>
                                              套用已儲存參考
                                            </Button>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                                  暫時未有相關候選字。
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm leading-relaxed text-slate-500">
                          好似搜尋器一樣輸入服務或痛點，系統會幫你整理短關鍵字、Meta 連結、Facebook 連結及預覽操作。
                        </div>
                      )}
                    </div>
                  </Card>

                  {embeddedPreviewUrl && (
                    <Card>
                      <div className="p-6">
                        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                          <SectionTitle
                            icon="frame"
                            title="搜尋預覽"
                            desc={`${embeddedPreviewType === "meta" ? "Meta Ad Library" : "Facebook Search"} - ${embeddedPreviewTitle}`}
                          />
                          <Button variant="outline" onClick={handleClearEmbeddedPreview}>
                            清除預覽
                          </Button>
                        </div>

                        <div className="mb-4 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-800">
                          <div className="font-semibold">預覽提示</div>
                          <div className="mt-1">
                            {embeddedPreviewNotice || "如果預覽空白或被平台封鎖，請用開新分頁查看。此版本不會爬取 Meta 或 Facebook 內容，iframe 只作方便瀏覽。"}
                          </div>
                        </div>

                        <div className="mb-4 break-all rounded-2xl bg-slate-50 p-3 text-xs text-slate-500">
                          {embeddedPreviewUrl}
                        </div>

                        <div className="mb-4 flex flex-wrap gap-3">
                          <a
                            href={embeddedPreviewUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                          >
                            開新分頁
                          </a>
                          <Button
                            variant="outline"
                            onClick={() => handleReferenceDraftChange("sourceUrl", embeddedPreviewUrl)}
                          >
                            填入參考連結
                          </Button>
                        </div>

                        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
                          <iframe
                            title={`搜尋預覽 - ${embeddedPreviewTitle}`}
                            src={embeddedPreviewUrl}
                            className="h-[780px] w-full bg-white"
                            sandbox="allow-forms allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
                            referrerPolicy="strict-origin-when-cross-origin"
                          />
                        </div>
                      </div>
                    </Card>
                  )}
                </div>

                <div className="space-y-6">
                  <Card>
                    <div className="p-6">
                      <SectionTitle icon="plus" title="儲存選中參考" desc="搜尋及預覽後，將最終選中的參考連結儲存，方便交給 Designer。" />
                      <div className="grid gap-4">
                        <TextInput
                          label="參考素材標題"
                          value={referenceDraft.title}
                          onChange={(value) => handleReferenceDraftChange("title", value)}
                          placeholder={createReferenceTitle(referenceDraft)}
                        />
                        <SelectInput
                          label="平台"
                          value={referenceDraft.platform}
                          onChange={(value) => handleReferenceDraftChange("platform", value)}
                          options={["Facebook", "Meta Ad Library", "Instagram", "TikTok", "YouTube", "Other"]}
                        />
                        <TextInput label="參考連結" value={referenceDraft.sourceUrl} onChange={(value) => handleReferenceDraftChange("sourceUrl", value)} />
                        <TextInput label="競爭品牌" value={referenceDraft.competitorBrand} onChange={(value) => handleReferenceDraftChange("competitorBrand", value)} />
                        <TextInput label="目標品牌" value={referenceDraft.targetBrand} onChange={(value) => handleReferenceDraftChange("targetBrand", value)} />
                        <TextInput label="優惠" value={referenceDraft.offer} onChange={(value) => handleReferenceDraftChange("offer", value)} />
                        <TextInput label="內容角度" value={referenceDraft.angle} onChange={(value) => handleReferenceDraftChange("angle", value)} />
                        <TextInput label="Hook 備註" value={referenceDraft.hookNotes} onChange={(value) => handleReferenceDraftChange("hookNotes", value)} textarea rows={3} />
                        <TextInput label="畫面備註" value={referenceDraft.visualNotes} onChange={(value) => handleReferenceDraftChange("visualNotes", value)} textarea rows={3} />
                        <TextInput label="Caption 備註" value={referenceDraft.captionNotes} onChange={(value) => handleReferenceDraftChange("captionNotes", value)} textarea rows={3} />
                        <TextInput label="製作備註" value={referenceDraft.productionNotes} onChange={(value) => handleReferenceDraftChange("productionNotes", value)} textarea rows={3} />
                        <TextInput label="標籤" value={referenceDraft.tags} onChange={(value) => handleReferenceDraftChange("tags", value)} placeholder="hook, offer, before-after" />
                        <Button onClick={handleSaveReferenceAd}>
                          <Icon name="plus" /> 儲存參考
                        </Button>
                      </div>
                    </div>
                  </Card>

                  <Card>
                    <div className="p-6">
                      <SectionTitle icon="alert" title="使用說明" desc="此頁只協助搜尋、預覽及儲存參考素材。" />
                      <div className="space-y-3 text-sm leading-relaxed text-slate-600">
                        <p>沒有 crawler、scraping、backend 或外部 API。</p>
                        <p>Meta / Facebook 可能會封鎖 iframe 預覽；如畫面空白，請開新分頁。</p>
                        <p>套用參考只會標記一個已儲存素材，方便儲存 Content Job 時交接給 Designer；不會改變 AI 生成。</p>
                      </div>
                      {appliedReference && (
                        <div className="mt-5 rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                          <div className="font-semibold">已套用參考</div>
                          <div className="mt-2 grid gap-1">
                            <div>{appliedReference.title}</div>
                            {appliedReference.sourceUrl && <div className="break-all">{appliedReference.sourceUrl}</div>}
                            {appliedReference.angle && <div>內容角度：{appliedReference.angle}</div>}
                            {appliedReference.offer && <div>優惠：{appliedReference.offer}</div>}
                          </div>
                          <Button className="mt-4" variant="outline" onClick={() => setAppliedReferenceId("")}>
                            清除已套用參考
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>

                  <Card>
                    <div className="p-6">
                      <SectionTitle icon="frame" title="已儲存參考" desc="已儲存的廣告參考素材。" />
                      {referenceAds.length ? (
                        <div className="grid gap-3">
                          {referenceAds.map((reference) => {
                            const active = selectedReference?.id === reference.id;
                            const applied = appliedReferenceId === reference.id;
                            return (
                              <div
                                key={reference.id}
                                className={`rounded-3xl border p-4 transition ${
                                  active ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-800"
                                }`}
                              >
                                <button type="button" onClick={() => setSelectedReferenceId(reference.id)} className="w-full text-left">
                                  <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                      <div className="font-semibold">{reference.title || "未命名參考"}</div>
                                      <div className={`mt-1 text-xs ${active ? "text-slate-300" : "text-slate-500"}`}>
                                        {[reference.platform, reference.competitorBrand, formatJobDate(reference.createdAt)].filter(Boolean).join(" - ")}
                                      </div>
                                    </div>
                                    {applied && (
                                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                                        已套用
                                      </span>
                                    )}
                                  </div>
                                  <div className={`mt-3 grid gap-1 text-sm ${active ? "text-slate-200" : "text-slate-600"}`}>
                                    {reference.offer && <div>優惠：{reference.offer}</div>}
                                    {reference.angle && <div>內容角度：{reference.angle}</div>}
                                    {reference.tags && <div>標籤：{reference.tags}</div>}
                                  </div>
                                </button>
                                <div className="mt-4 flex flex-wrap gap-2">
                                  {reference.sourceUrl && (
                                    <a
                                      href={reference.sourceUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className={`inline-flex items-center justify-center rounded-2xl border px-4 py-2.5 text-sm font-medium transition ${
                                        active ? "border-white/30 text-white hover:bg-white/10" : "border-slate-200 text-slate-700 hover:bg-slate-50"
                                      }`}
                                    >
                                      開啟來源
                                    </a>
                                  )}
                                  <Button variant="outline" onClick={() => handleCopyReferenceBrief(reference)}>
                                    複製 Brief
                                  </Button>
                                  <Button variant="outline" onClick={() => handleApplyReferenceToDraft(reference.id)}>
                                    套用參考
                                  </Button>
                                  <Button variant="danger" onClick={() => handleDeleteReferenceAd(reference.id)}>
                                    刪除
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                          已儲存的參考素材會顯示在這裡。
                        </div>
                      )}
                    </div>
                  </Card>

                  {selectedReference && (
                    <Card>
                      <div className="p-6">
                        <SectionTitle icon="doc" title="參考素材詳情" desc={`${selectedReference.title} - 已更新 ${formatJobDate(selectedReference.updatedAt)}`} />
                        <div className="grid gap-4">
                          <TextInput label="參考素材標題" value={selectedReference.title || ""} onChange={(value) => updateReferenceAd(selectedReference.id, { title: value })} />
                          <SelectInput
                            label="平台"
                            value={selectedReference.platform || "Facebook"}
                            onChange={(value) => updateReferenceAd(selectedReference.id, { platform: value })}
                            options={["Facebook", "Meta Ad Library", "Instagram", "TikTok", "YouTube", "Other"]}
                          />
                          <TextInput label="參考連結" value={selectedReference.sourceUrl || ""} onChange={(value) => updateReferenceAd(selectedReference.id, { sourceUrl: value })} />
                          <TextInput label="競爭品牌" value={selectedReference.competitorBrand || ""} onChange={(value) => updateReferenceAd(selectedReference.id, { competitorBrand: value })} />
                          <TextInput label="目標品牌" value={selectedReference.targetBrand || ""} onChange={(value) => updateReferenceAd(selectedReference.id, { targetBrand: value })} />
                          <TextInput label="優惠" value={selectedReference.offer || ""} onChange={(value) => updateReferenceAd(selectedReference.id, { offer: value })} />
                          <TextInput label="內容角度" value={selectedReference.angle || ""} onChange={(value) => updateReferenceAd(selectedReference.id, { angle: value })} />
                          <TextInput label="標籤" value={selectedReference.tags || ""} onChange={(value) => updateReferenceAd(selectedReference.id, { tags: value })} />
                          <TextInput label="Hook 備註" value={selectedReference.hookNotes || ""} onChange={(value) => updateReferenceAd(selectedReference.id, { hookNotes: value })} textarea rows={3} />
                          <TextInput label="畫面備註" value={selectedReference.visualNotes || ""} onChange={(value) => updateReferenceAd(selectedReference.id, { visualNotes: value })} textarea rows={3} />
                          <TextInput label="Caption 備註" value={selectedReference.captionNotes || ""} onChange={(value) => updateReferenceAd(selectedReference.id, { captionNotes: value })} textarea rows={3} />
                          <TextInput label="製作備註" value={selectedReference.productionNotes || ""} onChange={(value) => updateReferenceAd(selectedReference.id, { productionNotes: value })} textarea rows={3} />
                        </div>

                        <div className="mt-6 flex flex-wrap gap-3">
                          <Button variant="outline" onClick={() => handleCopyReferenceBrief(selectedReference)}>
                            <Icon name="copy" /> 複製 Brief
                          </Button>
                          <Button onClick={() => handleApplyReferenceToDraft(selectedReference.id)}>
                            <Icon name="check" /> 套用參考
                          </Button>
                          <Button variant="danger" onClick={() => handleDeleteReferenceAd(selectedReference.id)}>
                            刪除參考
                          </Button>
                        </div>

                        <div className="mt-6">
                          <div className="mb-3 text-sm font-semibold text-slate-900">參考 Brief</div>
                          <pre className="whitespace-pre-wrap rounded-3xl bg-slate-950 p-5 text-sm leading-relaxed text-slate-100">{formatReferenceBrief(selectedReference)}</pre>
                        </div>
                      </div>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "jobs" && (
            <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
              <div className="space-y-6">
                <Card>
                  <div className="p-6">
                    <SectionTitle icon="layers" title="Save as Content Job" desc="Save the current generated script into the production queue." />
                    <div className="grid gap-4">
                      <TextInput
                        label="Job title"
                        value={jobDraft.draftTitle}
                        onChange={(value) => handleJobDraftChange("draftTitle", value)}
                        placeholder={createJobTitle({ brandCode: selectedBrand, form })}
                      />
                      <SelectInput
                        label="Content type"
                        value={jobDraft.contentType}
                        onChange={(value) => handleJobDraftChange("contentType", value)}
                        options={ALYSSA_CONTENT_TYPE_OPTIONS}
                      />
                      <SelectInput
                        label="Priority"
                        value={jobDraft.priority}
                        onChange={(value) => handleJobDraftChange("priority", value)}
                        options={JOB_PRIORITY_OPTIONS}
                      />
                      <SelectInput
                        label="Assigned designer"
                        value={jobDraft.assignedDesigner}
                        onChange={(value) => handleJobDraftChange("assignedDesigner", value)}
                        options={DESIGNER_OPTIONS}
                      />
                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-slate-700">Deadline</span>
                        <input
                          type="date"
                          value={jobDraft.deadline}
                          onChange={(event) => handleJobDraftChange("deadline", event.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                        />
                      </label>
                      <TextInput
                        label="Marketer notes"
                        value={jobDraft.marketerNotes}
                        onChange={(value) => handleJobDraftChange("marketerNotes", value)}
                        textarea
                        rows={4}
                      />
                      <Button onClick={handleSaveAsContentJob}>
                        <Icon name="layers" /> Save current script as job
                      </Button>
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="p-6">
                    <SectionTitle icon="target" title="Job Status Summary" desc="Local browser queue snapshot." />
                    {contentJobs.length ? (
                      <div className="grid gap-2">
                        {jobStatusCounts.map((item) => {
                          const meta = getJobStatusMeta(item.status);
                          return (
                            <div key={item.status} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${meta.className}`}>{item.status}</span>
                              <span className="text-sm font-semibold text-slate-900">{item.count}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                        No jobs yet. Generate or edit a storyboard, then save it as the first Content Job.
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <div className="p-6">
                    <SectionTitle icon="layers" title="Content Jobs" desc="Designer-facing local job board." />
                    {contentJobs.length ? (
                      <div className="grid gap-3">
                        {contentJobs.map((job) => {
                          const meta = getJobStatusMeta(job.status);
                          const active = selectedJob?.id === job.id;
                          return (
                            <button
                              key={job.id}
                              type="button"
                              onClick={() => setSelectedJobId(job.id)}
                              className={`rounded-3xl border p-4 text-left transition ${
                                active ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                              }`}
                            >
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <div className="font-semibold">{job.title}</div>
                                  <div className={`mt-1 text-xs ${active ? "text-slate-300" : "text-slate-500"}`}>
                                    {[job.brandCode, job.contentType, formatJobDate(job.deadline)].filter(Boolean).join(" · ")}
                                  </div>
                                </div>
                                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${active ? "bg-white text-slate-950" : meta.className}`}>
                                  {meta.label}
                                </span>
                              </div>
                              <div className={`mt-3 flex flex-wrap gap-2 text-xs ${active ? "text-slate-200" : "text-slate-500"}`}>
                                <span>{job.assignedDesigner || "Unassigned"}</span>
                                <span>Priority: {job.priority || "Normal"}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                        Saved jobs will appear here.
                      </div>
                    )}
                  </div>
                </Card>

                {selectedJob && (
                  <Card>
                    <div className="p-6">
                      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                        <SectionTitle icon="doc" title="Selected Job Detail" desc={`${selectedJob.title} · updated ${formatJobDate(selectedJob.updatedAt)}`} />
                        <Button variant="danger" onClick={() => handleDeleteJob(selectedJob.id)}>
                          Delete Job
                        </Button>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <SelectInput label="Status" value={selectedJob.status} onChange={(value) => updateContentJob(selectedJob.id, { status: value })} options={JOB_STATUS_OPTIONS} />
                        <SelectInput label="Assigned designer" value={selectedJob.assignedDesigner} onChange={(value) => updateContentJob(selectedJob.id, { assignedDesigner: value })} options={DESIGNER_OPTIONS} />
                        <SelectInput label="Priority" value={selectedJob.priority} onChange={(value) => updateContentJob(selectedJob.id, { priority: value })} options={JOB_PRIORITY_OPTIONS} />
                        <label className="block">
                          <span className="mb-2 block text-sm font-medium text-slate-700">Deadline</span>
                          <input
                            type="date"
                            value={selectedJob.deadline || ""}
                            onChange={(event) => updateContentJob(selectedJob.id, { deadline: event.target.value })}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                          />
                        </label>
                        <TextInput label="Google Drive output link" value={selectedJob.outputLink || ""} onChange={(value) => updateContentJob(selectedJob.id, { outputLink: value })} />
                        <TextInput label="Reference URL" value={selectedJob.referenceUrl || ""} onChange={(value) => updateContentJob(selectedJob.id, { referenceUrl: value })} />
                        <div className="md:col-span-2">
                          <TextInput label="Marketer notes" value={selectedJob.marketerNotes || ""} onChange={(value) => updateContentJob(selectedJob.id, { marketerNotes: value })} textarea rows={4} />
                        </div>
                        <div className="md:col-span-2">
                          <TextInput label="Designer notes" value={selectedJob.designerNotes || ""} onChange={(value) => updateContentJob(selectedJob.id, { designerNotes: value })} textarea rows={4} />
                        </div>
                      </div>

                      <div className="mt-6 grid gap-6">
                        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                          <div className="mb-3 text-sm font-semibold text-slate-900">Production checklist</div>
                          <div className="grid gap-2">
                            {(selectedJob.productionChecklist || []).map((item) => (
                              <div key={item} className="flex gap-2 text-sm text-slate-700">
                                <Icon name="check" className="mt-0.5 text-emerald-600" />
                                <span>{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <div className="mb-3 text-sm font-semibold text-slate-900">Caption</div>
                          <pre className="whitespace-pre-wrap rounded-3xl bg-slate-50 p-5 text-sm leading-relaxed text-slate-700">{selectedJob.caption || "No caption saved."}</pre>
                        </div>

                        <div>
                          <div className="mb-3 text-sm font-semibold text-slate-900">Storyboard preview</div>
                          <div className="overflow-x-auto rounded-3xl border border-slate-200">
                            <table className="w-full min-w-[900px] border-collapse text-left text-sm">
                              <thead className="bg-slate-100 text-xs uppercase tracking-wider text-slate-500">
                                <tr>
                                  <th className="px-4 py-3">Time</th>
                                  <th className="px-4 py-3">Material</th>
                                  <th className="px-4 py-3">Visual</th>
                                  <th className="px-4 py-3">Subtitle / VO</th>
                                  <th className="px-4 py-3">Notes</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200 bg-white">
                                {getJobPreviewRows(selectedJob).map((row, index) => (
                                  <tr key={`${selectedJob.id}-preview-${index}`} className="align-top">
                                    <td className="px-4 py-4 font-semibold text-slate-900">{row.time || ""}</td>
                                    <td className="px-4 py-4 text-slate-700">{row.materialType || ""}</td>
                                    <td className="px-4 py-4 text-slate-700">{row.visual || ""}</td>
                                    <td className="whitespace-pre-wrap px-4 py-4 font-medium text-slate-900">{row.subtitleVo || [row.subtitle, row.vo].filter(Boolean).join("\n")}</td>
                                    <td className="px-4 py-4 text-slate-700">{row.note || row.purpose || ""}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        <div>
                          <div className="mb-3 text-sm font-semibold text-slate-900">Full brief</div>
                          <pre className="whitespace-pre-wrap rounded-3xl bg-slate-950 p-5 text-sm leading-relaxed text-slate-100">{selectedJob.brief || "No brief saved."}</pre>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          )}

          {activeTab === "database" && (
            <Card>
              <div className="p-6">
                <SectionTitle icon="db" title="品牌資料庫" desc="在這裡新增 / 修改品牌設定。資料會保存在此瀏覽器；重置示範資料才會清除自訂品牌。" />

                <div className="mb-6 flex flex-wrap gap-3">
                  <Button onClick={addBrand}>
                    <Icon name="plus" /> 新增品牌
                  </Button>
                  <Button variant="outline" onClick={resetBrandDatabase}>
                    重置示範資料
                  </Button>

                </div>

                <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
                  <div className="space-y-2">
                    {brandRecords.map((brand) => {
                      const normalized = normalizeBrandRecord(brand);
                      return (
                        <button
                          type="button"
                          key={normalized.code}
                          onClick={() => {
                            setEditingBrandCode(normalized.code);
                            setSelectedBrand(normalized.code);
                            setAiGenerated(null);
                            setSourceLabel("本地生成");
                          }}
                          className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition ${
                            editingBrandCode === normalized.code ? "border-slate-900 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <div className="font-semibold">
                            {normalized.code} · {normalized.name}
                          </div>
                          <div className={`mt-1 text-xs ${editingBrandCode === normalized.code ? "text-slate-200" : "text-slate-500"}`}>{normalized.cta}</div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">編輯品牌設定</div>
                        <div className="mt-1 text-xs leading-relaxed text-slate-500">
                          {editingBrand.code || selectedBrand} · {editingBrand.name || "未命名品牌"}
                        </div>
                      </div>
                      <Button variant="danger" onClick={deleteEditingBrand} disabled={brandRecords.length <= 1}>
                        刪除
                      </Button>
                    </div>

                    <div className="mb-5 flex flex-wrap gap-2 rounded-3xl border border-slate-200 bg-white p-2">
                      {[
                        { id: "basic", label: "品牌基本資料" },
                        { id: "rules", label: "出稿規則" },
                        { id: "treatments", label: "療程資料庫" },
                      ].map((panel) => (
                        <button
                          key={panel.id}
                          type="button"
                          onClick={() => setDatabasePanel(panel.id)}
                          className={
                            databasePanel === panel.id
                              ? "rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
                              : "rounded-2xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                          }
                        >
                          {panel.label}
                        </button>
                      ))}
                    </div>

                    {databasePanel === "basic" && (
                      <div className="grid gap-5 md:grid-cols-2">
                        <TextInput label="Brand Code" value={editingBrand.code} onChange={(value) => updateEditingBrand("code", value.toUpperCase())} />
                        <TextInput label="品牌名稱" value={editingBrand.name} onChange={(value) => updateEditingBrand("name", value)} />
                        <TextInput label="品牌語氣" value={editingBrand.tone} onChange={(value) => updateEditingBrand("tone", value)} textarea />
                        <TextInput label="預設 CTA" value={editingBrand.cta} onChange={(value) => updateEditingBrand("cta", value)} textarea />
                        <TextInput label="分店" value={editingBrand.branches} onChange={(value) => updateEditingBrand("branches", value)} textarea />
                        <TextInput label="WhatsApp" value={editingBrand.whatsapp} onChange={(value) => updateEditingBrand("whatsapp", value)} />
                        <TextInput label="Website URL" value={editingBrand.websiteUrl} onChange={(value) => updateEditingBrand("websiteUrl", value)} />
                        <TextInput label="Instagram URL" value={editingBrand.instagramUrl} onChange={(value) => updateEditingBrand("instagramUrl", value)} />
                        <TextInput label="Facebook URL" value={editingBrand.facebookUrl} onChange={(value) => updateEditingBrand("facebookUrl", value)} />

                        <div className="md:col-span-2 rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-slate-900">讀取 Website / Social 更新品牌風格</div>
                              <div className="mt-1 text-xs leading-relaxed text-slate-500">
                                填寫上方 Website、Instagram 或 Facebook 後，可自動整理品牌語氣、常用字眼、CTA 及 Footer。
                              </div>
                            </div>
                            <Button variant="outline" onClick={handleUpdateBrandStyle} disabled={styleUpdateStatus === "loading"}>
                              <Icon name="cloud" /> {styleUpdateStatus === "loading" ? "讀取中..." : "讀取品牌風格"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {databasePanel === "rules" && (
                      <div className="grid gap-5 md:grid-cols-2">
                        <BrandRulePresetField
                          label="影片稿規則"
                          field="scriptRule"
                          value={editingBrand.scriptRule}
                          onChange={(value) => updateEditingBrand("scriptRule", value)}
                        />
                        <BrandRulePresetField
                          label="禁用字"
                          field="bannedWords"
                          value={editingBrand.bannedWords}
                          onChange={(value) => updateEditingBrand("bannedWords", value)}
                        />
                        <BrandRulePresetField
                          label="安全替代表達"
                          field="safePhrases"
                          value={editingBrand.safePhrases}
                          onChange={(value) => updateEditingBrand("safePhrases", value)}
                        />
                        <BrandRulePresetField
                          label="Hook 規則"
                          field="hookRule"
                          value={editingBrand.hookRule}
                          onChange={(value) => updateEditingBrand("hookRule", value)}
                        />
                        <div className="md:col-span-2">
                          <TextInput label="Footer / 結尾固定資訊" value={editingBrand.footer} onChange={(value) => updateEditingBrand("footer", value)} textarea rows={4} />
                        </div>
                      </div>
                    )}

                    {databasePanel === "treatments" && (
                      <TreatmentLibraryEditor
                        editingBrand={editingBrand}
                        updateEditingBrand={updateEditingBrand}
                        updateEditingBrandFields={updateEditingBrandFields}
                      />
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {activeTab === "settings" && (
            <Card>
              <div className="p-6">
                <SectionTitle icon="settings" title="設定及測試" desc="這裡保留生成 checklist 及 built-in tests，方便之後正式上線前做 smoke test。" />

                <div className="rounded-3xl border border-slate-200 bg-white p-5">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">生成重點 Checklist</div>
                      <div className="text-xs text-slate-500">可用來控制每份稿件必須包含的元素。</div>
                    </div>
                    <Button variant="outline" onClick={addCustomPoint}>
                      <Icon name="plus" /> 新增
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {customPoints.map((point, index) => (
                      <div key={`${point}-${index}`} className="flex gap-2">
                        <input
                          value={point}
                          onChange={(event) => updateCustomPoint(index, event.target.value)}
                          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                        />
                        <Button variant="outline" onClick={() => removeCustomPoint(index)}>
                          <Icon name="close" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <Icon name="check" /> Built-in Tests
                  </div>
                  <div className="space-y-2">
                    {testResults.map((test) => (
                      <div key={test.name} className="flex items-start justify-between gap-4 rounded-2xl bg-white px-4 py-3 text-sm">
                        <div>
                          <div className="font-medium text-slate-800">{test.name}</div>
                          {test.details && <div className="mt-1 text-xs text-slate-500">{test.details}</div>}
                        </div>
                        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${test.passed ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                          {test.passed ? "PASS" : "FAIL"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          )}
        {aiGenerated && (
          <Card>
            <div className="p-6">
              <SectionTitle
                icon="magic"
                title="AI 改稿指令"
                desc="想調整分鏡稿？輸入修改方向即可，系統會沿用上一份影片分析、品牌設定同現有分鏡稿，無需重新上傳影片。"
              />

              <textarea
                value={revisionInstruction}
                rows={5}
                onChange={(event) => setRevisionInstruction(event.target.value)}
                placeholder={"例：\n- 0–3秒痛點再直接啲，字幕短啲\n- 9–18秒加多啲療程 close-up\n- CTA 縮短啲，集中 WhatsApp 預約\n- 跟 AI影片分析建議，加快片頭節奏\n- 減少醫療感，避開治療、生髮、永久改善"}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
              />

              <div className="mt-4 flex flex-wrap items-center gap-3">
                {storyboardIsStale && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-800">
                    目前分鏡稿已過期：品牌、項目名稱或療程已更改。請先重新生成新稿，避免舊品牌 / 舊療程內容污染改稿結果。
                  </div>
                )}

                <Button onClick={handleRegenerateWithInstruction} disabled={appIsBusy || !aiGenerated || storyboardIsStale}>
                  <Icon name="magic" /> {revisionStatus === "loading" ? "AI 按指示改稿中..." : "按指示重生分鏡稿"}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    setRevisionInstruction("");
                    setRevisionMessage("");
                    setRevisionStatus("idle");
                  }}
                >
                  清空指令
                </Button>

                {revisionMessage && (
                  <span className={revisionStatus === "error" ? "text-sm text-red-600" : "text-sm text-slate-500"}>
                    {revisionMessage}
                  </span>
                )}
              </div>
            </div>
          </Card>
        )}

        </section>
      </main>
    </div>
  );
}
