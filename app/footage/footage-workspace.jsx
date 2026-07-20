"use client";

import { useEffect, useMemo, useState } from "react";
import { FootageCard } from "./footage-card";
import { FootageEditor, FOOTAGE_USAGE_OPTIONS } from "./footage-editor";
import { ReferenceRecorder } from "./reference-recorder";

const ROOT_FOLDER_STORAGE_KEY = "alyssaCreativeSop.footageRootFolder.v1";
const REFERENCE_ADS_STORAGE_KEY = "alyssaCreativeSop.referenceAds.v1";
const FOOTAGE_SELECTION_STORAGE_KEY = "alyssaCreativeSop.footageSelection.v1";

function loadStoredRootFolder() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(ROOT_FOLDER_STORAGE_KEY) || "";
}

function loadReferenceAds() {
  if (typeof window === "undefined") return [];

  try {
    const parsed = JSON.parse(window.localStorage.getItem(REFERENCE_ADS_STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function formatSelectedFootageList(items) {
  return items
    .map(
      (item, index) =>
        `${index + 1}. ${item.displayName}\n   療程：${item.treatment}\n   用途：${item.usageType || "未分類"}\n   Drive：${item.webViewLink}${item.notes ? `\n   備註：${item.notes}` : ""}`
    )
    .join("\n\n");
}

function makeFootagePackReference(items, root) {
  const now = new Date().toISOString();
  const treatments = Array.from(new Set(items.map((item) => item.treatment).filter(Boolean)));
  const usageTypes = Array.from(new Set(items.map((item) => item.usageType).filter(Boolean)));
  const title = `IB Footage Pack · ${treatments.join(" / ") || "未分類"} · ${items.length}段`;

  return {
    id: `reference-footage-pack-${Date.now()}`,
    title,
    platform: "Google Drive",
    sourceType: "brand_footage_pack",
    mediaType: "link",
    sourceUrl: root?.webViewLink || items[0]?.webViewLink || "",
    previewUrl: items[0]?.thumbnailLink || "",
    assetUrl: "",
    thumbnailUrl: items[0]?.thumbnailLink || "",
    board: "品牌 Footage",
    status: "已收集",
    competitorBrand: "",
    targetBrand: "Ineffable Beauty",
    offer: "",
    angle: usageTypes.join(" / "),
    hookNotes: items
      .filter((item) => item.usageType === "Hook")
      .map((item) => item.displayName)
      .join("、"),
    visualNotes: formatSelectedFootageList(items),
    captionNotes: "",
    productionNotes: "由 Brand Footage Library 選取。建立影片稿時，請按每段素材嘅用途及 Drive link 配對分鏡。",
    tags: ["Ineffable Beauty", "Brand Footage", ...treatments, ...usageTypes].filter(Boolean).join(", "),
    selectedFootage: items.map((item) => ({
      id: item.id,
      name: item.displayName,
      treatment: item.treatment,
      usageType: item.usageType,
      notes: item.notes,
      driveUrl: item.webViewLink,
      thumbnailLink: item.thumbnailLink,
    })),
    createdAt: now,
    updatedAt: now,
  };
}

function saveFootagePackToCreativeApp(items, root) {
  const reference = makeFootagePackReference(items, root);
  const current = loadReferenceAds();
  window.localStorage.setItem(REFERENCE_ADS_STORAGE_KEY, JSON.stringify([reference, ...current]));
  window.localStorage.setItem(
    FOOTAGE_SELECTION_STORAGE_KEY,
    JSON.stringify({
      id: reference.id,
      title: reference.title,
      items: reference.selectedFootage,
      createdAt: reference.createdAt,
    })
  );
  window.dispatchEvent(new Event("alyssa-reference-library-updated"));
  window.dispatchEvent(new Event("alyssa-footage-selection-updated"));
  return reference;
}

function StatCard({ label, value, detail }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
      <p className="mt-2 text-xs text-slate-500">{detail}</p>
    </div>
  );
}

export default function FootageWorkspace() {
  const [activeView, setActiveView] = useState("library");
  const [rootFolderInput, setRootFolderInput] = useState("");
  const [serviceAccountEmail, setServiceAccountEmail] = useState("");
  const [library, setLibrary] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [treatmentFilter, setTreatmentFilter] = useState("all");
  const [usageFilter, setUsageFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState([]);
  const [editingFootage, setEditingFootage] = useState(null);

  async function loadLibrary(folderInput, options = {}) {
    const resolvedInput = String(folderInput || "").trim();
    setStatus("loading");
    setError("");
    if (!options.keepNotice) setNotice("");

    try {
      const query = resolvedInput ? `?rootFolder=${encodeURIComponent(resolvedInput)}` : "";
      const response = await fetch(`/api/footage${query}`, { cache: "no-store" });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "未能讀取 Google Drive Footage Library");
      }

      setServiceAccountEmail(payload.serviceAccountEmail || "");
      setLibrary(payload.library || null);
      setStatus(payload.configured ? "ready" : "setup");

      if (resolvedInput && payload.configured) {
        window.localStorage.setItem(ROOT_FOLDER_STORAGE_KEY, resolvedInput);
      }
    } catch (loadError) {
      setStatus("error");
      setError(loadError?.message || "Footage Library 載入失敗");
      setLibrary(null);
    }
  }

  useEffect(() => {
    const storedRoot = loadStoredRootFolder();
    setRootFolderInput(storedRoot);
    loadLibrary(storedRoot);
  }, []);

  const footage = library?.footage || [];
  const folders = library?.folders || [];
  const treatmentFolders = useMemo(
    () => folders.filter((folder) => Number(folder.depth || 0) === 1),
    [folders]
  );
  const treatmentOptions = useMemo(
    () => Array.from(new Set(footage.map((item) => item.treatment).filter(Boolean))).sort((a, b) => a.localeCompare(b, "zh-HK")),
    [footage]
  );
  const visibleFootage = useMemo(() => {
    const needle = search.trim().toLowerCase();

    return footage.filter((item) => {
      const searchable = [item.displayName, item.name, item.treatment, item.folderPath, item.usageType, item.notes]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesSearch = !needle || searchable.includes(needle);
      const matchesTreatment = treatmentFilter === "all" || item.treatment === treatmentFilter;
      const matchesUsage = usageFilter === "all" || item.usageType === usageFilter;
      return matchesSearch && matchesTreatment && matchesUsage;
    });
  }, [footage, search, treatmentFilter, usageFilter]);
  const selectedFootage = useMemo(
    () => footage.filter((item) => selectedIds.includes(item.id)),
    [footage, selectedIds]
  );
  const classifiedCount = useMemo(
    () => footage.filter((item) => item.usageType && item.usageType !== "未分類").length,
    [footage]
  );

  function toggleFootage(fileId) {
    setSelectedIds((current) =>
      current.includes(fileId) ? current.filter((id) => id !== fileId) : [...current, fileId]
    );
  }

  async function initializeFolders() {
    const resolvedRoot = rootFolderInput.trim() || library?.root?.id || "";
    if (!resolvedRoot) {
      setError("請先貼上 Google Drive Root Folder link。");
      return;
    }

    setStatus("initializing");
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/footage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ensure-folders", rootFolder: resolvedRoot }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "未能建立療程 Folder");
      }

      const createdCount = payload?.result?.created?.length || 0;
      setNotice(createdCount ? `已建立 ${createdCount} 個標準療程 Folder。` : "標準療程 Folder 已經齊全。" );
      await loadLibrary(resolvedRoot, { keepNotice: true });
    } catch (initializeError) {
      setStatus("error");
      setError(initializeError?.message || "Folder 建立失敗");
    }
  }

  async function refreshAfterEdit() {
    await loadLibrary(rootFolderInput || library?.root?.id, { keepNotice: true });
    setNotice("Footage 資料已更新。");
  }

  async function copySelectedList() {
    if (!selectedFootage.length) return;
    await navigator.clipboard.writeText(formatSelectedFootageList(selectedFootage));
    setNotice(`已複製 ${selectedFootage.length} 段 Footage 嘅 Designer 素材清單。`);
  }

  function sendToCreativeApp() {
    if (!selectedFootage.length) return;
    const reference = saveFootagePackToCreativeApp(selectedFootage, library?.root);
    setNotice(`已建立「${reference.title}」，並送入 Creative App 素材庫。`);
  }

  async function copyServiceEmail() {
    if (!serviceAccountEmail) return;
    await navigator.clipboard.writeText(serviceAccountEmail);
    setNotice("Service Account email 已複製。請喺 Google Drive 將 Root Folder 分享 Editor 權限畀呢個帳戶。");
  }

  return (
    <main className="min-h-screen bg-[#f5f6f8] text-slate-950">
      <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <header className="overflow-hidden rounded-[32px] bg-slate-950 text-white shadow-xl">
          <div className="grid gap-8 px-6 py-8 sm:px-9 lg:grid-cols-[1.3fr_0.7fr] lg:px-12 lg:py-11">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200">
                  Alyssa Creative SOP
                </span>
                <span className="rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-200">
                  Phase 1
                </span>
              </div>
              <h1 className="mt-5 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
                Brand Footage Library
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                原片繼續放 Google Drive。呢個工作台幫你按療程 Folder 掃描、預覽、簡單分類，再將選定 Footage 送入 Creative App。
              </p>
            </div>

            <div className="flex flex-col justify-between gap-5 rounded-[26px] border border-white/10 bg-white/5 p-5 backdrop-blur">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">簡化後每段只記</p>
                <p className="mt-3 text-sm leading-7 text-slate-100">名稱 · 療程 Folder · 主要用途 · 備註 · Drive Link</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <a href="/" className="rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-100">
                  返回 Creative App
                </a>
                {library?.root?.webViewLink && (
                  <a
                    href={library.root.webViewLink}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-2xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    開啟 Drive Folder
                  </a>
                )}
              </div>
            </div>
          </div>
        </header>

        <nav className="mt-6 flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm" aria-label="Footage workspace views">
          {[
            { id: "library", label: "品牌 Footage Library" },
            { id: "recorder", label: "掃描／錄製競品影片" },
          ].map((view) => (
            <button
              key={view.id}
              type="button"
              onClick={() => setActiveView(view.id)}
              className={`whitespace-nowrap rounded-xl px-5 py-3 text-sm font-semibold transition ${
                activeView === view.id ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {view.label}
            </button>
          ))}
        </nav>

        {activeView === "recorder" ? (
          <div className="mt-6">
            <ReferenceRecorder />
          </div>
        ) : (
          <>
            <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Footage" value={footage.length} detail="Google Drive 影片原檔" />
              <StatCard label="Treatment Folders" value={treatmentFolders.length} detail="第一層療程分類" />
              <StatCard label="已分類用途" value={classifiedCount} detail="Hook／過程／CTA 等" />
              <StatCard label="已選素材" value={selectedFootage.length} detail="準備送入 Creative Job" />
            </section>

            <section className="mt-6 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-end justify-between gap-5">
                <div className="min-w-[260px] flex-1">
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Google Drive Root Folder</span>
                    <input
                      value={rootFolderInput}
                      onChange={(event) => setRootFolderInput(event.target.value)}
                      placeholder="貼上 Drive Folder link 或 Folder ID"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                    />
                  </label>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => loadLibrary(rootFolderInput)}
                    disabled={status === "loading" || status === "initializing"}
                    className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {status === "loading" ? "掃描中..." : "掃描 Folder"}
                  </button>
                  <button
                    type="button"
                    onClick={initializeFolders}
                    disabled={status === "loading" || status === "initializing"}
                    className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {status === "initializing" ? "建立中..." : "建立標準療程 Folder"}
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-600">
                <span>
                  第一次設定：先喺 Drive 建立一個 Root Folder，再分享 <strong>Editor</strong> 權限畀系統 Service Account。
                </span>
                {serviceAccountEmail && (
                  <button type="button" onClick={copyServiceEmail} className="font-semibold text-indigo-700 underline underline-offset-4">
                    複製 {serviceAccountEmail}
                  </button>
                )}
              </div>

              {notice && (
                <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800">
                  {notice}
                </div>
              )}
              {error && (
                <div role="alert" className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">
                  {error}
                </div>
              )}
            </section>

            {library && (
              <>
                <section className="mt-6 grid gap-4 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2 sm:p-6 lg:grid-cols-4">
                  <label className="block sm:col-span-2 lg:col-span-2">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">搜尋 Footage</span>
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="搜尋名稱、療程、用途或備註"
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">療程</span>
                    <select
                      value={treatmentFilter}
                      onChange={(event) => setTreatmentFilter(event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                    >
                      <option value="all">全部療程</option>
                      {treatmentOptions.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">用途</span>
                    <select
                      value={usageFilter}
                      onChange={(event) => setUsageFilter(event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                    >
                      <option value="all">全部用途</option>
                      {FOOTAGE_USAGE_OPTIONS.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </label>
                </section>

                <section className="mt-6">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-semibold tracking-tight text-slate-950">現有素材</h2>
                      <p className="mt-1 text-sm text-slate-500">顯示 {visibleFootage.length} / {footage.length} 段影片</p>
                    </div>
                    {selectedFootage.length > 0 && (
                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={copySelectedList}
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          複製 Designer 清單
                        </button>
                        <button
                          type="button"
                          onClick={sendToCreativeApp}
                          className="rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
                        >
                          送入 Creative App
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedIds([])}
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-50"
                        >
                          清除選擇
                        </button>
                      </div>
                    )}
                  </div>

                  {visibleFootage.length ? (
                    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                      {visibleFootage.map((item) => (
                        <FootageCard
                          key={item.id}
                          footage={item}
                          selected={selectedIds.includes(item.id)}
                          onToggle={toggleFootage}
                          onEdit={setEditingFootage}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-[28px] border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
                      <p className="text-base font-semibold text-slate-800">未有符合條件嘅 Footage</p>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        將影片 Upload 入療程 Folder 後再撳掃描，或者清除目前搜尋及篩選。
                      </p>
                    </div>
                  )}
                </section>
              </>
            )}

            {!library && status !== "loading" && (
              <section className="mt-6 rounded-[28px] border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
                <p className="text-lg font-semibold text-slate-900">連接第一個 Google Drive Footage Folder</p>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500">
                  貼上 Root Folder link，再分享 Editor 權限畀上面顯示嘅 Service Account。系統就會按 Folder 自動整理療程素材。
                </p>
              </section>
            )}
          </>
        )}
      </div>

      <FootageEditor
        footage={editingFootage}
        folders={treatmentFolders.length ? treatmentFolders : folders}
        onClose={() => setEditingFootage(null)}
        onSaved={refreshAfterEdit}
      />
    </main>
  );
}
