"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ReferenceRecorder } from "../footage/reference-recorder";

const REFERENCE_ADS_STORAGE_KEY = "alyssaCreativeSop.referenceAds.v1";
const CONTENT_JOBS_STORAGE_KEY = "alyssaCreativeSop.contentJobs.v1";
const REMIX_SESSION_STORAGE_KEY = "alyssaCreativeSop.remixSession.v2";

const TREATMENTS = [
  {
    id: "dep",
    name: "DEP 無針水光 Combo",
    price: "$588",
    audience: "乾燥、暗啞、缺水、妝前唔貼服，想做溫和補水修護嘅客人",
    painPoints: "肌膚缺水、暗啞、粗糙、上妝唔貼服",
    sellingPoints: "DEP 儀器導入配合修護精華，重點係補水、柔滑同改善整體膚況觀感",
    safeLanguage: "使用補水、修護、柔滑、提升水潤感等保守表達，避免醫療或永久效果聲稱",
  },
  {
    id: "btl",
    name: "BTL EXION 全面膠原提拉",
    price: "$780",
    audience: "關注輪廓、眼周、面部線條同整體精神感嘅客人",
    painPoints: "輪廓感唔夠俐落、眼周疲態、面部線條睇落鬆散",
    sellingPoints: "以儀器溫感護理面部及眼周，突出自然輪廓管理、膚質及精神感",
    safeLanguage: "使用輪廓管理、提拉感、緊緻觀感、膠原護理等字眼，避免保證式醫療聲稱",
  },
  {
    id: "gentle",
    name: "柔清舒敏面部護理",
    price: "$388",
    audience: "皮膚容易不穩、泛紅、乾燥，想做溫和清潔同舒緩護理嘅客人",
    painPoints: "皮膚容易繃緊、乾燥、敏感觀感、清潔後不適",
    sellingPoints: "以溫和清潔、舒緩及修護流程為主，重點係乾淨、柔和同舒服感",
    safeLanguage: "使用舒緩、溫和、修護、改善不適觀感，避免治療敏感或炎症等醫療聲稱",
  },
  {
    id: "slite",
    name: "S-Lite 水感輕腿管理",
    price: "$588",
    audience: "長時間坐低、企得耐、雙腿容易沉重繃緊或浮腫觀感嘅客人",
    painPoints: "小腿沉重、繃緊、浮腫感、線條睇落唔夠俐落",
    sellingPoints: "儀器溫感護理配合專業人手穴位按摩，主打放鬆、舒緩同輕腿線條管理",
    safeLanguage: "使用舒緩沉重、放鬆繃緊、改善浮腫觀感、輕盈感，避免排毒或醫療聲稱",
  },
];

const ANGLES = [
  {
    id: "pain",
    name: "痛點共鳴版",
    description: "由日常困擾、尷尬或不舒服感切入，先令人覺得『講緊我』。",
  },
  {
    id: "contrast",
    name: "反差／效果觀感版",
    description: "用左右、前後、狀態反差或視覺線條突出改變感，但避免誇大承諾。",
  },
  {
    id: "process",
    name: "專業過程版",
    description: "用儀器、手法、步驟同專業細節建立可信感。",
  },
  {
    id: "offer",
    name: "價值／Offer 版",
    description: "由療程組合、步驟、價錢同新客價值切入，重點係轉化。",
  },
];

const MATERIAL_STATUS_OPTIONS = [
  "未開始搵",
  "已搵到",
  "用替代片",
  "需要補拍",
  "無法提供",
];

