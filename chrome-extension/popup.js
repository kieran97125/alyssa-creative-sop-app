const DEFAULT_APP_ORIGIN = "http://localhost:3000";
const APP_ORIGINS = [
  "http://localhost:3000",
  "https://alyssa-creative-sop-app.vercel.app",
];

const state = {
  tab: null,
  scanResult: null,
  selectedIds: new Set(),
  busy: false,
};

const elements = {
  refreshButton: document.getElementById("refreshButton"),
  selectAllButton: document.getElementById("selectAllButton"),
  openAppButton: document.getElementById("openAppButton"),
  sendButton: document.getElementById("sendButton"),
  appOriginSelect: document.getElementById("appOriginSelect"),
  platformLabel: document.getElementById("platformLabel"),
  brandLabel: document.getElementById("brandLabel"),
  urlLabel: document.getElementById("urlLabel"),
  candidateCount: document.getElementById("candidateCount"),
  candidateList: document.getElementById("candidateList"),
  statusMessage: document.getElementById("statusMessage"),
};

function safeText(value, fallback = "") {
  return String(value || fallback).trim();
}

function shortUrl(value) {
  try {
    const url = new URL(value);
    const path = `${url.pathname}${url.search}`.replace(/\/$/, "");
    return `${url.hostname}${path}`.slice(0, 90);
  } catch {
    return safeText(value, "-").slice(0, 90);
  }
}

function setStatus(message, isError = false) {
  elements.statusMessage.textContent = message;
  elements.statusMessage.classList.toggle("is-error", Boolean(isError));
}

function syncActionButtons() {
  const candidates = state.scanResult?.candidates || [];
  const hasCandidates = candidates.length > 0;
  const allSelected = hasCandidates && candidates.every((candidate) => state.selectedIds.has(candidate.id));

  elements.refreshButton.disabled = state.busy;
  elements.openAppButton.disabled = state.busy;
  elements.selectAllButton.disabled = state.busy || !hasCandidates;
  elements.sendButton.disabled = state.busy || state.selectedIds.size === 0;
  elements.selectAllButton.textContent = allSelected ? "取消全選" : "全選";
}

function setBusy(isBusy) {
  state.busy = isBusy;
  syncActionButtons();
}

function confidenceLabel(value) {
  if (value === "high") return "高信心";
  if (value === "medium") return "中信心";
  return "低信心";
}

function sourceTypeLabel(value) {
  const map = {
    instagram_post: "Instagram Post",
    instagram_reel: "Instagram Reel",
    instagram_tv: "Instagram TV",
    facebook_post: "Facebook Post",
    facebook_reel: "Facebook Reel",
    meta_ad_library: "Meta Ad Library",
    landing_page: "Landing Page",
    unknown: "Unknown",
  };
  return map[value] || safeText(value, "Unknown");
}

function renderDetectedInfo() {
  const result = state.scanResult || {};
  elements.platformLabel.textContent = result.platform || "未偵測";
  elements.brandLabel.textContent = result.detectedBrandName || result.pageTitle || "-";
  elements.urlLabel.textContent = shortUrl(result.pageUrl || state.tab?.url || "");
  elements.candidateCount.textContent = `${result.candidates?.length || 0} 個素材`;
}

function renderCandidates() {
  const candidates = state.scanResult?.candidates || [];
  elements.candidateList.innerHTML = "";

  if (!candidates.length) {
    const empty = document.createElement("div");
    empty.className = "status-message";
    empty.textContent = "未找到明顯素材。仍可開啟 Alyssa App，用手動方式加入 Swipe File。";
    elements.candidateList.appendChild(empty);
    return;
  }

  candidates.forEach((candidate) => {
    const card = document.createElement("label");
    card.className = "candidate-card";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = state.selectedIds.has(candidate.id);
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        state.selectedIds.add(candidate.id);
      } else {
        state.selectedIds.delete(candidate.id);
      }
      syncActionButtons();
    });

    const preview = document.createElement("div");
    preview.className = "preview";
    if (candidate.previewUrl) {
      const image = document.createElement("img");
      image.src = candidate.previewUrl;
      image.alt = candidate.title || "Material preview";
      preview.appendChild(image);
    } else {
      preview.textContent = "截圖補回";
    }

    const body = document.createElement("div");
    const title = document.createElement("div");
    title.className = "candidate-title";
    title.textContent = candidate.title || candidate.pageTitle || "未命名素材";

    const meta = document.createElement("div");
    meta.className = "candidate-meta";
    meta.textContent = shortUrl(candidate.sourceUrl || candidate.pageUrl || "");

    const footer = document.createElement("div");
    footer.className = "candidate-footer";

    const typeBadge = document.createElement("span");
    typeBadge.className = "badge";
    typeBadge.textContent = sourceTypeLabel(candidate.sourceType);

    const confidenceBadge = document.createElement("span");
    confidenceBadge.className = `badge ${candidate.confidence || "low"}`;
    confidenceBadge.textContent = confidenceLabel(candidate.confidence);

    footer.append(typeBadge, confidenceBadge);
    body.append(title, meta, footer);
    card.append(checkbox, preview, body);
    elements.candidateList.appendChild(card);
  });
}

