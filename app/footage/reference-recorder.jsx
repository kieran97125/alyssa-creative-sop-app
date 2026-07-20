"use client";

import { upload } from "@vercel/blob/client";
import { useEffect, useRef, useState } from "react";

const REFERENCE_ADS_STORAGE_KEY = "alyssaCreativeSop.referenceAds.v1";

function getSupportedMimeType() {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || "";
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

function saveRecordedReference({ title, sourceUrl, assetUrl, fileName, durationSeconds }) {
  const now = new Date().toISOString();
  const reference = {
    id: `reference-browser-recording-${Date.now()}`,
    title: title || fileName || "Browser Tab Recording",
    platform: "Browser Tab Recording",
    sourceType: "browser_tab_recording",
    mediaType: "video",
    sourceUrl: sourceUrl || assetUrl,
    previewUrl: "",
    assetUrl,
    thumbnailUrl: "",
    board: "競品參考影片",
    status: "已儲存",
    competitorBrand: "",
    targetBrand: "Ineffable Beauty",
    offer: "",
    angle: "等待 Remix 拆解",
    hookNotes: "",
    visualNotes: `由瀏覽器分頁錄製，共約 ${Math.max(1, Math.round(durationSeconds || 0))} 秒。`,
    captionNotes: "",
    productionNotes: "已儲存為 Reference，可進入 Reference Remix Studio 拆 Idea、套療程及生成多版本影片稿。",
    tags: "Browser Recording, 競品影片, Reference Remix",
    remixStatus: "ready_for_adaptation",
    createdAt: now,
    updatedAt: now,
  };

  const current = loadReferenceAds();
  window.localStorage.setItem(REFERENCE_ADS_STORAGE_KEY, JSON.stringify([reference, ...current]));
  window.dispatchEvent(new Event("alyssa-reference-library-updated"));
  return reference;
}

export function ReferenceRecorder({
  onSaved,
  saveLabel = "儲存為 Reference 素材",
  heading = "錄製競品影片分頁",
  description = "打開 IG、Facebook、Meta Ad Library、TikTok 或其他影片頁面，再由瀏覽器授權錄製指定分頁。唔需要安裝 Extension。",
}) {
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const startedAtRef = useRef(0);
  const previewUrlRef = useRef("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [recordingFile, setRecordingFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [title, setTitle] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [savedReference, setSavedReference] = useState(null);

  useEffect(() => {
    previewUrlRef.current = previewUrl;
  }, [previewUrl]);

  useEffect(
    () => () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    },
    []
  );

  function stopTracks() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  function stopRecording() {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
    stopTracks();
  }

  async function startRecording() {
    setError("");
    setSavedReference(null);

    if (!navigator.mediaDevices?.getDisplayMedia || typeof MediaRecorder === "undefined") {
      setError("目前瀏覽器未支援分頁錄製，請改用最新版 Chrome 或 Edge。");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: 30, max: 30 } },
        audio: true,
        preferCurrentTab: false,
        selfBrowserSurface: "exclude",
        surfaceSwitching: "include",
        systemAudio: "include",
      });
      const mimeType = getSupportedMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

      chunksRef.current = [];
      streamRef.current = stream;
      recorderRef.current = recorder;
      startedAtRef.current = Date.now();

      recorder.ondataavailable = (event) => {
        if (event.data?.size) chunksRef.current.push(event.data);
      };

      recorder.onerror = (event) => {
        setError(event?.error?.message || "錄製過程發生錯誤。");
        setStatus("error");
        stopTracks();
      };

      recorder.onstop = () => {
        const duration = Math.max(1, (Date.now() - startedAtRef.current) / 1000);
        const resolvedType = recorder.mimeType || "video/webm";
        const blob = new Blob(chunksRef.current, { type: resolvedType });
        const fileName = `reference-recording-${new Date().toISOString().replaceAll(":", "-")}.webm`;
        const file = new File([blob], fileName, { type: resolvedType });
        const localPreviewUrl = URL.createObjectURL(blob);

        if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
        setDurationSeconds(duration);
        setRecordingFile(file);
        setPreviewUrl(localPreviewUrl);
        setStatus("ready");
        stopTracks();
      };

      stream.getVideoTracks()[0]?.addEventListener("ended", () => {
        if (recorder.state !== "inactive") recorder.stop();
      });

      recorder.start(1000);
      setStatus("recording");
    } catch (recordingError) {
      const message = String(recordingError?.message || "");
      setError(
        recordingError?.name === "NotAllowedError"
          ? "你取消咗分頁分享，未有開始錄製。"
          : message || "未能開始分頁錄製。"
      );
      setStatus("idle");
      stopTracks();
    }
  }

  async function uploadAndSave() {
    if (!recordingFile) return;

    setStatus("uploading");
    setError("");

    try {
      const pathname = `reference-recordings/${Date.now()}-${recordingFile.name}`;
      const blob = await upload(pathname, recordingFile, {
        access: "public",
        contentType: recordingFile.type || "video/webm",
        handleUploadUrl: "/api/blob-upload",
        clientPayload: JSON.stringify({ fileName: recordingFile.name }),
      });

      const reference = saveRecordedReference({
        title: title.trim(),
        sourceUrl: sourceUrl.trim(),
        assetUrl: blob.url,
        fileName: recordingFile.name,
        durationSeconds,
      });

      setSavedReference(reference);
      setStatus("saved");
      onSaved?.(reference);
    } catch (uploadError) {
      setError(uploadError?.message || "影片上載失敗。");
      setStatus("ready");
    }
  }

  function resetRecording() {
    stopRecording();
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    setPreviewUrl("");
    setRecordingFile(null);
    setDurationSeconds(0);
    setSavedReference(null);
    setError("");
    setStatus("idle");
  }

  return (
    <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-950 px-6 py-6 text-white sm:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Reference Intake</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">{heading}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">{description}</p>
          </div>
          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200">
            Chrome / Edge
          </span>
        </div>
      </div>

      <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-950">
          {previewUrl ? (
            <video src={previewUrl} className="aspect-video w-full object-contain" controls playsInline />
          ) : (
            <div className="flex aspect-video flex-col items-center justify-center px-8 text-center text-slate-300">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-2xl">◉</div>
              <p className="mt-4 text-sm font-semibold text-white">未有錄影片段</p>
              <p className="mt-2 max-w-sm text-xs leading-5 text-slate-400">
                撳開始後，揀播放緊競品影片嘅 Browser Tab；想連聲音一齊錄，要勾選分享分頁音訊。
              </p>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">參考名稱</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="例如：競品小腿痛點 Hook"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">原影片網址</span>
              <input
                value={sourceUrl}
                onChange={(event) => setSourceUrl(event.target.value)}
                placeholder="可留空"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
              />
            </label>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
            <div className="flex items-center justify-between gap-4">
              <span>狀態</span>
              <strong className="text-slate-950">
                {status === "recording" && "錄製中"}
                {status === "uploading" && "儲存中"}
                {status === "ready" && `已錄製 · ${Math.round(durationSeconds)} 秒`}
                {status === "saved" && "已儲存為 Reference"}
                {status === "idle" && "準備開始"}
                {status === "error" && "錄製失敗"}
              </strong>
            </div>
          </div>

          {error && (
            <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">
              {error}
            </div>
          )}

          {savedReference && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800">
              已儲存為「{savedReference.title}」。下一步揀呢條 Reference、套療程，再生成不同版本影片稿。
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            {status !== "recording" ? (
              <button
                type="button"
                onClick={startRecording}
                disabled={status === "uploading"}
                className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                開始錄製分頁
              </button>
            ) : (
              <button
                type="button"
                onClick={stopRecording}
                className="rounded-2xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-500"
              >
                停止錄製
              </button>
            )}

            {recordingFile && status !== "recording" && (
              <button
                type="button"
                onClick={uploadAndSave}
                disabled={status === "uploading" || status === "saved"}
                className="rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {status === "uploading" ? "儲存中..." : status === "saved" ? "已儲存" : saveLabel}
              </button>
            )}

            {(recordingFile || status === "saved") && (
              <button
                type="button"
                onClick={resetRecording}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                重新錄製
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
