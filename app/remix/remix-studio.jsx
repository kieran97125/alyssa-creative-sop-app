"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ReferenceRecorder } from "../footage/reference-recorder";

const REFERENCE_ADS_STORAGE_KEY = "alyssaCreativeSop.referenceAds.v1";
const CONTENT_JOBS_STORAGE_KEY = "alyssaCreativeSop.contentJobs.v1";
const REMIX_SESSION_STORAGE_KEY = "alyssaCreativeSop.remixSession.v1";

const TREATMENTS = [
  {
    id: "dep",
    name: "DEP 無針水光 Combo",
    price: "$588",
    audience: "乾燥、暗啞、缺水、妝前唔貼服，想做溫和補水修護嘅客人",
    painPoints: "肌膚缺水、暗啞、粗糙、上妝唔貼服",
    sellingPoints: "DEP 儀器導入配合修護精華，重點係補水、柔滑同改善整體膚況觀感",
    safeLanguage: "使用補水、修護、柔滑、提升水潤感等保守表達，避免醫療或永久效果聲稱",
    footage: [
      "DEP 儀器操作 close-up",
      "精華／產品質感 close-up",
      "面部導入療程過程",
      "客人放鬆或完成後膚況",
      "$588 Offer／Logo CTA 畫面",
    ],
  },
  {
    id: "btl",
    name: "BTL EXION 全面膠原提拉",
    price: "$780",
    audience: "關注輪廓、眼周、面部線條同整體精神感嘅客人",
    painPoints: "輪廓感唔夠俐落、眼周疲態、面部線條睇落鬆散",
    sellingPoints: "以儀器溫感護理面部及眼周，突出自然輪廓管理、膚質及精神感",
    safeLanguage: "使用輪廓管理、提拉感、緊緻觀感、膠原護理等字眼，避免保證式醫療聲稱",
    footage: [
      "BTL EXION 儀器面部操作",
      "Jawline／輪廓位置 close-up",
      "眼周操作 close-up",
      "客人療程中放鬆反應",
      "$780 Offer／Logo CTA 畫面",
    ],
  },
  {
    id: "gentle",
    name: "柔清舒敏面部護理",
    price: "$388",
    audience: "皮膚容易不穩、泛紅、乾燥，想做溫和清潔同舒緩護理嘅客人",
    painPoints: "皮膚容易繃緊、乾燥、敏感觀感、清潔後不適",
    sellingPoints: "以溫和清潔、舒緩及修護流程為主，重點係乾淨、柔和同舒服感",
    safeLanguage: "使用舒緩、溫和、修護、改善不適觀感，避免治療敏感或炎症等醫療聲稱",
    footage: [
      "溫和潔面／卸妝過程",
      "柔和清潔或面部護理 close-up",
      "修護產品／面膜畫面",
      "客人放鬆反應",
      "$388 Offer／Logo CTA 畫面",
    ],
  },
  {
    id: "slite",
    name: "S-Lite 水感輕腿管理",
    price: "$588",
    audience: "長時間坐低、企得耐、雙腿容易沉重繃緊或浮腫觀感嘅客人",
    painPoints: "小腿沉重、繃緊、浮腫感、線條睇落唔夠俐落",
    sellingPoints: "儀器溫感護理配合專業人手穴位按摩，主打放鬆、舒緩同輕腿線條管理",
    safeLanguage: "使用舒緩沉重、放鬆繃緊、改善浮腫觀感、輕盈感，避免排毒或醫療聲稱",
    footage: [
      "小腿沉重／繃緊情境 Hook",
      "S-Lite 儀器小腿操作",
      "專業人手穴位按摩",
      "雙腿 movement／完成後輕盈感",
      "$588 Offer／Logo CTA 畫面",
    ],
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
    description: "用儀器、手法、步驟同專業細節建立可信感，最適合重用療程過程片。",
  },
  {
    id: "offer",
    name: "價值／Offer 版",
    description: "由療程組合、步驟、價錢同新客價值切入，重點係轉化。",
  },
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
      `Reference 結構：${row?.referenceIdea || ""}`,
      `自己素材：${row?.ownFootage || ""}`,
      `字幕／VO：${row?.subtitleVo || ""}`,
      `畫面設計：${row?.visualDesign || ""}`,
      `剪接備註：${row?.editorNote || ""}`,
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
    materialType: "現有療程過程片 / 文字動畫 / B-roll",
    referenceMapping: row?.referenceIdea || "",
    suggestedFileName: "",
    visual: `${row?.ownFootage || ""}\n${row?.visualDesign || ""}`.trim(),
    subtitleVo: row?.subtitleVo || "",
    subtitle: row?.subtitleVo || "",
    vo: row?.subtitleVo || "",
    purpose: row?.role || "",
    designerNote: row?.editorNote || "",
  }));

  const job = {
    id: `content-job-remix-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: `IB｜${treatment?.name || "療程"}｜${version?.name || "Remix Version"}`,
    status: "Draft",
    priority: "Normal",
    contentType: "Reels / Short Video",
    assignedDesigner: "Unassigned",
    deadline: "",
    marketerNotes: `由 Reference Remix Studio 生成。Reference：${reference?.title || ""}`,
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
    <div className={`flex min-w-[180px] items-center gap-3 rounded-2xl border px-4 py-3 ${active ? "border-indigo-500 bg-indigo-50" : "border-slate-200 bg-white"}`}>
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
      {description && <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>}
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
        title="AI 拆出真正可以借用嘅創作結構"
        description="借 Hook 機制、節奏、構圖同敘事次序；唔會照抄競品文案、品牌或 claim。"
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
            <table className="w-full min-w-[1000px] border-separate border-spacing-0 text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-slate-500">
                  {['時間／角色', 'Reference 結構', '自己療程素材', '字幕／VO', '畫面設計', 'Editor 指令'].map((heading) => (
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
  const [selectedFootage, setSelectedFootage] = useState(TREATMENTS[0].footage.slice(0, 4));
  const [customFootage, setCustomFootage] = useState("");
  const [selectedAngles, setSelectedAngles] = useState(ANGLES.map((item) => item.id));
  const [extraBrief, setExtraBrief] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [result, setResult] = useState(null);
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

  useEffect(() => {
    setSelectedFootage(treatment.footage.slice(0, 4));
    setResult(null);
  }, [treatment.id]);

  function handleReferenceSaved(reference) {
    refreshReferences(reference?.id || "");
    setSelectedReferenceId(reference?.id || "");
    setNotice(`已儲存「${reference?.title || "Reference"}」，可以開始拆 Idea。`);
  }

  function toggleFootage(item) {
    setSelectedFootage((current) =>
      current.includes(item) ? current.filter((value) => value !== item) : [...current, item]
    );
  }

  function toggleAngle(id) {
    setSelectedAngles((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
    );
  }

  async function generateVersions() {
    if (!selectedReference) {
      setError("請先錄製並揀選一條 Reference 影片。");
      return;
    }
    if (!versionAngles.length) {
      setError("請至少揀一個版本切入點。");
      return;
    }

    setStatus("generating");
    setError("");
    setNotice("");
    setResult(null);

    const customItems = customFootage
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    try {
      const response = await fetch("/api/generate-remix-versions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference: selectedReference,
          treatment,
          availableFootage: [...selectedFootage, ...customItems],
          versionAngles,
          extraBrief,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.ok) throw new Error(payload?.error || "AI 未能生成影片版本");

      setResult(payload.data || null);
      setFrameCount(Number(payload.frameCount || 0));
      const firstId = payload?.data?.versions?.[0]?.id || "";
      setOpenVersionId(firstId);
      setStatus("ready");
      window.localStorage.setItem(
        REMIX_SESSION_STORAGE_KEY,
        JSON.stringify({
          referenceId: selectedReference.id,
          treatmentId: treatment.id,
          availableFootage: [...selectedFootage, ...customItems],
          versionAngles,
          result: payload.data,
          updatedAt: new Date().toISOString(),
        })
      );
    } catch (generationError) {
      setError(generationError?.message || "生成失敗");
      setStatus("error");
    }
  }

  const versions = Array.isArray(result?.versions) ? result.versions : [];
  const materialPlan = result?.materialPlan || null;
  const riskNotes = Array.isArray(result?.riskNotes) ? result.riskNotes : [];

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
                錄低人哋嘅 Idea，轉化成自己療程嘅多版本影片稿
              </h1>
              <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                唔再管理大型影片庫。先儲低 Reference，再拆 Hook、節奏同設計邏輯，最後將你已有嘅療程過程片套入不同切入點。
              </p>
            </div>
            <div className="rounded-[26px] border border-white/10 bg-white/5 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">核心原則</p>
              <p className="mt-4 text-lg font-semibold leading-8 text-white">借結構，不照抄內容。</p>
              <p className="mt-3 text-sm leading-6 text-slate-300">競品品牌、Logo、原句同 claim 唔會搬過嚟；只會轉化可重用嘅創作方法。</p>
              <Link href="/" className="mt-6 inline-flex rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-slate-100">
                返回 Creative App
              </Link>
            </div>
          </div>
        </header>

        <div className="mt-6 flex gap-3 overflow-x-auto pb-1">
          <StepBadge number="1" title="錄製並儲存 Reference" active />
          <StepBadge number="2" title="選自己療程" />
          <StepBadge number="3" title="勾選現有過程片" />
          <StepBadge number="4" title="揀不同切入點" />
          <StepBadge number="5" title="AI 生成多版本影片稿" />
        </div>

        <section className="mt-7">
          <ReferenceRecorder onSaved={handleReferenceSaved} saveLabel="儲存為 Reference 素材" />
        </section>

        <section className="mt-7 rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <SectionTitle
            eyebrow="Step 1.5"
            title="揀今次要借 Idea 嘅 Reference"
            description="錄製完成後一定要先儲存。你亦可以重用之前錄過嘅影片。"
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

        <section className="mt-7 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <SectionTitle eyebrow="Step 2" title="套落自己邊個療程？" description="揀療程後，客群、痛點、賣點同安全講法會自動帶入。" />
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
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
            <div className="mt-5 space-y-3 rounded-2xl bg-slate-50 p-5 text-sm leading-6 text-slate-700">
              <p><strong>客群：</strong>{treatment.audience}</p>
              <p><strong>問題：</strong>{treatment.painPoints}</p>
              <p><strong>賣點：</strong>{treatment.sellingPoints}</p>
            </div>
          </div>

          <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <SectionTitle
              eyebrow="Step 3"
              title="你今次手頭上有咩療程過程片？"
              description="唔需要建立影片庫。只要勾選今次可用素材，AI 會將同一批片變成不同版本。"
            />
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {treatment.footage.map((item) => {
                const checked = selectedFootage.includes(item);
                return (
                  <label key={item} className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 ${checked ? "border-emerald-400 bg-emerald-50" : "border-slate-200 bg-white"}`}>
                    <input type="checkbox" checked={checked} onChange={() => toggleFootage(item)} className="mt-1 h-4 w-4" />
                    <span className="text-sm leading-6 text-slate-700">{item}</span>
                  </label>
                );
              })}
            </div>
            <label className="mt-5 block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">其他已有素材，每行一段</span>
              <textarea
                value={customFootage}
                onChange={(event) => setCustomFootage(event.target.value)}
                rows={4}
                placeholder={'例如：\n客人入房畫面\n美容師講解機頭\n固定品牌 CTA 片尾'}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm leading-6 outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
              />
            </label>
          </div>
        </section>

        <section className="mt-7 rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <SectionTitle
            eyebrow="Step 4"
            title="同一個 Reference，同一批療程片，出幾個不同版本"
            description="唔係純粹換 Hook，而係連敘事、字卡、畫面設計同素材次序一齊改。"
          />
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {ANGLES.map((angle) => {
              const checked = selectedAngles.includes(angle.id);
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
                  <p className="mt-3 text-sm leading-6 text-slate-600">{angle.description}</p>
                </button>
              );
            })}
          </div>

          <label className="mt-6 block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">額外方向</span>
            <textarea
              value={extraBrief}
              onChange={(event) => setExtraBrief(event.target.value)}
              rows={3}
              placeholder="例如：片頭想更後生、唔好太醫美、固定用原本 CTA、需要 9:16 Reels。"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm leading-6 outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
            />
          </label>

          {notice && <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</div>}
          {error && <div role="alert" className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

          <button
            type="button"
            onClick={generateVersions}
            disabled={status === "generating"}
            className="mt-6 rounded-2xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status === "generating" ? "AI 拆解 Reference 並生成版本中..." : `生成 ${versionAngles.length} 個不同影片版本`}
          </button>
        </section>

        {result && (
          <div className="mt-7 space-y-7">
            <ReferenceDNA data={result.referenceDNA} />

            {materialPlan && (
              <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <SectionTitle eyebrow="Material Remix Plan" title="點樣將本身已有療程片剪出唔同感覺" />
                <p className="mt-5 rounded-2xl bg-slate-50 p-5 text-sm leading-6 text-slate-700">{materialPlan.availableFootageSummary || ""}</p>
                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl bg-emerald-50 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">重用方法</p>
                    <ul className="mt-3 space-y-2 text-sm leading-6 text-emerald-900">
                      {(materialPlan.reuseStrategy || []).map((item) => <li key={item}>• {item}</li>)}
                    </ul>
                  </div>
                  <div className="rounded-2xl bg-amber-50 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">小量素材缺口</p>
                    <ul className="mt-3 space-y-2 text-sm leading-6 text-amber-900">
                      {(materialPlan.gaps || []).map((item) => <li key={item}>• {item}</li>)}
                    </ul>
                  </div>
                </div>
              </section>
            )}

            <section>
              <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
                <SectionTitle
                  eyebrow="Step 5"
                  title={`${versions.length} 個可直接交 Designer 嘅版本`}
                  description={`AI 從 Reference 抽取咗 ${frameCount} 張實際畫面作分析。`}
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

            {riskNotes.length > 0 && (
              <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
                <p className="font-semibold">人手確認位</p>
                <ul className="mt-2 space-y-1">
                  {riskNotes.map((item, index) => <li key={`${item}-${index}`}>• {item}</li>)}
                </ul>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
