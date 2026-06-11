"use client";

import React, { useEffect, useMemo, useState } from "react";
import { upload } from "@vercel/blob/client";

const initialBrandRecords = [];

const BRAND_RECORDS_STORAGE_KEY = "aiCreativeScriptGenerator.brandRecords.v1";
const TREATMENT_LIBRARY_STORAGE_KEY = "ai_creative_treatment_library_v1";
const CONTENT_JOBS_STORAGE_KEY = "alyssaCreativeSop.contentJobs.v1";
const REFERENCE_ADS_STORAGE_KEY = "alyssaCreativeSop.referenceAds.v1";
const BRAND_INTELLIGENCE_STORAGE_KEY = "alyssaCreativeSop.brandIntelligence.v1";
const BRAND_LIBRARY_STORAGE_KEY = "alyssaCreativeSop.brandLibrary.v1";
const CREATIVE_SESSION_STORAGE_KEY = "alyssaCreativeSop.creativeSession.v1";

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

function createJobTitle({ draftTitle, brandCode, brandName, form }) {
  const explicitTitle = String(draftTitle || "").trim();
  if (explicitTitle) return explicitTitle;

  return [brandName || brandCode, form?.projectName || form?.treatment || "Creative Job"].filter(Boolean).join(" - ");
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
    sourceType: "url",
    mediaType: "link",
    sourceUrl: "",
    previewUrl: "",
    assetUrl: "",
    thumbnailUrl: "",
    board: "參考素材",
    status: "Draft",
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

const REFERENCE_SOURCE_OPTIONS = [
  { id: "url", label: "URL / 廣告連結", mediaType: "link", platform: "Meta Ad Library" },
  { id: "video", label: "上載影片", mediaType: "video", platform: "Video" },
  { id: "image", label: "上載圖片", mediaType: "image", platform: "Image" },
  { id: "manual", label: "手動建立", mediaType: "manual", platform: "Manual" },
];

function getReferenceSourceOption(sourceType) {
  return REFERENCE_SOURCE_OPTIONS.find((option) => option.id === sourceType) || REFERENCE_SOURCE_OPTIONS[0];
}

const TRENDING_TOPIC_CATEGORIES = [
  "瘦身體態",
  "頭皮護理",
  "男士美容",
  "脫疣皮膚",
  "痛症舒緩",
  "養生刮痧",
  "高客單成交",
  "節日 / 熱話",
];

const TRENDING_TOPIC_LIBRARY = [
  {
    id: "body-shape-mirror",
    category: "瘦身體態",
    title: "鏡前體態焦慮",
    why: "用真實生活場景切入，將體態管理由硬銷變成可共鳴的自我整理。",
    hook: "明明磅數無變，但鏡入面條線好似鬆晒？",
    audience: "想改善線條但怕 hard sell 的上班族女生",
    visualDirection: "鏡前三秒停頓、衣服線條對比、局部輪廓 close up",
    format: "Reels / Short Video",
    score: 87,
    tags: ["體態", "線條", "上班族", "Before After"],
  },
  {
    id: "body-shape-event",
    category: "瘦身體態",
    title: "活動前急救線條",
    why: "連接婚禮、旅行、影相等高意圖場景，容易帶出預約 CTA。",
    hook: "下星期影相，最想先處理邊個位？",
    audience: "準備拍攝、旅行或重要活動的人",
    visualDirection: "日曆倒數、服裝 fitting、療程前後動作分鏡",
    format: "Story + Feed Post",
    score: 82,
    tags: ["活動前", "塑形", "預約", "急救"],
  },
  {
    id: "scalp-oily",
    category: "頭皮護理",
    title: "頭皮油同頭味尷尬",
    why: "痛點直接、香港天氣相關，適合做教育型 Hook 和檢測導流。",
    hook: "朝早洗完頭，下午已經有頭油味？",
    audience: "頭油、頭痕、頭皮屑困擾的香港男女",
    visualDirection: "頭頂分界 close up、吸油紙比喻、檢測儀畫面",
    format: "Reels / Short Video",
    score: 91,
    tags: ["頭皮護理", "頭油", "頭痕", "頭皮檢測"],
  },
  {
    id: "scalp-check",
    category: "頭皮護理",
    title: "頭皮檢測揭示真相",
    why: "以專業檢測建立信任，將問題由感覺轉成可視化證據。",
    hook: "你以為係髮質問題，其實可能係頭皮狀態出事。",
    audience: "開始留意脫髮、頭皮敏感或髮量變薄的人",
    visualDirection: "檢測畫面、顧問講解、頭皮狀態圖像化",
    format: "AI Video",
    score: 88,
    tags: ["頭皮檢測", "脫髮", "專業分析", "護理"],
  },
  {
    id: "men-skin-first",
    category: "男士美容",
    title: "男士第一次做美容",
    why: "降低尷尬感和入門門檻，適合用 FAQ 形式做轉化內容。",
    hook: "男仔第一次做 Facial，其實會唔會好尷尬？",
    audience: "想改善皮膚但未試過美容療程的男士",
    visualDirection: "接待流程、簡單步驟、乾淨專業環境",
    format: "Reels / Short Video",
    score: 84,
    tags: ["男士美容", "第一次", "Facial", "入門"],
  },
  {
    id: "men-grooming-work",
    category: "男士美容",
    title: "見客前儀容管理",
    why: "把美容轉成職場形象投資，更容易被男士客群接受。",
    hook: "見客前，皮膚狀態其實都係第一印象。",
    audience: "銷售、管理層、需要見客的男士",
    visualDirection: "西裝、會議前整理、皮膚細節對比",
    format: "Feed Post",
    score: 81,
    tags: ["男士形象", "職場", "皮膚管理", "高客單"],
  },
  {
    id: "skin-wart-clean",
    category: "脫疣皮膚",
    title: "皮膚小粒粒安全處理",
    why: "用風險教育建立專業感，避免觀眾自行處理。",
    hook: "皮膚小粒粒，唔好自己亂剪亂挑。",
    audience: "面頸有疣、肉粒或不明凸起的人",
    visualDirection: "皮膚局部示意、專業檢查、衛生流程",
    format: "Treatment Video",
    score: 86,
    tags: ["脫疣", "皮膚", "安全", "專業"],
  },
  {
    id: "pain-office",
    category: "痛症舒緩",
    title: "Office 肩頸痛日常",
    why: "生活感強，可用日常動作帶入痛症舒緩和療程查詢。",
    hook: "坐到肩頸硬晒，放工都仲痛？",
    audience: "長時間坐 office、肩頸腰背不適的人",
    visualDirection: "電腦前姿勢、肩頸特寫、舒緩流程",
    format: "Reels / Short Video",
    score: 85,
    tags: ["肩頸痛", "Office", "痛症舒緩", "姿勢"],
  },
  {
    id: "gua-sha-sleep",
    category: "養生刮痧",
    title: "睡眠差與身體緊繃",
    why: "以身體感受切入，語氣適合溫和養生和體驗優惠。",
    hook: "瞓夠都攰，可能係個身一直放鬆唔到。",
    audience: "壓力大、睡眠差、想做養生放鬆的人",
    visualDirection: "溫熱毛巾、肩背刮痧、放鬆表情",
    format: "Story + Reels",
    score: 80,
    tags: ["刮痧", "養生", "睡眠", "放鬆"],
  },
  {
    id: "premium-consult",
    category: "高客單成交",
    title: "先分析再建議",
    why: "高客單服務適合用專業診斷代替直接 sell package。",
    hook: "唔係一坐低就 sell plan，先睇清楚你真正需要。",
    audience: "重視專業、願意付費但怕被硬銷的高意圖客",
    visualDirection: "顧問問診、分析報告、個人化方案卡",
    format: "Ad Creative",
    score: 89,
    tags: ["高客單", "顧問式銷售", "信任", "方案"],
  },
  {
    id: "season-hot-topic",
    category: "節日 / 熱話",
    title: "節日前狀態急救",
    why: "節日前有明確 deadline，方便推出限時 offer 和預約導流。",
    hook: "見人前一星期，最想先救邊個狀態？",
    audience: "節日前想改善外觀或狀態的人",
    visualDirection: "節日前倒數、聚會準備、狀態整理 checklist",
    format: "Story + Short Video",
    score: 83,
    tags: ["節日", "限時", "急救", "預約"],
  },
];

const FALLBACK_TOPIC_BRANDS = [];

function getTrendingTopicsForCategory(category) {
  const selected = TRENDING_TOPIC_LIBRARY.filter((topic) => topic.category === category);
  return selected.length ? selected : TRENDING_TOPIC_LIBRARY.slice(0, 4);
}

function getSelectedTrendingTopic(topics, selectedTopicId) {
  return topics.find((topic) => topic.id === selectedTopicId) || topics[0] || null;
}

function buildTopicWhatIfPreviews(topic, brandLibrary = []) {
  if (!topic) return [];
  if (!brandLibrary.length) return [];

  const library = brandLibrary;
  const topicText = [topic.title, topic.why, topic.hook, topic.audience, topic.visualDirection, ...(topic.tags || [])]
    .filter(Boolean)
    .join(" ");
  const rows = [];

  library.forEach((brand) => {
    (brand.treatments || []).forEach((treatment) => {
      const keywords = [
        brand.brandName,
        treatment.treatmentName,
        treatment.category,
        treatment.offer,
        treatment.targetAudience,
        treatment.painPoints,
        treatment.keywords,
        ...(topic.tags || []),
      ];
      const matchScore = scoreKeywordMatch(topicText, keywords);
      rows.push({
        id: `${brand.id || brand.brandName}-${treatment.id || treatment.treatmentName}`,
        brandId: brand.id || "",
        treatmentId: treatment.id || "",
        brandName: brand.brandName || "品牌",
        treatmentName: treatment.treatmentName || "服務",
        offer: treatment.offer || "",
        score: matchScore,
        angle: `${topic.title} x ${treatment.treatmentName || "服務痛點"}`,
        hook: topic.hook,
        visualDirection: topic.visualDirection,
        cta: treatment.offer ? `預約${treatment.offer}` : "預約初步評估",
        why: matchScore
          ? `內容痛點同 ${brand.brandName || "品牌"} 的 ${treatment.treatmentName || "服務"} 有關，可直接變成短片方向。`
          : `可借用此題材的 Hook 結構，再改寫成 ${brand.brandName || "品牌"} 的服務語氣。`,
      });
    });
  });

  return rows.sort((a, b) => b.score - a.score).slice(0, 4);
}

const CREATIVE_SOURCE_DISPLAY_COPY = {
  extension: {
    title: "瀏覽器插件擷取",
    desc: "在 IG / FB / Ad Library / Landing Page 選取畫面上可見素材，匯入 素材庫 再做 AI 拆解。",
    cta: "開始擷取流程",
  },
  video: {
    title: "上載參考影片",
    desc: "把影片、來源 URL、競品品牌和備註整理成同一張 素材庫 參考素材。",
    cta: "選擇影片",
  },
  topic: {
    title: "AI 熱門話題建議",
    desc: "用內部題材建議先試 Hook、角度和品牌套用方向，不假裝即時抓取熱搜。",
    cta: "查看題材建議",
  },
};

function getCreativeSourceDisplay(option) {
  return {
    ...option,
    ...(CREATIVE_SOURCE_DISPLAY_COPY[option?.id] || {}),
  };
}

function getReferenceSourceLabel(reference) {
  if (reference?.sourceType === "ad_library") return "Ad Library 連結";
  const option = getReferenceSourceOption(reference?.sourceType || "");
  if (reference?.sourceType) return option.label;
  if (reference?.mediaType === "video") return "上載影片";
  if (reference?.mediaType === "image") return "上載圖片";
  return reference?.sourceUrl ? "URL / 廣告連結" : "手動建立";
}

function createDefaultBrandIntelligence() {
  return {
    brandName: "",
    instagramUrl: "",
    facebookUrl: "",
    websiteUrl: "",
    category: "",
    service: "",
    targetAudience: "",
    positioning: "",
    offer: "",
    brandNotes: "",
    competitorSeeds: "",
    competitors: [],
    selectedCompetitorId: "",
    manualCompetitorName: "",
    manualCompetitorIgUrl: "",
    manualCompetitorFbUrl: "",
    adLibraryUrl: "",
    positioningCompleted: false,
    updatedAt: "",
  };
}

function loadBrandIntelligenceFromStorage() {
  if (typeof window === "undefined") return createDefaultBrandIntelligence();

  try {
    const raw = window.localStorage.getItem(BRAND_INTELLIGENCE_STORAGE_KEY);
    if (!raw) return createDefaultBrandIntelligence();

    const parsed = JSON.parse(raw);
    return { ...createDefaultBrandIntelligence(), ...(parsed && typeof parsed === "object" ? parsed : {}) };
  } catch {
    return createDefaultBrandIntelligence();
  }
}

function saveBrandIntelligenceToStorage(value) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(BRAND_INTELLIGENCE_STORAGE_KEY, JSON.stringify(value || createDefaultBrandIntelligence()));
  } catch {
    // localStorage may be unavailable in restricted browsers.
  }
}