function render() {
  renderDetectedInfo();
  renderCandidates();
  syncActionButtons();
}

async function getActiveTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0] || null;
}

async function injectScanner(tabId) {
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ["content.js"],
  });
}

async function scanCurrentPage() {
  setBusy(true);
  setStatus("正在偵測目前頁面...");

  try {
    state.tab = await getActiveTab();
    if (!state.tab?.id) throw new Error("未找到目前分頁");

    await injectScanner(state.tab.id);
    const response = await chrome.tabs.sendMessage(state.tab.id, { type: "ALYSSA_SCAN_PAGE" });
    if (!response?.ok) throw new Error(response?.error || "偵測失敗");

    state.scanResult = response.data;
    state.selectedIds = new Set((response.data?.candidates || []).map((candidate) => candidate.id));
    setStatus("請選擇要加入 Swipe File 的素材。");
    render();
  } catch (error) {
    state.scanResult = {
      platform: "Unknown",
      pageTitle: state.tab?.title || "",
      pageUrl: state.tab?.url || "",
      detectedBrandName: "",
      candidates: [],
    };
    setStatus(error?.message || "偵測失敗，請重新整理頁面再試。", true);
    render();
  } finally {
    setBusy(false);
  }
}

async function loadSettings() {
  const stored = await chrome.storage.local.get(["alyssaAppOrigin"]);
  const appOrigin = APP_ORIGINS.includes(stored.alyssaAppOrigin) ? stored.alyssaAppOrigin : DEFAULT_APP_ORIGIN;
  elements.appOriginSelect.value = appOrigin;
}

async function saveAppOrigin() {
  const appOrigin = elements.appOriginSelect.value || DEFAULT_APP_ORIGIN;
  await chrome.storage.local.set({ alyssaAppOrigin: appOrigin });
  return appOrigin;
}

async function captureViewportIfNeeded(selectedCandidates) {
  const needsScreenshot = selectedCandidates.some((candidate) => !candidate.previewUrl);
  if (!needsScreenshot || !state.tab?.windowId) return "";

  try {
    return await chrome.tabs.captureVisibleTab(state.tab.windowId, {
      format: "jpeg",
      quality: 72,
    });
  } catch {
    return "";
  }
}

async function sendSelectedToAlyssa() {
  const candidates = state.scanResult?.candidates || [];
  const selectedCandidates = candidates.filter((candidate) => state.selectedIds.has(candidate.id));

  if (!selectedCandidates.length) {
    setStatus("請先選擇至少一個素材。", true);
    return;
  }

  setBusy(true);
  setStatus("準備送到 Alyssa App...");

  try {
    const appOrigin = await saveAppOrigin();
    const screenshotDataUrl = await captureViewportIfNeeded(selectedCandidates);
    const preparedCandidates = selectedCandidates.map((candidate) => ({
      ...candidate,
      screenshotDataUrl: candidate.previewUrl ? "" : screenshotDataUrl,
    }));
    const batch = {
      id: `alyssa-capture-${Date.now()}`,
      source: "Alyssa Capture Extension",
      platform: state.scanResult?.platform || "Unknown",
      pageType: state.scanResult?.pageType || "",
      pageTitle: state.scanResult?.pageTitle || state.tab?.title || "",
      pageUrl: state.scanResult?.pageUrl || state.tab?.url || "",
      detectedBrandName: state.scanResult?.detectedBrandName || "",
      capturedAt: new Date().toISOString(),
      candidates: preparedCandidates,
    };

    await chrome.storage.local.set({
      alyssaLastCaptureBatch: batch,
      alyssaAppOrigin: appOrigin,
    });

    const response = await chrome.runtime.sendMessage({
      type: "ALYSSA_SEND_TO_APP",
      payload: { batch, appOrigin },
    });

    if (!response?.ok) throw new Error(response?.error || "未能送到 Alyssa App");
    setStatus(`已送出 ${preparedCandidates.length} 個素材，Alyssa App 正在開啟。`);
  } catch (error) {
    setStatus(error?.message || "送出失敗，請再試一次。", true);
  } finally {
    setBusy(false);
  }
}

async function openAlyssaApp() {
  setBusy(true);
  try {
    const appOrigin = await saveAppOrigin();
    await chrome.runtime.sendMessage({ type: "ALYSSA_OPEN_APP", appOrigin });
  } finally {
    setBusy(false);
  }
}

elements.refreshButton.addEventListener("click", scanCurrentPage);
elements.selectAllButton.addEventListener("click", () => {
  const candidates = state.scanResult?.candidates || [];
  const allSelected = candidates.every((candidate) => state.selectedIds.has(candidate.id));
  state.selectedIds = allSelected ? new Set() : new Set(candidates.map((candidate) => candidate.id));
  elements.selectAllButton.textContent = allSelected ? "全選" : "取消全選";
  render();
});
elements.openAppButton.addEventListener("click", openAlyssaApp);
elements.sendButton.addEventListener("click", sendSelectedToAlyssa);
elements.appOriginSelect.addEventListener("change", saveAppOrigin);

document.addEventListener("DOMContentLoaded", async () => {
  await loadSettings();
  await scanCurrentPage();
});