function loadReferences() {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(REFERENCE_ADS_STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadJobs() {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(CONTENT_JOBS_STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeReferences(items) {
  return items
    .filter((item) => item?.mediaType === "video" && item?.assetUrl)
    .sort((a, b) => new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime());
}

function formatVersionBrief(version, treatment, reference) {
  const rows = Array.isArray(version?.timeline) ? version.timeline : [];
  return [
    `${version?.name || "影片版本"}｜${treatment?.name || ""} ${treatment?.price || ""}`,
    `Reference：${reference?.title || ""}`,
    `切入點：${version?.angle || ""}`,
    `Hook：${version?.hook || ""}`,
    `設計方向：${version?.designDirection || ""}`,
    "",
    ...rows.flatMap((row) => [
      `${row?.time || ""}｜${row?.role || ""}`,
      `Reference 功能：${row?.referenceIdea || ""}`,
      `最終素材：${row?.ownFootage || ""}`,
      `素材狀態：${row?.sourceStatus || ""}`,
      `VO 決定：${row?.voRequired || ""}｜${row?.voReason || ""}`,
      `字幕／VO：${row?.subtitleVo || ""}`,
      `畫面設計：${row?.visualDesign || ""}`,
      `Editor 指令：${row?.editorNote || ""}`,
      "",
    ]),
    `Designer Brief：${version?.designerBrief || ""}`,
    `Caption：${version?.caption || ""}`,
    `CTA：${version?.cta || ""}`,
  ].join("\n");
}

function saveVersionAsJob({ version, treatment, reference }) {
  const now = new Date().toISOString();
  const storyboardRows = (Array.isArray(version?.timeline) ? version.timeline : []).map((row) => ({
    time: row?.time || "",
    materialType: row?.sourceStatus || "現有療程片／替代片／文字動畫",
    referenceMapping: row?.referenceIdea || "",
    suggestedFileName: "",
    visual: `${row?.ownFootage || ""}\n${row?.visualDesign || ""}`.trim(),
    subtitleVo: row?.subtitleVo || "",
    subtitle: row?.subtitleVo || "",
    vo: row?.voRequired === "唔需要" ? "" : row?.subtitleVo || "",
    purpose: row?.role || "",
    designerNote: `${row?.editorNote || ""}\nVO：${row?.voRequired || ""}｜${row?.voReason || ""}`.trim(),
  }));

  const job = {
    id: `content-job-remix-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: `IB｜${treatment?.name || "療程"}｜${version?.name || "Remix Version"}`,
    status: "Draft",
    priority: "Normal",
    contentType: "Reels / Short Video",
    assignedDesigner: "Unassigned",
    deadline: "",
    marketerNotes: `由 Reference Remix Studio 兩階段流程生成。Reference：${reference?.title || ""}`,
    brandCode: "IB",
    brandName: "Ineffable Beauty",
    treatment: treatment?.name || "",
    offer: treatment?.price || "",
    creativeAngle: version?.angle || "",
    hook: version?.hook || "",
    designerBrief: version?.designerBrief || "",
    caption: version?.caption || "",
    storyboardRows,
    referenceId: reference?.id || "",
    referenceUrl: reference?.sourceUrl || reference?.assetUrl || "",
    outputLink: "",
    createdAt: now,
    updatedAt: now,
  };

  const jobs = loadJobs();
  window.localStorage.setItem(CONTENT_JOBS_STORAGE_KEY, JSON.stringify([job, ...jobs]));
  window.dispatchEvent(new Event("alyssa-content-jobs-updated"));
  return job;
}

function StepBadge({ number, title, active = false }) {
  return (
    <div className={`flex min-w-[190px] items-center gap-3 rounded-2xl border px-4 py-3 ${active ? "border-indigo-500 bg-indigo-50" : "border-slate-200 bg-white"}`}>
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${active ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"}`}>
        {number}
      </span>
      <span className="text-sm font-semibold text-slate-800">{title}</span>
    </div>
  );
}

function SectionTitle({ eyebrow, title, description }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{title}</h2>
      {description && <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">{description}</p>}
    </div>
  );
}

function ReferenceCard({ reference, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(reference.id)}
      className={`overflow-hidden rounded-3xl border bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${selected ? "border-indigo-500 ring-4 ring-indigo-100" : "border-slate-200"}`}
    >
      <div className="relative aspect-video bg-slate-950">
        <video src={reference.assetUrl} className="h-full w-full object-contain" muted preload="metadata" />
        <span className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${selected ? "bg-indigo-600 text-white" : "bg-white/90 text-slate-600"}`}>
          {selected ? "✓" : "+"}
        </span>
      </div>
      <div className="p-4">
        <p className="line-clamp-2 text-sm font-semibold text-slate-950">{reference.title || "未命名 Reference"}</p>
        <p className="mt-1 text-xs text-slate-500">{reference.platform || "Recorded Reference"}</p>
      </div>
    </button>
  );
}

function ReferenceDNA({ data }) {
  if (!data) return null;
  const structure = Array.isArray(data.storyStructure) ? data.storyStructure : [];
  const borrow = Array.isArray(data.whatToBorrow) ? data.whatToBorrow : [];
  const avoid = Array.isArray(data.whatNotToCopy) ? data.whatNotToCopy : [];

  return (
    <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <SectionTitle
        eyebrow="Reference DNA"
        title="AI 先拆出原片真正有效嘅創作方法"
        description="借 Hook、節奏、構圖同敘事功能；唔會照抄競品品牌、原句或 claim。"
      />
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[
          ["核心 Idea", data.coreIdea],
          ["Hook 機制", data.hookMechanism],
          ["視覺規律", data.visualGrammar],
          ["節奏", data.pacing],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</p>
            <p className="mt-3 text-sm leading-6 text-slate-700">{value || "—"}</p>
          </div>
        ))}
        <div className="rounded-2xl bg-emerald-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">可以借</p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-emerald-900">
            {borrow.map((item) => <li key={item}>• {item}</li>)}
          </ul>
        </div>
        <div className="rounded-2xl bg-rose-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-700">唔可以照抄</p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-rose-900">
            {avoid.map((item) => <li key={item}>• {item}</li>)}
          </ul>
        </div>
      </div>
      {structure.length > 0 && (
        <div className="mt-5 rounded-2xl border border-slate-200 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">原片敘事次序</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {structure.map((item, index) => (
              <span key={`${item}-${index}`} className="rounded-full bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white">
                {index + 1}. {item}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function ProductAdaptation({ data, treatment }) {
  if (!data) return null;
  return (
    <section className="rounded-[30px] border border-indigo-200 bg-indigo-50 p-6 shadow-sm sm:p-8">
      <SectionTitle
        eyebrow="AI Master Concept"
        title={`將 Reference 轉化成 ${treatment.name} 嘅成品方向`}
        description="呢個係 AI 先提出嘅成品骨架，之後先按你實際搵到嘅片作最後定稿。"
      />
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[
          ["成品核心 Idea", data.productIdea],
          ["Master Hook", data.masterHook],
          ["受眾切入", data.audienceAngle],
          ["故事線", data.masterStory],
          ["設計系統", data.designSystem],
          ["建議片長", data.recommendedLength],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-indigo-100 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-500">{label}</p>
            <p className="mt-3 text-sm leading-6 text-slate-700">{value || "—"}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function statusClass(status) {
  if (status === "已搵到") return "border-emerald-300 bg-emerald-50";
  if (status === "用替代片") return "border-sky-300 bg-sky-50";
  if (status === "需要補拍") return "border-amber-300 bg-amber-50";
  if (status === "無法提供") return "border-rose-300 bg-rose-50";
  return "border-slate-200 bg-white";
}

function ShotPlanCard({ shot, decision, onChange }) {
  const resolvedDecision = decision || {
    status: "未開始搵",
    actualFootage: "",
    marketerNote: "",
  };

  async function copySearchBrief() {
    const text = [
      `${shot.time}｜${shot.purpose}`,
      `首選素材：${shot.recommendedOwnFootage || ""}`,
      `替代方案：${shot.alternativeFootage || ""}`,
      `搜尋提示：${shot.searchPrompt || ""}`,
      `VO：${shot.voRecommendation || ""}｜${shot.voReason || ""}`,
      `字卡：${shot.onScreenText || ""}`,
      `效果：${shot.visualEffect || ""}`,
    ].join("\n");
    await navigator.clipboard.writeText(text);
  }

  return (
    <article className={`rounded-[26px] border p-5 shadow-sm transition ${statusClass(resolvedDecision.status)}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">{shot.time}</span>
            <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">{shot.purpose}</span>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600"><strong className="text-slate-950">Reference 功能：</strong>{shot.referencePattern || "—"}</p>
        </div>
        <button type="button" onClick={copySearchBrief} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
          複製搵片要求
        </button>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl bg-emerald-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">AI 首選自家素材</p>
          <p className="mt-2 text-sm leading-6 text-emerald-950">{shot.recommendedOwnFootage || "—"}</p>
        </div>
        <div className="rounded-2xl bg-amber-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">搵唔到時替代方案</p>
          <p className="mt-2 text-sm leading-6 text-amber-950">{shot.alternativeFootage || "—"}</p>
        </div>
      </div>

      <div className="mt-3 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
        <p><strong>搜尋關鍵字：</strong>{shot.searchPrompt || "—"}</p>
        <p className="mt-2"><strong>VO 建議：</strong>{shot.voRecommendation || "—"}｜{shot.voReason || ""}</p>
        {shot.draftVoiceover && <p className="mt-2"><strong>暫定 VO：</strong>{shot.draftVoiceover}</p>}
        <p className="mt-2"><strong>字卡：</strong>{shot.onScreenText || "—"}</p>
        <p className="mt-2"><strong>畫面效果：</strong>{shot.visualEffect || "—"}</p>
        <p className="mt-2"><strong>剪接：</strong>{shot.editInstruction || "—"}</p>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[220px_1fr]">
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">搵片狀態</span>
          <select
            value={resolvedDecision.status}
            onChange={(event) => onChange({ status: event.target.value })}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
          >
            {MATERIAL_STATUS_OPTIONS.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">實際搵到／決定使用嘅片</span>
          <textarea
            value={resolvedDecision.actualFootage}
            onChange={(event) => onChange({ actualFootage: event.target.value })}
            rows={3}
            placeholder="例如：S-Lite 機頭由腳踝推至小腿 close-up，檔名 IMG_2877.mov；或者寫明用邊段替代片。"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
          />
        </label>
      </div>
      <label className="mt-4 block">
        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">同 AI 夾嘅補充</span>
        <input
          value={resolvedDecision.marketerNote}
          onChange={(event) => onChange({ marketerNote: event.target.value })}
          placeholder="例如：呢幕唔想有 VO、效果想青春啲、只可以用直片。"
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
        />
      </label>
    </article>
  );
}

function VersionCard({ version, treatment, reference, active, onToggle, onNotice }) {
  const timeline = Array.isArray(version?.timeline) ? version.timeline : [];

  async function copyBrief() {
    await navigator.clipboard.writeText(formatVersionBrief(version, treatment, reference));
    onNotice(`已複製「${version?.name || "影片版本"}」完整影片稿。`);
  }

  function saveJob() {
    const job = saveVersionAsJob({ version, treatment, reference });
    onNotice(`已儲存為 Creative Job：${job.title}`);
  }

  return (
    <article className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
      <button type="button" onClick={onToggle} className="flex w-full items-start justify-between gap-5 p-6 text-left sm:p-7">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">{version?.name || "Version"}</span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{version?.angle || ""}</span>
          </div>
          <h3 className="mt-4 text-xl font-semibold text-slate-950">{version?.hook || "未有 Hook"}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{version?.whyItWorks || ""}</p>
        </div>
        <span className="text-xl text-slate-400">{active ? "−" : "+"}</span>
      </button>

      {active && (
        <div className="border-t border-slate-200 px-6 pb-7 pt-6 sm:px-7">
          <div className="rounded-2xl bg-slate-950 p-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Design Direction</p>
            <p className="mt-3 text-sm leading-6 text-slate-100">{version?.designDirection || ""}</p>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[1250px] border-separate border-spacing-0 text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-slate-500">
                  {[
                    "時間／角色",
                    "Reference 功能",
                    "最終素材",
                    "素材狀態",
                    "VO 決定",
                    "字幕／VO",
                    "畫面效果",
                    "Editor 指令",
                  ].map((heading) => (
                    <th key={heading} className="border-b border-slate-200 px-3 py-3 font-semibold">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeline.map((row, index) => (
                  <tr key={`${row?.time}-${index}`} className="align-top">
                    <td className="border-b border-slate-100 px-3 py-4">
                      <p className="font-semibold text-slate-950">{row?.time}</p>
                      <p className="mt-1 text-xs text-indigo-600">{row?.role}</p>
                    </td>
                    <td className="border-b border-slate-100 px-3 py-4 leading-6 text-slate-600">{row?.referenceIdea}</td>
                    <td className="border-b border-slate-100 px-3 py-4 leading-6 text-slate-700">{row?.ownFootage}</td>
                    <td className="border-b border-slate-100 px-3 py-4 leading-6 text-slate-600">{row?.sourceStatus}</td>
                    <td className="border-b border-slate-100 px-3 py-4 leading-6 text-slate-700">
                      <p className="font-semibold text-slate-950">{row?.voRequired}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">{row?.voReason}</p>
                    </td>
                    <td className="border-b border-slate-100 px-3 py-4 font-medium leading-6 text-slate-950">{row?.subtitleVo}</td>
                    <td className="border-b border-slate-100 px-3 py-4 leading-6 text-slate-600">{row?.visualDesign}</td>
                    <td className="border-b border-slate-100 px-3 py-4 leading-6 text-slate-600">{row?.editorNote}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Designer Brief</p>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{version?.designerBrief || ""}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Caption／CTA</p>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{version?.caption || ""}</p>
              <p className="mt-4 text-sm font-semibold text-indigo-700">{version?.cta || ""}</p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" onClick={copyBrief} className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
              複製完整影片稿
            </button>
            <button type="button" onClick={saveJob} className="rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-500">
              儲存為 Creative Job
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

export default function RemixStudio() {
  const [references, setReferences] = useState([]);
  const [selectedReferenceId, setSelectedReferenceId] = useState("");
  const [selectedTreatmentId, setSelectedTreatmentId] = useState(TREATMENTS[0].id);
  const [selectedAngles, setSelectedAngles] = useState(ANGLES.map((item) => item.id));
  const [extraBrief, setExtraBrief] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [proposal, setProposal] = useState(null);
  const [materialDecisions, setMaterialDecisions] = useState({});
  const [finalResult, setFinalResult] = useState(null);
  const [frameCount, setFrameCount] = useState(0);
  const [openVersionId, setOpenVersionId] = useState("");

  function refreshReferences(preferredId = "") {
    const next = normalizeReferences(loadReferences());
    setReferences(next);
    const resolved = preferredId || selectedReferenceId || next[0]?.id || "";
    if (resolved && next.some((item) => item.id === resolved)) setSelectedReferenceId(resolved);
  }

  useEffect(() => {
    refreshReferences();
    const refresh = () => refreshReferences();
    window.addEventListener("storage", refresh);
    window.addEventListener("alyssa-reference-library-updated", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("alyssa-reference-library-updated", refresh);
    };
  }, []);

  const treatment = useMemo(
    () => TREATMENTS.find((item) => item.id === selectedTreatmentId) || TREATMENTS[0],
    [selectedTreatmentId]
  );
  const selectedReference = useMemo(
    () => references.find((item) => item.id === selectedReferenceId) || null,
    [references, selectedReferenceId]
  );
  const versionAngles = useMemo(
    () => ANGLES.filter((item) => selectedAngles.includes(item.id)),
    [selectedAngles]
  );
  const shotPlan = Array.isArray(proposal?.shotPlan) ? proposal.shotPlan : [];
  const versions = Array.isArray(finalResult?.versions) ? finalResult.versions : [];
  const riskNotes = Array.isArray(finalResult?.riskNotes) ? finalResult.riskNotes : [];
  const missingMaterials = Array.isArray(finalResult?.missingMaterials) ? finalResult.missingMaterials : [];

  useEffect(() => {
    setProposal(null);
    setMaterialDecisions({});
    setFinalResult(null);
    setStatus("idle");
  }, [treatment.id, selectedReferenceId]);

  function handleReferenceSaved(reference) {
    refreshReferences(reference?.id || "");
    setSelectedReferenceId(reference?.id || "");
    setNotice(`已儲存「${reference?.title || "Reference"}」，下一步由 AI 先提出成品方案。`);
  }

  function toggleAngle(id) {
    setSelectedAngles((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
    );
  }

  function updateMaterialDecision(shotId, patch) {
    setMaterialDecisions((current) => ({
      ...current,
      [shotId]: {
        status: "未開始搵",
        actualFootage: "",
        marketerNote: "",
        ...(current[shotId] || {}),
        ...patch,
      },
    }));
    setFinalResult(null);
  }

  async function generateProposal() {
    if (!selectedReference) {
      setError("請先錄製並揀選一條 Reference 影片。");
      return;
    }

    setStatus("planning");
    setError("");
    setNotice("");
    setProposal(null);
    setMaterialDecisions({});
    setFinalResult(null);

    try {
      const response = await fetch("/api/generate-remix-versions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "plan",
          reference: selectedReference,
          treatment,
          extraBrief,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.ok) throw new Error(payload?.error || "AI 未能提出成品方案");

      const nextProposal = payload.data || null;
      const nextPlan = Array.isArray(nextProposal?.shotPlan) ? nextProposal.shotPlan : [];
      const decisions = Object.fromEntries(
        nextPlan.map((shot, index) => [
          shot.id || `shot-${index + 1}`,
          { status: "未開始搵", actualFootage: "", marketerNote: "" },
        ])
      );
      setProposal(nextProposal);
      setMaterialDecisions(decisions);
      setFrameCount(Number(payload.frameCount || 0));
      setStatus("planned");
      setNotice("AI 已提出成品結構、逐幕搵片要求、VO 同畫面效果建議。依家按提議去搵片，再回填實際素材。");

      const suggested = Array.isArray(nextProposal?.suggestedAngles)
        ? nextProposal.suggestedAngles.map((item) => item.id).filter((id) => ANGLES.some((angle) => angle.id === id))
        : [];
      if (suggested.length) setSelectedAngles(suggested);
    } catch (planningError) {
      setError(planningError?.message || "AI 規劃失敗");
      setStatus("error");
    }
  }

  async function finalizeVersions() {
    if (!proposal || !shotPlan.length) {
      setError("請先叫 AI 提出成品方案同素材對應表。");
      return;
    }
    if (!versionAngles.length) {
      setError("請至少揀一個最終版本切入點。");
      return;
    }

    const decisions = shotPlan.map((shot, index) => ({
      shotId: shot.id || `shot-${index + 1}`,
      time: shot.time,
      purpose: shot.purpose,
      aiRecommendedFootage: shot.recommendedOwnFootage,
      aiAlternative: shot.alternativeFootage,
      aiVoRecommendation: shot.voRecommendation,
      aiVoReason: shot.voReason,
      ...(materialDecisions[shot.id || `shot-${index + 1}`] || {
        status: "未開始搵",
        actualFootage: "",
        marketerNote: "",
      }),
    }));

    setStatus("finalizing");
    setError("");
    setNotice("");
    setFinalResult(null);

    try {
      const response = await fetch("/api/generate-remix-versions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "finalize",
          reference: selectedReference,
          treatment,
          proposal,
          materialDecisions: decisions,
          versionAngles,
          extraBrief,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.ok) throw new Error(payload?.error || "AI 未能完成最終影片稿");

      setFinalResult(payload.data || null);
      const firstId = payload?.data?.versions?.[0]?.id || "";
      setOpenVersionId(firstId);
      setStatus("ready");
      setNotice("AI 已根據你實際搵到嘅素材，鎖定 VO、字幕、效果同多版本影片稿。");

      window.localStorage.setItem(
        REMIX_SESSION_STORAGE_KEY,
        JSON.stringify({
          referenceId: selectedReference.id,
          treatmentId: treatment.id,
          proposal,
          materialDecisions: decisions,
          versionAngles,
          result: payload.data,
          updatedAt: new Date().toISOString(),
        })
      );
    } catch (finalizeError) {
      setError(finalizeError?.message || "最終定稿失敗");
      setStatus("error");
    }
  }

  const completedCount = shotPlan.filter((shot, index) => {
    const decision = materialDecisions[shot.id || `shot-${index + 1}`];
    return decision && decision.status !== "未開始搵";
  }).length;

  return (
    <main className="min-h-screen bg-[#f5f6f8] text-slate-950">
      <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <header className="overflow-hidden rounded-[34px] bg-slate-950 text-white shadow-xl">
          <div className="grid gap-8 px-6 py-9 sm:px-10 lg:grid-cols-[1.25fr_0.75fr] lg:px-12 lg:py-12">
            <div>
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200">
                Reference Remix Studio
              </span>
              <h1 className="mt-5 max-w-4xl text-3xl font-semibold tracking-tight sm:text-5xl">
                AI 先提出成品每一幕，再按提議去搵療程片
              </h1>
              <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                錄低 Reference 後，AI 會先做 Creative Director：逐幕話你知要搵咩片、點對應原片、需唔需要 VO、字卡同畫面效果。你搵到素材後，再由 AI 鎖定最終多版本影片稿。
              </p>
            </div>
            <div className="rounded-[26px] border border-white/10 bg-white/5 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">正確工作方式</p>
              <p className="mt-4 text-lg font-semibold leading-8 text-white">AI 提議 → 人去搵片 → AI 再定稿</p>
              <p className="mt-3 text-sm leading-6 text-slate-300">唔需要先建立影片庫，亦唔需要 Marketer 一開始已經知道要用咩片。</p>
              <Link href="/" className="mt-6 inline-flex rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-slate-100">
                返回 Creative App
              </Link>
            </div>
          </div>
        </header>

        <div className="mt-6 flex gap-3 overflow-x-auto pb-1">
          <StepBadge number="1" title="錄製並儲存 Reference" active />
          <StepBadge number="2" title="揀療程，AI 提出成品" />
          <StepBadge number="3" title="按提議搵片" />
          <StepBadge number="4" title="回填實際素材" />
          <StepBadge number="5" title="AI 鎖定 VO／效果／版本" />
        </div>

        <section className="mt-7">
          <ReferenceRecorder onSaved={handleReferenceSaved} saveLabel="儲存為 Reference 素材" />
        </section>

        <section className="mt-7 rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <SectionTitle
            eyebrow="Step 1.5"
            title="揀今次要借 Idea 嘅 Reference"
            description="錄製完成後先儲存；亦可以重用之前錄過嘅 Reference。"
          />
          {references.length ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {references.map((reference) => (
                <ReferenceCard
                  key={reference.id}
                  reference={reference}
                  selected={reference.id === selectedReferenceId}
                  onSelect={setSelectedReferenceId}
                />
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 px-6 py-10 text-center text-sm text-slate-500">
              暫時未有已儲存 Reference。先喺上面錄製一條競品影片。
            </div>
          )}
        </section>

        <section className="mt-7 rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <SectionTitle
            eyebrow="Step 2"
            title="揀療程，叫 AI 先提出成品方案"
            description="呢一步唔使你提供已有素材。AI 會先睇 Reference，再逐幕提出最合理嘅自家療程畫面、替代方案、VO 同效果。"
          />
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {TREATMENTS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedTreatmentId(item.id)}
                className={`rounded-2xl border p-4 text-left transition ${item.id === treatment.id ? "border-indigo-500 bg-indigo-50 ring-4 ring-indigo-100" : "border-slate-200 hover:border-slate-400"}`}
              >
                <p className="text-sm font-semibold text-slate-950">{item.name}</p>
                <p className="mt-1 text-sm font-bold text-indigo-700">{item.price}</p>
              </button>
            ))}
          </div>
          <div className="mt-5 grid gap-3 rounded-2xl bg-slate-50 p-5 text-sm leading-6 text-slate-700 lg:grid-cols-3">
            <p><strong>客群：</strong>{treatment.audience}</p>
            <p><strong>問題：</strong>{treatment.painPoints}</p>
            <p><strong>賣點：</strong>{treatment.sellingPoints}</p>
          </div>
          <label className="mt-5 block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">額外方向</span>
            <textarea
              value={extraBrief}
              onChange={(event) => setExtraBrief(event.target.value)}
              rows={3}
              placeholder="例如：成品要 9:16、後生真人 feel、唔好太醫美、固定保留現有 CTA。"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm leading-6 outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
            />
          </label>

          {notice && <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800">{notice}</div>}
          {error && <div role="alert" className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">{error}</div>}

          <button
            type="button"
            onClick={generateProposal}
            disabled={status === "planning" || status === "finalizing"}
            className="mt-6 rounded-2xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status === "planning" ? "AI 睇片並規劃成品中..." : "AI 先提出成品結構＋逐幕搵片要求"}
          </button>
        </section>

        {proposal && (
          <div className="mt-7 space-y-7">
            <ReferenceDNA data={proposal.referenceDNA} />
            <ProductAdaptation data={proposal.productAdaptation} treatment={treatment} />

            <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <SectionTitle
                  eyebrow="Step 3–4"
                  title="AI 逐幕提出要搵咩片；你搵完再回填"
                  description={`AI 從 Reference 抽取咗 ${frameCount} 張實際畫面。每一幕已經包含首選素材、替代片、VO、字卡、效果同搜尋提示。`}
                />
                <div className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
                  已處理 {completedCount} / {shotPlan.length} 幕
                </div>
              </div>
              <div className="mt-6 space-y-5">
                {shotPlan.map((shot, index) => {
                  const shotId = shot.id || `shot-${index + 1}`;
                  return (
                    <ShotPlanCard
                      key={shotId}
                      shot={{ ...shot, id: shotId }}
                      decision={materialDecisions[shotId]}
                      onChange={(patch) => updateMaterialDecision(shotId, patch)}
                    />
                  );
                })}
              </div>
            </section>

            <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <SectionTitle
                eyebrow="Step 5"
                title="揀最終要出嘅版本，由 AI 鎖定 VO、效果同影片稿"
                description="可以未搵齊晒素材就先定稿；AI 會將未有片嘅位置縮到最細可行補拍或文字動畫方案。"
              />
              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {ANGLES.map((angle) => {
                  const checked = selectedAngles.includes(angle.id);
                  const suggestion = (proposal.suggestedAngles || []).find((item) => item.id === angle.id);
                  return (
                    <button
                      key={angle.id}
                      type="button"
                      onClick={() => toggleAngle(angle.id)}
                      className={`rounded-2xl border p-5 text-left transition ${checked ? "border-indigo-500 bg-indigo-50 ring-4 ring-indigo-100" : "border-slate-200 hover:border-slate-400"}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-slate-950">{angle.name}</p>
                        <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${checked ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"}`}>{checked ? "✓" : "+"}</span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-600">{suggestion?.reason || angle.description}</p>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={finalizeVersions}
                disabled={status === "planning" || status === "finalizing"}
                className="mt-6 rounded-2xl bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {status === "finalizing" ? "AI 正按實際素材鎖定 VO／效果／版本..." : `按實際素材生成 ${versionAngles.length} 個最終版本`}
              </button>
            </section>
          </div>
        )}

        {finalResult && (
          <div className="mt-7 space-y-7">
            <section className="rounded-[30px] border border-emerald-200 bg-emerald-50 p-6 shadow-sm sm:p-8">
              <SectionTitle eyebrow="Finalization Summary" title="AI 已完成素材、VO 同設計決策" />
              <div className="mt-6 grid gap-4 lg:grid-cols-3">
                {[
                  ["素材覆蓋", finalResult?.finalizationSummary?.footageCoverage],
                  ["VO 策略", finalResult?.finalizationSummary?.voStrategy],
                  ["設計策略", finalResult?.finalizationSummary?.designStrategy],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl bg-white p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">{label}</p>
                    <p className="mt-3 text-sm leading-6 text-slate-700">{value || "—"}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <div className="mb-5">
                <SectionTitle
                  eyebrow="Final Versions"
                  title={`${versions.length} 個可直接交 Designer 嘅影片版本`}
                  description="每一幕已經寫清楚最終素材、素材狀態、VO 決定、原因、字卡、畫面效果同 Editor 指令。"
                />
              </div>
              <div className="space-y-4">
                {versions.map((version, index) => (
                  <VersionCard
                    key={version?.id || index}
                    version={version}
                    treatment={treatment}
                    reference={selectedReference}
                    active={openVersionId === (version?.id || String(index))}
                    onToggle={() => setOpenVersionId((current) => current === (version?.id || String(index)) ? "" : (version?.id || String(index)))}
                    onNotice={setNotice}
                  />
                ))}
              </div>
            </section>

            {missingMaterials.length > 0 && (
              <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
                <p className="font-semibold">仍需處理嘅素材</p>
                <ul className="mt-2 space-y-1">{missingMaterials.map((item) => <li key={item}>• {item}</li>)}</ul>
              </section>
            )}

            {riskNotes.length > 0 && (
              <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
                <p className="font-semibold">人手確認位</p>
                <ul className="mt-2 space-y-1">{riskNotes.map((item) => <li key={item}>• {item}</li>)}</ul>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