function splitLibraryList(value) {
  if (Array.isArray(value)) {
    return value
      .flatMap((item) => splitLibraryList(item))
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return String(value || "")
    .split(/[\n,，、/|]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinLibraryList(value) {
  return splitLibraryList(value).join("\n");
}

function createBrandLibraryBrandId(record = {}, index = 0) {
  const seed = record.id || record.code || record.brandCode || record.brandName || record.name || `brand-${index + 1}`;
  return `brand-library-${String(seed).toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/gi, "-")}`;
}

function normalizeBrandLibraryTreatment(record = {}, index = 0, brandCode = "BRAND") {
  const treatmentName = String(record.treatmentName || record.name || record.treatment || `療程 ${index + 1}`).trim();

  return {
    id: record.id || makeTreatmentId(treatmentName, `${brandCode}-library-treatment-${index + 1}`),
    treatmentName,
    category: String(record.category || "").trim(),
    offer: String(record.offer || "").trim(),
    price: String(record.price || "").trim(),
    sellingPoints: String(record.sellingPoints || record.summary || "").trim(),
    painPoints: String(record.painPoints || "").trim(),
    targetAudience: String(record.targetAudience || "").trim(),
    objections: String(record.objections || record.commonObjections || "").trim(),
    commonHooks: String(record.commonHooks || record.hookNotes || record.safePhrases || "").trim(),
    visualAngles: String(record.visualAngles || record.suggestedVisuals || record.materialDirection || "").trim(),
    keywords: joinLibraryList(record.keywords || [treatmentName, record.category].filter(Boolean)),
    competitorKeywords: joinLibraryList(record.competitorKeywords || record.competitorSeeds || ""),
    notes: String(record.notes || record.landingPageNotes || "").trim(),
  };
}

function createBlankBrandLibraryTreatment(index = 0, brandCode = "BRAND") {
  return normalizeBrandLibraryTreatment(
    {
      treatmentName: "新療程 / 服務",
      category: "",
      offer: "",
      price: "",
      sellingPoints: "",
      painPoints: "",
      targetAudience: "",
      objections: "",
      commonHooks: "",
      visualAngles: "",
      keywords: "",
      competitorKeywords: "",
      notes: "",
    },
    index,
    brandCode
  );
}

function normalizeBrandLibraryBrand(record = {}, index = 0) {
  const code = String(record.code || record.brandCode || "").trim().toUpperCase();
  const brandName = String(record.brandName || record.name || `品牌 ${index + 1}`).trim();
  const treatments = Array.isArray(record.treatments) ? record.treatments : [];

  return {
    id: record.id || createBrandLibraryBrandId({ ...record, brandName, code }, index),
    code,
    brandName,
    brandPositioning: String(record.brandPositioning || record.positioning || record.brandStyleSummary || record.promptRules || "").trim(),
    targetAudience: String(record.targetAudience || "").trim(),
    toneOfVoice: String(record.toneOfVoice || record.tone || "").trim(),
    commonCta: String(record.commonCta || record.cta || record.commonCtaPatterns || "").trim(),
    cautionNotes: String(record.cautionNotes || record.defaultAvoid || record.bannedWords || "").trim(),
    igUrl: String(record.igUrl || record.instagramUrl || "").trim(),
    fbUrl: String(record.fbUrl || record.facebookUrl || "").trim(),
    websiteUrl: String(record.websiteUrl || "").trim(),
    treatments: treatments.length
      ? treatments.map((treatment, treatmentIndex) => normalizeBrandLibraryTreatment(treatment, treatmentIndex, code || brandName))
      : [createBlankBrandLibraryTreatment(0, code || brandName)],
  };
}

function createBlankBrandLibraryBrand(index = 0) {
  return normalizeBrandLibraryBrand(
    {
      code: `LIB${index + 1}`,
      brandName: "新品牌",
      brandPositioning: "",
      targetAudience: "",
      toneOfVoice: "",
      commonCta: "",
      cautionNotes: "",
      igUrl: "",
      fbUrl: "",
      websiteUrl: "",
      treatments: [createBlankBrandLibraryTreatment(0, `LIB${index + 1}`)],
    },
    index
  );
}

function createPresetAlyssaBrandLibrary() {
  return [];
}

function createBrandLibraryFromBrandRecords(records = []) {
  return (Array.isArray(records) ? records : []).map((record, index) => {
    const normalized = normalizeBrandRecord(record);
    const treatments = getBrandTreatments(normalized);

    return normalizeBrandLibraryBrand(
      {
        code: normalized.code,
        brandName: normalized.name,
        brandPositioning: normalized.brandStyleSummary || normalized.promptRules || normalized.scriptRule || "",
        targetAudience: normalized.commonWords || "",
        toneOfVoice: normalized.tone || "",
        igUrl: normalized.instagramUrl || "",
        fbUrl: normalized.facebookUrl || "",
        websiteUrl: normalized.websiteUrl || "",
        treatments,
      },
      index
    );
  });
}

function loadBrandLibraryFromStorage(fallbackLibrary = []) {
  if (typeof window === "undefined") return fallbackLibrary;

  try {
    const raw = window.localStorage.getItem(BRAND_LIBRARY_STORAGE_KEY);
    if (!raw) return fallbackLibrary;

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length
      ? parsed.map((brand, index) => normalizeBrandLibraryBrand(brand, index))
      : fallbackLibrary;
  } catch {
    return fallbackLibrary;
  }
}

const LEGACY_DEMO_BRAND_MARKERS = [
  "HairHealth",
  "HairHealth 髮生社",
  "Clean Bear",
  "Angel Beauty",
  "Inzpire",
  "Alyssa",
  "HH",
  "AB",
  "CB",
  "IB",
  "AE",
  "\u64c3\ue9b7\u98e2\u769b\u8124\u0080\ue435\uee66?\u683c\u694a??",
  "?\u7455\u311a\u761b\u52d7\u60dc\u7623\ue91d\uec84",
  "?\u600e\ue83a",
  "?\u5254\ueab9 SPA",
  "SuperJet",
];

function containsLegacyDemoBrandData(value) {
  if (!value) return false;

  try {
    const text = typeof value === "string" ? value : JSON.stringify(value);
    return LEGACY_DEMO_BRAND_MARKERS.some((marker) => marker && text.includes(marker));
  } catch {
    return false;
  }
}

function cleanupLegacyDemoBrandStorage() {
  if (typeof window === "undefined") return;

  try {
    const brandLibraryRaw = window.localStorage.getItem(BRAND_LIBRARY_STORAGE_KEY);
    if (containsLegacyDemoBrandData(brandLibraryRaw)) {
      window.localStorage.setItem(BRAND_LIBRARY_STORAGE_KEY, JSON.stringify([]));
    }

    const brandIntelligenceRaw = window.localStorage.getItem(BRAND_INTELLIGENCE_STORAGE_KEY);
    if (containsLegacyDemoBrandData(brandIntelligenceRaw)) {
      window.localStorage.removeItem(BRAND_INTELLIGENCE_STORAGE_KEY);
    }

    const creativeSessionRaw = window.localStorage.getItem(CREATIVE_SESSION_STORAGE_KEY);
    if (containsLegacyDemoBrandData(creativeSessionRaw)) {
      window.localStorage.removeItem(CREATIVE_SESSION_STORAGE_KEY);
    }
  } catch {
    // Brand cleanup is best-effort; never block the app or touch materials/jobs.
  }
}

function saveBrandLibraryToStorage(library) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(BRAND_LIBRARY_STORAGE_KEY, JSON.stringify(Array.isArray(library) ? library : []));
  } catch {
    // localStorage may be unavailable in restricted browsers.
  }
}

function splitCompetitorSeedNames(value) {
  return String(value || "")
    .split(/[\n,，、]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function createCompetitorId(name, index = 0) {
  return `competitor-${String(name || "brand").toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/gi, "-")}-${index}`;
}

function buildBrandPositioningSummary(input = {}) {
  const brandName = String(input.brandName || "未命名品牌").trim();
  const category = String(input.category || "未填行業").trim();
  const service = String(input.service || "未填服務").trim();
  const targetAudience = String(input.targetAudience || "未填目標客群").trim();
  const positioning = String(input.positioning || "未填品牌定位").trim();
  const offer = String(input.offer || "未填優惠").trim();

  return {
    brandName,
    category,
    targetAudience,
    coreOffer: offer,
    competitorDirection: `${category}、${service}、相近價位 / 痛點 / 素材風格`,
    creativeFocus: `${positioning}。優先觀察 Hook、痛點講法、素材節奏、Offer 呈現。`,
  };
}

function buildSuggestedCompetitors(input = {}) {
  const seeds = splitCompetitorSeedNames(input.competitorSeeds);
  const category = String(input.category || "美容服務").trim();
  const service = String(input.service || input.category || "服務").trim();
  const baseNames = seeds.length
    ? seeds
    : [
        `${service} 專門店 A`,
        `${service} 專門店 B`,
        `${category} 本地品牌 A`,
        `${category} 本地品牌 B`,
        `${category} 高端定位品牌`,
        `${category} 平價優惠品牌`,
        `${service} 內容強勢品牌`,
        `${service} 轉化廣告品牌`,
        `${category} IG 活躍品牌`,
        `${category} Meta 廣告活躍品牌`,
      ];

  const generated = baseNames.slice(0, 12).map((name, index) => {
    const typeList = ["直接競爭", "定位相近", "素材參考", "本地品牌"];
    const type = typeList[index % typeList.length];

    return {
      id: createCompetitorId(name, index),
      name,
      type,
      why: seeds.includes(name)
        ? "由團隊輸入，適合優先觀察其素材、Offer 同 CTA。"
        : `根據「${category} / ${service}」自動生成的候選，請由 marketer 確認是否真實競爭品牌。`,
      igUrl: "",
      fbUrl: "",
      status: "待確認",
    };
  });

  return generated;
}

function getCompetitorStatusMeta(status) {
  if (status === "已選用") return "bg-slate-950 text-white border-slate-950";
  if (status === "已確認") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  return "bg-amber-50 text-amber-700 border-amber-200";
}

function buildCampaignContext(brand, treatment) {
  const safeBrand = brand || {};
  const safeTreatment = treatment || {};
  const treatmentName = String(safeTreatment.treatmentName || safeTreatment.name || "").trim();
  const offer = String(safeTreatment.offer || "").trim();
  const targetAudience = String(safeTreatment.targetAudience || safeBrand.targetAudience || "").trim();

  return {
    key: [safeBrand.id || safeBrand.code || safeBrand.brandName, safeTreatment.id || treatmentName].filter(Boolean).join("::"),
    brandId: safeBrand.id || "",
    treatmentId: safeTreatment.id || "",
    brandCode: safeBrand.code || "",
    brandName: safeBrand.brandName || safeBrand.name || "",
    brandPositioning: safeBrand.brandPositioning || "",
    toneOfVoice: safeBrand.toneOfVoice || "",
    igUrl: safeBrand.igUrl || "",
    fbUrl: safeBrand.fbUrl || "",
    websiteUrl: safeBrand.websiteUrl || "",
    treatmentName,
    category: safeTreatment.category || "",
    offer,
    price: safeTreatment.price || "",
    sellingPoints: safeTreatment.sellingPoints || "",
    painPoints: safeTreatment.painPoints || "",
    targetAudience,
    commonHooks: safeTreatment.commonHooks || "",
    visualAngles: safeTreatment.visualAngles || "",
    keywords: splitLibraryList(safeTreatment.keywords || treatmentName),
    competitorKeywords: splitLibraryList(safeTreatment.competitorKeywords),
  };
}

function formatCampaignContextSummary(context = {}) {
  return [
    context.brandName || "未選品牌",
    context.treatmentName || "未選療程",
    context.offer || "未定 Offer",
    context.targetAudience || "未定目標客群",
  ].join("｜");
}

function buildCompetitorSearchKeywords(name, context = {}) {
  return [
    name,
    context.treatmentName,
    context.category,
    ...splitLibraryList(context.keywords).slice(0, 3),
    ...splitLibraryList(context.painPoints).slice(0, 2),
    "Hong Kong",
  ]
    .filter(Boolean)
    .map((item) => String(item).trim())
    .filter(Boolean)
    .slice(0, 6);
}

function buildCampaignCompetitors(context = {}) {
  const manualNames = splitLibraryList(context.competitorKeywords);
  const searchableText = [
    context.brandName,
    context.treatmentName,
    context.category,
    context.sellingPoints,
    context.painPoints,
    context.keywords,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const isHairOrScalp = /hair|scalp|頭皮|頭髮|生髮|育髮|去屑|頭痕/i.test(searchableText);
  const isMedicalBeauty = /醫美|medical|laser|激光|皮膚|facial|暗瘡|斑|毛孔|緊緻/i.test(searchableText);
  const localPool = isHairOrScalp
    ? [
        "Hair Forest",
        "Svenson",
        "Oasis Hair Spa",
        "Aveda Hong Kong",
        "Nioxin Hong Kong",
        "New Beauty",
        "MediLASE",
        "Phillip Wain",
        "AsterSpring",
        "Dream Beauty Pro",
        "THANN Sanctuary",
        "Hair Corner",
        "The Hair Solutions",
        "Perfect Hair",
        "F8 Hair Regrowth Centre",
      ]
    : isMedicalBeauty
      ? [
          "MediLASE",
          "New Beauty",
          "perFACE",
          "Pretty Beauty",
          "Skin Laundry HK",
          "AsterSpring",
          "Phillip Wain",
          "Dream Beauty Pro",
          "Bella Beauty",
          "The Right Spot",
          "H2O+ Beauty Centre",
          "Perfect Medical",
          "Neo Derm",
          "CosMax",
          "Medispa",
        ]
      : [
          "MediLASE",
          "New Beauty",
          "Pretty Beauty",
          "perFACE",
          "AsterSpring",
          "Phillip Wain",
          "Dream Beauty Pro",
          "Bella Beauty",
          "The Right Spot",
          "THANN Sanctuary",
          "Skin Laundry HK",
          "H2O+ Beauty Centre",
          "Perfect Medical",
          "Neo Derm",
          "CosMax",
        ];
  const typeList = ["直接競爭", "相近療程", "相同客群", "參考風格", "同區域"];
  const names = [...manualNames, ...localPool]
    .map((name) => String(name || "").trim())
    .filter(Boolean)
    .filter((name, index, list) => list.findIndex((item) => item.toLowerCase() === name.toLowerCase()) === index)
    .slice(0, 20);

  return names.map((name, index) => {
    const type = manualNames.some((manualName) => manualName.toLowerCase() === name.toLowerCase())
      ? "直接競爭"
      : typeList[index % typeList.length];
    const searchKeywords = buildCompetitorSearchKeywords(name, context);

    return {
      id: createCompetitorId(`${context.key || "campaign"}-${name}`, index),
      name,
      type,
      why: `${context.treatmentName || context.category || "同類服務"} 相關，可比較 Hook、Offer、客群痛點同素材呈現。`,
      searchKeywords,
      status: "候選",
      source: "brand-library",
    };
  });
}

function getCampaignCompetitorDisplayStatus(status) {
  const safeStatus = String(status || "候選");
  return safeStatus === "\u5df2\u6383\u63cf" ? "已收集" : safeStatus;
}

function getCampaignCompetitorStatusMeta(status) {
  const displayStatus = getCampaignCompetitorDisplayStatus(status);
  if (displayStatus === "已選擇") return "bg-slate-950 text-white border-slate-950";
  if (displayStatus === "已收集") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (displayStatus === "已排除") return "bg-rose-50 text-rose-700 border-rose-200";
  return "bg-amber-50 text-amber-700 border-amber-200";
}

function buildSocialSearchUrl(competitorName, platform) {
  return `https://www.google.com/search?q=${encodeURIComponent(`${competitorName} ${platform} Hong Kong`)}`;
}

function inferReferencePlatformFromUrl(url) {
  const value = String(url || "").toLowerCase();

  if (value.includes("facebook.com/ads/library")) return "Meta Ad Library";
  if (value.includes("facebook.com")) return "Facebook";
  if (value.includes("instagram.com")) return "Instagram";
  if (value.includes("tiktok.com")) return "TikTok";
  if (value.includes("youtube.com") || value.includes("youtu.be")) return "YouTube";

  return "";
}

function getReferenceMediaType(reference) {
  const mediaType = String(reference?.mediaType || "").toLowerCase();
  if (mediaType) return mediaType;

  const assetUrl = String(reference?.assetUrl || reference?.previewUrl || reference?.sourceUrl || "").toLowerCase();
  if (/\.(mp4|mov|webm)(\?|$)/.test(assetUrl)) return "video";
  if (/\.(png|jpe?g|gif|webp)(\?|$)/.test(assetUrl) || assetUrl.startsWith("data:image/")) return "image";

  return reference?.sourceUrl ? "link" : "manual";
}

function getReferencePreviewUrl(reference) {
  return reference?.thumbnailUrl || reference?.previewUrl || "";
}

function getReferenceAssetUrl(reference) {
  return reference?.assetUrl || reference?.sourceUrl || "";
}

function ReferencePreview({
  reference,
  className = "",
  localPreviewUrl = "",
  showControls = false,
  emptyTitle = "未有預覽",
  emptyDescription = "可透過 Ad Library、上載素材或外部匯入補回",
}) {
  const mediaType = getReferenceMediaType(reference);
  const previewUrl = localPreviewUrl || getReferencePreviewUrl(reference);
  const assetUrl = getReferenceAssetUrl(reference);
  const sourceLabel = getReferenceSourceLabel(reference);
  const resolvedEmptyTitle = String(emptyTitle || "").includes("?") ? "未有預覽" : emptyTitle || "未有預覽";
  const resolvedEmptyDescription =
    String(emptyDescription || "").includes("?")
      ? "可透過 Ad Library、上載素材或外部匯入補回"
      : emptyDescription || "可透過 Ad Library、上載素材或外部匯入補回";

  if (mediaType === "video" && (assetUrl || previewUrl)) {
    return (
      <div className={`overflow-hidden bg-slate-950 ${className}`}>
        {showControls && (assetUrl || localPreviewUrl) ? (
          <video
            src={localPreviewUrl || assetUrl}
            poster={previewUrl && !String(previewUrl).startsWith("blob:") ? previewUrl : undefined}
            className="h-full w-full object-cover"
            muted
            playsInline
            controls
            preload="metadata"
          />
        ) : previewUrl && !String(previewUrl).startsWith("blob:") ? (
          <img src={previewUrl} alt={reference?.title || "影片參考預覽"} className="h-full w-full object-cover" />
        ) : (
          <video
            src={localPreviewUrl || assetUrl || previewUrl}
            className="h-full w-full object-cover"
            muted
            playsInline
            preload="metadata"
          />
        )}
        <div className="hidden">
          影片素材
        </div>
      </div>
    );
  }

  if (previewUrl) {
    return (
      <div className={`overflow-hidden bg-slate-100 ${className}`}>
        <img src={previewUrl} alt={reference?.title || "參考素材預覽"} className="h-full w-full object-cover" />
        <div className="hidden">
          {sourceLabel}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center overflow-hidden border border-dashed border-slate-200 bg-gradient-to-br from-slate-50 to-white text-slate-500 ${className}`}>
      <div className="px-5 text-center [&>div:nth-child(n+3)]:hidden">
        <div className="text-sm font-semibold text-slate-700">{resolvedEmptyTitle}</div>
        <div className="mt-1 text-xs leading-relaxed text-slate-500">{resolvedEmptyDescription}</div>
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-sm">
          <Icon name="frame" />
        </div>
        <div className="text-sm font-semibold text-slate-600">未有預覽</div>
        <div className="mt-1 text-xs leading-relaxed text-slate-400">可透過 Ad Library、上載素材或外部匯入補回</div>
        <div className="mt-3 inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500 shadow-sm">{sourceLabel}</div>
      </div>
    </div>
  );
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("圖片讀取失敗。"));
    reader.readAsDataURL(file);
  });
}

function loadImageFromDataUrl(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("圖片預覽建立失敗。"));
    image.src = dataUrl;
  });
}

async function createImagePreviewDataUrl(file, maxWidth = 1200, quality = 0.82) {
  const dataUrl = await readFileAsDataUrl(file);
  const image = await loadImageFromDataUrl(dataUrl);
  const ratio = image.width > maxWidth ? maxWidth / image.width : 1;
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) return dataUrl;

  canvas.width = Math.max(1, Math.round(image.width * ratio));
  canvas.height = Math.max(1, Math.round(image.height * ratio));
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL("image/jpeg", quality);
}

const WORKFLOW_STAGES = [
  { id: "brand", label: "品牌定位", shortLabel: "Positioning" },
  { id: "competitors", label: "競爭對手探索", shortLabel: "Competitors" },
  { id: "materials", label: "素材收集", shortLabel: "Materials" },
  { id: "deconstruct", label: "AI 分析", shortLabel: "素材庫" },
  { id: "brief", label: "Creative Brief", shortLabel: "Brief" },
  { id: "job", label: "製作 Job", shortLabel: "Production" },
];

const CAMPAIGN_WORKFLOW_STAGES = [
  { id: "library", label: "品牌庫", shortLabel: "Brand Library" },
  { id: "treatment", label: "選擇療程", shortLabel: "Treatment" },
  { id: "competitors", label: "競品推薦", shortLabel: "Competitors" },
  { id: "materials", label: "素材收集", shortLabel: "Materials" },
  { id: "deconstruct", label: "AI 分析", shortLabel: "素材庫" },
  { id: "brief", label: "Creative Brief", shortLabel: "Brief" },
  { id: "job", label: "製作 Job", shortLabel: "Production" },
];

const PRODUCT_WORKFLOW_STAGES = [
  { id: "source", label: "選擇創作來源", shortLabel: "Source" },
  { id: "analysis", label: "AI 分析", shortLabel: "Deconstruct" },
  { id: "apply", label: "套用品牌療程", shortLabel: "Brand Fit" },
  { id: "checklist", label: "勾選參考位", shortLabel: "Reference Points" },
  { id: "script", label: "生成影片稿", shortLabel: "Script" },
  { id: "roughcut", label: "初剪方案", shortLabel: "Rough Cut" },
  { id: "job", label: "製作 Job", shortLabel: "Production" },
];

const CREATIVE_SOURCE_OPTIONS = [
  {
    id: "extension",
    title: "瀏覽器插件擷取",
    desc: "在 IG / FB / Ad Library / Landing Page 直接選取畫面上可見素材，匯入 素材庫。",
    cta: "使用插件擷取",
    icon: "frame",
    gradient: "from-[#fff3e4] via-[#ffe3e3] to-[#ead7ff]",
    accent: "text-[#a54968]",
  },
  {
    id: "video",
    title: "上載參考影片",
    desc: "上載參考影片並附上來源 URL，AI 會分析講得點、剪接節奏及可參考位。",
    cta: "上載參考影片",
    icon: "video",
    gradient: "from-[#fff7d7] via-[#ffe4c7] to-[#ffd6df]",
    accent: "text-[#b66b2d]",
  },
  {
    id: "topic",
    title: "AI 熱門話題建議",
    desc: "由 AI 提供熱門題材、內容角度及可套用到品牌療程的影片構想。",
    cta: "探索熱門題材",
    icon: "magic",
    gradient: "from-[#f4eaff] via-[#fce0ef] to-[#fff0d2]",
    accent: "text-[#6f4267]",
  },
];

const REFERENCE_CHECKLIST_OPTIONS = [
  "Hook 結構",
  "痛點切入",
  "視覺構圖",
  "字幕節奏",
  "剪接節奏",
  "情緒 / 音樂",
  "Offer 表達",
  "CTA 方式",
  "Before / After 對比",
  "人物 / 場景設定",
  "香港本地化語氣",
  "避免直接照抄",
];

function scoreKeywordMatch(text, keywords = []) {
  const normalized = String(text || "").toLowerCase();
  return keywords.reduce((score, keyword) => {
    const value = String(keyword || "").trim().toLowerCase();
    return value && normalized.includes(value) ? score + 1 : score;
  }, 0);
}

function buildCreativeAnalysisPreview({ sourceType, selectedReference, videoAnalysis, topicInspiration, generated }) {
  const reference = selectedReference || {};
  const hasVideoAnalysis = videoAnalysis?.status && videoAnalysis.status !== "未分析";
  const sourceTitle =
    reference.title ||
    (sourceType === "topic" ? topicInspiration : "") ||
    (hasVideoAnalysis ? "參考影片分析" : "") ||
    "AI 初步分析";
  const summary =
    reference.captionNotes ||
    reference.visualNotes ||
    videoAnalysis?.summary ||
    (sourceType === "topic"
      ? `以「${topicInspiration || "熱門題材"}」作為題材方向，先用本地結構整理可行 Hook、畫面及品牌套用方向。`
      : "目前未有完整 AI 結果，先根據已收集素材建立結構化初步分析。");
  const hookPoints = [
    reference.hookNotes || generated?.rows?.[0]?.subtitle || "片頭需要 0-3 秒直接講痛點或反差。",
    reference.angle || "用一個清晰內容角度帶出服務價值。",
    videoAnalysis?.hookMoment || "先抓情緒，再補充療程 / 產品資訊。",
  ].filter(Boolean);
  const avoidPoints = [
    "避免直接照抄原素材畫面、字幕或節奏。",
    "避免誇大療效、保證結果或醫療承諾。",
    ...(Array.isArray(videoAnalysis?.riskNotes) ? videoAnalysis.riskNotes.slice(0, 2) : []),
  ];
  const rewriteDirections = [
    "轉成香港廣東話短句，減少書面感。",
    "保留 Hook 結構，但換成品牌自身痛點及 Offer。",
    "把視覺節奏拆成可拍攝 shot list。",
  ];
  const scoreBase = hasVideoAnalysis ? 82 : reference.id ? 76 : sourceType === "topic" ? 68 : 58;

  return {
    title: sourceTitle,
    sourceLabel: CREATIVE_SOURCE_OPTIONS.find((option) => option.id === sourceType)?.title || "創作來源",
    summary,
    score: Math.min(96, scoreBase + Math.min(8, hookPoints.length * 2)),
    hookPoints,
    referenceIdeas: [
      "片頭節奏",
      "痛點講法",
      "畫面構圖",
      "Offer 呈現",
    ],
    avoidPoints,
    rewriteDirections,
    categoryText: [reference.platform, reference.competitorBrand, reference.tags, topicInspiration].filter(Boolean).join(" "),
  };
}

function buildSourceFirstCreativeAnalysisPreview({
  sourceType,
  selectedReference,
  videoAnalysis,
  topicInspiration,
  selectedTrendingTopic,
  uploadReferenceDraft,
  uploadReferenceVideoName,
  generated,
}) {
  const reference = selectedReference || {};
  const topic = selectedTrendingTopic || null;
  const hasReference = Boolean(reference.id);
  const hasVideoAnalysis = videoAnalysis?.status && videoAnalysis.status !== "未分析";
  const uploadTitle = uploadReferenceDraft?.title || uploadReferenceVideoName || "";
  const sourceTitle =
    reference.title ||
    (sourceType === "topic" ? topic?.title || topicInspiration : "") ||
    (sourceType === "video" ? uploadTitle || "上載參考影片" : "") ||
    (hasVideoAnalysis ? "參考影片分析" : "") ||
    "AI 初步拆解";
  const sourceLabel =
    sourceType === "extension"
      ? "瀏覽器插件擷取"
      : sourceType === "video"
      ? "上載參考影片"
      : sourceType === "topic"
      ? "AI 熱門話題建議"
      : "創作來源";
  const summary =
    reference.captionNotes ||
    reference.visualNotes ||
    videoAnalysis?.summary ||
    (sourceType === "topic" && topic
      ? `${topic.why} 這是內部題材方向，不代表即時熱門數據。`
      : sourceType === "video"
      ? [
          uploadReferenceDraft?.notes || "已建立參考影片來源，可先做本地初步拆解，再按需要開始 AI 影片分析。",
          uploadReferenceDraft?.sourceUrl ? `參考來源：${uploadReferenceDraft.sourceUrl}` : "",
        ]
          .filter(Boolean)
          .join(" ")
      : "從素材庫抽出可重用的 Hook、畫面語言、Offer 表達和製作注意位。");
  const hookPoints = [
    reference.hookNotes,
    topic?.hook,
    generated?.rows?.[0]?.subtitle,
    uploadReferenceDraft?.notes,
    videoAnalysis?.hookMoment,
    "首三秒要先呈現痛點或結果，避免一開始只講品牌。",
  ].filter(Boolean);
  const referenceIdeas = [
    reference.angle,
    topic?.visualDirection,
    topic?.format,
    videoAnalysis?.pacing,
    "保留節奏、構圖和痛點切入，文案必須重新寫成 Alyssa 內部品牌語氣。",
  ].filter(Boolean);
  const avoidPoints = [
    "不要直接照抄對手畫面、字幕或 offer 包裝。",
    "避免使用太誇張的醫療、效果或保證式字眼。",
    ...(Array.isArray(videoAnalysis?.riskNotes) ? videoAnalysis.riskNotes.slice(0, 2) : []),
  ];
  const rewriteDirections = [
    topic ? `用「${topic.title}」變成品牌服務痛點，不要講成泛泛熱話。` : "",
    "把 Hook 改成香港客人會講的日常語氣。",
    "先列出鏡頭次序，再轉成 Script / Storyboard。",
  ].filter(Boolean);
  const scoreBase = hasVideoAnalysis ? 84 : hasReference ? 78 : topic?.score || (sourceType === "video" ? 70 : 64);

  return {
    title: sourceTitle,
    sourceLabel,
    summary,
    score: Math.min(96, scoreBase + Math.min(8, hookPoints.length * 2)),
    hookPoints,
    referenceIdeas,
    avoidPoints,
    rewriteDirections,
    categoryText: [
      reference.platform,
      reference.competitorBrand,
      reference.tags,
      topic?.category,
      topic?.title,
      topicInspiration,
      uploadReferenceDraft?.competitorBrand,
      uploadReferenceDraft?.sourceUrl,
    ]
      .filter(Boolean)
      .join(" "),
  };
}

function buildBrandTreatmentRecommendations(analysis, brandLibrary = []) {
  const analysisText = [
    analysis?.title,
    analysis?.summary,
    analysis?.categoryText,
    ...(analysis?.hookPoints || []),
    ...(analysis?.referenceIdeas || []),
  ]
    .filter(Boolean)
    .join(" ");
  const recommendations = [];

  brandLibrary.forEach((brand) => {
    (brand.treatments || []).forEach((treatment) => {
      const keywords = [
        brand.brandName,
        brand.brandPositioning,
        brand.targetAudience,
        treatment.treatmentName,
        treatment.category,
        treatment.offer,
        treatment.sellingPoints,
        treatment.painPoints,
        ...splitLibraryList(treatment.keywords),
        ...splitLibraryList(treatment.competitorKeywords),
      ];
      const score = scoreKeywordMatch(analysisText, keywords);
      recommendations.push({
        brandId: brand.id,
        treatmentId: treatment.id,
        brandName: brand.brandName,
        treatmentName: treatment.treatmentName,
        offer: treatment.offer,
        targetAudience: treatment.targetAudience || brand.targetAudience,
        why: score > 0 ? "素材痛點、關鍵字或角度同呢個療程有重疊。" : "可作為備選方向，由 marketer 判斷是否適合。",
        score: score + (brand.brandName ? 1 : 0),
      });
    });
  });

  return recommendations.sort((a, b) => b.score - a.score).slice(0, 8);
}

function buildRoughCutPlanRows(rows = [], checklist = [], reference) {
  const sourceLabel = reference?.title || reference?.platform || "參考素材";
  const safeRows = Array.isArray(rows) && rows.length ? rows : [];
  const fallbackRows = [
    { time: "0-3s", visual: "痛點 close-up / 情緒反應", subtitleVo: "開場 Hook", note: "快入主題，避免 logo 開場" },
    { time: "3-8s", visual: "展示問題場景", subtitleVo: "放大痛點", note: "保持節奏短句" },
    { time: "8-18s", visual: "服務 / 療程過程", subtitleVo: "解釋解決方向", note: "加入品牌可信元素" },
    { time: "18-26s", visual: "結果感 / 生活化畫面", subtitleVo: "帶出 Offer", note: "不要誇大效果" },
    { time: "26-30s", visual: "CTA 畫面", subtitleVo: "預約 / 查詢", note: "清楚展示下一步" },
  ];

  return (safeRows.length ? safeRows : fallbackRows).slice(0, 6).map((row, index) => ({
    timeline: row.time || `${index * 5}-${index * 5 + 5}s`,
    duration: row.time || "約 4-6 秒",
    visualReference: row.referenceMapping || row.visual || sourceLabel,
    textOverlay: row.subtitle || row.subtitleVo || "短字幕重點",
    voCaption: row.vo || row.subtitleVo || "按影片稿補 VO / Caption",
    transition: index === 0 ? "快切入痛點，首 1 秒要有反差" : "跟音樂節奏做 clean cut / match cut",
    footageNeeded: row.materialType || row.suggestedFileName || "實拍 / 素材 / 圖片補位",
    musicMood: checklist.includes("情緒 / 音樂") ? "按參考情緒選音樂，避免太 generic" : "輕快、乾淨、有轉化感",
    editorNotes: row.note || row.designerNotes || "保留節奏，但不要直接照抄參考素材。",
  }));
}

function hasReferencePreview(reference) {
  return Boolean(getReferencePreviewUrl(reference) || (getReferenceMediaType(reference) === "video" && getReferenceAssetUrl(reference)));
}

function isReferenceAnalyzed(reference) {
  return Boolean(
    reference?.hookNotes ||
      reference?.visualNotes ||
      reference?.captionNotes ||
      reference?.productionNotes ||
      reference?.angle
  );
}

function hasJobForReference(reference, jobs = []) {
  if (!reference) return false;

  return jobs.some((job) => job.referenceAdId === reference.id || (reference.title && job.referenceAdTitle === reference.title));
}

function getReferenceWorkflowGuidance(reference, context = {}) {
  const { appliedReferenceId = "", hasBrief = false, jobs = [] } = context;

  if (!reference) {
    return {
      stage: "未選擇素材",
      missing: "未有參考素材",
      next: "新增第一張素材卡",
      action: "capture",
      cta: "新增素材",
    };
  }

  if (!hasReferencePreview(reference)) {
    return {
      stage: "已收集素材",
      missing: "未有視覺預覽",
      next: "補充圖片、影片或連結預覽",
      action: "addPreview",
      cta: "補充預覽",
    };
  }

  if (!isReferenceAnalyzed(reference)) {
    return {
      stage: "素材已入庫",
      missing: "未有 AI 拆解",
      next: "先拆解 Hook、畫面同角度",
      action: "deconstruct",
      cta: "AI 拆解",
    };
  }

  if (appliedReferenceId !== reference.id) {
    return {
      stage: "已拆解",
      missing: "未套用到創意方向",
      next: "套用成今次 Brief 的方向",
      action: "apply",
      cta: "套用成創意方向",
    };
  }

  if (!hasBrief) {
    return {
      stage: "已套用參考",
      missing: "未生成 Creative Brief",
      next: "用已套用參考生成 Brief",
      action: "brief",
      cta: "生成 Brief",
    };
  }

  if (!hasJobForReference(reference, jobs)) {
    return {
      stage: "Brief 已生成",
      missing: "未建立製作 Job",
      next: "交俾 Designer 開始製作",
      action: "job",
      cta: "建立製作 Job",
    };
  }

  return {
    stage: "製作流程中",
    missing: "等待製作 / Review",
    next: "跟進 Job 狀態及輸出",
    action: "review",
    cta: "查看製作 Job",
  };
}

function getReferenceStatusBadge(reference, context = {}) {
  const guidance = getReferenceWorkflowGuidance(reference, context);

  if (!hasReferencePreview(reference)) {
    return { label: "未有預覽", className: "bg-amber-50 text-amber-700 border-amber-200" };
  }

  if (guidance.action === "review") {
    return { label: "已有 Job", className: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  }

  if (guidance.action === "job") {
    return { label: "已生成 Brief", className: "bg-blue-50 text-blue-700 border-blue-200" };
  }

  if (guidance.action === "brief") {
    return { label: "已套用", className: "bg-indigo-50 text-indigo-700 border-indigo-200" };
  }

  if (guidance.action === "apply") {
    return { label: "已拆解", className: "bg-violet-50 text-violet-700 border-violet-200" };
  }

  return { label: "已收集", className: "bg-slate-100 text-slate-600 border-slate-200" };
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

function safeCaptureText(value, maxLength = 1200) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function safeCaptureAssetUrl(value, maxLength = 4500000) {
  const trimmed = String(value || "").trim();
  if (trimmed.startsWith("data:") && trimmed.length > maxLength) return "";
  return trimmed.slice(0, maxLength);
}

function normalizeCapturePlatform(value) {
  const normalized = safeCaptureText(value, 80).toLowerCase();
  if (normalized.includes("instagram")) return "Instagram";
  if (normalized.includes("facebook")) return "Facebook";
  if (normalized.includes("meta")) return "Meta Ad Library";
  if (normalized.includes("website") || normalized.includes("landing")) return "Website";
  return safeCaptureText(value, 80) || "Website";
}

function getCaptureImportCandidates(payload) {
  if (!payload || typeof payload !== "object") return [];

  const sourceCandidates = Array.isArray(payload.candidates)
    ? payload.candidates
    : Array.isArray(payload.items)
      ? payload.items
      : [];

  return sourceCandidates
    .filter((candidate) => candidate && typeof candidate === "object")
    .slice(0, 30);
}

function createReferenceFromCaptureCandidate(candidate, context = {}, index = 0) {
  const now = new Date().toISOString();
  const campaignContext = context.campaignContext || {};
  const selectedCompetitor = context.selectedCompetitor || {};
  const platform = normalizeCapturePlatform(candidate.platform || context.platform);
  const previewUrl = safeCaptureAssetUrl(candidate.previewUrl || candidate.screenshotDataUrl || "");
  const sourceUrl = safeCaptureText(candidate.sourceUrl || candidate.pageUrl || context.pageUrl || "", 2000);
  const competitorBrand = safeCaptureText(candidate.competitorBrand || selectedCompetitor.name || context.detectedBrandName || "", 180);
  const title = safeCaptureText(candidate.title || candidate.pageTitle || competitorBrand || "已收集素材", 180);
  const sourceType = safeCaptureText(candidate.sourceType || "extension_capture", 80);
  const contextTags = [
    "瀏覽器插件擷取",
    platform,
    sourceType,
    campaignContext.brandName,
    campaignContext.treatmentName,
    selectedCompetitor.name,
  ]
    .filter(Boolean)
    .map((tag) => safeCaptureText(tag, 80));
  const productionNotes = [
    "由 Alyssa 瀏覽器插件匯入。",
    candidate.pageTitle ? `來源頁：${safeCaptureText(candidate.pageTitle, 180)}` : "",
    campaignContext.brandName ? `目前品牌：${campaignContext.brandName}` : "",
    campaignContext.treatmentName ? `目前療程：${campaignContext.treatmentName}` : "",
    campaignContext.offer ? `Offer：${campaignContext.offer}` : "",
    selectedCompetitor.name ? `競爭品牌：${selectedCompetitor.name}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    id: `capture-reference-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
    title,
    platform,
    sourceUrl,
    competitorBrand,
    targetBrand: safeCaptureText(campaignContext.brandName || "", 180),
    offer: safeCaptureText(candidate.offer || "", 240),
    angle: safeCaptureText(candidate.angle || campaignContext.treatmentName || "", 240),
    hookNotes: safeCaptureText(candidate.hookNotes || "", 1200),
    visualNotes: "由 Alyssa 瀏覽器插件匯入。",
    captionNotes: safeCaptureText(candidate.captionText || "", 1800),
    productionNotes,
    tags: Array.from(new Set(contextTags)).join(", "),
    sourceType,
    mediaType: previewUrl ? "image" : "link",
    previewUrl,
    assetUrl: "",
    thumbnailUrl: safeCaptureAssetUrl(candidate.previewUrl || previewUrl || ""),
    board: "瀏覽器插件擷取",
    status: "已收集",
    createdAt: now,
    updatedAt: now,
  };
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
    `Source type: ${getReferenceSourceLabel(reference)}`,
    `Media type: ${getReferenceMediaType(reference)}`,
    `Source URL: ${reference.sourceUrl || "None"}`,
    `Asset URL: ${reference.assetUrl || "None"}`,
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
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(BRAND_RECORDS_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
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
  spark: "✧",
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
  summary: "未進行 AI 影片分析。可以先由新增創作上載影片，或直接用品牌資料生成稿。",
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
  return <div className={`rounded-[2rem] border border-rose-100/80 bg-white/88 shadow-[0_18px_55px_rgba(73,34,67,0.08)] backdrop-blur ${className}`}>{children}</div>;
}

function Button({ children, onClick, variant = "primary", className = "", type = "button", disabled = false }) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold shadow-sm transition hover:-translate-y-0.5 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0";
  const styles =
    variant === "outline"
      ? "border border-rose-200/80 bg-white/90 text-[#41223f] hover:border-rose-300 hover:bg-rose-50"
      : variant === "ghost"
      ? "bg-transparent text-[#6f4267] shadow-none hover:bg-rose-100/70"
      : variant === "danger"
      ? "bg-red-600 text-white hover:bg-red-700"
      : "bg-gradient-to-r from-[#7f315f] via-[#b45571] to-[#e08b64] text-white shadow-[0_14px_34px_rgba(180,85,113,0.28)] hover:from-[#6d2857] hover:to-[#d97b57]";

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
      <div className="mb-2 text-sm font-semibold text-[#583257]">{label}</div>
      {textarea ? (
        <textarea
          value={value || ""}
          rows={rows}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-rose-100 bg-white/90 px-4 py-3 text-sm text-[#40243f] outline-none transition placeholder:text-slate-300 focus:border-rose-300 focus:ring-4 focus:ring-rose-100/80"
        />
      ) : (
        <input
          value={value || ""}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-rose-100 bg-white/90 px-4 py-3 text-sm text-[#40243f] outline-none transition placeholder:text-slate-300 focus:border-rose-300 focus:ring-4 focus:ring-rose-100/80"
        />
      )}
    </label>
  );
}

function SelectInput({ label, value, onChange, options }) {
  return (
    <label className="block">
      <div className="mb-2 text-sm font-semibold text-[#583257]">{label}</div>
      <select
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-rose-100 bg-white/90 px-4 py-3 text-sm text-[#40243f] outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100/80"
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
  const name = String(record?.name || "").trim();
  const cta = String(record?.cta || "").trim();

  return {
    code,
    name,
    tone: String(record?.tone || "").trim(),
    footer: String(record?.footer || "").trim(),
    defaultAvoid: cleanOptionalBrandText(record?.defaultAvoid),
    cta,
    branches: String(record?.branches || "").trim(),
    whatsapp: String(record?.whatsapp || "").trim(),
    scriptRule: cleanOptionalBrandText(record?.scriptRule) || "0-3秒先講清楚痛點或結果。",
    promptRules: cleanOptionalBrandText(record?.promptRules) || "使用香港 marketing team 語氣，文案要清楚、可信、可執行。",
    bannedWords: cleanOptionalBrandText(record?.bannedWords) || "保證、根治、永久改善、誇大效果",
    safePhrases: cleanOptionalBrandText(record?.safePhrases) || "了解狀態、改善觀感、提升體驗、按需要建議方案",
    hookRule: cleanOptionalBrandText(record?.hookRule) || "片頭先講客人情境或痛點，再帶出服務價值。",
    websiteUrl: String(record?.websiteUrl || "").trim(),
    instagramUrl: String(record?.instagramUrl || "").trim(),
    facebookUrl: String(record?.facebookUrl || "").trim(),
    brandStyleSummary: cleanOptionalBrandText(record?.brandStyleSummary),
    commonWords: cleanOptionalBrandText(record?.commonWords),
    footerExamples: String(record?.footerExamples || record?.footer || "").trim(),
    commonCtaPatterns: String(record?.commonCtaPatterns || record?.cta || "").trim(),
    captionRules: cleanOptionalBrandText(record?.captionRules) || "痛點開場 → 服務價值 → Offer → CTA",
  };
}

function brandOptionsFromRecords(records) {
  return records.map(normalizeBrandRecord).map((brand) => ({ value: brand.code, label: brand.name || "未命名品牌" }));
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

function getDefaultTreatmentRecords() {
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

  const normalized = normalizeBrandRecord({ code: " brand1 ", name: " 測試品牌 ", cta: "預約" });
  assert("brand code is normalized to uppercase", normalized.code === "BRAND1");
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
      treatment: "測試療程",
      painPoints: "客人主要痛點",
      sellingPoints: "核心賣點",
      offer: "體驗優惠",
      cta: "預約查詢",
    },
    normalizeBrandRecord({ code: "BRAND1", name: "測試品牌", cta: "預約查詢" }),
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
  const [activeTab, setActiveTab] = useState("overview");
  const [creativeSourceType, setCreativeSourceType] = useState("extension");
  const [topicInspiration, setTopicInspiration] = useState("頭皮護理熱門痛點內容");
  const [selectedReferenceChecklist, setSelectedReferenceChecklist] = useState(["Hook 結構", "痛點切入", "視覺構圖", "香港本地化語氣", "避免直接照抄"]);
  const [scriptDetailMode, setScriptDetailMode] = useState("simple");
  const [uploadReferenceDraft, setUploadReferenceDraft] = useState({
    title: "",
    sourceUrl: "",
    competitorBrand: "",
    notes: "",
  });
  const [uploadReferencePreviewUrl, setUploadReferencePreviewUrl] = useState("");
  const [uploadReferenceStatus, setUploadReferenceStatus] = useState("idle");
  const [selectedTopicCategory, setSelectedTopicCategory] = useState("頭皮護理");
  const [selectedTrendingTopicId, setSelectedTrendingTopicId] = useState("");
  const [skipBrandSetupPrompt, setSkipBrandSetupPrompt] = useState(false);
  const [clientReady, setClientReady] = useState(false);
  const [databasePanel, setDatabasePanel] = useState("basic");
  const [storyboardViewMode, setStoryboardViewMode] = useState("compact");
  const [brandRecords, setBrandRecords] = useState(initialBrandRecords);
  const [brandStorageReady, setBrandStorageReady] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState("");
  const [editingBrandCode, setEditingBrandCode] = useState("");
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
  const [referenceScreenshotFile, setReferenceScreenshotFile] = useState(null);
  const [referenceScreenshotPreviewUrl, setReferenceScreenshotPreviewUrl] = useState("");
  const [referenceScreenshotAnalysisStatus, setReferenceScreenshotAnalysisStatus] = useState("idle");
  const [referenceScreenshotAnalysisError, setReferenceScreenshotAnalysisError] = useState("");
  const [referenceScreenshotAnalysis, setReferenceScreenshotAnalysis] = useState(null);
  const [referenceBoardFilter, setReferenceBoardFilter] = useState("all");
  const [referenceCaptureOpen, setReferenceCaptureOpen] = useState(false);
  const [referenceSourceStatus, setReferenceSourceStatus] = useState("idle");
  const [referenceSourceMessage, setReferenceSourceMessage] = useState("");
  const [referenceSourceLocalPreviewUrl, setReferenceSourceLocalPreviewUrl] = useState("");
  const [captureImportNotice, setCaptureImportNotice] = useState(null);
  const [brandIntelligence, setBrandIntelligence] = useState(createDefaultBrandIntelligence);
  const [brandIntelligenceReady, setBrandIntelligenceReady] = useState(false);
  const [brandLibrary, setBrandLibrary] = useState([]);
  const [brandLibraryReady, setBrandLibraryReady] = useState(false);
  const [selectedLibraryBrandId, setSelectedLibraryBrandId] = useState("");
  const [selectedLibraryTreatmentId, setSelectedLibraryTreatmentId] = useState("");
  const [materialScanTask, setMaterialScanTask] = useState(null);

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
    if (!clientReady) return;

    setBrandIntelligence(loadBrandIntelligenceFromStorage());
    setBrandIntelligenceReady(true);
  }, [clientReady]);

  useEffect(() => {
    if (!brandIntelligenceReady) return;
    saveBrandIntelligenceToStorage(brandIntelligence);
  }, [brandIntelligence, brandIntelligenceReady]);

  useEffect(() => {
    if (!referenceScreenshotPreviewUrl) return undefined;

    return () => {
      window.URL.revokeObjectURL(referenceScreenshotPreviewUrl);
    };
  }, [referenceScreenshotPreviewUrl]);

  useEffect(() => {
    if (!referenceSourceLocalPreviewUrl) return undefined;

    return () => {
      window.URL.revokeObjectURL(referenceSourceLocalPreviewUrl);
    };
  }, [referenceSourceLocalPreviewUrl]);

  useEffect(() => {
    if (!uploadReferencePreviewUrl) return undefined;

    return () => {
      window.URL.revokeObjectURL(uploadReferencePreviewUrl);
    };
  }, [uploadReferencePreviewUrl]);

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
    projectName: "",
    platform: "Reels",
    length: "30秒",
    angle: "痛點型",
    generationMode: "CTWA 強轉化版",
    treatment: "",
    targetAudience: "",
    painPoints: "",
    sellingPoints: "",
    offer: "",
    cta: "",
    referencePath: "",
    mustInclude: "",
    avoidWords: "",
    notes: "",
  });

  useEffect(() => {
    cleanupLegacyDemoBrandStorage();
    setBrandRecords(loadBrandRecordsFromStorage());
    setBrandStorageReady(true);
  }, []);

  useEffect(() => {
    if (!brandStorageReady) return;
    saveBrandRecordsToStorage(brandRecords);
  }, [brandRecords, brandStorageReady]);

  useEffect(() => {
    if (!clientReady || !brandStorageReady || brandLibraryReady) return;

    const nextLibrary = loadBrandLibraryFromStorage([]);

    setBrandLibrary(nextLibrary);
    setSelectedLibraryBrandId((current) => current || nextLibrary[0]?.id || "");
    setSelectedLibraryTreatmentId((current) => current || nextLibrary[0]?.treatments?.[0]?.id || "");
    setBrandLibraryReady(true);
  }, [clientReady, brandStorageReady, brandLibraryReady]);

  useEffect(() => {
    if (!brandLibraryReady) return;
    saveBrandLibraryToStorage(brandLibrary);
  }, [brandLibrary, brandLibraryReady]);

  useEffect(() => {
    const selectedLibraryBrand = brandLibrary.find((brand) => brand.id === selectedLibraryBrandId);
    if (!selectedLibraryBrand) return;

    if (!selectedLibraryBrand.treatments?.some((treatment) => treatment.id === selectedLibraryTreatmentId)) {
      setSelectedLibraryTreatmentId(selectedLibraryBrand.treatments?.[0]?.id || "");
    }
  }, [brandLibrary, selectedLibraryBrandId, selectedLibraryTreatmentId]);

  const brandOptions = useMemo(() => brandOptionsFromRecords(brandRecords), [brandRecords]);
  const brandConfig = useMemo(() => getBrandConfig(brandRecords, selectedBrand), [brandRecords, selectedBrand]);
  const brandTreatments = getBrandTreatments(brandConfig);
  const selectedTreatment =
    brandTreatments.find((treatment) => treatment.id === form.treatmentId) ||
    brandTreatments.find((treatment) => treatment.name === form.treatment) ||
    null;
  const selectedLibraryBrand = useMemo(
    () => brandLibrary.find((brand) => brand.id === selectedLibraryBrandId) || brandLibrary[0] || null,
    [brandLibrary, selectedLibraryBrandId]
  );
  const selectedLibraryTreatments = selectedLibraryBrand?.treatments || [];
  const selectedLibraryTreatment = useMemo(
    () =>
      selectedLibraryTreatments.find((treatment) => treatment.id === selectedLibraryTreatmentId) ||
      selectedLibraryTreatments[0] ||
      null,
    [selectedLibraryTreatments, selectedLibraryTreatmentId]
  );
  const campaignContext = useMemo(
    () => buildCampaignContext(selectedLibraryBrand, selectedLibraryTreatment),
    [selectedLibraryBrand, selectedLibraryTreatment]
  );
  const campaignContextSummary = useMemo(() => formatCampaignContextSummary(campaignContext), [campaignContext]);

  // Auto apply selected brand treatment when switching brand.
  useEffect(() => {
    if (!selectedBrand || !brandRecords.length) return;

    const nextBrand = brandRecords.find((brand) => brand.code === selectedBrand) || brandConfig;
    const nextTreatments = getBrandTreatments(nextBrand);
    const nextTreatment = nextTreatments[0] || null;

    setForm((current) => {
      if (current.brandCode === selectedBrand) return current;

      return {
        ...current,
        brandCode: selectedBrand,
        projectName: nextTreatment?.name ? `${nextTreatment.name} ${current.length || "30秒"}廣告` : current.projectName,
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

  const referenceBoardOptions = useMemo(
    () => [
      { id: "all", label: "全部參考", count: referenceAds.length },
      { id: "applied", label: "已套用", count: appliedReferenceId ? 1 : 0 },
      {
        id: "facebook",
        label: "Facebook",
        count: referenceAds.filter((reference) => String(reference.platform || "").toLowerCase().includes("facebook")).length,
      },
      {
        id: "meta",
        label: "Meta Ad Library",
        count: referenceAds.filter((reference) => String(reference.platform || "").toLowerCase().includes("meta")).length,
      },
      {
        id: "offer",
        label: "有優惠",
        count: referenceAds.filter((reference) => String(reference.offer || "").trim()).length,
      },
      {
        id: "hook",
        label: "Hook 角度",
        count: referenceAds.filter((reference) => String(reference.hookNotes || reference.angle || "").trim()).length,
      },
      {
        id: "screenshot",
        label: "截圖素材",
        count: referenceAds.filter((reference) => String(reference.platform || "").toLowerCase().includes("screenshot")).length,
      },
      {
        id: "video",
        label: "影片素材",
        count: referenceAds.filter((reference) => getReferenceMediaType(reference) === "video").length,
      },
      {
        id: "image",
        label: "圖片素材",
        count: referenceAds.filter((reference) => getReferenceMediaType(reference) === "image").length,
      },
      {
        id: "url",
        label: "連結素材",
        count: referenceAds.filter((reference) => (reference.sourceType || getReferenceMediaType(reference)) === "url" || getReferenceMediaType(reference) === "link").length,
      },
    ],
    [referenceAds, appliedReferenceId]
  );

  const filteredReferenceAds = useMemo(() => {
    const searchTerm = discoveryKeyword.trim().toLowerCase();

    return referenceAds.filter((reference) => {
      const platform = String(reference.platform || "").toLowerCase();
      const searchable = [
        reference.title,
        reference.platform,
        reference.competitorBrand,
        reference.targetBrand,
        reference.offer,
        reference.angle,
        reference.hookNotes,
        reference.visualNotes,
        reference.captionNotes,
        reference.productionNotes,
        reference.tags,
        reference.board,
        reference.status,
        reference.sourceType,
        reference.mediaType,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !searchTerm || searchable.includes(searchTerm);
      const matchesBoard =
        referenceBoardFilter === "all" ||
        (referenceBoardFilter === "applied" && appliedReferenceId === reference.id) ||
        (referenceBoardFilter === "facebook" && platform.includes("facebook")) ||
        (referenceBoardFilter === "meta" && platform.includes("meta")) ||
        (referenceBoardFilter === "offer" && String(reference.offer || "").trim()) ||
        (referenceBoardFilter === "hook" && String(reference.hookNotes || reference.angle || "").trim()) ||
        (referenceBoardFilter === "screenshot" && platform.includes("screenshot")) ||
        (referenceBoardFilter === "video" && getReferenceMediaType(reference) === "video") ||
        (referenceBoardFilter === "image" && getReferenceMediaType(reference) === "image") ||
        (referenceBoardFilter === "url" && ((reference.sourceType || "") === "url" || getReferenceMediaType(reference) === "link"));

      return matchesSearch && matchesBoard;
    });
  }, [referenceAds, discoveryKeyword, referenceBoardFilter, appliedReferenceId]);

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

  const brandPositioningSummary = useMemo(() => buildBrandPositioningSummary(brandIntelligence), [brandIntelligence]);
  const autoCampaignCompetitors = useMemo(() => buildCampaignCompetitors(campaignContext), [campaignContext]);
  const competitorCandidates = useMemo(
    () => (brandIntelligence.competitors?.length ? brandIntelligence.competitors : autoCampaignCompetitors),
    [brandIntelligence.competitors, autoCampaignCompetitors]
  );
  const selectedCompetitor = useMemo(
    () => competitorCandidates.find((competitor) => competitor.id === brandIntelligence.selectedCompetitorId) || competitorCandidates[0] || null,
    [competitorCandidates, brandIntelligence.selectedCompetitorId]
  );
  const trendingTopicSuggestions = useMemo(
    () => getTrendingTopicsForCategory(selectedTopicCategory),
    [selectedTopicCategory]
  );
  const selectedTrendingTopic = useMemo(
    () => getSelectedTrendingTopic(trendingTopicSuggestions, selectedTrendingTopicId),
    [trendingTopicSuggestions, selectedTrendingTopicId]
  );
  const topicWhatIfPreviews = useMemo(
    () => buildTopicWhatIfPreviews(selectedTrendingTopic, brandLibrary),
    [selectedTrendingTopic, brandLibrary]
  );
  const creativeAnalysisPreview = useMemo(
    () =>
      buildSourceFirstCreativeAnalysisPreview({
        sourceType: creativeSourceType,
        selectedReference: creativeSourceType === "topic" ? null : selectedReference || appliedReference,
        videoAnalysis,
        topicInspiration,
        selectedTrendingTopic,
        uploadReferenceDraft,
        uploadReferenceVideoName: videoName,
        generated,
      }),
    [creativeSourceType, selectedReference, appliedReference, videoAnalysis, topicInspiration, selectedTrendingTopic, uploadReferenceDraft, videoName, generated]
  );
  const brandTreatmentRecommendations = useMemo(
    () => buildBrandTreatmentRecommendations(creativeAnalysisPreview, brandLibrary),
    [creativeAnalysisPreview, brandLibrary]
  );
  const hasGeneratedBrief = Boolean(aiGenerated);
  const roughCutPlanRows = useMemo(
    () => buildRoughCutPlanRows(generated.rows, selectedReferenceChecklist, selectedReference || appliedReference),
    [generated.rows, selectedReferenceChecklist, selectedReference, appliedReference]
  );
  const generatedOutputRecords = useMemo(() => {
    const rows = [];
    const briefTitle =
      typeof generated.brief === "string"
        ? generated.brief.slice(0, 42)
        : generated.brief?.title || generated.strategy?.brand || "";

    if (hasGeneratedBrief) {
      rows.push({
        id: "current-generated-output",
        title: form.projectName || briefTitle || "今次 Creative Brief",
        type: roughCutPlanRows.length ? "Creative Brief / 初剪方案" : "Creative Brief",
        brandName: campaignContext.brandName || brandConfig.name || "未套用品牌",
        treatmentName: campaignContext.treatmentName || form.treatment || "未指定療程",
        status: "今次工作",
        updatedAt: "",
        source: "AI 生成",
      });
    }

    contentJobs.forEach((job) => {
      rows.push({
        id: `job-output-${job.id}`,
        title: job.title || job.videoName || "製作 Job",
        type: job.brief || job.fullOutput ? "Creative Brief / 製作 Job" : "製作 Job",
        brandName: job.brandName || job.brandCode || "未套用品牌",
        treatmentName: job.contentType || job.videoName || "",
        status: job.status || "Job",
        updatedAt: job.updatedAt || job.createdAt || "",
        source: "製作 Job",
      });
    });

    return rows.slice(0, 8);
  }, [campaignContext, brandConfig.name, contentJobs, form.projectName, form.treatment, generated.brief, generated.strategy, hasGeneratedBrief, roughCutPlanRows.length]);
  const activeProductionJobCount = useMemo(
    () => contentJobs.filter((job) => !["Completed", "Archived"].includes(job.status)).length,
    [contentJobs]
  );
  const brandWorkspaceRecords = useMemo(
    () =>
      brandLibrary.map((brand) => {
        const brandName = brand.brandName || brand.name || "未命名品牌";
        const brandNeedle = brandName.trim().toLowerCase();
        const matchesBrand = (values) =>
          Boolean(
            brandNeedle &&
              values
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(brandNeedle)
          );
        const materialCount = referenceAds.filter((reference) =>
          matchesBrand([
            reference.targetBrand,
            reference.competitorBrand,
            reference.title,
            reference.tags,
            reference.board,
          ])
        ).length;
        const outputCount = generatedOutputRecords.filter((record) =>
          matchesBrand([record.brandName, record.title, record.treatmentName])
        ).length;
        const activeJobs = contentJobs.filter(
          (job) =>
            !["Completed", "Archived"].includes(job.status) &&
            matchesBrand([job.brandName, job.brandCode, job.title, job.videoName])
        ).length;

        return {
          ...brand,
          brandName,
          materials: materialCount,
          outputs: outputCount,
          activeJobs,
          treatmentsCount: brand.treatments?.length || 0,
        };
      }),
    [brandLibrary, contentJobs, generatedOutputRecords, referenceAds]
  );
  const selectedWorkspaceBrand =
    brandWorkspaceRecords.find((brand) => brand.id === selectedLibraryBrandId) ||
    brandWorkspaceRecords[0] ||
    null;
  const selectedWorkspaceNeedle = selectedWorkspaceBrand?.brandName?.trim().toLowerCase() || "";
  const matchesSelectedWorkspaceBrand = (values) =>
    Boolean(
      selectedWorkspaceNeedle &&
        values
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(selectedWorkspaceNeedle)
    );
  const selectedWorkspaceMaterials = useMemo(
    () =>
      referenceAds
        .filter((reference) =>
          matchesSelectedWorkspaceBrand([
            reference.targetBrand,
            reference.competitorBrand,
            reference.title,
            reference.tags,
            reference.board,
          ])
        )
        .slice(0, 6),
    [referenceAds, selectedWorkspaceNeedle]
  );
  const selectedWorkspaceOutputs = useMemo(
    () =>
      generatedOutputRecords
        .filter((record) => matchesSelectedWorkspaceBrand([record.brandName, record.title, record.treatmentName]))
        .slice(0, 6),
    [generatedOutputRecords, selectedWorkspaceNeedle]
  );
  const selectedWorkspaceJobs = useMemo(
    () =>
      contentJobs
        .filter((job) => matchesSelectedWorkspaceBrand([job.brandName, job.brandCode, job.title, job.videoName]))
        .slice(0, 6),
    [contentJobs, selectedWorkspaceNeedle]
  );
  const selectedChecklistSummary = selectedReferenceChecklist.length
    ? selectedReferenceChecklist.join(" / ")
    : "未勾選參考位";

  const handleCreativeSourceSelect = (sourceId) => {
    setCreativeSourceType(sourceId);
    if (sourceId === "extension") setSourceLabel("瀏覽器插件擷取");
    if (sourceId === "video") setSourceLabel("上載參考影片");
    if (sourceId === "topic") {
      const topic = selectedTrendingTopic || trendingTopicSuggestions[0];
      if (topic) {
        setSelectedTrendingTopicId(topic.id);
        setTopicInspiration(topic.title);
      }
      setSourceLabel("AI 熱門話題建議");
    }
    setActiveTab("analysis");
  };

  const handleUploadReferenceDraftChange = (field, value) => {
    setUploadReferenceDraft((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleUploadReferenceVideoSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const localUrl = window.URL.createObjectURL(file);
    setVideoFile(file);
    setVideoName(file.name);
    setVideoUrl("");
    setUploadReferencePreviewUrl(localUrl);
    setUploadReferenceStatus("ready");
    setAnalysisError("");
    setUploadReferenceDraft((current) => ({
      ...current,
      title: current.title || file.name.replace(/\.[^.]+$/, ""),
    }));
  };

  const handleCreateUploadedVideoReference = async () => {
    const sourceUrl = uploadReferenceDraft.sourceUrl.trim();

    if (!videoFile && !sourceUrl) {
      setUploadReferenceStatus("error");
      setAnalysisError("請先選擇影片，或貼上參考來源 URL。");
      return;
    }

    setUploadReferenceStatus("saving");
    setAnalysisError("");

    let assetUrl = videoUrl || "";
    let thumbnailUrl = "";

    if (videoFile) {
      try {
        const frames = await extractFramesFromVideoFile(videoFile, {
          maxFrames: 1,
          maxWidth: 900,
          quality: 0.72,
        });
        thumbnailUrl = frames[0]?.imageBase64 || "";
      } catch {
        thumbnailUrl = "";
      }

      if (!assetUrl) {
        try {
          const blob = await uploadVideoToBlob(videoFile);
          assetUrl = blob.url || "";
          setVideoUrl(assetUrl);
        } catch (error) {
          setAnalysisError(`影片已可作本地參考，但暫時未能上載：${error?.message || "未知錯誤"}`);
        }
      }
    }

    const now = new Date().toISOString();
    const title = uploadReferenceDraft.title.trim() || videoName || sourceUrl || "上載參考影片";
    const newReference = {
      ...createDefaultReferenceDraft(),
      id: `reference-upload-video-${Date.now()}`,
      title,
      platform: inferReferencePlatformFromUrl(sourceUrl) || "Video",
      sourceType: "uploaded_reference_video",
      mediaType: "video",
      sourceUrl: sourceUrl || assetUrl,
      previewUrl: thumbnailUrl,
      assetUrl,
      thumbnailUrl,
      board: "上載參考影片",
      status: "已收集",
      competitorBrand: uploadReferenceDraft.competitorBrand.trim(),
      visualNotes: [
        uploadReferenceDraft.notes.trim(),
        videoName ? `影片檔案：${videoName}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
      productionNotes: "由上載參考影片流程建立，可繼續做 AI 拆解、Brief 或製作 Job。",
      tags: "上載參考影片, 素材庫, 影片參考",
      createdAt: now,
      updatedAt: now,
    };

    setReferenceAds((current) => [newReference, ...current]);
    setSelectedReferenceId(newReference.id);
    setAppliedReferenceId(newReference.id);
    setSourceLabel(`上載參考影片｜${title}`);
    setUploadReferenceStatus("saved");
    setActiveTab("analysis");
  };

  const handleUseTrendingTopicAsAnalysisSource = (topic) => {
    if (!topic) return;

    const now = new Date().toISOString();
    const existingReference = referenceAds.find(
      (reference) => reference.sourceType === "ai_trending_topic" && reference.title === topic.title
    );

    setCreativeSourceType("topic");
    setSelectedTrendingTopicId(topic.id);
    setTopicInspiration(topic.title);
    setSourceLabel(`AI 熱門話題｜${topic.title}`);

    if (existingReference) {
      setSelectedReferenceId(existingReference.id);
      setAppliedReferenceId(existingReference.id);
      setActiveTab("analysis");
      return;
    }

    const newReference = {
      ...createDefaultReferenceDraft(),
      id: `reference-topic-${Date.now()}`,
      title: topic.title,
      platform: "AI Topic",
      sourceType: "ai_trending_topic",
      mediaType: "manual",
      board: "AI 熱門話題",
      status: "已收集",
      offer: "",
      angle: topic.title,
      hookNotes: topic.hook,
      visualNotes: topic.visualDirection,
      captionNotes: topic.why,
      productionNotes: `建議格式：${topic.format}`,
      tags: [topic.category, ...(topic.tags || [])].filter(Boolean).join(", "),
      createdAt: now,
      updatedAt: now,
    };

    setReferenceAds((current) => [newReference, ...current]);
    setSelectedReferenceId(newReference.id);
    setAppliedReferenceId(newReference.id);
    setActiveTab("analysis");
  };

  const handleApplyTopicWhatIfPreview = (preview) => {
    if (!preview) return;
    if (preview.brandId && !String(preview.brandId).startsWith("fallback-")) {
      setSelectedLibraryBrandId(preview.brandId);
    }
    if (preview.treatmentId && !String(preview.treatmentId).startsWith("fallback-")) {
      setSelectedLibraryTreatmentId(preview.treatmentId);
    }
    setSourceLabel(`${preview.brandName}｜${preview.treatmentName}`);
    setActiveTab("apply");
  };

  const toggleReferenceChecklistItem = (item) => {
    setSelectedReferenceChecklist((current) =>
      current.includes(item) ? current.filter((value) => value !== item) : [...current, item]
    );
  };

  const handleApplyBrandTreatmentRecommendation = (recommendation) => {
    if (!recommendation) return;
    setSelectedLibraryBrandId(recommendation.brandId);
    setSelectedLibraryTreatmentId(recommendation.treatmentId);
    setSourceLabel(`${recommendation.brandName}｜${recommendation.treatmentName}`);
    setActiveTab("checklist");
  };

  useEffect(() => {
    if (!clientReady || !referenceStorageReady) return undefined;

    const handleCaptureImport = (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.source !== window) return;

      const message = event.data;
      if (!message || message.type !== "ALYSSA_CAPTURE_IMPORT") return;

      const payload = message.payload;
      const payloadId = safeCaptureText(payload?.id, 200);
      if (payloadId && window.__alyssaLastCaptureImportId === payloadId) return;
      if (payloadId) window.__alyssaLastCaptureImportId = payloadId;

      const candidates = getCaptureImportCandidates(payload);

      if (!candidates.length) {
        setCaptureImportNotice({
          type: "error",
          message: "瀏覽器插件未有送入可用素材。",
        });
        return;
      }

      const importedReferences = candidates.map((candidate, index) =>
        createReferenceFromCaptureCandidate(candidate, {
          campaignContext,
          selectedCompetitor,
          platform: payload?.platform,
          pageUrl: payload?.pageUrl,
          detectedBrandName: payload?.detectedBrandName,
        }, index)
      );

      setReferenceAds((current) => {
        const nextReferences = [...importedReferences, ...current];
        saveReferenceAdsToStorage(nextReferences);
        return nextReferences;
      });
      setSelectedReferenceId(importedReferences[0]?.id || "");
      setReferenceBoardFilter("all");
      setActiveTab("references");
      setCaptureImportNotice({
        type: "success",
        count: importedReferences.length,
        message: `已從瀏覽器插件匯入 ${importedReferences.length} 個素材`,
      });
    };

    window.addEventListener("message", handleCaptureImport);
    return () => window.removeEventListener("message", handleCaptureImport);
  }, [clientReady, referenceStorageReady, campaignContext, selectedCompetitor]);

  const activeWorkflowStageId = (() => {
    if (activeTab === "source") return "source";
    if (["analysis", "references", "materials"].includes(activeTab)) return "analysis";
    if (["apply", "brand", "competitors"].includes(activeTab)) return "apply";
    if (activeTab === "checklist") return "checklist";
    if (["input", "script", "brief"].includes(activeTab)) return "script";
    if (activeTab === "roughcut") return "roughcut";
    if (activeTab === "jobs") return "job";
    return "source";
  })();
  const activeWorkflowStageIndex = PRODUCT_WORKFLOW_STAGES.findIndex((stage) => stage.id === activeWorkflowStageId);
  const workflowCompleted = {
    source: Boolean(creativeSourceType),
    analysis: videoAnalysis.status !== "未分析" || referenceAds.length > 0 || creativeSourceType === "topic",
    apply: Boolean(campaignContext.brandName && campaignContext.treatmentName),
    checklist: selectedReferenceChecklist.length > 0,
    script: hasGeneratedBrief || Boolean(generated.rows?.length),
    roughcut: roughCutPlanRows.length > 0,
    job: contentJobs.length > 0,
  };
  workflowCompleted.library = brandLibrary.length > 0;
  workflowCompleted.treatment = Boolean(campaignContext.brandName && campaignContext.treatmentName);
  workflowCompleted.competitors = competitorCandidates.some(
    (competitor) => competitor.status === "已選擇" || competitor.id === brandIntelligence.selectedCompetitorId
  );
  const selectedReferenceGuidance = useMemo(
    () =>
      getReferenceWorkflowGuidance(selectedReference, {
        appliedReferenceId,
        hasBrief: hasGeneratedBrief,
        jobs: contentJobs,
      }),
    [selectedReference, appliedReferenceId, hasGeneratedBrief, contentJobs]
  );

  const getWorkflowStageStatus = (stage, index) => {
    if (stage.id === activeWorkflowStageId) return { label: "進行中", tone: "current" };
    if (workflowCompleted[stage.id]) return { label: "已完成", tone: "done" };
    if (index === activeWorkflowStageIndex + 1) return { label: "下一步", tone: "next" };
    return { label: "未開始", tone: "pending" };
  };

  const updateBrandIntelligenceField = (field, value) => {
    setBrandIntelligence((current) => ({
      ...current,
      [field]: value,
      updatedAt: new Date().toISOString(),
    }));
  };

  const updateBrandLibraryBrandField = (field, value) => {
    if (!selectedLibraryBrand) return;

    setBrandLibrary((current) =>
      current.map((brand) => (brand.id === selectedLibraryBrand.id ? { ...brand, [field]: value } : brand))
    );
  };

  const updateBrandLibraryTreatmentField = (field, value) => {
    if (!selectedLibraryBrand || !selectedLibraryTreatment) return;

    setBrandLibrary((current) =>
      current.map((brand) =>
        brand.id === selectedLibraryBrand.id
          ? {
              ...brand,
              treatments: brand.treatments.map((treatment) =>
                treatment.id === selectedLibraryTreatment.id ? { ...treatment, [field]: value } : treatment
              ),
            }
          : brand
      )
    );
  };

  const handleSelectLibraryBrand = (brandId) => {
    const nextBrand = brandLibrary.find((brand) => brand.id === brandId);
    setSelectedLibraryBrandId(brandId);
    setSelectedLibraryTreatmentId(nextBrand?.treatments?.[0]?.id || "");
  };

  const handleAddLibraryBrand = () => {
    const nextBrand = createBlankBrandLibraryBrand(brandLibrary.length);
    setBrandLibrary((current) => [...current, nextBrand]);
    setSelectedLibraryBrandId(nextBrand.id);
    setSelectedLibraryTreatmentId(nextBrand.treatments?.[0]?.id || "");
  };

  const handleAddLibraryTreatment = () => {
    if (!selectedLibraryBrand) return;

    const nextTreatment = createBlankBrandLibraryTreatment(selectedLibraryBrand.treatments?.length || 0, selectedLibraryBrand.code || selectedLibraryBrand.brandName);
    setBrandLibrary((current) =>
      current.map((brand) =>
        brand.id === selectedLibraryBrand.id
          ? { ...brand, treatments: [...(brand.treatments || []), nextTreatment] }
          : brand
      )
    );
    setSelectedLibraryTreatmentId(nextTreatment.id);
  };

  const handleApplyCampaignContext = () => {
    if (!selectedLibraryBrand || !selectedLibraryTreatment) return;

    const context = buildCampaignContext(selectedLibraryBrand, selectedLibraryTreatment);
    const nextCode =
      String(context.brandCode || context.brandName || selectedBrand)
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, "")
        .slice(0, 8) || `LIB${brandLibrary.length + 1}`;
    const suggestions = buildCampaignCompetitors(context);

    setBrandRecords((current) => {
      const hasRecord = current.some((brand) => normalizeBrandRecord(brand).code === nextCode);
      if (hasRecord) return current;

      return [
        ...current,
        {
          code: nextCode,
          name: context.brandName,
          tone: context.toneOfVoice,
          websiteUrl: context.websiteUrl,
          instagramUrl: context.igUrl,
          facebookUrl: context.fbUrl,
          brandStyleSummary: context.brandPositioning,
          treatments: [
            {
              id: context.treatmentId,
              name: context.treatmentName,
              category: context.category,
              painPoints: context.painPoints,
              sellingPoints: context.sellingPoints,
              targetAudience: context.targetAudience,
              offer: context.offer,
              suggestedVisuals: context.visualAngles,
              materialDirection: context.visualAngles,
              safePhrases: context.commonHooks,
            },
          ],
          activeTreatmentIndex: 0,
        },
      ];
    });
    setSelectedBrand(nextCode);
    setEditingBrandCode(nextCode);
    setForm((current) => ({
      ...current,
      brandCode: nextCode,
      projectName: [context.brandName, context.treatmentName || "Creative Brief"].filter(Boolean).join("｜"),
      treatmentId: context.treatmentId,
      treatment: context.treatmentName || current.treatment,
      targetAudience: context.targetAudience || current.targetAudience,
      painPoints: context.painPoints || current.painPoints,
      sellingPoints: context.sellingPoints || current.sellingPoints,
      offer: context.offer || current.offer,
      treatmentCategory: context.category || "",
      treatmentSummary: context.sellingPoints || "",
      treatmentSuggestedVisuals: context.visualAngles || "",
      treatmentMaterialDirection: context.visualAngles || "",
      notes: [current.notes, context.commonHooks ? `參考 Hook：${context.commonHooks}` : ""].filter(Boolean).join("\n"),
    }));
    setBrandIntelligence((current) => ({
      ...current,
      brandName: context.brandName,
      instagramUrl: context.igUrl,
      facebookUrl: context.fbUrl,
      websiteUrl: context.websiteUrl,
      category: context.category,
      service: context.treatmentName,
      targetAudience: context.targetAudience,
      positioning: context.brandPositioning,
      offer: context.offer,
      competitorSeeds: context.competitorKeywords.join("\n"),
      competitors: suggestions,
      selectedCompetitorId: suggestions[0]?.id || "",
      positioningCompleted: true,
      updatedAt: new Date().toISOString(),
    }));
    setDiscoveryKeyword(context.treatmentName || context.keywords[0] || "");
    setDiscoveryCompetitor("");
    setActiveTab("competitors");
  };

  const handleChooseCompetitor = (competitorId) => {
    setBrandIntelligence((current) => ({
      ...current,
      selectedCompetitorId: competitorId,
      competitors: (current.competitors?.length ? current.competitors : competitorCandidates).map((competitor) =>
        competitor.id === competitorId
          ? { ...competitor, status: "已選擇" }
          : competitor.status === "已選擇"
            ? { ...competitor, status: "候選" }
            : competitor
      ),
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleExcludeCompetitor = (competitorId) => {
    setBrandIntelligence((current) => ({
      ...current,
      competitors: (current.competitors?.length ? current.competitors : competitorCandidates).map((competitor) =>
        competitor.id === competitorId ? { ...competitor, status: "已排除" } : competitor
      ),
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleMarkCompetitorScanned = (competitorId) => {
    setBrandIntelligence((current) => ({
      ...current,
      competitors: (current.competitors?.length ? current.competitors : competitorCandidates).map((competitor) =>
        competitor.id === competitorId ? { ...competitor, status: "已收集" } : competitor
      ),
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleStartMaterialScanTask = (platform) => {
    if (!selectedCompetitor) return;

    setMaterialScanTask({
      competitorId: selectedCompetitor.id,
      competitorName: selectedCompetitor.name,
      platform,
      createdAt: new Date().toISOString(),
    });
  };

  const handleAddManualCompetitorFromLibrary = () => {
    const name = String(brandIntelligence.manualCompetitorName || "").trim();
    if (!name) return;

    const newCompetitor = {
      id: createCompetitorId(`${campaignContext.key || "manual"}-${name}`, Date.now()),
      name,
      type: "手動加入",
      why: "團隊指定要比較的競品，可直接進入 IG / FB 或 Ad Library 搜尋。",
      searchKeywords: buildCompetitorSearchKeywords(name, campaignContext),
      status: "已選擇",
      source: "manual",
    };

    setBrandIntelligence((current) => ({
      ...current,
      competitors: [
        newCompetitor,
        ...(current.competitors?.length ? current.competitors : competitorCandidates).map((competitor) =>
          competitor.status === "已選擇" ? { ...competitor, status: "候選" } : competitor
        ),
      ],
      selectedCompetitorId: newCompetitor.id,
      manualCompetitorName: "",
      manualCompetitorIgUrl: "",
      manualCompetitorFbUrl: "",
      updatedAt: new Date().toISOString(),
    }));
    setActiveTab("materials");
  };

  const handleOpenCompetitorAdLibrary = (competitor = selectedCompetitor) => {
    if (!competitor?.name) return;
    window.open(buildMetaAdLibrarySearchUrl(competitor.name, discoveryCountry || "Hong Kong"), "_blank", "noopener,noreferrer");
  };

  const handleSearchCompetitorSocial = (competitor = selectedCompetitor, platform = "Instagram Facebook") => {
    if (!competitor?.name) return;
    window.open(buildSocialSearchUrl(competitor.name, platform), "_blank", "noopener,noreferrer");
  };

  const handleAnalyzeBrandPositioning = () => {
    const suggestions = buildSuggestedCompetitors(brandIntelligence);
    setBrandIntelligence((current) => ({
      ...current,
      competitors: suggestions,
      selectedCompetitorId: current.selectedCompetitorId || suggestions[0]?.id || "",
      positioningCompleted: true,
      updatedAt: new Date().toISOString(),
    }));
    setActiveTab("competitors");
  };

  const handleSelectCompetitor = (competitorId) => {
    setBrandIntelligence((current) => ({
      ...current,
      selectedCompetitorId: competitorId,
      competitors: (current.competitors?.length ? current.competitors : competitorCandidates).map((competitor) =>
        competitor.id === competitorId
          ? { ...competitor, status: "已選用" }
          : competitor.status === "已選用"
            ? { ...competitor, status: "已確認" }
            : competitor
      ),
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleUpdateCompetitorField = (competitorId, field, value) => {
    setBrandIntelligence((current) => ({
      ...current,
      competitors: (current.competitors?.length ? current.competitors : competitorCandidates).map((competitor) =>
        competitor.id === competitorId ? { ...competitor, [field]: value, status: competitor.status === "待確認" ? "已確認" : competitor.status } : competitor
      ),
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleAddManualCompetitor = () => {
    const name = String(brandIntelligence.manualCompetitorName || "").trim();
    if (!name) return;

    const newCompetitor = {
      id: createCompetitorId(name, Date.now()),
      name,
      type: "手動加入",
      why: "由團隊手動加入，適合優先檢查 IG / FB / Ad Library 素材。",
      igUrl: brandIntelligence.manualCompetitorIgUrl || "",
      fbUrl: brandIntelligence.manualCompetitorFbUrl || "",
      status: "已選用",
    };

    setBrandIntelligence((current) => ({
      ...current,
      competitors: [newCompetitor, ...(current.competitors?.length ? current.competitors : competitorCandidates).map((competitor) => ({ ...competitor, status: competitor.status === "已選用" ? "已確認" : competitor.status }))],
      selectedCompetitorId: newCompetitor.id,
      manualCompetitorName: "",
      manualCompetitorIgUrl: "",
      manualCompetitorFbUrl: "",
      updatedAt: new Date().toISOString(),
    }));
    setActiveTab("materials");
  };

  const handleOpenSelectedCompetitorAdLibrary = () => {
    if (!selectedCompetitor?.name) return;
    const url = buildMetaAdLibrarySearchUrl(selectedCompetitor.name, discoveryCountry || "Hong Kong");
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleUseAdLibraryLinkAsReferenceDraft = () => {
    const url = String(brandIntelligence.adLibraryUrl || "").trim();
    if (!url || !selectedCompetitor) return;

    setReferenceDraft((current) => ({
      ...current,
      title: `${selectedCompetitor.name} Ad Library 參考`,
      platform: "Meta Ad Library",
      sourceType: "ad_library",
      mediaType: "link",
      sourceUrl: url,
      competitorBrand: selectedCompetitor.name,
      targetBrand: campaignContext.brandName || current.targetBrand,
      offer: campaignContext.offer || current.offer,
      angle: campaignContext.treatmentName || current.angle,
      board: "競爭對手素材",
      status: "未有預覽",
      tags: [current.tags, "Ad Library", selectedCompetitor.type, campaignContext.treatmentName].filter(Boolean).join(", "),
      visualNotes: current.visualNotes || "由競爭對手 Ad Library 連結建立，未有素材預覽。",
    }));
    setReferenceCaptureOpen(true);
    setActiveTab("references");
  };

  const renderContextualTopActions = () => {
    if (activeTab === "overview") {
      return (
        <>
          <Button onClick={() => setActiveTab("source")}>
            <Icon name="spark" /> 新增創作
          </Button>
          <Button variant="outline" onClick={() => setActiveTab("brand")}>
            品牌資料庫
          </Button>
        </>
      );
    }

    if (activeTab === "workspace") {
      return (
        <>
          <Button onClick={() => setActiveTab("source")}>
            <Icon name="spark" /> 新增創作
          </Button>
          <Button variant="outline" onClick={() => setActiveTab("brand")}>
            管理品牌資料
          </Button>
        </>
      );
    }

    if (activeTab === "source") {
      return (
        <Button onClick={() => setActiveTab("analysis")}>
          <Icon name="magic" /> 開始 AI 分析
        </Button>
      );
    }

    if (activeTab === "analysis") {
      return (
        <>
          <Button onClick={() => setActiveTab("apply")}>
            <Icon name="target" /> 套用品牌療程
          </Button>
          <Button variant="outline" onClick={() => setActiveTab("references")}>
            查看素材庫
          </Button>
        </>
      );
    }

    if (activeTab === "apply") {
      return (
        <>
          <Button onClick={() => setActiveTab("checklist")}>
            <Icon name="check" /> 勾選參考位
          </Button>
          <Button variant="outline" onClick={() => setActiveTab("brand")}>
            品牌資料庫
          </Button>
        </>
      );
    }

    if (activeTab === "checklist") {
      return (
        <>
          <Button onClick={() => setActiveTab("input")}>
            <Icon name="video" /> 生成影片稿
          </Button>
        </>
      );
    }

    if (["input", "analysis", "script", "brief"].includes(activeTab)) {
      return (
        <>
          <Button onClick={handleGenerateWithAi} disabled={appIsBusy}>
            <Icon name="magic" /> {aiStatus === "loading" ? "生成中..." : "生成影片稿"}
          </Button>
          {hasGeneratedBrief && (
            <Button variant="outline" onClick={() => setActiveTab("roughcut")}>
              <Icon name="frame" /> 初剪方案
            </Button>
          )}
        </>
      );
    }

    if (activeTab === "roughcut") {
      return (
        <>
          <Button onClick={() => setActiveTab("jobs")}>
            <Icon name="layers" /> 建立製作 Job
          </Button>
          <Button variant="outline" onClick={handleExportWord}>
            <Icon name="doc" /> 匯出 Word
          </Button>
        </>
      );
    }

    if (activeTab === "references") {
      return (
        <Button onClick={() => setReferenceCaptureOpen(true)}>
          <Icon name="frame" /> 新增素材
        </Button>
      );
    }

    if (activeTab === "brand") {
      return (
        <Button onClick={() => setActiveTab("source")}>
          返回創作流程
        </Button>
      );
    }

    if (activeTab === "jobs") {
      return (
        <>
          <Button variant="outline" onClick={() => setActiveTab("roughcut")}>
            返回初剪方案
          </Button>
          {hasGeneratedBrief && (
            <Button onClick={handleSaveAsContentJob}>
              <Icon name="layers" /> 建立製作 Job
            </Button>
          )}
        </>
      );
    }

    return null;
  };

  const handleJobDraftChange = (field, value) => {
    setJobDraft((current) => ({ ...current, [field]: value }));
  };

  const handleReferenceDraftChange = (field, value) => {
    setReferenceDraft((current) => ({ ...current, [field]: value }));
  };

  const handleReferenceSourceTypeChange = (sourceType) => {
    const option = getReferenceSourceOption(sourceType);
    setReferenceSourceStatus("idle");
    setReferenceSourceMessage("");

    setReferenceDraft((current) => ({
      ...current,
      sourceType: option.id,
      mediaType: option.mediaType,
      platform: option.platform,
      board: current.board || "參考素材",
      status: current.status || "Draft",
    }));
  };

  const handleReferenceSourceUrlChange = (value) => {
    const inferredPlatform = inferReferencePlatformFromUrl(value);

    setReferenceDraft((current) => ({
      ...current,
      sourceType: "url",
      mediaType: "link",
      sourceUrl: value,
      platform: inferredPlatform || current.platform || "Meta Ad Library",
      board: current.board || "參考素材",
      status: current.status || "Draft",
    }));
  };

  const handleExtractReferenceUrlMetadata = async () => {
    const url = String(referenceDraft.sourceUrl || "").trim();

    if (!url) {
      setReferenceSourceStatus("error");
      setReferenceSourceMessage("請先貼上參考連結。");
      return;
    }

    setReferenceSourceStatus("loading");
    setReferenceSourceMessage("正在讀取連結資料...");

    try {
      const response = await fetch("/api/extract-landing-page", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
          brandConfig,
          currentTreatment: {
            name: referenceDraft.title || "",
            offer: referenceDraft.offer || "",
            summary: referenceDraft.angle || "",
            suggestedVisuals: referenceDraft.visualNotes || "",
            landingPageNotes: referenceDraft.productionNotes || "",
          },
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.ok) {
        throw new Error(result?.message || "連結資料讀取失敗");
      }

      const treatment = result.treatment || {};
      const pageTitle = result.title || treatment.name || "";
      const pageSummary = treatment.summary || result.description || "";

      setReferenceDraft((current) => ({
        ...current,
        sourceType: "url",
        mediaType: "link",
        platform: inferReferencePlatformFromUrl(url) || current.platform || "Meta Ad Library",
        title: current.title || pageTitle,
        angle: current.angle || pageSummary,
        offer: current.offer || treatment.offer || "",
        visualNotes: current.visualNotes || treatment.suggestedVisuals || "",
        productionNotes: [current.productionNotes, treatment.landingPageNotes].filter(Boolean).join("\n\n"),
        tags: current.tags || [discoveryKeyword, treatment.category, "URL參考"].filter(Boolean).join(", "),
        board: current.board || "URL參考",
        status: current.status || "Draft",
      }));
      setReferenceSourceStatus("done");
      setReferenceSourceMessage("已讀取可用資料；如沒有預覽圖，可照樣儲存。");
    } catch (error) {
      setReferenceSourceStatus("error");
      const message = String(error?.message || "");
      setReferenceSourceMessage(
        message.includes("403")
          ? "網站暫時不允許系統讀取內容。可以照樣儲存連結，或用截圖 / 手動備註補充預覽。"
          : `${message || "連結資料讀取失敗"}。可以手動填寫後照樣儲存。`
      );
    }
  };

  const handleReferenceSourceFileSelect = async (event, sourceType) => {
    const file = event.target.files?.[0] || null;

    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (sourceType === "image" && !isImage) {
      setReferenceSourceStatus("error");
      setReferenceSourceMessage("請選擇圖片檔案。");
      return;
    }

    if (sourceType === "video" && !isVideo) {
      setReferenceSourceStatus("error");
      setReferenceSourceMessage("請選擇影片檔案。");
      return;
    }

    const nextSourceType = isVideo ? "video" : "image";
    const localUrl = window.URL.createObjectURL(file);
    setReferenceSourceLocalPreviewUrl(localUrl);
    setReferenceSourceStatus("loading");
    setReferenceSourceMessage(isVideo ? "正在準備影片素材..." : "正在準備圖片預覽...");

    setReferenceDraft((current) => ({
      ...current,
      title: current.title || file.name.replace(/\.[^.]+$/, ""),
      platform: isVideo ? "Video" : "Image",
      sourceType: nextSourceType,
      mediaType: nextSourceType,
      sourceUrl: current.sourceUrl || "",
      assetUrl: "",
      previewUrl: isVideo ? current.previewUrl || "" : localUrl,
      thumbnailUrl: "",
      board: isVideo ? "影片素材" : "圖片素材",
      status: current.status || "Draft",
      visualNotes: [current.visualNotes, `素材檔案：${file.name}`].filter(Boolean).join("\n"),
    }));

    try {
      if (isImage) {
        const previewDataUrl = await createImagePreviewDataUrl(file);

        setReferenceDraft((current) => ({
          ...current,
          previewUrl: previewDataUrl,
          thumbnailUrl: previewDataUrl,
        }));
        setReferenceSourceStatus("done");
        setReferenceSourceMessage("圖片已加入素材草稿。");
        return;
      }

      let thumbnailUrl = "";

      try {
        const frames = await extractFramesFromVideoFile(file, {
          maxFrames: 1,
          maxWidth: 900,
          quality: 0.72,
        });
        thumbnailUrl = frames[0]?.imageBase64 || "";
      } catch {
        thumbnailUrl = "";
      }

      if (thumbnailUrl) {
        setReferenceDraft((current) => ({
          ...current,
          previewUrl: thumbnailUrl,
          thumbnailUrl,
        }));
      }

      try {
        const blob = await uploadVideoToBlob(file);
        setReferenceDraft((current) => ({
          ...current,
          assetUrl: blob.url || current.assetUrl || "",
          sourceUrl: current.sourceUrl || blob.url || "",
        }));
        setVideoFile(file);
        setVideoName(file.name);
        setVideoUrl(blob.url || "");
        setReferenceSourceStatus("done");
        setReferenceSourceMessage("影片已加入素材草稿，並可用作後續 AI 分析。");
      } catch (error) {
        setVideoFile(file);
        setVideoName(file.name);
        setVideoUrl("");
        setReferenceSourceStatus("done");
        setReferenceSourceMessage(`影片已加入素材草稿；雲端上載未完成：${error?.message || "請稍後再試"}。`);
      }
    } catch (error) {
      setReferenceSourceStatus("error");
      setReferenceSourceMessage(error?.message || "素材預覽建立失敗，請改用手動建立。");
    }
  };

  const handleSaveReferenceAd = () => {
    const now = new Date().toISOString();
    const newReference = {
      id: `reference-${Date.now()}`,
      title: createReferenceTitle(referenceDraft),
      platform: referenceDraft.platform || "Facebook",
      sourceType: referenceDraft.sourceType || "url",
      mediaType: referenceDraft.mediaType || getReferenceMediaType(referenceDraft),
      sourceUrl: referenceDraft.sourceUrl || "",
      previewUrl: referenceDraft.previewUrl || "",
      assetUrl: referenceDraft.assetUrl || "",
      thumbnailUrl: referenceDraft.thumbnailUrl || "",
      board: referenceDraft.board || "參考素材",
      status: referenceDraft.status || "Draft",
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
    setReferenceSourceLocalPreviewUrl("");
    setReferenceSourceStatus("idle");
    setReferenceSourceMessage("");
    setReferenceCaptureOpen(false);
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

  const handleDeconstructReference = async (reference) => {
    if (!reference) return;

    handleApplyReferenceToDraft(reference.id);
    setSourceLabel(`參考素材：${reference.title || "未命名參考"}`);

    const mediaType = getReferenceMediaType(reference);
    const videoReferenceUrl = mediaType === "video" ? reference.assetUrl || reference.sourceUrl || "" : "";

    if (!videoReferenceUrl) {
      setActiveTab("input");
      return;
    }

    setVideoFile(null);
    setVideoName(reference.title || "參考影片");
    setVideoUrl(videoReferenceUrl);
    setAnalysisStatus("analyzing");
    setAnalysisError("");

    try {
      const backendResult = await requestBackendVideoAnalysis({
        videoUrl: videoReferenceUrl,
        form,
        brandConfig,
        frames: [],
      });

      setVideoAnalysis(backendResult);
      setAnalysisStatus("done");
      setActiveTab("analysis");
    } catch (error) {
      setAnalysisStatus("error");
      setAnalysisError(`影片參考分析未成功：${error?.message || "Unknown error"}。參考已套用，可繼續生成 Brief。`);
      setActiveTab("input");
    }
  };

  const handleSelectedReferenceNextAction = () => {
    if (!selectedReference) {
      setReferenceCaptureOpen(true);
      return;
    }

    if (selectedReferenceGuidance.action === "addPreview") {
      setReferenceDraft({
        ...createDefaultReferenceDraft(),
        ...selectedReference,
        sourceType: "image",
        mediaType: "image",
        previewUrl: selectedReference.previewUrl || "",
        thumbnailUrl: selectedReference.thumbnailUrl || "",
      });
      setReferenceCaptureOpen(true);
      return;
    }

    if (selectedReferenceGuidance.action === "deconstruct") {
      handleDeconstructReference(selectedReference);
      return;
    }

    if (selectedReferenceGuidance.action === "apply") {
      handleApplyReferenceToDraft(selectedReference.id);
      return;
    }

    if (selectedReferenceGuidance.action === "brief") {
      handleApplyReferenceToDraft(selectedReference.id);
      setActiveTab("input");
      return;
    }

    if (selectedReferenceGuidance.action === "job") {
      handleApplyReferenceToDraft(selectedReference.id);
      setActiveTab("jobs");
      return;
    }

    setActiveTab("jobs");
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
      sourceType: "url",
      mediaType: "link",
      platform: current.platform || "Meta Ad Library",
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
      board: current.board || "搜尋方向",
      status: current.status || "Draft",
    }));
    setReferenceCaptureOpen(true);
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

  const handleReferenceScreenshotSelect = (event) => {
    const file = event.target.files?.[0] || null;

    if (!file) {
      handleClearReferenceScreenshot();
      return;
    }

    setReferenceScreenshotFile(file);
    setReferenceScreenshotPreviewUrl(window.URL.createObjectURL(file));
    setReferenceScreenshotAnalysis(null);
    setReferenceScreenshotAnalysisError("");
    setReferenceScreenshotAnalysisStatus("idle");
  };

  const handleClearReferenceScreenshot = () => {
    setReferenceScreenshotFile(null);
    setReferenceScreenshotPreviewUrl("");
    setReferenceScreenshotAnalysis(null);
    setReferenceScreenshotAnalysisError("");
    setReferenceScreenshotAnalysisStatus("idle");
  };

  const handleUseScreenshotForReferenceDraft = async () => {
    const screenshotNote = referenceScreenshotFile
      ? `已附截圖參考：${referenceScreenshotFile.name}`
      : "已附截圖參考";
    const previewDataUrl = referenceScreenshotFile
      ? await createImagePreviewDataUrl(referenceScreenshotFile).catch(() => referenceScreenshotPreviewUrl)
      : referenceScreenshotPreviewUrl;

    setReferenceDraft((current) => ({
      ...current,
      platform: "Screenshot",
      sourceType: "image",
      mediaType: "image",
      sourceUrl: embeddedPreviewUrl || current.sourceUrl,
      previewUrl: previewDataUrl || current.previewUrl,
      thumbnailUrl: previewDataUrl || current.thumbnailUrl,
      board: current.board || "補充素材",
      status: current.status || "Draft",
      visualNotes: [current.visualNotes, screenshotNote].filter(Boolean).join("\n"),
    }));
    setReferenceCaptureOpen(true);
  };

  const handleAnalyzeReferenceScreenshot = async () => {
    if (!referenceScreenshotFile) {
      setReferenceScreenshotAnalysisError("請先上載截圖。");
      return;
    }

    setReferenceScreenshotAnalysisStatus("loading");
    setReferenceScreenshotAnalysisError("");

    try {
      const formData = new FormData();
      formData.append("image", referenceScreenshotFile);

      const response = await fetch("/api/analyze-reference-screenshot", {
        method: "POST",
        body: formData,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "截圖分析失敗");
      }

      setReferenceScreenshotAnalysis(data || null);
      setReferenceScreenshotAnalysisStatus("done");
    } catch (error) {
      setReferenceScreenshotAnalysisStatus("error");
      setReferenceScreenshotAnalysisError(error?.message || "截圖分析失敗");
    }
  };

  const handleApplyScreenshotAnalysisToReferenceDraft = async () => {
    if (!referenceScreenshotAnalysis) return;

    const screenshotNote = referenceScreenshotFile
      ? `已附截圖參考：${referenceScreenshotFile.name}`
      : "已附截圖參考";
    const previewDataUrl = referenceScreenshotFile
      ? await createImagePreviewDataUrl(referenceScreenshotFile).catch(() => referenceScreenshotPreviewUrl)
      : referenceScreenshotPreviewUrl;

    setReferenceDraft((current) => ({
      ...current,
      title: referenceScreenshotAnalysis.title || current.title,
      platform: "Screenshot",
      sourceType: "image",
      mediaType: "image",
      sourceUrl: embeddedPreviewUrl || current.sourceUrl,
      previewUrl: previewDataUrl || current.previewUrl,
      thumbnailUrl: previewDataUrl || current.thumbnailUrl,
      board: current.board || "補充素材",
      status: current.status || "Draft",
      competitorBrand: referenceScreenshotAnalysis.competitorBrand || current.competitorBrand,
      offer: referenceScreenshotAnalysis.offer || current.offer,
      angle: referenceScreenshotAnalysis.angle || current.angle,
      hookNotes: referenceScreenshotAnalysis.hookNotes || current.hookNotes,
      visualNotes: [current.visualNotes, referenceScreenshotAnalysis.visualNotes, screenshotNote].filter(Boolean).join("\n"),
      captionNotes: referenceScreenshotAnalysis.captionNotes || current.captionNotes,
      productionNotes: referenceScreenshotAnalysis.productionNotes || current.productionNotes,
      tags: referenceScreenshotAnalysis.tags || current.tags,
    }));
    setReferenceCaptureOpen(true);
  };

  const handleSaveAsContentJob = () => {
    const now = new Date().toISOString();
    const assignedDesigner = jobDraft.assignedDesigner || "Unassigned";
    const contentType = jobDraft.contentType || "AI Video";
    const brandCode = selectedBrand || brandConfig?.code || form?.brandCode || "";
    const appliedBrandName = campaignContext.brandName || brandConfig?.name || "";
    const appliedTreatmentName = campaignContext.treatmentName || form?.treatment || "";
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
      title: createJobTitle({ draftTitle: jobDraft.draftTitle, brandCode, brandName: appliedBrandName, form }),
      brandCode,
      brandName: appliedBrandName,
      treatmentName: appliedTreatmentName,
      creativeSourceType,
      selectedChecklistItems: selectedReferenceChecklist,
      scriptDetailMode,
      roughCutPlan: roughCutPlanRows,
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
      creativeDirection: {
        analysisTitle: creativeAnalysisPreview.title,
        analysisSummary: creativeAnalysisPreview.summary,
        appliedBrandName,
        appliedTreatmentName,
        selectedChecklistItems: selectedReferenceChecklist,
      },
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

  const handleStartUploadedReferenceVideoAnalysis = async () => {
    setCreativeSourceType("video");
    setSourceLabel("上載參考影片");

    if (videoFile || videoUrl.trim()) {
      await handleAnalyzeVideo();
      return;
    }

    const title = uploadReferenceDraft.title.trim() || uploadReferenceDraft.sourceUrl.trim() || "上載參考影片";
    setVideoAnalysis({
      ...emptyVideoAnalysis,
      status: "AI 初步分析",
      summary: `${title} 已作為 素材庫 參考來源。暫未有可分析影片檔，先用來源 URL、品牌和備註建立初步拆解方向。`,
      hookMoment: uploadReferenceDraft.notes.trim() || "先確認首三秒 Hook、畫面節奏和 Offer 表達。",
      pacing: "先按 Hook / 痛點 / 證據 / CTA 四段拆解。",
      creativeAngles: [
        uploadReferenceDraft.competitorBrand ? `${uploadReferenceDraft.competitorBrand} 的素材角度` : "競品素材角度",
        "香港客人痛點",
        "可改寫成品牌服務方向",
      ],
      riskNotes: ["這是本地初步分析，並非影片內容逐格辨識。", "如要更準確，請上載可讀取的影片檔。"],
    });
    setAnalysisStatus("fallback");
    setAnalysisError("");
    setActiveTab("analysis");
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
    if (typeof window !== "undefined" && !window.confirm("只會清除本機品牌測試資料，不會清除 素材庫 或 Jobs。確定繼續？")) {
      return;
    }

    resetBrandRecordsStorage();
    try {
      window.localStorage.removeItem(BRAND_LIBRARY_STORAGE_KEY);
    } catch {
      // ignore
    }
    setBrandRecords([]);
    setBrandLibrary([]);
    setSelectedBrand("");
    setEditingBrandCode("");
    setSelectedLibraryBrandId("");
    setSelectedLibraryTreatmentId("");
    setAiGenerated(null);
    setSourceLabel("本地生成");
  };

  const navItems = [
    { id: "brand", label: "品牌定位", icon: "db" },
    { id: "competitors", label: "競爭對手探索", icon: "target" },
    { id: "materials", label: "素材收集", icon: "frame" },
    { id: "references", label: "AI 分析", icon: "magic" },
    { id: "input", label: "Creative Brief", icon: "upload" },
    { id: "jobs", label: "製作 Job", icon: "layers" },
  ];

  const campaignNavItems = [
    { id: "brand", label: "品牌庫 / 療程", icon: "db" },
    { id: "competitors", label: "競品推薦", icon: "target" },
    { id: "materials", label: "素材收集", icon: "frame" },
    { id: "references", label: "AI 分析", icon: "magic" },
    { id: "input", label: "Creative Brief", icon: "upload" },
    { id: "jobs", label: "製作 Job", icon: "layers" },
  ];

  const productNavItems = [
    { id: "overview", label: "Overview 總覽", icon: "app" },
    { id: "workspace", label: "品牌工作台", icon: "target" },
    { id: "source", label: "新增創作", icon: "spark" },
    { id: "references", label: "素材庫", icon: "frame" },
    { id: "brand", label: "品牌資料庫", icon: "db" },
    { id: "jobs", label: "製作 Jobs", icon: "layers" },
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#fff4df_0,#fff8ef_28%,#f7edf6_56%,#eef2ff_100%)] text-[#2f1d35]">
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
      <header className="sticky top-0 z-20 border-b border-rose-100/80 bg-[#fffaf3]/88 backdrop-blur-xl">
        <div className="flex w-full items-center justify-between gap-4 px-4 py-3 sm:px-5 lg:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7f315f] to-[#e08b64] text-white shadow-[0_14px_34px_rgba(180,85,113,0.24)]">
              <Icon name="app" />
            </div>
            <div className="[&>div:nth-child(3)]:hidden">
              <div className="text-lg font-semibold tracking-tight">Alyssa Creative SOP</div>
              <div className="text-xs text-[#7c5b72]">創作來源 → AI 分析 → 套用品牌療程 → 影片稿 → 初剪方案 → 製作 Job</div>
              <div className="text-xs text-[#7c5b72]">素材先入 素材庫，再變 Brief，再派 Job。</div>
            </div>
          </div>
          <div className="hidden items-center gap-2 lg:flex">
            {copiedLabel && <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">已複製：{copiedLabel}</span>}
            {renderContextualTopActions()}
          </div>
        </div>
      </header>

      <main className="w-full px-4 py-5 sm:px-5 lg:px-6">
        <section className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {productNavItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                    activeTab === item.id ? "bg-gradient-to-r from-[#7f315f] to-[#e08b64] text-white shadow-[0_12px_28px_rgba(180,85,113,0.24)]" : "border border-rose-100 bg-white/75 text-[#6f4267] hover:border-rose-200 hover:bg-white"
                  }`}
                >
                  <Icon name={item.icon} className="h-4 w-4 text-sm" />
                  {item.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="rounded-full border border-rose-100 bg-white/70 px-3 py-1.5">來源：{sourceLabel}</span>
              <span className="rounded-full border border-rose-100 bg-white/70 px-3 py-1.5">影片：{videoName ? "已選擇" : "未上傳"}</span>
              <span className="rounded-full border border-rose-100 bg-white/70 px-3 py-1.5">品牌資料：{brandLibrary.length}</span>
              <span className={`rounded-full border px-3 py-1.5 ${allTestsPassed ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>
                測試：{allTestsPassed ? "通過" : "需檢查"}
              </span>
            </div>
          </div>

          {!["overview", "workspace", "source", "brand", "references"].includes(activeTab) && (
          <div className="overflow-hidden rounded-3xl border border-rose-100 bg-white/70 p-4 shadow-sm">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div className="[&>div:nth-child(3)]:hidden [&>div:nth-child(4)]:hidden">
                <div className="text-sm font-semibold text-slate-950">品牌庫到製作 Job 流程</div>
                <div className="mt-1 text-xs text-slate-500">品牌庫 → 選擇療程 → 競品推薦 → 素材收集 → AI 分析 → Creative Brief → 製作 Job</div>
                <div className="text-sm font-semibold text-slate-950">競品素材流程</div>
                <div className="mt-1 text-xs text-slate-500">先理解自己品牌，再揀競爭對手、收集素材、加入素材庫，最後出 Brief 同派 Job。</div>
              </div>
              <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                目前：{PRODUCT_WORKFLOW_STAGES.find((stage) => stage.id === activeWorkflowStageId)?.label || "工作台"}
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-7">
              {PRODUCT_WORKFLOW_STAGES.map((stage, index) => {
                const status = getWorkflowStageStatus(stage, index);
                const isCurrent = status.tone === "current";
                const isDone = status.tone === "done";
                const statusClass =
                  status.tone === "current"
                    ? "bg-slate-950 text-white"
                    : status.tone === "done"
                      ? "bg-emerald-50 text-emerald-700"
                      : status.tone === "next"
                        ? "bg-blue-50 text-blue-700"
                        : "bg-slate-100 text-slate-500";

                return (
                  <div key={stage.id} className="relative">
                    {index > 0 && <div className={`absolute -left-3 top-6 hidden h-0.5 w-3 md:block ${isDone || isCurrent ? "bg-slate-300" : "bg-slate-200"}`} />}
                    <div
                      className={`h-full rounded-2xl border p-3 transition-all duration-300 ${
                        isCurrent
                          ? "border-slate-950 bg-slate-950 text-white shadow-lg shadow-slate-900/10"
                          : isDone
                            ? "border-emerald-200 bg-emerald-50/50 text-slate-800"
                            : "border-slate-200 bg-slate-50 text-slate-600"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${isCurrent ? "bg-white text-slate-950" : isDone ? "bg-emerald-600 text-white" : "bg-white text-slate-500"}`}>
                          {isDone ? "✓" : index + 1}
                        </div>
                        <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${statusClass}`}>{status.label}</span>
                      </div>
                      <div className="mt-3 text-sm font-semibold">{stage.label}</div>
                      <div className={`mt-1 text-xs ${isCurrent ? "text-slate-300" : "text-slate-400"}`}>{stage.shortLabel}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          )}

          {!["overview", "workspace", "brand", "source"].includes(activeTab) && (
            <div className="rounded-3xl border border-rose-100 bg-white/70 p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">目前分析</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">{campaignContextSummary}</div>
                </div>
                <div className="text-xs leading-relaxed text-slate-500">素材先入 素材庫，再變 Brief，再派 Job。</div>
                <Button variant="outline" onClick={() => setActiveTab("brand")}>
                  返回選擇品牌 / 療程
                </Button>
              </div>
            </div>
          )}

          {captureImportNotice && (
            <div
              className={`rounded-3xl border p-4 shadow-sm ${
                captureImportNotice.type === "error"
                  ? "border-rose-200 bg-rose-50 text-rose-800"
                  : "border-emerald-200 bg-emerald-50 text-emerald-800"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">{captureImportNotice.message}</div>
                  <div className="mt-1 text-xs leading-relaxed opacity-80">
                    用瀏覽器插件在 IG / FB / Ad Library / 網站上選取可見素材，直接加入素材庫。
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => setActiveTab("references")}>
                    查看素材庫
                  </Button>
                  <Button variant="ghost" onClick={() => setCaptureImportNotice(null)}>
                    關閉
                  </Button>
                </div>
              </div>
            </div>
          )}

          {["input", "analysis", "script", "brief", "jobs"].includes(activeTab) && (
            <div className="grid gap-4 md:grid-cols-5">
            <StatCard icon="play" title="Hook 強度" value={scoreValue(generated.analysis.hookScore)} note="片頭痛點是否夠直接" />
            <StatCard icon="megaphone" title="CTA 清晰度" value={scoreValue(generated.analysis.ctaScore)} note="CTA 是否清晰" />
            <StatCard icon="layers" title="賣點完整度" value={scoreValue(generated.analysis.clarityScore)} note="內容是否連貫" />
            <StatCard icon="video" title="AI影片分析" value={videoAnalysisScoreValue} note="分析影片內容、節奏及風險" />
            <StatCard icon="db" title="品牌庫" value={`${brandRecords.length}`} note="品牌設定" />
            </div>
          )}

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

          {["input", "analysis", "script", "brief"].includes(activeTab) && appliedReference && (
            <Card>
              <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <div className="text-sm font-semibold text-slate-900">已套用參考素材</div>
                  <div className="mt-1 text-xs text-slate-500">
                    {[appliedReference.title, appliedReference.platform, appliedReference.angle].filter(Boolean).join(" / ")}
                  </div>
                </div>
                <Button variant="outline" onClick={() => setActiveTab("references")}>
                  返回參考素材庫
                </Button>
              </div>
            </Card>
          )}

          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#fff4df] via-[#f6dce9] to-[#e9ddff] p-8 shadow-[0_30px_90px_rgba(111,66,103,0.16)] lg:p-10">
                <div className="absolute right-8 top-8 hidden h-36 w-36 rounded-full bg-white/35 blur-2xl lg:block" />
                <div className="relative grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-end">
                  <div>
                    <div className="inline-flex rounded-full bg-white/70 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#8a4b66] shadow-sm">
                      Alyssa Creative SOP
                    </div>
                    <h1 className="mt-6 max-w-4xl text-4xl font-semibold tracking-tight text-[#321d38] md:text-6xl">
                      總覽
                    </h1>
                    <p className="mt-5 max-w-3xl text-base leading-8 text-[#6f4267]">
                      品牌資料、素材庫、AI 輸出同製作 Jobs 集中睇清楚。素材先收集，再拆解成 Brief，最後派給設計及製作同事執行。
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                      <Button onClick={() => setActiveTab("source")}>
                        <Icon name="spark" /> 建立新創作
                      </Button>
                      <Button variant="outline" onClick={() => setActiveTab("brand")}>
                        前往品牌資料庫
                      </Button>
                      <Button variant="outline" onClick={() => setActiveTab("references")}>
                        查看素材庫
                      </Button>
                    </div>
                  </div>
                  <div className="rounded-[2rem] border border-white/70 bg-white/60 p-5 shadow-xl backdrop-blur">
                    <div className="text-sm font-semibold text-[#5b3157]">工作流</div>
                    <div className="mt-3 space-y-2 text-sm text-[#76516f]">
                      {["品牌資料庫", "新增創作", "素材庫", "AI 分析 / Creative Brief", "製作 Jobs"].map((item, index) => (
                        <div key={item} className="flex items-center gap-3 rounded-2xl bg-white/65 px-3 py-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#7f315f] text-xs font-bold text-white">{index + 1}</span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: "品牌數目", value: brandLibrary.length, note: "已建立品牌資料", icon: "db" },
                  { label: "素材庫素材", value: referenceAds.length, note: "已收集參考素材", icon: "frame" },
                  { label: "輸出記錄", value: generatedOutputRecords.length, note: "Brief / 初剪 / Job", icon: "doc" },
                  { label: "進行中 Jobs", value: activeProductionJobCount, note: "未完成製作工作", icon: "layers" },
                ].map((item) => (
                  <Card key={item.label}>
                    <div className="flex items-start justify-between gap-4 p-5">
                      <div>
                        <div className="text-sm font-semibold text-[#76516f]">{item.label}</div>
                        <div className="mt-3 text-4xl font-semibold tracking-tight text-[#321d38]">{item.value}</div>
                        <div className="mt-2 text-xs text-[#8a6d80]">{item.note}</div>
                      </div>
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff2df] text-[#7f315f]">
                        <Icon name={item.icon} />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
                <Card>
                  <div className="p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <SectionTitle icon="doc" title="最近輸出" desc="最近生成的 Creative Brief、初剪方案及已建立的製作 Job。" />
                      <Button variant="outline" onClick={() => setActiveTab("jobs")}>
                        查看 Jobs
                      </Button>
                    </div>
                    <div className="mt-5 space-y-3">
                      {generatedOutputRecords.length ? (
                        generatedOutputRecords.map((record) => (
                          <div key={record.id} className="rounded-3xl border border-rose-100 bg-[#fffaf3] p-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <div className="text-sm font-semibold text-[#321d38]">{record.title}</div>
                                <div className="mt-1 text-xs text-[#8a6d80]">
                                  {[record.brandName, record.treatmentName, record.type].filter(Boolean).join(" · ")}
                                </div>
                              </div>
                              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#7f315f]">
                                {record.updatedAt ? formatJobDate(record.updatedAt) : record.status}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-3xl border border-dashed border-rose-200 bg-white/65 p-6 text-sm leading-7 text-[#76516f]">
                          未有輸出記錄。完成一次 AI 生成或建立製作 Job 後，這裡會顯示最近結果。
                        </div>
                      )}
                    </div>
                  </div>
                </Card>

                <div className="space-y-5">
                  <Card>
                    <div className="p-6">
                      <SectionTitle icon="spark" title="建議下一步" desc="按目前狀態快速進入下一個工作區。" />
                      <div className="mt-5 grid gap-3">
                        {!brandLibrary.length && (
                          <Button onClick={() => setActiveTab("brand")}>
                            建立第一個品牌
                          </Button>
                        )}
                        <Button variant={brandLibrary.length ? "primary" : "outline"} onClick={() => setActiveTab("source")}>
                          建立新創作
                        </Button>
                        <Button variant="outline" onClick={() => setActiveTab("workspace")}>
                          打開品牌工作台
                        </Button>
                        <Button variant="outline" onClick={() => setActiveTab("references")}>
                          查看已收集素材
                        </Button>
                      </div>
                    </div>
                  </Card>

                  <Card>
                    <div className="p-6">
                      <SectionTitle icon="frame" title="最近素材" desc="素材庫會保存 Ad Library 連結、上載圖片 / 影片及手動素材。" />
                      <div className="mt-5 space-y-3">
                        {referenceAds.slice(0, 3).map((reference) => (
                          <button
                            key={reference.id}
                            type="button"
                            onClick={() => {
                              setSelectedReferenceId(reference.id);
                              setActiveTab("references");
                            }}
                            className="flex w-full gap-3 rounded-3xl bg-[#fff9f0] p-3 text-left transition hover:bg-white hover:shadow-md"
                          >
                            <ReferencePreview reference={reference} className="h-16 w-20 shrink-0 rounded-2xl" />
                            <div className="min-w-0">
                              <div className="line-clamp-2 text-sm font-semibold text-[#321d38]">{reference.title || "未命名素材"}</div>
                              <div className="mt-1 text-xs text-[#8a6d80]">{reference.platform || "素材"}</div>
                            </div>
                          </button>
                        ))}
                        {!referenceAds.length && (
                          <div className="rounded-3xl border border-dashed border-rose-200 bg-white/65 p-5 text-sm leading-7 text-[#76516f]">
                            未有素材。可由新增創作開始，或直接到素材庫加入 Ad Library 連結、圖片或影片。
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {activeTab === "workspace" && (
            <div className="space-y-6">
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
                <div className="rounded-[2.5rem] bg-gradient-to-br from-[#43234c] via-[#7f315f] to-[#d8795e] p-8 text-white shadow-[0_30px_90px_rgba(111,66,103,0.18)]">
                  <div className="text-xs font-bold uppercase tracking-[0.18em] text-white/65">Brand Workspace</div>
                  <h1 className="mt-4 text-4xl font-semibold tracking-tight">品牌工作台</h1>
                  <p className="mt-4 max-w-3xl text-sm leading-7 text-white/78">
                    每個品牌集中睇素材、輸出、療程資料同進行中 Jobs。團隊可先建立品牌資料，再用素材和 AI 拆解推進創作。
                  </p>
                </div>
                <Card>
                  <div className="p-6">
                    <SectionTitle icon="target" title="目前分析" desc={campaignContextSummary} />
                    <div className="mt-5 flex flex-wrap gap-3">
                      <Button onClick={() => setActiveTab("brand")}>管理品牌資料</Button>
                      <Button variant="outline" onClick={() => setActiveTab("source")}>新增創作</Button>
                    </div>
                  </div>
                </Card>
              </div>

              {!brandWorkspaceRecords.length ? (
                <Card className="overflow-hidden border-rose-100 bg-[#fffaf3]">
                  <div className="grid gap-6 p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#b45571]">品牌工作台</div>
                      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#321d38]">暫未建立品牌</h2>
                      <p className="mt-3 max-w-3xl text-sm leading-7 text-[#76516f]">
                        先到品牌資料庫建立品牌和療程，之後就可以集中查看素材、AI 輸出和製作 Jobs。
                      </p>
                    </div>
                    <Button onClick={() => setActiveTab("brand")}>
                      前往品牌資料庫
                    </Button>
                  </div>
                </Card>
              ) : (
                <>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {brandWorkspaceRecords.map((brand) => {
                      const selected = selectedWorkspaceBrand?.id === brand.id;
                      return (
                        <button
                          key={brand.id}
                          type="button"
                          onClick={() => {
                            setSelectedLibraryBrandId(brand.id);
                            setSelectedLibraryTreatmentId(brand.treatments?.[0]?.id || "");
                          }}
                          className={`rounded-[2rem] p-5 text-left transition hover:-translate-y-0.5 ${
                            selected
                              ? "bg-[#321d38] text-white shadow-xl"
                              : "border border-rose-100 bg-white/78 text-[#321d38] hover:bg-white hover:shadow-md"
                          }`}
                        >
                          <div className={`text-xs font-bold uppercase tracking-[0.18em] ${selected ? "text-white/55" : "text-[#b45571]"}`}>
                            品牌
                          </div>
                          <div className="mt-3 text-2xl font-semibold tracking-tight">{brand.brandName}</div>
                          <div className={`mt-2 line-clamp-2 text-sm leading-6 ${selected ? "text-white/72" : "text-[#76516f]"}`}>
                            {brand.brandPositioning || "未填品牌定位"}
                          </div>
                          <div className="mt-5 grid grid-cols-2 gap-2 text-sm">
                            {[
                              ["素材", brand.materials],
                              ["輸出", brand.outputs],
                              ["Jobs", brand.activeJobs],
                              ["療程", brand.treatmentsCount],
                            ].map(([label, value]) => (
                              <div key={label} className={`rounded-2xl px-3 py-2 ${selected ? "bg-white/12" : "bg-[#fff7ec]"}`}>
                                <div className={`text-xs ${selected ? "text-white/55" : "text-[#8a6d80]"}`}>{label}</div>
                                <div className="mt-1 text-lg font-semibold">{value}</div>
                              </div>
                            ))}
                          </div>
                          <div className={`mt-5 text-sm font-semibold ${selected ? "text-white" : "text-[#7f315f]"}`}>
                            進入品牌工作台
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {selectedWorkspaceBrand && (
                    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
                      <div className="space-y-5">
                        <Card>
                          <div className="p-6">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                              <SectionTitle icon="db" title={selectedWorkspaceBrand.brandName} desc={selectedWorkspaceBrand.brandPositioning || "未填品牌定位"} />
                              <Button variant="outline" onClick={() => setActiveTab("brand")}>
                                編輯品牌設定
                              </Button>
                            </div>
                            <div className="mt-5 grid gap-3 md:grid-cols-2">
                              {[
                                ["目標客群", selectedWorkspaceBrand.targetAudience || "未填"],
                                ["品牌語氣", selectedWorkspaceBrand.toneOfVoice || "未填"],
                                ["常用 CTA", selectedWorkspaceBrand.commonCta || selectedWorkspaceBrand.cta || "未填"],
                                ["注意事項", selectedWorkspaceBrand.brandNotes || selectedWorkspaceBrand.bannedWords || "未填"],
                              ].map(([label, value]) => (
                                <div key={label} className="rounded-3xl bg-[#fff7ec] p-4 text-sm leading-7 text-[#5b3157]">
                                  <div className="text-xs font-bold uppercase tracking-wider text-[#b45571]">{label}</div>
                                  <div className="mt-2">{value}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </Card>

                        <Card>
                          <div className="p-6">
                            <SectionTitle icon="frame" title="品牌素材庫" desc="與這個品牌相關的已收集素材。" />
                            <div className="mt-5 grid gap-3 md:grid-cols-2">
                              {selectedWorkspaceMaterials.map((reference) => (
                                <button
                                  key={reference.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedReferenceId(reference.id);
                                    setActiveTab("references");
                                  }}
                                  className="flex gap-3 rounded-3xl bg-[#fff9f0] p-3 text-left transition hover:bg-white hover:shadow-md"
                                >
                                  <ReferencePreview reference={reference} className="h-20 w-24 shrink-0 rounded-2xl" />
                                  <div className="min-w-0">
                                    <div className="line-clamp-2 text-sm font-semibold text-[#321d38]">{reference.title || "未命名素材"}</div>
                                    <div className="mt-1 text-xs text-[#8a6d80]">{reference.platform || "素材"}</div>
                                  </div>
                                </button>
                              ))}
                              {!selectedWorkspaceMaterials.length && (
                                <div className="md:col-span-2 rounded-3xl border border-dashed border-rose-200 bg-white/65 p-5 text-sm leading-7 text-[#76516f]">
                                  暫未有相關素材。可先在新增創作或素材庫加入 Ad Library 連結、圖片或影片。
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      </div>

                      <div className="space-y-5">
                        <Card>
                          <div className="p-6">
                            <SectionTitle icon="doc" title="輸出記錄" desc="這個品牌相關的 Brief、初剪方案及 Job。" />
                            <div className="mt-5 space-y-3">
                              {selectedWorkspaceOutputs.map((record) => (
                                <div key={record.id} className="rounded-3xl bg-[#fffaf3] p-4">
                                  <div className="text-sm font-semibold text-[#321d38]">{record.title}</div>
                                  <div className="mt-1 text-xs text-[#8a6d80]">{[record.treatmentName, record.type, record.status].filter(Boolean).join(" · ")}</div>
                                </div>
                              ))}
                              {!selectedWorkspaceOutputs.length && (
                                <div className="rounded-3xl border border-dashed border-rose-200 bg-white/65 p-5 text-sm leading-7 text-[#76516f]">
                                  未有輸出記錄。完成 AI 生成或建立 Job 後會顯示在這裡。
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>

                        <Card>
                          <div className="p-6">
                            <SectionTitle icon="layers" title="進行中 Jobs" desc="設計及製作同事可跟進的工作。" />
                            <div className="mt-5 space-y-3">
                              {selectedWorkspaceJobs.map((job) => (
                                <button
                                  key={job.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedJobId(job.id);
                                    setActiveTab("jobs");
                                  }}
                                  className="w-full rounded-3xl bg-[#fffaf3] p-4 text-left transition hover:bg-white hover:shadow-md"
                                >
                                  <div className="text-sm font-semibold text-[#321d38]">{job.title || "製作 Job"}</div>
                                  <div className="mt-1 text-xs text-[#8a6d80]">{[job.status, job.assignedDesigner, formatJobDate(job.deadline)].filter(Boolean).join(" · ")}</div>
                                </button>
                              ))}
                              {!selectedWorkspaceJobs.length && (
                                <div className="rounded-3xl border border-dashed border-rose-200 bg-white/65 p-5 text-sm leading-7 text-[#76516f]">
                                  暫未有相關 Job。生成 Brief 後可以建立製作 Job。
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>

                        <Card>
                          <div className="p-6">
                            <SectionTitle icon="target" title="療程資料" desc="已建立的療程 / 服務會在新創作時套用。" />
                            <div className="mt-5 space-y-3">
                              {(selectedWorkspaceBrand.treatments || []).slice(0, 5).map((treatment) => (
                                <div key={treatment.id || treatment.treatmentName} className="rounded-3xl bg-[#fff7ec] p-4">
                                  <div className="text-sm font-semibold text-[#321d38]">{treatment.treatmentName || treatment.name || "未命名療程"}</div>
                                  <div className="mt-1 text-xs text-[#8a6d80]">{[treatment.category, treatment.offer].filter(Boolean).join(" · ") || "未填分類 / Offer"}</div>
                                </div>
                              ))}
                              {!(selectedWorkspaceBrand.treatments || []).length && (
                                <div className="rounded-3xl border border-dashed border-rose-200 bg-white/65 p-5 text-sm leading-7 text-[#76516f]">
                                  未有療程資料。到品牌資料庫新增療程後，新創作會更快套用。
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === "source" && (
            <div className="space-y-6">
              <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#fff2df] via-[#f8dce8] to-[#ead9ff] p-8 shadow-[0_30px_90px_rgba(111,66,103,0.16)] lg:p-10">
                <div className="absolute right-8 top-8 hidden h-32 w-32 rounded-full bg-white/35 blur-2xl lg:block" />
                <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
                  <div>
                    <div className="inline-flex rounded-full bg-white/70 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#8a4b66] shadow-sm">
                      Alyssa AI Creative Platform
                    </div>
                    <h1 className="mt-6 max-w-4xl text-4xl font-semibold tracking-tight text-[#321d38] md:text-6xl">
                      你想由邊種靈感開始？
                    </h1>
                    <p className="mt-5 max-w-3xl text-base leading-8 text-[#6f4267]">
                      由市場素材、參考影片或熱門話題開始，AI 會拆解亮點，再套用到品牌療程，生成影片稿及初剪方案。
                    </p>
                  </div>
                  <div className="rounded-[2rem] border border-white/70 bg-white/55 p-5 shadow-xl backdrop-blur">
                    <div className="text-sm font-semibold text-[#5b3157]">今次工作流</div>
                    <div className="mt-3 grid gap-2 text-sm text-[#76516f]">
                      {PRODUCT_WORKFLOW_STAGES.map((stage, index) => (
                        <div key={stage.id} className="flex items-center gap-3 rounded-2xl bg-white/55 px-3 py-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#7f315f] text-xs font-bold text-white">{index + 1}</span>
                          <span>{stage.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {!brandLibrary.length && !skipBrandSetupPrompt && (
                <Card className="overflow-hidden border-rose-100 bg-[#fffaf3]">
                  <div className="grid gap-5 p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#b45571]">Brand Library Setup</div>
                      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#321d38]">開始前先建立品牌資料</h2>
                      <p className="mt-3 max-w-3xl text-sm leading-7 text-[#76516f]">
                        品牌資料會用於自動套用療程、賣點、痛點及 CTA。未建立品牌前，仍可先用 素材庫、影片或題材做 AI 拆解。
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3 lg:justify-end">
                      <Button onClick={() => setActiveTab("brand")}>
                        前往品牌資料庫
                      </Button>
                      <Button variant="outline" onClick={() => setSkipBrandSetupPrompt(true)}>
                        暫時不套用品牌
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              <div className="grid gap-5 lg:grid-cols-3">
                {CREATIVE_SOURCE_OPTIONS.map((option) => {
                  const display = getCreativeSourceDisplay(option);
                  return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleCreativeSourceSelect(option.id)}
                    className={`group overflow-hidden rounded-[2rem] bg-gradient-to-br ${option.gradient} p-6 text-left shadow-[0_22px_55px_rgba(111,66,103,0.12)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_30px_75px_rgba(111,66,103,0.18)]`}
                  >
                    <div className="flex min-h-[280px] flex-col justify-between">
                      <div>
                        <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-3xl bg-white/75 text-2xl shadow-sm ${option.accent}`}>
                          <Icon name={option.icon} />
                        </div>
                        <h2 className="text-2xl font-semibold tracking-tight text-[#321d38]">{display.title}</h2>
                        <p className="mt-4 text-sm leading-7 text-[#704766]">{display.desc}</p>
                      </div>
                      <div className="mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-white/75 px-4 py-2 text-sm font-bold text-[#7f315f] shadow-sm transition group-hover:bg-white">
                        {display.cta}
                        <span>→</span>
                      </div>
                    </div>
                  </button>
                  );
                })}
              </div>

              <Card>
                <div className="grid gap-5 p-6 lg:grid-cols-[1fr_1.2fr]">
                  <div>
                    <SectionTitle
                      icon="frame"
                      title="最近素材"
                      desc="插件擷取、Ad Library 連結、上載素材都會先成為 參考素材。"
                    />
                    <Button className="mt-4" variant="outline" onClick={() => setActiveTab("references")}>
                      查看素材庫
                    </Button>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {referenceAds.slice(0, 4).map((reference) => (
                      <button
                        key={reference.id}
                        type="button"
                        onClick={() => {
                          setSelectedReferenceId(reference.id);
                          setCreativeSourceType("extension");
                          setActiveTab("analysis");
                        }}
                        className="group flex gap-3 rounded-3xl bg-[#fff9f0] p-3 text-left transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
                      >
                        <ReferencePreview reference={reference} className="h-20 w-24 shrink-0 rounded-2xl" />
                        <div className="min-w-0">
                          <div className="line-clamp-2 text-sm font-semibold text-[#321d38]">{reference.title || "未命名素材"}</div>
                          <div className="mt-1 text-xs text-[#8a6d80]">{reference.platform || "素材庫"}</div>
                        </div>
                      </button>
                    ))}
                    {!referenceAds.length && (
                      <div className="md:col-span-2 rounded-3xl border border-dashed border-rose-200 bg-white/60 p-6 text-sm text-[#76516f]">
                        未有素材。可先用瀏覽器插件擷取、上載參考影片，或用 AI 熱門話題開始。
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeTab === "analysis" && (
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
              <div className="space-y-6">
                <Card className="overflow-hidden">
                  <div className="bg-gradient-to-br from-[#43234c] via-[#7f315f] to-[#d8795e] p-7 text-white">
                    <div className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70">Unified AI Analysis</div>
                    <h1 className="mt-3 text-3xl font-semibold tracking-tight">AI 初步分析</h1>
                    <p className="mt-3 max-w-3xl text-sm leading-7 text-white/78">
                      不論來源係插件素材、參考影片定熱門話題，呢度會先拆解可參考亮點，再進入品牌療程套用。
                    </p>
                  </div>
                  <div className="grid gap-5 p-6 lg:grid-cols-3">
                    <div className="rounded-3xl bg-[#fff7ec] p-5">
                      <div className="text-xs font-bold uppercase tracking-wider text-[#b45571]">素材 / 主題摘要</div>
                      <div className="mt-3 text-xl font-semibold text-[#321d38]">{creativeAnalysisPreview.title}</div>
                      <p className="mt-3 text-sm leading-7 text-[#76516f]">{creativeAnalysisPreview.summary}</p>
                    </div>
                    <div className="rounded-3xl bg-[#fbeaf2] p-5">
                      <div className="text-xs font-bold uppercase tracking-wider text-[#b45571]">AI 分數</div>
                      <div className="mt-4 text-5xl font-semibold text-[#7f315f]">{creativeAnalysisPreview.score}</div>
                      <div className="mt-2 text-sm text-[#76516f]">以 Hook、清晰度、可改寫性作本地預覽評分。</div>
                    </div>
                    <div className="rounded-3xl bg-[#f4ecff] p-5">
                      <div className="text-xs font-bold uppercase tracking-wider text-[#7f315f]">適合套用</div>
                      <div className="mt-3 text-lg font-semibold text-[#321d38]">
                        {brandTreatmentRecommendations[0]?.brandName || campaignContext.brandName || "待選品牌"}
                      </div>
                      <div className="mt-1 text-sm text-[#76516f]">
                        {brandTreatmentRecommendations[0]?.treatmentName || campaignContext.treatmentName || "系統會根據品牌資料庫推薦"}
                      </div>
                    </div>
                  </div>
                </Card>

                {creativeSourceType === "extension" && (
                  <Card>
                    <div className="p-6">
                      <SectionTitle
                        icon="frame"
                        title="瀏覽器插件擷取"
                        desc="在瀏覽器選取畫面上可見的素材，再匯入 Alyssa 素材庫。素材先入庫，再做 AI 拆解、Brief 同製作 Job。"
                      />
                      <div className="mt-5 grid gap-4 md:grid-cols-3">
                        {[
                          { title: "1. 開啟插件", desc: "在 IG、FB、Ad Library 或 Landing Page 旁邊使用瀏覽器插件。" },
                          { title: "2. 擷取素材", desc: "保留來源、畫面預覽、caption 或備註，避免人手重覆整理。" },
                          { title: "3. 回到素材庫", desc: "匯入後選取素材，繼續 AI 拆解和生成 Brief。" },
                        ].map((step) => (
                          <div key={step.title} className="rounded-3xl bg-white/75 p-4 text-sm leading-7 text-[#5b3157] shadow-sm">
                            <div className="font-semibold text-[#321d38]">{step.title}</div>
                            <div className="mt-2">{step.desc}</div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-5 flex flex-wrap gap-3">
                        <Button variant="outline" onClick={() => setActiveTab("references")}>
                          查看素材庫
                        </Button>
                        <Button onClick={() => setReferenceCaptureOpen(true)}>
                          新增素材
                        </Button>
                      </div>
                    </div>
                  </Card>
                )}

                {creativeSourceType === "video" && (
                  <Card>
                    <div className="p-6">
                      <SectionTitle
                        icon="video"
                        title="上載參考影片"
                        desc="影片、來源 URL、品牌同備註會建立成同一張素材卡，之後可直接做 AI 拆解。"
                      />
                      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                        <div className="rounded-3xl border border-dashed border-rose-200 bg-white/70 p-5">
                          <div className="text-sm font-semibold text-[#321d38]">選擇影片</div>
                          <input
                            type="file"
                            accept="video/mp4,video/quicktime,video/webm,video/*"
                            onChange={handleUploadReferenceVideoSelect}
                            className="mt-3 text-sm text-[#76516f] file:mr-3 file:rounded-xl file:border-0 file:bg-[#321d38] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white"
                          />
                          {uploadReferencePreviewUrl ? (
                            <video src={uploadReferencePreviewUrl} controls className="mt-4 aspect-video w-full rounded-2xl bg-black object-contain" />
                          ) : (
                            <div className="mt-4 flex aspect-video items-center justify-center rounded-2xl bg-[#fff7ec] text-sm font-semibold text-[#8a6d80]">
                              待補預覽
                            </div>
                          )}
                          {videoName && <div className="mt-3 text-sm font-semibold text-[#5b3157]">已選擇：{videoName}</div>}
                        </div>

                        <div className="grid gap-4">
                          <TextInput
                            label="參考素材標題"
                            value={uploadReferenceDraft.title}
                            onChange={(value) => handleUploadReferenceDraftChange("title", value)}
                            placeholder={videoName || "上載參考影片"}
                          />
                          <TextInput
                            label="參考來源 URL（IG / FB / Ad Library / 網站）"
                            value={uploadReferenceDraft.sourceUrl}
                            onChange={(value) => handleUploadReferenceDraftChange("sourceUrl", value)}
                            placeholder="https://..."
                          />
                          <TextInput
                            label="競品 / 來源品牌"
                            value={uploadReferenceDraft.competitorBrand}
                            onChange={(value) => handleUploadReferenceDraftChange("competitorBrand", value)}
                          />
                          <TextInput
                            label="素材備註"
                            value={uploadReferenceDraft.notes}
                            onChange={(value) => handleUploadReferenceDraftChange("notes", value)}
                            textarea
                            rows={3}
                          />
                          <div className="flex flex-wrap gap-3">
                            <Button onClick={handleCreateUploadedVideoReference} disabled={uploadReferenceStatus === "saving"}>
                              {uploadReferenceStatus === "saving" ? "建立中..." : "建立參考素材"}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={handleStartUploadedReferenceVideoAnalysis}
                              disabled={analysisStatus === "analyzing" || analysisStatus === "extracting_frames" || analysisStatus === "uploading"}
                            >
                              {analysisStatus === "analyzing" || analysisStatus === "extracting_frames" || analysisStatus === "uploading" ? "AI 分析中..." : "開始 AI 分析"}
                            </Button>
                          </div>
                          {uploadReferenceStatus === "saved" && (
                            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                              已建立素材庫參考素材，可繼續拆解、生成 Brief 或建立製作 Job。
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                )}

                {creativeSourceType === "topic" && (
                  <Card>
                    <div className="p-6">
                      <SectionTitle
                        icon="magic"
                        title="AI 熱門話題建議"
                        desc="用內部題材庫快速試角度，唔假裝即時抓取熱搜；選中題材後會進入同一個 AI 拆解流程。"
                      />
                      <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
                        {TRENDING_TOPIC_CATEGORIES.map((category) => (
                          <button
                            key={category}
                            type="button"
                            onClick={() => {
                              setSelectedTopicCategory(category);
                              const firstTopic = getTrendingTopicsForCategory(category)[0];
                              if (firstTopic) {
                                setSelectedTrendingTopicId(firstTopic.id);
                                setTopicInspiration(firstTopic.title);
                              }
                            }}
                            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${
                              selectedTopicCategory === category
                                ? "bg-[#321d38] text-white shadow-sm"
                                : "bg-white/80 text-[#5b3157] hover:bg-rose-50"
                            }`}
                          >
                            {category}
                          </button>
                        ))}
                      </div>

                      <div className="mt-5 grid gap-4 lg:grid-cols-2">
                        {trendingTopicSuggestions.map((topic) => {
                          const selected = selectedTrendingTopic?.id === topic.id;
                          return (
                            <button
                              key={topic.id}
                              type="button"
                              onClick={() => {
                                setSelectedTrendingTopicId(topic.id);
                                setTopicInspiration(topic.title);
                              }}
                              className={`rounded-3xl p-5 text-left transition hover:-translate-y-0.5 ${
                                selected ? "bg-[#321d38] text-white shadow-xl" : "border border-rose-100 bg-white/80 text-[#321d38]"
                              }`}
                            >
                              <div className={`text-xs font-bold uppercase tracking-wider ${selected ? "text-white/60" : "text-[#b45571]"}`}>
                                {topic.category}｜{topic.format}｜{topic.score}
                              </div>
                              <div className="mt-3 text-xl font-semibold">{topic.title}</div>
                              <p className={`mt-3 text-sm leading-7 ${selected ? "text-white/76" : "text-[#76516f]"}`}>{topic.why}</p>
                              <div className={`mt-3 rounded-2xl px-3 py-2 text-sm ${selected ? "bg-white/12 text-white" : "bg-[#fff7ec] text-[#5b3157]"}`}>
                                Hook：{topic.hook}
                              </div>
                              <div className={`mt-3 text-sm leading-7 ${selected ? "text-white/76" : "text-[#76516f]"}`}>
                                受眾：{topic.audience}<br />
                                畫面：{topic.visualDirection}
                              </div>
                              <div className="mt-4 flex flex-wrap gap-2">
                                {(topic.tags || []).map((tag) => (
                                  <span key={tag} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${selected ? "bg-white/14 text-white" : "bg-rose-50 text-[#7f315f]"}`}>
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      <div className="mt-5 flex flex-wrap gap-3">
                        <Button onClick={() => handleUseTrendingTopicAsAnalysisSource(selectedTrendingTopic)}>
                          套用作分析來源
                        </Button>
                        <Button variant="outline" onClick={() => setActiveTab("apply")}>
                          查看品牌套用
                        </Button>
                      </div>

                      <div className="mt-6">
                        <div className="text-sm font-semibold text-[#321d38]">What-if 套用預覽</div>
                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                          {!topicWhatIfPreviews.length && (
                            <div className="md:col-span-2 rounded-3xl border border-dashed border-rose-200 bg-white/70 p-5 text-sm leading-7 text-[#76516f]">
                              未有品牌資料，建立品牌後可自動生成「套用到品牌 / 療程」預覽。你仍可先用上方題材做 AI 拆解，再手動填寫今次方向。
                            </div>
                          )}
                          {topicWhatIfPreviews.map((preview) => (
                            <div key={preview.id} className="rounded-3xl border border-rose-100 bg-white/75 p-4">
                              <div className="text-xs font-bold uppercase tracking-wider text-[#b45571]">
                                假如套用於 {preview.brandName}｜{preview.treatmentName}
                              </div>
                              <div className="mt-2 text-sm font-semibold text-[#321d38]">{preview.angle}</div>
                              <div className="mt-2 text-sm leading-7 text-[#76516f]">Hook：{preview.hook}</div>
                              <div className="mt-2 text-sm leading-7 text-[#76516f]">畫面：{preview.visualDirection}</div>
                              <div className="mt-2 rounded-2xl bg-[#fff7ec] px-3 py-2 text-sm text-[#7f315f]">CTA：{preview.cta}</div>
                              <p className="mt-3 text-xs leading-6 text-[#8a6d80]">{preview.why}</p>
                              <Button className="mt-3" variant="outline" onClick={() => handleApplyTopicWhatIfPreview(preview)}>
                                套用品牌療程
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                )}

                {false && creativeSourceType === "video" && (
                  <Card>
                    <div className="p-6">
                      <SectionTitle icon="video" title="上載參考影片" desc="上載影片後可呼叫既有影片分析流程，拆解講得點、節奏及風險。" />
                      <div className="mt-4 rounded-3xl border border-dashed border-rose-200 bg-white/70 p-6 text-center">
                        <input type="file" accept="video/*" onChange={handleVideoSelect} className="text-sm" />
                        {videoName && <div className="mt-3 text-sm font-semibold text-[#5b3157]">已選擇：{videoName}</div>}
                        <Button className="mt-4" onClick={handleAnalyzeVideo} disabled={appIsBusy || !(videoFile || videoUrl.trim())}>
                          {analysisStatus === "analyzing" || analysisStatus === "extracting_frames" || analysisStatus === "uploading" ? "AI 分析中..." : "AI 分析參考影片"}
                        </Button>
                      </div>
                    </div>
                  </Card>
                )}

                {false && creativeSourceType === "topic" && (
                  <Card>
                    <div className="p-6">
                      <SectionTitle icon="magic" title="AI 熱門話題建議" desc="先用題材方向建立本地初步分析；之後可以接入真正趨勢資料源。" />
                      <div className="mt-4">
                        <TextInput label="想探索的題材 / 服務痛點" value={topicInspiration} onChange={setTopicInspiration} />
                      </div>
                    </div>
                  </Card>
                )}

                <div className="grid gap-5 lg:grid-cols-2">
                  <Card>
                    <div className="p-6">
                      <SectionTitle icon="play" title="講得點" desc="可保留的內容結構。" />
                      <div className="mt-4 grid gap-2">
                        {creativeAnalysisPreview.hookPoints.map((item, index) => (
                          <div key={`${item}-${index}`} className="rounded-2xl bg-[#fff8f0] px-4 py-3 text-sm leading-7 text-[#5b3157]">
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                  <Card>
                    <div className="p-6">
                      <SectionTitle icon="alert" title="避免或注意位" desc="保留參考感，但不要照抄或踩風險。" />
                      <div className="mt-4 grid gap-2">
                        {creativeAnalysisPreview.avoidPoints.map((item, index) => (
                          <div key={`${item}-${index}`} className="rounded-2xl bg-[#fff4f4] px-4 py-3 text-sm leading-7 text-[#7b4353]">
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                </div>

                <Card>
                  <div className="p-6">
                    <SectionTitle icon="copy" title="可改寫方向" desc="下一步會用呢啲方向套到品牌療程。" />
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      {creativeAnalysisPreview.rewriteDirections.map((item) => (
                        <div key={item} className="rounded-3xl bg-white/70 p-4 text-sm leading-7 text-[#5b3157] shadow-sm">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>

              <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
                <Card>
                  <div className="p-5">
                    <SectionTitle icon="target" title="下一步" desc="套用到品牌 / 療程。" />
                    <Button className="mt-4 w-full" onClick={() => setActiveTab("apply")}>
                      套用品牌療程
                    </Button>
                  </div>
                </Card>
                <Card>
                  <div className="p-5">
                    <SectionTitle icon="frame" title="選中素材" desc="瀏覽器插件匯入會直接加入素材庫。" />
                    {selectedReference ? (
                      <div className="mt-4">
                        <ReferencePreview reference={selectedReference} className="aspect-video rounded-3xl" showControls />
                        <div className="mt-3 text-sm font-semibold text-[#321d38]">{selectedReference.title || "未命名素材"}</div>
                        <div className="mt-1 text-xs text-[#8a6d80]">{selectedReference.platform || "素材庫"}</div>
                      </div>
                    ) : (
                      <div className="mt-4 rounded-3xl border border-dashed border-rose-200 bg-white/60 p-5 text-sm text-[#76516f]">
                        暫未選中素材。可先用插件擷取或從素材庫選擇。
                      </div>
                    )}
                    <Button className="mt-4 w-full" variant="outline" onClick={() => setActiveTab("references")}>
                      查看素材庫
                    </Button>
                  </div>
                </Card>
              </aside>
            </div>
          )}

          {activeTab === "apply" && (
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
              <div className="space-y-6">
                <Card className="overflow-hidden">
                  <div className="bg-gradient-to-br from-[#fff1df] via-[#f8ddea] to-[#f2e7ff] p-7">
                    <div className="text-sm font-bold uppercase tracking-[0.18em] text-[#b45571]">Brand Fit Layer</div>
                    <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#321d38]">套用到品牌 / 療程</h1>
                    <p className="mt-3 max-w-3xl text-sm leading-7 text-[#704766]">
                      Brand Library 係共用資料層，不再係起點。AI 會先拆解來源，再建議最適合套用的品牌及療程。
                    </p>
                  </div>
                  <div className="p-6">
                    <div className="grid gap-4 lg:grid-cols-2">
                      {brandTreatmentRecommendations.slice(0, 6).map((recommendation, index) => (
                        <button
                          key={`${recommendation.brandId}-${recommendation.treatmentId}`}
                          type="button"
                          onClick={() => handleApplyBrandTreatmentRecommendation(recommendation)}
                          className={`rounded-[2rem] p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${
                            index === 0 ? "bg-gradient-to-br from-[#7f315f] to-[#e08b64] text-white" : "border border-rose-100 bg-white/80 text-[#321d38]"
                          }`}
                        >
                          <div className={`text-xs font-bold uppercase tracking-wider ${index === 0 ? "text-white/70" : "text-[#b45571]"}`}>
                            {index === 0 ? "系統建議首選品牌 / 療程" : "其他可能適合"}
                          </div>
                          <div className="mt-3 text-xl font-semibold">{recommendation.brandName}</div>
                          <div className={`mt-1 text-sm ${index === 0 ? "text-white/82" : "text-[#76516f]"}`}>{recommendation.treatmentName}</div>
                          <p className={`mt-4 text-sm leading-7 ${index === 0 ? "text-white/78" : "text-[#76516f]"}`}>{recommendation.why}</p>
                          <div className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-bold ${index === 0 ? "bg-white/18 text-white" : "bg-rose-50 text-[#7f315f]"}`}>
                            套用此方向
                          </div>
                        </button>
                      ))}
                    </div>
                    {!brandTreatmentRecommendations.length && (
                      <div className="rounded-3xl border border-dashed border-rose-200 bg-white/60 p-6 text-sm text-[#76516f]">
                        品牌資料庫暫時未有可推薦療程。請先到品牌資料庫建立品牌及療程。
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
                <Card>
                  <div className="p-5">
                    <SectionTitle icon="db" title="手動選擇品牌 / 療程" desc="如果 AI 建議唔啱，可以由資料庫手動揀。" />
                    <div className="mt-4 grid gap-4">
                      <SelectInput
                        label="品牌"
                        value={selectedLibraryBrand?.id || ""}
                        onChange={handleSelectLibraryBrand}
                        options={brandLibrary.length ? brandLibrary.map((brand) => ({ value: brand.id, label: brand.brandName || "未命名品牌" })) : [{ value: "", label: "未有品牌" }]}
                      />
                      <SelectInput
                        label="療程 / 服務"
                        value={selectedLibraryTreatment?.id || ""}
                        onChange={setSelectedLibraryTreatmentId}
                        options={
                          selectedLibraryTreatments.length
                            ? selectedLibraryTreatments.map((treatment) => ({ value: treatment.id, label: treatment.treatmentName || "未命名療程" }))
                            : [{ value: "", label: "未有療程" }]
                        }
                      />
                      <Button onClick={() => setActiveTab("checklist")} disabled={!selectedLibraryBrand || !selectedLibraryTreatment}>
                        確認並勾選參考位
                      </Button>
                    </div>
                  </div>
                </Card>
                <Card>
                  <div className="p-5">
                    <SectionTitle icon="target" title="目前選擇" desc="會帶入影片稿、初剪方案同製作 Job。" />
                    <div className="mt-4 rounded-3xl bg-[#321d38] p-5 text-white">
                      <div className="text-xs font-bold uppercase tracking-wider text-white/55">Applied Context</div>
                      <div className="mt-2 text-xl font-semibold">{campaignContext.brandName || "未選品牌"}</div>
                      <div className="mt-1 text-sm text-white/72">{campaignContext.treatmentName || "未選療程"}</div>
                      <div className="mt-3 text-sm leading-7 text-white/70">{campaignContext.offer || "未定 Offer"}</div>
                    </div>
                  </div>
                </Card>
              </aside>
            </div>
          )}

          {activeTab === "checklist" && (
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
              <Card>
                <div className="p-7">
                  <SectionTitle icon="check" title="點選要參考的位" desc="保留參考素材的有效結構，但唔直接照抄。所選項目會出現在影片稿同初剪方案。" />
                  <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {REFERENCE_CHECKLIST_OPTIONS.map((item) => {
                      const selected = selectedReferenceChecklist.includes(item);
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => toggleReferenceChecklistItem(item)}
                          className={`rounded-3xl p-4 text-left text-sm font-semibold transition hover:-translate-y-0.5 ${
                            selected
                              ? "bg-gradient-to-br from-[#7f315f] to-[#e08b64] text-white shadow-[0_16px_36px_rgba(180,85,113,0.22)]"
                              : "border border-rose-100 bg-white/75 text-[#5b3157] hover:bg-white"
                          }`}
                        >
                          <span className="mr-2">{selected ? "✓" : "○"}</span>
                          {item}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </Card>
              <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
                <Card>
                  <div className="p-5">
                    <SectionTitle icon="copy" title="已選參考位" desc="會帶入後續輸出。" />
                    <div className="mt-4 flex flex-wrap gap-2">
                      {selectedReferenceChecklist.map((item) => (
                        <span key={item} className="rounded-full bg-rose-50 px-3 py-1.5 text-xs font-bold text-[#7f315f]">
                          {item}
                        </span>
                      ))}
                    </div>
                    <Button className="mt-5 w-full" onClick={() => setActiveTab("input")}>
                      生成影片稿
                    </Button>
                  </div>
                </Card>
              </aside>
            </div>
          )}

          {activeTab === "roughcut" && (
            <div className="space-y-6">
              <Card className="overflow-hidden">
                <div className="bg-gradient-to-br from-[#43234c] via-[#7f315f] to-[#e08b64] p-7 text-white">
                  <div className="text-sm font-bold uppercase tracking-[0.18em] text-white/70">Rough Cut Plan</div>
                  <h1 className="mt-3 text-3xl font-semibold tracking-tight">初剪方案</h1>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-white/78">呢度係給 Editor / Designer 的剪接方案，不代表已生成影片。</p>
                </div>
                <div className="p-6">
                  <div className="mb-5 rounded-3xl bg-[#fff7ec] p-4 text-sm leading-7 text-[#76516f]">
                    已套用參考位：{selectedChecklistSummary}
                  </div>
                  <div className="overflow-hidden rounded-[2rem] border border-rose-100 bg-white/75">
                    <div className="grid grid-cols-[110px_1.2fr_1.2fr_1fr] gap-3 border-b border-rose-100 bg-[#fff8ef] px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#8a4b66]">
                      <div>Timeline</div>
                      <div>Visual / Text</div>
                      <div>VO / Pacing</div>
                      <div>Footage / Editor Notes</div>
                    </div>
                    {roughCutPlanRows.map((row, index) => (
                      <div key={`${row.timeline}-${index}`} className="grid grid-cols-[110px_1.2fr_1.2fr_1fr] gap-3 border-b border-rose-50 px-4 py-4 text-sm last:border-b-0">
                        <div className="font-semibold text-[#7f315f]">{row.timeline}</div>
                        <div className="space-y-2 text-[#4d2b4b]">
                          <div>{row.visualReference}</div>
                          <div className="rounded-2xl bg-rose-50 px-3 py-2 text-xs text-[#7f315f]">{row.textOverlay}</div>
                        </div>
                        <div className="space-y-2 text-[#76516f]">
                          <div>{row.voCaption}</div>
                          <div className="text-xs">{row.transition}</div>
                        </div>
                        <div className="space-y-2 text-[#76516f]">
                          <div>{row.footageNeeded}</div>
                          <div className="text-xs">{row.musicMood}</div>
                          <div className="text-xs font-semibold">{row.editorNotes}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Button onClick={() => setActiveTab("jobs")}>
                      建立製作 Job
                    </Button>
                    <Button variant="outline" onClick={handleExportWord}>
                      匯出 Word
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeTab === "brand" && (
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_420px]">
              <Card className="overflow-hidden">
                <div className="bg-gradient-to-br from-[#43234c] via-[#7f315f] to-[#e08b64] px-6 py-7 text-white">
                  <div className="text-sm font-semibold uppercase tracking-wider text-white/70">Team Creative Database</div>
                  <h1 className="mt-2 text-3xl font-semibold tracking-tight">品牌資料庫</h1>
                  <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/78">
                    團隊用來設定品牌、療程、賣點、痛點、Hook、視覺方向及 CTA。
                  </p>
                </div>
                {!brandLibrary.length && (
                  <div className="p-6">
                    <div className="rounded-[2rem] border border-dashed border-rose-200 bg-[#fff8ef] p-8 text-center">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-white text-[#b45571] shadow-sm">
                        <Icon name="db" />
                      </div>
                      <h2 className="mt-4 text-2xl font-semibold tracking-tight text-[#321d38]">尚未建立品牌資料</h2>
                      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[#76516f]">
                        先建立品牌及療程，之後每次創作都可以一鍵套用。
                      </p>
                      <div className="mt-5 flex flex-wrap justify-center gap-3">
                        <Button onClick={handleAddLibraryBrand}>
                          建立第一個品牌
                        </Button>
                        <Button variant="danger" onClick={resetBrandDatabase}>
                          清除本機品牌測試資料
                        </Button>
                      </div>
                      <p className="mx-auto mt-4 max-w-2xl text-xs leading-6 text-[#8a6d80]">
                        正式團隊版會改用共享資料庫，所有同事共用同一套品牌 / 療程資料。
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid gap-6 p-6 lg:grid-cols-[320px_minmax(0,1fr)]">
                  <div className="space-y-4">
                    <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
                      目前為本機測試資料。正式團隊版將改用共享資料庫，所有同事共用同一套品牌 / 療程資料。
                    </div>
                    <SelectInput
                      label="選擇品牌"
                      value={selectedLibraryBrand?.id || ""}
                      onChange={handleSelectLibraryBrand}
                      options={
                        brandLibrary.length
                          ? brandLibrary.map((brand) => ({ value: brand.id, label: brand.brandName || "未命名品牌" }))
                          : [{ value: "", label: "未有品牌" }]
                      }
                    />
                    <SelectInput
                      label="選擇療程 / 服務"
                      value={selectedLibraryTreatment?.id || ""}
                      onChange={setSelectedLibraryTreatmentId}
                      options={
                        selectedLibraryTreatments.length
                          ? selectedLibraryTreatments.map((treatment) => ({
                              value: treatment.id,
                              label: treatment.treatmentName || "未命名療程",
                            }))
                          : [{ value: "", label: "未有療程" }]
                      }
                    />
                    <div className="grid gap-2">
                      <Button onClick={handleApplyCampaignContext} disabled={!selectedLibraryBrand || !selectedLibraryTreatment}>
                        <Icon name="magic" /> 套用到創作流程
                      </Button>
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" onClick={handleAddLibraryBrand}>
                          新增品牌
                        </Button>
                        <Button variant="outline" onClick={handleAddLibraryTreatment} disabled={!selectedLibraryBrand}>
                          新增療程
                        </Button>
                      </div>
                    </div>
                    <div className="rounded-3xl border border-rose-100 bg-[#fff8ef] p-4 text-sm leading-relaxed text-[#76516f]">
                      品牌資料庫係可重用資料層；創作流程由素材、影片或話題開始。
                    </div>
                  </div>

                  <details className="rounded-3xl border border-rose-100 bg-white/80 p-4" open>
                    <summary className="cursor-pointer text-sm font-semibold text-[#5b3157]">編輯品牌 / 療程資料</summary>
                    <div className="mt-5 grid gap-5">
                    <div className="grid gap-4 md:grid-cols-2">
                      <TextInput label="品牌名稱" value={selectedLibraryBrand?.brandName || ""} onChange={(value) => updateBrandLibraryBrandField("brandName", value)} />
                      <TextInput label="品牌語氣" value={selectedLibraryBrand?.toneOfVoice || ""} onChange={(value) => updateBrandLibraryBrandField("toneOfVoice", value)} />
                      <TextInput label="IG" value={selectedLibraryBrand?.igUrl || ""} onChange={(value) => updateBrandLibraryBrandField("igUrl", value)} />
                      <TextInput label="FB" value={selectedLibraryBrand?.fbUrl || ""} onChange={(value) => updateBrandLibraryBrandField("fbUrl", value)} />
                      <TextInput label="分店 / 地點" value={selectedLibraryBrand?.branches || ""} onChange={(value) => updateBrandLibraryBrandField("branches", value)} />
                      <TextInput label="常用 CTA" value={selectedLibraryBrand?.commonCta || ""} onChange={(value) => updateBrandLibraryBrandField("commonCta", value)} />
                      <TextInput label="注意事項 / 禁用字" value={selectedLibraryBrand?.cautionNotes || ""} onChange={(value) => updateBrandLibraryBrandField("cautionNotes", value)} textarea rows={2} />
                      <div className="md:col-span-2">
                        <TextInput label="Website" value={selectedLibraryBrand?.websiteUrl || ""} onChange={(value) => updateBrandLibraryBrandField("websiteUrl", value)} />
                      </div>
                      <div className="md:col-span-2">
                        <TextInput label="品牌定位" value={selectedLibraryBrand?.brandPositioning || ""} onChange={(value) => updateBrandLibraryBrandField("brandPositioning", value)} textarea rows={3} />
                      </div>
                      <div className="md:col-span-2">
                        <TextInput label="目標客群" value={selectedLibraryBrand?.targetAudience || ""} onChange={(value) => updateBrandLibraryBrandField("targetAudience", value)} textarea rows={2} />
                      </div>
                    </div>

                    <div className="rounded-3xl border border-rose-100 bg-white p-4">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-[#321d38]">療程資料</div>
                          <div className="mt-1 text-xs text-[#8a6d80]">呢度會推動品牌建議、影片稿同初剪方案。</div>
                        </div>
                        <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-[#7f315f]">
                          DB-ready
                        </span>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <TextInput label="療程 / 服務名稱" value={selectedLibraryTreatment?.treatmentName || ""} onChange={(value) => updateBrandLibraryTreatmentField("treatmentName", value)} />
                        <TextInput label="分類" value={selectedLibraryTreatment?.category || ""} onChange={(value) => updateBrandLibraryTreatmentField("category", value)} />
                        <TextInput label="Offer / 價錢" value={selectedLibraryTreatment?.offer || ""} onChange={(value) => updateBrandLibraryTreatmentField("offer", value)} />
                        <TextInput label="價錢備註" value={selectedLibraryTreatment?.price || ""} onChange={(value) => updateBrandLibraryTreatmentField("price", value)} />
                        <div className="md:col-span-2">
                          <TextInput label="核心賣點" value={selectedLibraryTreatment?.sellingPoints || ""} onChange={(value) => updateBrandLibraryTreatmentField("sellingPoints", value)} textarea rows={3} />
                        </div>
                        <div className="md:col-span-2">
                          <TextInput label="客人痛點" value={selectedLibraryTreatment?.painPoints || ""} onChange={(value) => updateBrandLibraryTreatmentField("painPoints", value)} textarea rows={3} />
                        </div>
                        <div className="md:col-span-2">
                          <TextInput label="適合客群" value={selectedLibraryTreatment?.targetAudience || ""} onChange={(value) => updateBrandLibraryTreatmentField("targetAudience", value)} textarea rows={2} />
                        </div>
                        <TextInput label="常用 Hook" value={selectedLibraryTreatment?.commonHooks || ""} onChange={(value) => updateBrandLibraryTreatmentField("commonHooks", value)} textarea rows={3} />
                        <TextInput label="視覺方向" value={selectedLibraryTreatment?.visualAngles || ""} onChange={(value) => updateBrandLibraryTreatmentField("visualAngles", value)} textarea rows={3} />
                        <TextInput label="關鍵字" value={selectedLibraryTreatment?.keywords || ""} onChange={(value) => updateBrandLibraryTreatmentField("keywords", value)} textarea rows={3} />
                        <TextInput label="競品關鍵字" value={selectedLibraryTreatment?.competitorKeywords || ""} onChange={(value) => updateBrandLibraryTreatmentField("competitorKeywords", value)} textarea rows={3} />
                        <TextInput label="常見 objection" value={selectedLibraryTreatment?.objections || ""} onChange={(value) => updateBrandLibraryTreatmentField("objections", value)} textarea rows={3} />
                        <TextInput label="備註" value={selectedLibraryTreatment?.notes || ""} onChange={(value) => updateBrandLibraryTreatmentField("notes", value)} textarea rows={3} />
                      </div>
                    </div>
                    </div>
                  </details>
                </div>
              </Card>

              <div className="space-y-4">
                <Card>
                  <div className="p-5">
                    <SectionTitle icon="target" title="目前分析" desc="確認品牌同療程後，下一步會自動推薦競爭對手。" />
                    <div className="rounded-3xl bg-slate-950 p-5 text-white">
                      <div className="text-xs font-semibold uppercase tracking-wider text-slate-300">Campaign Context</div>
                      <div className="mt-2 text-xl font-semibold leading-snug">{campaignContextSummary}</div>
                    </div>
                    <div className="mt-4 grid gap-3 text-sm">
                      {[
                        ["品牌", campaignContext.brandName],
                        ["療程", campaignContext.treatmentName],
                        ["Offer", campaignContext.offer],
                        ["目標客群", campaignContext.targetAudience],
                        ["關鍵字", campaignContext.keywords.join(" / ")],
                        ["競品關鍵字", campaignContext.competitorKeywords.join(" / ") || "系統會用本地美容 / 醫美語境推薦"],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-2xl bg-slate-50 p-3">
                          <div className="text-xs font-semibold text-slate-400">{label}</div>
                          <div className="mt-1 text-slate-800">{value || "未填"}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="p-5">
                    <div className="text-sm font-semibold text-slate-900">下一步</div>
                    <div className="mt-2 text-sm leading-relaxed text-slate-500">
                      套用後會根據品牌、療程、痛點、關鍵字同香港美容 / 醫美語境，推薦 10-20 個競品候選。
                    </div>
                    <Button className="mt-4 w-full" onClick={handleApplyCampaignContext} disabled={!selectedLibraryBrand || !selectedLibraryTreatment}>
                      自動推薦競爭對手
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {false && activeTab === "brand" && (
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_420px]">
              <Card className="overflow-hidden">
                <div className="bg-slate-950 px-6 py-8 text-white">
                  <div className="text-sm font-semibold uppercase tracking-wider text-slate-300">Brand Intelligence</div>
                  <h1 className="mt-2 text-3xl font-semibold tracking-tight">先定品牌定位，再搵競爭素材</h1>
                  <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-300">
                    這一步會整理自己的品牌、服務、客群同 Offer，之後先建議競爭品牌同素材收集方向。
                  </p>
                </div>
                <div className="grid gap-5 p-6 md:grid-cols-2">
                  <TextInput label="品牌名稱" value={brandIntelligence.brandName} onChange={(value) => updateBrandIntelligenceField("brandName", value)} />
                  <TextInput label="行業 / 服務類別" value={brandIntelligence.category} onChange={(value) => updateBrandIntelligenceField("category", value)} />
                  <TextInput label="主打服務 / 療程" value={brandIntelligence.service} onChange={(value) => updateBrandIntelligenceField("service", value)} />
                  <TextInput label="優惠 / Offer" value={brandIntelligence.offer} onChange={(value) => updateBrandIntelligenceField("offer", value)} />
                  <TextInput label="IG URL" value={brandIntelligence.instagramUrl} onChange={(value) => updateBrandIntelligenceField("instagramUrl", value)} />
                  <TextInput label="FB URL" value={brandIntelligence.facebookUrl} onChange={(value) => updateBrandIntelligenceField("facebookUrl", value)} />
                  <div className="md:col-span-2">
                    <TextInput label="Website URL" value={brandIntelligence.websiteUrl} onChange={(value) => updateBrandIntelligenceField("websiteUrl", value)} />
                  </div>
                  <div className="md:col-span-2">
                    <TextInput label="目標客群" value={brandIntelligence.targetAudience} onChange={(value) => updateBrandIntelligenceField("targetAudience", value)} textarea rows={3} />
                  </div>
                  <div className="md:col-span-2">
                    <TextInput label="品牌定位 / 賣點" value={brandIntelligence.positioning} onChange={(value) => updateBrandIntelligenceField("positioning", value)} textarea rows={3} />
                  </div>
                  <div className="md:col-span-2">
                    <TextInput label="已知競爭品牌（可留空，一行一個或用逗號分隔）" value={brandIntelligence.competitorSeeds} onChange={(value) => updateBrandIntelligenceField("competitorSeeds", value)} textarea rows={4} />
                  </div>
                  <div className="md:col-span-2">
                    <TextInput label="補充備註" value={brandIntelligence.brandNotes} onChange={(value) => updateBrandIntelligenceField("brandNotes", value)} textarea rows={3} />
                  </div>
                  <div className="md:col-span-2 flex flex-wrap gap-3">
                    <Button onClick={handleAnalyzeBrandPositioning}>
                      <Icon name="magic" /> 分析品牌定位
                    </Button>
                    <Button variant="outline" onClick={() => setActiveTab("competitors")}>
                      查看競爭對手候選
                    </Button>
                  </div>
                </div>
              </Card>

              <div className="space-y-4">
                <Card>
                  <div className="p-5">
                    <SectionTitle icon="target" title="品牌定位摘要" desc="暫時用本地規則整理，未呼叫新 backend。" />
                    <div className="mt-4 grid gap-3 text-sm">
                      {[
                        ["品牌", brandPositioningSummary.brandName],
                        ["行業 / 服務", brandPositioningSummary.category],
                        ["目標客群", brandPositioningSummary.targetAudience],
                        ["核心 Offer", brandPositioningSummary.coreOffer],
                        ["素材收集方向", brandPositioningSummary.competitorDirection],
                        ["素材觀察重點", brandPositioningSummary.creativeFocus],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-2xl bg-slate-50 p-3">
                          <div className="text-xs font-semibold text-slate-400">{label}</div>
                          <div className="mt-1 text-slate-800">{value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="p-5">
                    <div className="text-sm font-semibold text-slate-900">下一步</div>
                    <div className="mt-2 text-sm leading-relaxed text-slate-500">
                      系統會根據品牌定位生成 10 個左右競爭品牌候選。這些只是 planning 建議，需要由 marketer 確認。
                    </div>
                    <Button className="mt-4 w-full" onClick={handleAnalyzeBrandPositioning}>
                      生成競爭品牌候選
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "competitors" && (
            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <SectionTitle
                    icon="target"
                    title="自動推薦競爭對手"
                    desc="根據目前品牌、療程、痛點同關鍵字，先推本地候選品牌。連結搜尋係下一步，唔係第一步。"
                  />
                  <Button onClick={() => setActiveTab("materials")} disabled={!selectedCompetitor}>
                    前往素材收集
                  </Button>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
                  目前分析：{campaignContextSummary}
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-3 2xl:grid-cols-4">
                {competitorCandidates.map((competitor) => {
                  const active = selectedCompetitor?.id === competitor.id;
                  const status = active ? "已選擇" : getCampaignCompetitorDisplayStatus(competitor.status);
                  const isExcluded = status === "已排除";
                  const keywords = Array.isArray(competitor.searchKeywords)
                    ? competitor.searchKeywords
                    : buildCompetitorSearchKeywords(competitor.name, campaignContext);

                  return (
                    <div
                      key={competitor.id}
                      className={`rounded-3xl border bg-white p-4 shadow-sm transition ${
                        active ? "border-slate-950 ring-2 ring-slate-950/10" : "border-slate-200"
                      } ${isExcluded ? "opacity-60" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-lg font-semibold text-slate-950">{competitor.name}</div>
                          <div className="mt-1 text-xs font-semibold text-slate-500">{competitor.type}</div>
                        </div>
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getCampaignCompetitorStatusMeta(status)}`}>
                          {status}
                        </span>
                      </div>
                      <p className="mt-4 min-h-16 text-sm leading-relaxed text-slate-600">{competitor.why}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {keywords.slice(0, 5).map((keyword) => (
                          <span key={keyword} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                            {keyword}
                          </span>
                        ))}
                      </div>
                      <div className="mt-5 grid gap-2">
                        <div className="grid grid-cols-2 gap-2">
                          <Button onClick={() => handleChooseCompetitor(competitor.id)} disabled={isExcluded}>
                            選擇競品
                          </Button>
                          <Button variant="outline" onClick={() => handleExcludeCompetitor(competitor.id)}>
                            排除
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Button variant="outline" onClick={() => handleSearchCompetitorSocial(competitor, "Instagram")}>
                            外部搜尋 IG
                          </Button>
                          <Button variant="outline" onClick={() => handleSearchCompetitorSocial(competitor, "Facebook")}>
                            外部搜尋 FB
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Button variant="outline" onClick={() => handleOpenCompetitorAdLibrary(competitor)}>
                            打開 Ad Library 搜尋
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              handleChooseCompetitor(competitor.id);
                              setActiveTab("materials");
                            }}
                          >
                            貼上 Ad Library 連結
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Card>
                <div className="p-5">
                  <SectionTitle icon="plus" title="手動加入指定品牌" desc="如果團隊已有指定競品，只填品牌名即可。連結可以去素材收集階段再處理。" />
                  <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
                    <TextInput label="品牌名稱" value={brandIntelligence.manualCompetitorName} onChange={(value) => updateBrandIntelligenceField("manualCompetitorName", value)} />
                    <div className="flex items-end">
                      <Button className="w-full" onClick={handleAddManualCompetitorFromLibrary} disabled={!brandIntelligence.manualCompetitorName.trim()}>
                        <Icon name="plus" /> 加入並選擇
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {false && activeTab === "competitors" && (
            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <SectionTitle icon="target" title="競爭對手探索" desc="以下是根據品牌定位整理的候選名單，不代表已完成素材收集或驗證。" />
                  <Button onClick={() => setActiveTab("materials")} disabled={!selectedCompetitor}>
                    去素材收集
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-3 2xl:grid-cols-4">
                {competitorCandidates.map((competitor) => {
                  const active = selectedCompetitor?.id === competitor.id;
                  return (
                    <button
                      key={competitor.id}
                      type="button"
                      onClick={() => handleSelectCompetitor(competitor.id)}
                      className={`rounded-3xl border bg-white p-4 text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl ${
                        active ? "border-slate-950 ring-2 ring-slate-950/10" : "border-slate-200"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-lg font-semibold text-slate-950">{competitor.name}</div>
                          <div className="mt-1 text-xs font-semibold text-slate-500">{competitor.type}</div>
                        </div>
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getCompetitorStatusMeta(active ? "已選用" : competitor.status)}`}>
                          {active ? "已選用" : competitor.status}
                        </span>
                      </div>
                      <p className="mt-4 min-h-16 text-sm leading-relaxed text-slate-600">{competitor.why}</p>
                      <div className="mt-4 grid gap-2">
                        <input
                          value={competitor.igUrl || ""}
                          onClick={(event) => event.stopPropagation()}
                          onChange={(event) => handleUpdateCompetitorField(competitor.id, "igUrl", event.target.value)}
                          placeholder="IG URL（可選）"
                          className="rounded-2xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-slate-400"
                        />
                        <input
                          value={competitor.fbUrl || ""}
                          onClick={(event) => event.stopPropagation()}
                          onChange={(event) => handleUpdateCompetitorField(competitor.id, "fbUrl", event.target.value)}
                          placeholder="FB URL（可選）"
                          className="rounded-2xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-slate-400"
                        />
                      </div>
                    </button>
                  );
                })}
              </div>

              <Card>
                <div className="p-5">
                  <SectionTitle icon="plus" title="手動加入競爭品牌" desc="如果團隊已知直接對手，可以直接加入並進入素材收集。" />
                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <TextInput label="品牌名稱" value={brandIntelligence.manualCompetitorName} onChange={(value) => updateBrandIntelligenceField("manualCompetitorName", value)} />
                    <TextInput label="IG URL" value={brandIntelligence.manualCompetitorIgUrl} onChange={(value) => updateBrandIntelligenceField("manualCompetitorIgUrl", value)} />
                    <TextInput label="FB URL" value={brandIntelligence.manualCompetitorFbUrl} onChange={(value) => updateBrandIntelligenceField("manualCompetitorFbUrl", value)} />
                    <div className="md:col-span-3">
                      <Button onClick={handleAddManualCompetitor}>
                        <Icon name="plus" /> 加入並選用
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeTab === "materials" && (
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
              <div className="space-y-6">
                <Card>
                  <div className="p-6">
                    <SectionTitle
                      icon="frame"
                      title="素材收集"
                      desc="IG / FB 素材暫未自動接入。現階段可先用 Ad Library 連結、手動素材、上載檔案或外部工具匯入。"
                    />
                    {selectedCompetitor ? (
                      <div className="rounded-3xl bg-slate-950 p-5 text-white">
                        <div className="text-xs font-semibold uppercase tracking-wider text-slate-300">Selected Competitor</div>
                        <div className="mt-2 text-2xl font-semibold">{selectedCompetitor.name}</div>
                        <div className="mt-1 text-sm text-slate-300">
                          {selectedCompetitor.type}｜{getCampaignCompetitorDisplayStatus(selectedCompetitor.status)}
                        </div>
                        <div className="mt-4 text-sm leading-relaxed text-slate-300">
                          先用可靠來源收集素材，再加入素材庫做 AI 分析。
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
                        請先喺競品推薦揀一個品牌。
                      </div>
                    )}
                  </div>
                </Card>

                <Card>
                  <div className="p-5">
                    <SectionTitle
                      icon="frame"
                      title="瀏覽器插件匯入"
                      desc="用瀏覽器插件在 IG / FB / Ad Library / 網站上選取可見素材，直接加入素材庫。"
                    />
                    <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_180px]">
                      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-600">
                        這不是 server-side 自動爬取。團隊只會匯入自己正在瀏覽、明確選取的素材。
                      </div>
                      <div className="flex items-center">
                        <Button variant="outline" className="w-full" onClick={() => setActiveTab("references")}>
                          查看素材庫
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>

                <div className="grid gap-4 lg:grid-cols-2">
                  <Card>
                    <div className="p-5">
                      <SectionTitle
                        icon="target"
                        title="Ad Library 連結"
                        desc="目前最穩定做法：打開 Meta Ad Library，揀中廣告後貼回連結建立素材庫草稿。"
                      />
                      <div className="grid gap-3">
                        <Button onClick={() => handleOpenCompetitorAdLibrary(selectedCompetitor)} disabled={!selectedCompetitor}>
                          <Icon name="cloud" /> 打開 Ad Library 搜尋
                        </Button>
                        <TextInput
                          label="貼上 Ad Library 連結"
                          value={brandIntelligence.adLibraryUrl}
                          onChange={(value) => updateBrandIntelligenceField("adLibraryUrl", value)}
                        />
                        <Button variant="outline" onClick={handleUseAdLibraryLinkAsReferenceDraft} disabled={!selectedCompetitor || !brandIntelligence.adLibraryUrl.trim()}>
                          加入素材庫草稿
                        </Button>
                      </div>
                    </div>
                  </Card>

                  <Card>
                    <div className="p-5">
                      <SectionTitle
                        icon="plus"
                        title="手動素材 / 上載"
                        desc="適合已下載圖片、影片、截圖，或者手動整理好的素材資料。"
                      />
                      <div className="grid gap-3">
                        <Button variant="outline" onClick={() => setReferenceCaptureOpen(true)}>
                          手動加入素材
                        </Button>
                        <Button variant="outline" onClick={() => setReferenceCaptureOpen(true)}>
                          上載圖片 / 影片
                        </Button>
                        <div className="rounded-2xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-500">
                          已加入的素材會先進入 素材庫，再做 AI 分析、Brief 同製作 Job。
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>

                <Card>
                  <div className="p-6">
                    <SectionTitle
                      icon="cloud"
                      title="外部素材匯入"
                      desc="可先用 Thunderbit / CSV / Google Sheet 收集 IG、FB 或網站素材，再匯入 Alyssa 素材庫。"
                    />
                    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
                      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                        <div className="text-sm font-semibold text-slate-900">匯入流程</div>
                        <div className="mt-2 text-sm leading-relaxed text-slate-600">
                          之後可接入資料源或匯入流程。此版本未實作 CSV / Google Sheet 匯入，避免製造假自動化承諾。
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Button variant="outline" className="w-full" disabled>
                          準備匯入 CSV / Google Sheet
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">即將支援</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="p-6">
                    <SectionTitle icon="frame" title="待加入素材" desc="用 Ad Library、上載素材或外部匯入後，素材會成為 參考素材。" />
                    <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-white text-slate-500 shadow-sm">
                        <Icon name="frame" />
                      </div>
                      <div className="text-lg font-semibold text-slate-900">未有新素材</div>
                      <p className="mt-2 text-sm leading-relaxed text-slate-500">
                        可透過 Ad Library 連結、手動加入、上載圖片 / 影片或外部匯入補回。
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="space-y-4 xl:sticky xl:top-24 xl:self-start">
                <Card>
                  <div className="p-5">
                    <SectionTitle icon="frame" title="已加入素材庫的素材" desc="呢啲素材會進入 AI 分析、Creative Brief 同製作 Job。" />
                    {referenceAds.length ? (
                      <div className="mt-4 grid gap-3">
                        {referenceAds.slice(0, 6).map((reference) => (
                          <button
                            key={reference.id}
                            type="button"
                            onClick={() => {
                              setSelectedReferenceId(reference.id);
                              setActiveTab("references");
                            }}
                            className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left transition hover:border-slate-400 hover:shadow-sm"
                          >
                            <ReferencePreview
                              reference={reference}
                              className="h-20 w-24 shrink-0 rounded-2xl"
                              emptyTitle="未有預覽"
                              emptyDescription="可透過 Ad Library、上載素材或外部匯入補回"
                            />
                            <div className="min-w-0">
                              <div className="line-clamp-2 text-sm font-semibold text-slate-900">{reference.title || "未命名素材"}</div>
                              <div className="mt-1 text-xs text-slate-500">{reference.competitorBrand || reference.platform || "素材庫"}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                        未有素材。請先貼上 Ad Library 連結、手動加入素材，或準備外部匯入。
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          )}

          {false && activeTab === "materials" && (
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
              <div className="space-y-6">
                <Card>
                  <div className="p-6">
                    <SectionTitle
                      icon="frame"
                      title="素材收集"
                      desc="先選競品，再用 Ad Library 連結、手動素材、上載檔案或外部匯入加入素材庫。"
                    />
                    {selectedCompetitor ? (
                      <div className="rounded-3xl bg-slate-950 p-5 text-white">
                        <div className="text-xs font-semibold uppercase tracking-wider text-slate-300">Selected Competitor</div>
                        <div className="mt-2 text-2xl font-semibold">{selectedCompetitor.name}</div>
                        <div className="mt-1 text-sm text-slate-300">
                          {selectedCompetitor.type}｜{getCampaignCompetitorDisplayStatus(selectedCompetitor.status)}
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {(selectedCompetitor.searchKeywords || buildCompetitorSearchKeywords(selectedCompetitor.name, campaignContext)).slice(0, 5).map((keyword) => (
                            <span key={keyword} className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-slate-200">
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
                        請先喺競品推薦揀一個品牌。
                      </div>
                    )}
                  </div>
                </Card>

                <div className="grid gap-4 lg:grid-cols-2">
                  <Card>
                    <div className="p-5">
                      <SectionTitle
                        icon="cloud"
                        title="IG / FB 素材暫未自動接入"
                        desc="可先用 Ad Library 連結、手動素材，或外部工具匯入。"
                      />
                      <div className="grid gap-3">
                        <div className="grid grid-cols-2 gap-2">
                          <Button className="[&]:text-[0px] [&]:text-transparent" variant="outline" onClick={() => handleStartMaterialScanTask("IG")} disabled={!selectedCompetitor}>
                            <span className="text-sm text-slate-800">外部搜尋 IG</span>
                            外部搜尋 IG
                          </Button>
                          <Button className="[&]:text-[0px] [&]:text-transparent" variant="outline" onClick={() => handleStartMaterialScanTask("FB")} disabled={!selectedCompetitor}>
                            <span className="text-sm text-slate-800">外部搜尋 FB</span>
                            外部搜尋 FB
                          </Button>
                        </div>
                        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-800">
                          IG / FB 素材暫未自動接入。現階段可先用 Ad Library 連結、手動素材，或外部工具匯入。
                        </div>
                        {materialScanTask && materialScanTask.competitorId === selectedCompetitor?.id && (
                          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                            <div className="text-sm font-semibold text-slate-900">資料源待接入</div>
                            <div className="mt-1 text-sm leading-relaxed text-slate-600">
                              {materialScanTask.competitorName} 的 {materialScanTask.platform} 素材可先用外部工具整理，再匯入 Alyssa 素材庫。
                            </div>
                          </div>
                        )}
                        <div className="grid grid-cols-3 gap-2">
                          <Button variant="ghost" onClick={() => handleSearchCompetitorSocial(selectedCompetitor, "Instagram")} disabled={!selectedCompetitor}>
                            外部搜尋 IG
                          </Button>
                          <Button variant="ghost" onClick={() => handleSearchCompetitorSocial(selectedCompetitor, "Facebook")} disabled={!selectedCompetitor}>
                            外部搜尋 FB
                          </Button>
                          <Button variant="ghost" onClick={() => handleOpenCompetitorAdLibrary(selectedCompetitor)} disabled={!selectedCompetitor}>
                            打開 Ad Library
                          </Button>
                        </div>
                        <Button variant="outline" onClick={() => selectedCompetitor && handleMarkCompetitorScanned(selectedCompetitor.id)} disabled={!selectedCompetitor}>
                          標記為已收集
                        </Button>
                      </div>
                    </div>
                  </Card>

                  <Card>
                    <div className="p-5">
                      <SectionTitle icon="target" title="Meta Ad Library" desc="先用品牌名搜尋，再將選中的廣告連結貼回來加入素材庫。" />
                      <div className="mt-4 grid gap-3">
                        <Button onClick={() => handleOpenCompetitorAdLibrary(selectedCompetitor)} disabled={!selectedCompetitor}>
                          <Icon name="cloud" /> 打開 Ad Library 搜尋
                        </Button>
                        <TextInput
                          label="貼上 Ad Library 廣告連結"
                          value={brandIntelligence.adLibraryUrl}
                          onChange={(value) => updateBrandIntelligenceField("adLibraryUrl", value)}
                        />
                        <Button variant="outline" onClick={handleUseAdLibraryLinkAsReferenceDraft} disabled={!selectedCompetitor || !brandIntelligence.adLibraryUrl.trim()}>
                          加入素材庫草稿
                        </Button>
                      </div>
                    </div>
                  </Card>
                </div>

                <Card>
                  <div className="p-6">
                    <SectionTitle icon="frame" title="待加入素材" desc="用 Ad Library、上載素材或外部匯入後，素材會先成為 參考素材。" />
                    <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-white text-slate-500 shadow-sm">
                        <Icon name="frame" />
                      </div>
                      <div className="text-lg font-semibold text-slate-900">未有新素材預覽</div>
                      <p className="mt-2 text-sm leading-relaxed text-slate-500">
                        可用 Ad Library 連結、手動素材、上載圖片 / 影片或外部匯入加入素材庫。
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="space-y-4 xl:sticky xl:top-24 xl:self-start">
                <Card>
                  <div className="p-5">
                    <SectionTitle icon="frame" title="已加入素材庫的素材" desc="呢啲素材會進入 AI 分析、Creative Brief 同製作 Job。" />
                    {referenceAds.length ? (
                      <div className="mt-4 grid gap-3">
                        {referenceAds.slice(0, 6).map((reference) => (
                          <button
                            key={reference.id}
                            type="button"
                            onClick={() => {
                              setSelectedReferenceId(reference.id);
                              setActiveTab("references");
                            }}
                            className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left transition hover:border-slate-400 hover:shadow-sm"
                          >
                            <ReferencePreview reference={reference} className="h-20 w-24 shrink-0 rounded-2xl" />
                            <div className="min-w-0">
                              <div className="line-clamp-2 text-sm font-semibold text-slate-900">{reference.title || "未命名素材"}</div>
                              <div className="mt-1 text-xs text-slate-500">{reference.competitorBrand || reference.platform || "素材庫"}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                        未有素材。請先搜尋競品素材或貼上 Ad Library 廣告連結。
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          )}

          {false && activeTab === "materials" && (
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
              <div className="space-y-6">
                <Card>
                  <div className="p-6">
                    <SectionTitle icon="frame" title="素材收集工作區" desc="選定競爭品牌後，準備 Ad Library、手動素材、上載檔案或外部匯入來源。" />
                    {selectedCompetitor ? (
                      <div className="mt-5 rounded-3xl bg-slate-950 p-5 text-white">
                        <div className="text-xs font-semibold uppercase tracking-wider text-slate-300">Selected Competitor</div>
                        <div className="mt-2 text-2xl font-semibold">{selectedCompetitor.name}</div>
                        <div className="mt-1 text-sm text-slate-300">{selectedCompetitor.type}｜{getCampaignCompetitorDisplayStatus(selectedCompetitor.status)}</div>
                      </div>
                    ) : (
                      <div className="mt-5 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
                        請先於「競爭對手探索」選擇一個品牌。
                      </div>
                    )}
                  </div>
                </Card>

                <div className="grid gap-4 lg:grid-cols-2">
                  <Card>
                    <div className="p-5">
                      <SectionTitle icon="cloud" title="IG / FB 素材暫未自動接入" desc="可先用 Ad Library 連結、手動素材，或外部工具匯入。" />
                      <div className="mt-4 grid gap-3">
                        <TextInput
                          label="IG Page URL"
                          value={selectedCompetitor?.igUrl || ""}
                          onChange={(value) => selectedCompetitor && handleUpdateCompetitorField(selectedCompetitor.id, "igUrl", value)}
                        />
                        <TextInput
                          label="FB Page URL"
                          value={selectedCompetitor?.fbUrl || ""}
                          onChange={(value) => selectedCompetitor && handleUpdateCompetitorField(selectedCompetitor.id, "fbUrl", value)}
                        />
                        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-800">
                          之後可接入資料源或匯入流程。此版本請先用 Ad Library、手動素材或上載檔案建立素材。
                        </div>
                        <Button variant="outline" disabled>
                          匯入流程即將支援
                        </Button>
                      </div>
                    </div>
                  </Card>

                  <Card>
                    <div className="p-5">
                      <SectionTitle icon="target" title="Meta Ad Library 路線" desc="無需登入；先開搜尋，再貼回選中的廣告連結。" />
                      <div className="mt-4 grid gap-3">
                        <Button onClick={handleOpenSelectedCompetitorAdLibrary} disabled={!selectedCompetitor}>
                          <Icon name="cloud" /> 開啟 Ad Library 搜尋
                        </Button>
                        <TextInput
                          label="貼上 Ad Library 廣告連結"
                          value={brandIntelligence.adLibraryUrl}
                          onChange={(value) => updateBrandIntelligenceField("adLibraryUrl", value)}
                        />
                        <Button variant="outline" onClick={handleUseAdLibraryLinkAsReferenceDraft} disabled={!selectedCompetitor || !brandIntelligence.adLibraryUrl.trim()}>
                          加入素材庫草稿
                        </Button>
                      </div>
                    </div>
                  </Card>
                </div>

                <Card>
                  <div className="p-6">
                    <SectionTitle icon="frame" title="素材候選" desc="Ad Library、上載素材或外部匯入的素材會在這裡預覽。" />
                    <div className="mt-4 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-white text-slate-500 shadow-sm">
                        <Icon name="frame" />
                      </div>
                      <div className="text-lg font-semibold text-slate-900">未有素材預覽</div>
                      <p className="mt-2 text-sm leading-relaxed text-slate-500">
                        可先貼上 Ad Library 連結、手動加入素材，或準備外部匯入建立第一張 素材庫 參考。
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="space-y-4 xl:sticky xl:top-24 xl:self-start">
                <Card>
                  <div className="p-5">
                    <SectionTitle icon="frame" title="已加入素材庫的素材" desc="這些是由競爭對手素材、Ad Library 或手動建立的參考。" />
                    {referenceAds.length ? (
                      <div className="mt-4 grid gap-3">
                        {referenceAds.slice(0, 5).map((reference) => (
                          <button
                            key={reference.id}
                            type="button"
                            onClick={() => {
                              setSelectedReferenceId(reference.id);
                              setActiveTab("references");
                            }}
                            className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left transition hover:border-slate-400 hover:shadow-sm"
                          >
                            <ReferencePreview reference={reference} className="h-20 w-24 shrink-0 rounded-2xl" />
                            <div className="min-w-0">
                              <div className="line-clamp-2 text-sm font-semibold text-slate-900">{reference.title || "未命名素材"}</div>
                              <div className="mt-1 text-xs text-slate-500">{reference.competitorBrand || reference.platform || "未分類"}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                        未有素材。貼上 Ad Library 連結後可建立第一張。
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "input" && (
            <Card>
              <div className="p-6">
                <SectionTitle
                  icon="upload"
                  title="生成影片稿"
                  desc="選擇簡單版或詳細版；系統會套用 AI 分析、品牌療程及已勾選參考位。"
                />

                <div className="mb-6 grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
                  <div className="rounded-3xl bg-gradient-to-br from-[#fff2df] to-[#f5dded] p-4">
                    <div className="text-sm font-semibold text-[#5b3157]">輸出版本</div>
                    <div className="mt-3 grid gap-2">
                      {[
                        { id: "simple", label: "簡單版影片稿", desc: "Opening Hook、3-5 個 Scene Beats、Caption / VO、CTA" },
                        { id: "detailed", label: "詳細版影片稿", desc: "Storyboard、Shot Direction、字幕、VO、剪接及 Designer 備註" },
                      ].map((mode) => (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => setScriptDetailMode(mode.id)}
                          className={`rounded-2xl p-3 text-left transition ${
                            scriptDetailMode === mode.id ? "bg-[#7f315f] text-white shadow-lg" : "bg-white/70 text-[#5b3157] hover:bg-white"
                          }`}
                        >
                          <div className="text-sm font-semibold">{mode.label}</div>
                          <div className={`mt-1 text-xs leading-relaxed ${scriptDetailMode === mode.id ? "text-white/75" : "text-[#8a6d80]"}`}>{mode.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-3xl border border-rose-100 bg-white/75 p-4">
                    <div className="text-sm font-semibold text-[#321d38]">會套用的參考位</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedReferenceChecklist.map((item) => (
                        <span key={item} className="rounded-full bg-rose-50 px-3 py-1.5 text-xs font-bold text-[#7f315f]">
                          {item}
                        </span>
                      ))}
                    </div>
                    <div className="mt-4 text-xs leading-relaxed text-[#8a6d80]">
                      {creativeAnalysisPreview.title}｜{campaignContext.brandName || brandConfig.name}｜{campaignContext.treatmentName || form.treatment}
                    </div>
                  </div>
                </div>

                {!appliedReference && (
                  <div className="mb-6 rounded-3xl border border-amber-200 bg-amber-50 p-5">
                    <div className="text-sm font-semibold text-amber-900">建議先套用參考素材</div>
                    <div className="mt-1 text-sm leading-relaxed text-amber-800">
                      先由 素材庫 揀一張參考，系統會更容易整理 Hook、畫面角度同 Brief 方向。
                    </div>
                    <Button className="mt-4" variant="outline" onClick={() => setActiveTab("references")}>
                      返回參考素材庫
                    </Button>
                  </div>
                )}

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

                <div className="mt-6 rounded-[2rem] border border-rose-100 bg-[#fffaf3] p-5">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-[#321d38]">
                        {scriptDetailMode === "simple" ? "簡單版影片稿預覽" : "詳細版影片稿預覽"}
                      </div>
                      <div className="mt-1 text-xs text-[#8a6d80]">已套用參考位：{selectedChecklistSummary}</div>
                    </div>
                    <Button variant="outline" onClick={() => setActiveTab("roughcut")}>
                      查看初剪方案
                    </Button>
                  </div>
                  {scriptDetailMode === "simple" ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-3xl bg-white/75 p-4">
                        <div className="text-xs font-bold uppercase tracking-wider text-[#b45571]">Opening Hook</div>
                        <div className="mt-2 text-sm leading-7 text-[#5b3157]">{generated.rows?.[0]?.subtitleVo || generated.rows?.[0]?.subtitle || form.painPoints}</div>
                      </div>
                      <div className="rounded-3xl bg-white/75 p-4">
                        <div className="text-xs font-bold uppercase tracking-wider text-[#b45571]">CTA</div>
                        <div className="mt-2 text-sm leading-7 text-[#5b3157]">{form.cta || brandConfig.cta}</div>
                      </div>
                      <div className="md:col-span-2 rounded-3xl bg-white/75 p-4">
                        <div className="text-xs font-bold uppercase tracking-wider text-[#b45571]">3-5 Scene Beats</div>
                        <div className="mt-3 grid gap-2">
                          {generated.rows.slice(0, 5).map((row, index) => (
                            <div key={`${row.time}-${index}`} className="rounded-2xl bg-rose-50/70 px-4 py-3 text-sm text-[#5b3157]">
                              {index + 1}. {row.visual || row.purpose}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-3xl bg-white/75">
                      {generated.rows.slice(0, 5).map((row, index) => (
                        <div key={`${row.time}-${index}-detail`} className="grid gap-3 border-b border-rose-50 p-4 last:border-b-0 md:grid-cols-[90px_1fr_1fr]">
                          <div className="font-semibold text-[#7f315f]">{row.time}</div>
                          <div className="text-sm leading-7 text-[#5b3157]">
                            <div className="font-semibold">Shot Direction</div>
                            <div>{row.visual}</div>
                            <div className="mt-2 text-xs text-[#8a6d80]">{row.note}</div>
                          </div>
                          <div className="text-sm leading-7 text-[#5b3157]">
                            <div className="font-semibold">On-screen / VO</div>
                            <div>{row.subtitleVo || [row.subtitle, row.vo].filter(Boolean).join(" / ")}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Button onClick={handleGenerateWithAi} disabled={appIsBusy}>
                    <Icon name="magic" /> {aiStatus === "loading" ? "AI 生成稿中..." : "生成影片稿"}
                  </Button>
                  <Button variant="outline" onClick={() => setActiveTab("roughcut")} disabled={!hasGeneratedBrief}>
                    <Icon name="frame" /> 查看初剪方案
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {false && activeTab === "analysis" && (
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
                      請返回「新增創作」上載影片，或直接用品牌資料及同事 brief 生成稿。
                    </p>
                    <Button className="mt-4" onClick={() => setActiveTab("input")}>
                      返回 Creative Brief
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


          {false && activeTab === "analysis" && (
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
            <div className="space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm lg:p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      <Icon name="frame" className="h-4 w-4 text-sm" /> 參考素材
                    </div>
                    <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">已選入 素材庫 的素材</h1>
                    <p className="mt-1 text-sm text-slate-500">這裡管理由競爭對手素材、Ad Library 或手動加入的素材，之後可做 AI 分析同 Brief。</p>
                  </div>

                  <div className="flex w-full flex-col gap-2 xl:w-[720px]">
                    <div className="flex gap-2">
                      <input
                        value={discoveryKeyword}
                        onChange={(event) => setDiscoveryKeyword(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") handleGenerateDiscoveryPlan();
                        }}
                        placeholder="搜尋服務、痛點、競爭品牌，例如：頭皮護理"
                        className="min-h-13 w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 text-base font-semibold text-slate-950 outline-none focus:border-slate-500 focus:bg-white focus:ring-4 focus:ring-slate-100"
                      />
                      <Button className="min-h-13 shrink-0 px-5" onClick={handleGenerateDiscoveryPlan}>
                        <Icon name="magic" /> 搜尋
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {[
                        ["競爭品牌", discoveryCompetitor, setDiscoveryCompetitor],
                        ["地區", discoveryCountry, setDiscoveryCountry],
                        ["行業", discoveryIndustry, setDiscoveryIndustry],
                        ["目標", discoveryObjective, setDiscoveryObjective],
                        ["優惠", discoveryOfferType, setDiscoveryOfferType],
                      ].map(([label, value, setter]) => (
                        <label key={label} className="flex min-w-[140px] items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-500">
                          <span className="shrink-0 font-semibold">{label}</span>
                          <input
                            value={value}
                            onChange={(event) => setter(event.target.value)}
                            className="min-w-0 flex-1 bg-transparent text-xs font-medium text-slate-700 outline-none"
                          />
                        </label>
                      ))}
                      <button type="button" onClick={handleClearDiscovery} className="rounded-full px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100">
                        清除
                      </button>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Button onClick={() => setReferenceCaptureOpen((open) => !open)}>
                      <Icon name="plus" /> {referenceCaptureOpen ? "收起新增" : "新增素材"}
                    </Button>
                    <Button variant="outline" onClick={handleUseDiscoveryAsReferenceDraft}>
                      用搜尋方向填草稿
                    </Button>
                  </div>
                </div>
              </div>

              {referenceCaptureOpen && (
                <Card className="border-slate-300">
                  <div className="p-4 lg:p-5">
                    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                      <SectionTitle icon="plus" title="新增素材" desc="選擇來源：連結、影片、圖片或手動建立。全部都會儲存成 素材庫 參考卡。" />
                      <Button variant="ghost" onClick={() => setReferenceCaptureOpen(false)}>
                        收起
                      </Button>
                    </div>
                    <div className="mb-5 grid gap-2 md:grid-cols-4">
                      {REFERENCE_SOURCE_OPTIONS.map((option) => {
                        const active = (referenceDraft.sourceType || "url") === option.id;
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => handleReferenceSourceTypeChange(option.id)}
                            className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                              active ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                            }`}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>

                    <div className="mb-5 grid gap-4 lg:grid-cols-[minmax(0,360px)_1fr]">
                      <ReferencePreview
                        reference={referenceDraft}
                        localPreviewUrl={referenceDraft.mediaType === "video" ? referenceSourceLocalPreviewUrl : ""}
                        showControls
                        className="aspect-video rounded-3xl"
                      />
                      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                        <div className="mb-3 text-sm font-semibold text-slate-900">來源資料</div>
                        {(referenceDraft.sourceType || "url") === "url" && (
                          <div className="grid gap-3">
                            <TextInput label="廣告 / 參考連結" value={referenceDraft.sourceUrl} onChange={handleReferenceSourceUrlChange} />
                            <div className="flex flex-wrap gap-2">
                              <Button onClick={handleExtractReferenceUrlMetadata} disabled={referenceSourceStatus === "loading"}>
                                {referenceSourceStatus === "loading" ? "讀取中..." : "讀取連結資料"}
                              </Button>
                              <Button variant="outline" onClick={() => handlePreviewMetaSearch(referenceDraft.sourceUrl, referenceDraft.title || "參考連結")} disabled={!referenceDraft.sourceUrl}>
                                預覽
                              </Button>
                            </div>
                          </div>
                        )}
                        {referenceDraft.sourceType === "video" && (
                          <div className="grid gap-3">
                            <input
                              type="file"
                              accept="video/mp4,video/quicktime,video/webm,video/*"
                              onChange={(event) => handleReferenceSourceFileSelect(event, "video")}
                              className="text-sm text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-slate-950 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white"
                            />
                            <p className="text-xs leading-relaxed text-slate-500">影片會先成為素材；之後可以 AI 拆解，再生成 Brief。</p>
                          </div>
                        )}
                        {referenceDraft.sourceType === "image" && (
                          <div className="grid gap-3">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(event) => handleReferenceSourceFileSelect(event, "image")}
                              className="text-sm text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-slate-950 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white"
                            />
                            <p className="text-xs leading-relaxed text-slate-500">圖片會直接變成參考卡預覽；不用分開走截圖流程。</p>
                          </div>
                        )}
                        {referenceDraft.sourceType === "manual" && (
                          <p className="text-sm leading-relaxed text-slate-500">手動建立適合線下靈感、Designer notes 或沒有連結的素材。</p>
                        )}
                        {referenceSourceMessage && (
                          <div className={`mt-3 rounded-2xl border p-3 text-xs leading-relaxed ${
                            referenceSourceStatus === "error"
                              ? "border-amber-200 bg-amber-50 text-amber-800"
                              : "border-slate-200 bg-white text-slate-600"
                          }`}>
                            {referenceSourceMessage}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-3">
                      <TextInput label="標題" value={referenceDraft.title} onChange={(value) => handleReferenceDraftChange("title", value)} placeholder={createReferenceTitle(referenceDraft)} />
                      <SelectInput label="平台" value={referenceDraft.platform} onChange={(value) => handleReferenceDraftChange("platform", value)} options={["Facebook", "Meta Ad Library", "Instagram", "TikTok", "YouTube", "Video", "Image", "Manual", "Other", "Screenshot"]} />
                      <TextInput label="素材板" value={referenceDraft.board} onChange={(value) => handleReferenceDraftChange("board", value)} />
                      <TextInput label="競爭品牌" value={referenceDraft.competitorBrand} onChange={(value) => handleReferenceDraftChange("competitorBrand", value)} />
                      <TextInput label="優惠" value={referenceDraft.offer} onChange={(value) => handleReferenceDraftChange("offer", value)} />
                      <TextInput label="內容角度" value={referenceDraft.angle} onChange={(value) => handleReferenceDraftChange("angle", value)} />
                      <TextInput label="Hook 備註" value={referenceDraft.hookNotes} onChange={(value) => handleReferenceDraftChange("hookNotes", value)} textarea rows={3} />
                      <TextInput label="畫面備註" value={referenceDraft.visualNotes} onChange={(value) => handleReferenceDraftChange("visualNotes", value)} textarea rows={3} />
                      <TextInput label="製作備註" value={referenceDraft.productionNotes} onChange={(value) => handleReferenceDraftChange("productionNotes", value)} textarea rows={3} />
                      <div className="lg:col-span-2">
                        <TextInput label="標籤" value={referenceDraft.tags} onChange={(value) => handleReferenceDraftChange("tags", value)} />
                      </div>
                      <div className="flex items-end">
                        <Button className="w-full" onClick={handleSaveReferenceAd}>
                          <Icon name="plus" /> 儲存素材卡
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              <div className="grid min-h-[calc(100vh-220px)] gap-4 xl:grid-cols-[240px_minmax(0,1fr)_380px] 2xl:grid-cols-[260px_minmax(0,1fr)_420px]">
                <div className="space-y-4 xl:sticky xl:top-24 xl:self-start">
                  <Card>
                    <div className="p-4">
                      <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">素材板</div>
                      <div className="space-y-1.5">
                        {referenceBoardOptions.map((board) => (
                          <button
                            key={board.id}
                            type="button"
                            onClick={() => setReferenceBoardFilter(board.id)}
                            className={`flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-left text-sm transition ${
                              referenceBoardFilter === board.id ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            <span className="font-medium">{board.label}</span>
                            <span className={`rounded-full px-2 py-0.5 text-xs ${referenceBoardFilter === board.id ? "bg-white/15 text-white" : "bg-slate-100 text-slate-500"}`}>
                              {board.count}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </Card>

                  <Card>
                    <div className="p-4">
                      <div className="mb-3 text-sm font-semibold text-slate-900">流程</div>
                      <div className="space-y-2 text-sm text-slate-600">
                        <div className="rounded-2xl bg-slate-50 px-3 py-2">1. 新增素材</div>
                        <div className="rounded-2xl bg-slate-50 px-3 py-2">2. AI 拆解</div>
                        <div className="rounded-2xl bg-slate-50 px-3 py-2">3. 生成創意 Brief</div>
                        <div className="rounded-2xl bg-slate-50 px-3 py-2">4. 建立製作 Job</div>
                      </div>
                    </div>
                  </Card>

                  <Card>
                    <details className="group p-4">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-slate-900">
                        <span className="flex items-center gap-2"><Icon name="upload" /> 補充素材</span>
                        <span className="text-xs text-slate-400 group-open:hidden">展開</span>
                        <span className="hidden text-xs text-slate-400 group-open:inline">收起</span>
                      </summary>
                      <div className="mt-3 grid gap-3">
                        <p className="text-xs leading-relaxed text-slate-500">截圖上載只作 fallback；主要流程仍然由參考素材開始。</p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleReferenceScreenshotSelect}
                          className="text-xs text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-slate-950 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white"
                        />
                        {referenceScreenshotPreviewUrl && (
                          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                            <img src={referenceScreenshotPreviewUrl} alt="截圖參考預覽" className="max-h-48 w-full object-contain" />
                            <div className="flex flex-wrap gap-2 border-t border-slate-200 bg-white p-3">
                              <Button onClick={handleAnalyzeReferenceScreenshot} disabled={referenceScreenshotAnalysisStatus === "loading"}>
                                {referenceScreenshotAnalysisStatus === "loading" ? "分析中..." : "AI 分析截圖"}
                              </Button>
                              <Button variant="ghost" onClick={handleClearReferenceScreenshot}>
                                清除
                              </Button>
                            </div>
                          </div>
                        )}
                        {referenceScreenshotAnalysisError && (
                          <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-xs leading-relaxed text-red-700">
                            {referenceScreenshotAnalysisError}
                          </div>
                        )}
                        {referenceScreenshotAnalysis && (
                          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs leading-relaxed text-emerald-900">
                            <div className="font-semibold">AI 拆解結果</div>
                            <div className="mt-2 grid gap-1">
                              {referenceScreenshotAnalysis.title && <div>標題：{referenceScreenshotAnalysis.title}</div>}
                              {referenceScreenshotAnalysis.angle && <div>角度：{referenceScreenshotAnalysis.angle}</div>}
                              {referenceScreenshotAnalysis.tags && <div>標籤：{referenceScreenshotAnalysis.tags}</div>}
                            </div>
                            <Button
                              className="mt-3"
                              variant="outline"
                              onClick={() => {
                                handleApplyScreenshotAnalysisToReferenceDraft();
                                setReferenceCaptureOpen(true);
                              }}
                            >
                              套用到草稿
                            </Button>
                          </div>
                        )}
                      </div>
                    </details>
                  </Card>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">參考卡片</div>
                      <div className="mt-1 text-xs text-slate-500">
                        顯示 {filteredReferenceAds.length} / {referenceAds.length} 個參考
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" onClick={() => setReferenceCaptureOpen(true)}>
                        <Icon name="plus" /> 新增素材
                      </Button>
                      <Button variant="outline" onClick={handleGenerateDiscoveryPlan}>
                        生成搜尋方向
                      </Button>
                    </div>
                  </div>

                  {discoveryPlan && (
                    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 p-4">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">搜尋方向</div>
                          <div className="mt-1 max-w-3xl text-xs leading-relaxed text-slate-500">{discoveryPlan.searchBrief}</div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {discoveryPlan.suggestedTags.slice(0, 5).map((tag) => (
                            <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-3 overflow-x-auto p-4">
                        {[
                          ...discoveryPlan.primaryQueries,
                          ...discoveryPlan.angleQueries,
                          ...discoveryPlan.competitorQueries,
                        ].slice(0, 10).map((query) => {
                          const metaUrl = buildMetaAdLibrarySearchUrl(query, discoveryCountry);
                          const facebookUrl = buildFacebookSearchUrl(query);
                          return (
                            <div key={query} className="min-w-[260px] rounded-2xl border border-slate-200 bg-slate-50 p-3">
                              <div className="line-clamp-2 text-sm font-semibold text-slate-950">{query}</div>
                              <div className="mt-1 text-xs text-slate-500">Meta / Facebook 搜尋候選</div>
                              <div className="mt-3 flex flex-wrap gap-2">
                                <a href={metaUrl} target="_blank" rel="noreferrer" className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800">
                                  Meta
                                </a>
                                <a href={facebookUrl} target="_blank" rel="noreferrer" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                                  Facebook
                                </a>
                                <button type="button" onClick={() => handlePreviewMetaSearch(metaUrl, query)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                                  預覽
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReferenceDraft((current) => ({
                                      ...current,
                                      title: query,
                                      platform: "Meta Ad Library",
                                      sourceType: "url",
                                      mediaType: "link",
                                      sourceUrl: metaUrl,
                                      competitorBrand: discoveryCompetitor || current.competitorBrand,
                                      targetBrand: selectedBrand || current.targetBrand || "",
                                      offer: discoveryOfferType || current.offer,
                                      angle: "探索候選",
                                      hookNotes: `搜尋字：${query}`,
                                      productionNotes: discoveryPlan.searchBrief,
                                      tags: discoveryPlan.suggestedTags.join(", "),
                                      board: current.board || "搜尋方向",
                                      status: current.status || "Draft",
                                    }));
                                    setReferenceCaptureOpen(true);
                                  }}
                                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                  填草稿
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {filteredReferenceAds.length ? (
                    <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                      {filteredReferenceAds.map((reference) => {
                        const active = selectedReference?.id === reference.id;
                        const applied = appliedReferenceId === reference.id;
                        const statusBadge = getReferenceStatusBadge(reference, {
                          appliedReferenceId,
                          hasBrief: hasGeneratedBrief,
                          jobs: contentJobs,
                        });
                        const tagList = String(reference.tags || "")
                          .split(",")
                          .map((tag) => tag.trim())
                          .filter(Boolean)
                          .slice(0, 4);

                        return (
                          <button
                            key={reference.id}
                            type="button"
                            onClick={() => setSelectedReferenceId(reference.id)}
                            className={`group flex h-full flex-col overflow-hidden rounded-3xl border bg-white text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl ${
                              active ? "border-slate-950 shadow-xl ring-2 ring-slate-950/10" : "border-slate-200"
                            }`}
                          >
                            <ReferencePreview reference={reference} className="aspect-[4/3] w-full rounded-t-3xl" />
                            <div className="flex flex-1 flex-col p-4">
                              <div className="mb-3 flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="line-clamp-2 min-h-10 text-sm font-semibold text-slate-950">{reference.title || "未命名參考"}</div>
                                  <div className="mt-1 text-xs text-slate-500">
                                    {[reference.platform, reference.competitorBrand, formatJobDate(reference.createdAt)].filter(Boolean).join(" · ") || "未分類"}
                                  </div>
                                </div>
                                <span className={`shrink-0 rounded-full border px-2 py-1 text-xs font-semibold ${statusBadge.className}`}>
                                  {applied ? "已套用" : statusBadge.label}
                                </span>
                              </div>
                              <div className="space-y-1 text-xs text-slate-600">
                                {(reference.offer || reference.angle) && <div className="line-clamp-2">{reference.offer || reference.angle}</div>}
                                {reference.offer && reference.angle && <div className="line-clamp-2 text-slate-500">{reference.angle}</div>}
                              </div>
                              {tagList.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-1.5">
                                  {tagList.map((tag) => (
                                    <span key={`${reference.id}-${tag}`} className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                              <div className="mt-auto flex flex-wrap gap-1.5 pt-3">
                                <span className="rounded-full bg-slate-950 px-2 py-1 text-xs font-semibold text-white">
                                  {reference.board || "參考素材"}
                                </span>
                                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                                  {getReferenceSourceLabel(reference)}
                                </span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    referenceAds.length === 0 ? (
                      <div className="overflow-hidden rounded-3xl border border-dashed border-slate-300 bg-white shadow-sm">
                        <div className="mx-auto max-w-2xl px-6 py-14 text-center">
                          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-950 text-white shadow-lg shadow-slate-900/10">
                            <Icon name="frame" />
                          </div>
                          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">建立第一張素材</h2>
                          <p className="mt-3 text-sm leading-relaxed text-slate-500">
                            用 URL、影片、圖片或手動備註建立參考卡。素材會先入庫，再做 AI 拆解、Brief 同製作 Job。
                          </p>
                          <div className="mt-6">
                            <Button onClick={() => setReferenceCaptureOpen(true)}>
                              <Icon name="plus" /> 新增第一張素材
                            </Button>
                          </div>
                          <p className="mt-4 text-xs text-slate-400">不需要先上載影片；所有來源都會先變成 素材庫 參考。</p>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
                        <div className="font-semibold text-slate-800">未有符合條件的參考</div>
                        <div className="mt-2">可以清除搜尋 / 素材板篩選，或新增另一張素材。</div>
                        <div className="mt-5 flex justify-center gap-2">
                          <Button variant="outline" onClick={() => setReferenceBoardFilter("all")}>查看全部</Button>
                          <Button onClick={() => setReferenceCaptureOpen(true)}>新增素材</Button>
                        </div>
                      </div>
                    )
                  )}

                  {embeddedPreviewUrl && (
                    <Card>
                      <div className="p-4 md:p-5">
                        <div className="mb-3 flex flex-wrap items-start justify-between gap-4">
                          <SectionTitle icon="frame" title="搜尋預覽" desc={`${embeddedPreviewType === "meta" ? "Meta Ad Library" : "Facebook Search"} - ${embeddedPreviewTitle}`} />
                          <Button variant="outline" onClick={handleClearEmbeddedPreview}>
                            清除預覽
                          </Button>
                        </div>
                        <div className="mb-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">
                          {embeddedPreviewNotice || "如果預覽空白或被平台封鎖，請用開新分頁查看。此版本不會爬取 Meta 或 Facebook 內容。"}
                        </div>
                        <div className="mb-3 flex flex-wrap gap-2">
                          <a href={embeddedPreviewUrl} target="_blank" rel="noreferrer" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                            開新分頁
                          </a>
                          <Button
                            variant="outline"
                            onClick={() => {
                              handleReferenceSourceUrlChange(embeddedPreviewUrl);
                              setReferenceCaptureOpen(true);
                            }}
                          >
                            填入參考連結
                          </Button>
                        </div>
                        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
                          <iframe
                            title={`搜尋預覽 - ${embeddedPreviewTitle}`}
                            src={embeddedPreviewUrl}
                            className="h-[700px] w-full bg-white"
                            sandbox="allow-forms allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
                            referrerPolicy="strict-origin-when-cross-origin"
                          />
                        </div>
                      </div>
                    </Card>
                  )}
                </div>

                <aside className="xl:sticky xl:top-24 xl:self-start">
                  <Card>
                    <div className="p-4">
                      <SectionTitle icon="doc" title="已選參考" desc={selectedReference ? "拆解、套用及交俾製作" : "請先選擇一張參考卡"} />
                      {selectedReference ? (
                        <div className="space-y-4">
                          <ReferencePreview
                            reference={selectedReference}
                            showControls
                            className="aspect-video rounded-3xl"
                            emptyTitle="未有素材預覽"
                            emptyDescription="可透過 Ad Library、上載素材或外部匯入補回。"
                          />
                          <div className="rounded-3xl bg-slate-950 p-4 text-white">
                            <div className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                              {[selectedReference.platform, getReferenceSourceLabel(selectedReference)].filter(Boolean).join(" · ")}
                            </div>
                            <div className="mt-2 text-xl font-semibold">{selectedReference.title || "未命名參考"}</div>
                            <div className="mt-2 text-sm text-slate-300">{selectedReference.competitorBrand || "未填競爭品牌"}</div>
                          </div>

                          <div className="rounded-3xl border border-blue-100 bg-blue-50/70 p-4">
                            <div className="mb-3 flex items-center justify-between gap-3">
                              <div className="text-sm font-semibold text-slate-950">下一步建議</div>
                              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-blue-700 shadow-sm">
                                {selectedReferenceGuidance.stage}
                              </span>
                            </div>
                            <div className="grid gap-2 text-sm text-slate-700">
                              <div><span className="font-semibold text-slate-900">缺少：</span>{selectedReferenceGuidance.missing}</div>
                              <div><span className="font-semibold text-slate-900">建議：</span>{selectedReferenceGuidance.next}</div>
                            </div>
                            <Button className="mt-4 w-full" onClick={handleSelectedReferenceNextAction} disabled={analysisStatus === "analyzing"}>
                              {analysisStatus === "analyzing" && selectedReferenceGuidance.action === "deconstruct" ? "AI 拆解中..." : selectedReferenceGuidance.cta}
                            </Button>
                          </div>

                          <div className="grid gap-3 text-sm">
                            {[
                              ["來源", selectedReference.sourceUrl],
                              ["素材 URL", selectedReference.assetUrl],
                              ["素材板", selectedReference.board],
                              ["狀態", selectedReference.status],
                              ["優惠", selectedReference.offer],
                              ["內容角度", selectedReference.angle],
                              ["Hook 備註", selectedReference.hookNotes],
                              ["畫面備註", selectedReference.visualNotes],
                              ["Caption 備註", selectedReference.captionNotes],
                              ["製作備註", selectedReference.productionNotes],
                              ["標籤", selectedReference.tags],
                            ].map(([label, value]) =>
                              value ? (
                                <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                                  <div className="mb-1 text-xs font-semibold text-slate-400">{label}</div>
                                  {label === "來源" || label === "素材 URL" ? (
                                    <a href={value} target="_blank" rel="noreferrer" className="break-all text-slate-700 underline decoration-slate-300 underline-offset-4">
                                      {value}
                                    </a>
                                  ) : (
                                    <div className="whitespace-pre-wrap text-slate-700">{value}</div>
                                  )}
                                </div>
                              ) : null
                            )}
                          </div>

                          <div className="grid gap-2">
                            <Button variant="outline" onClick={() => handleDeconstructReference(selectedReference)} disabled={analysisStatus === "analyzing"}>
                              AI 拆解
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                handleApplyReferenceToDraft(selectedReference.id);
                                setActiveTab("input");
                              }}
                            >
                              套用成創意方向
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                handleApplyReferenceToDraft(selectedReference.id);
                                setActiveTab("brief");
                              }}
                            >
                              生成 Brief
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                handleApplyReferenceToDraft(selectedReference.id);
                                setActiveTab("jobs");
                              }}
                            >
                              建立製作 Job
                            </Button>
                          </div>

                          <details className="rounded-2xl border border-slate-200 bg-white p-3">
                            <summary className="cursor-pointer text-xs font-semibold text-slate-500">更多操作</summary>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {selectedReference.sourceUrl && (
                                <a href={selectedReference.sourceUrl} target="_blank" rel="noreferrer" className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                                  開啟來源
                                </a>
                              )}
                              <Button variant="outline" onClick={() => handleCopyReferenceBrief(selectedReference)}>
                                複製 Brief
                              </Button>
                              <Button variant="danger" onClick={() => handleDeleteReferenceAd(selectedReference.id)}>
                                刪除
                              </Button>
                            </div>
                          </details>

                          <details className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                            <summary className="cursor-pointer text-xs font-semibold text-slate-500">快速編輯</summary>
                            <div className="mt-3 grid gap-3">
                              <TextInput label="標題" value={selectedReference.title || ""} onChange={(value) => updateReferenceAd(selectedReference.id, { title: value })} />
                              <TextInput label="優惠" value={selectedReference.offer || ""} onChange={(value) => updateReferenceAd(selectedReference.id, { offer: value })} />
                              <TextInput label="內容角度" value={selectedReference.angle || ""} onChange={(value) => updateReferenceAd(selectedReference.id, { angle: value })} />
                              <TextInput label="標籤" value={selectedReference.tags || ""} onChange={(value) => updateReferenceAd(selectedReference.id, { tags: value })} />
                            </div>
                          </details>
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                          從中間參考素材庫選擇一張參考卡。
                        </div>
                      )}
                    </div>
                  </Card>
                </aside>
              </div>
            </div>
          )}

          {activeTab === "jobs" && (
            <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
              <div className="space-y-6">
                <Card>
                  <div className="p-6">
                    <SectionTitle icon="layers" title="建立製作 Job" desc="Brief 完成後，將內容交俾 Designer 排期、製作、提交同 Review。" />
                    <div className="grid gap-4">
                      <TextInput
                        label="Job 標題"
                        value={jobDraft.draftTitle}
                        onChange={(value) => handleJobDraftChange("draftTitle", value)}
                        placeholder={createJobTitle({ brandCode: selectedBrand, brandName: campaignContext.brandName || brandConfig.name, form })}
                      />
                      <SelectInput
                        label="內容類型"
                        value={jobDraft.contentType}
                        onChange={(value) => handleJobDraftChange("contentType", value)}
                        options={ALYSSA_CONTENT_TYPE_OPTIONS}
                      />
                      <SelectInput
                        label="優先次序"
                        value={jobDraft.priority}
                        onChange={(value) => handleJobDraftChange("priority", value)}
                        options={JOB_PRIORITY_OPTIONS}
                      />
                      <SelectInput
                        label="負責 Designer"
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
                        label="Marketing 備註"
                        value={jobDraft.marketerNotes}
                        onChange={(value) => handleJobDraftChange("marketerNotes", value)}
                        textarea
                        rows={4}
                      />
                      <Button onClick={handleSaveAsContentJob}>
                        <Icon name="layers" /> 建立製作 Job
                      </Button>
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="p-6">
                    <SectionTitle icon="target" title="Job 狀態總覽" desc="之後可延伸為 assign → accept → produce → submit → review。" />
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
                        未有製作 Job。完成 Brief 後，可以建立第一個 Designer Job。
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
                <SectionTitle icon="db" title="品牌資料庫" desc="在這裡新增 / 修改品牌設定。資料會保存在此瀏覽器；正式團隊版會改用共享資料庫。" />

                <div className="mb-6 flex flex-wrap gap-3">
                  <Button onClick={addBrand}>
                    <Icon name="plus" /> 新增品牌
                  </Button>
                  <Button variant="outline" onClick={resetBrandDatabase}>
                    清除本機品牌測試資料
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
                            {normalized.name}
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
                          {editingBrand.name || "未命名品牌"}
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
                        <div className="hidden">
                          <TextInput label="Internal ID" value={editingBrand.code} onChange={(value) => updateEditingBrand("code", value.toUpperCase())} />
                        </div>
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
