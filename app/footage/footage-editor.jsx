"use client";

import { useEffect, useState } from "react";

export const FOOTAGE_USAGE_OPTIONS = [
  "未分類",
  "Hook",
  "療程過程",
  "Before / After",
  "客人反應",
  "CTA / Offer",
  "品牌通用",
];

export function FootageEditor({ footage, folders, onClose, onSaved }) {
  const [displayName, setDisplayName] = useState("");
  const [usageType, setUsageType] = useState("未分類");
  const [notes, setNotes] = useState("");
  const [targetFolderId, setTargetFolderId] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!footage) return;
    setDisplayName(footage.displayName || footage.name || "");
    setUsageType(footage.usageType || "未分類");
    setNotes(footage.notes || "");
    setTargetFolderId(footage.folderId || "");
    setStatus("idle");
    setError("");
  }, [footage]);

  if (!footage) return null;

  async function saveChanges(event) {
    event.preventDefault();
    setStatus("saving");
    setError("");

    try {
      const metadataResponse = await fetch("/api/footage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-metadata",
          fileId: footage.id,
          displayName,
          usageType,
          notes,
        }),
      });
      const metadataPayload = await metadataResponse.json().catch(() => null);
      if (!metadataResponse.ok || !metadataPayload?.ok) {
        throw new Error(metadataPayload?.error || "未能更新 Footage 資料");
      }

      if (targetFolderId && targetFolderId !== footage.folderId) {
        const moveResponse = await fetch("/api/footage/move", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileId: footage.id, targetFolderId }),
        });
        const movePayload = await moveResponse.json().catch(() => null);
        if (!moveResponse.ok || !movePayload?.ok) {
          throw new Error(movePayload?.error || "資料已更新，但未能移動到新療程 Folder");
        }
      }

      setStatus("saved");
      await onSaved?.();
      onClose?.();
    } catch (saveError) {
      setStatus("error");
      setError(saveError?.message || "儲存失敗");
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="關閉 Footage 編輯器"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="footage-editor-title"
        className="relative z-10 max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-[30px] bg-white shadow-2xl sm:rounded-[30px]"
      >
        <div className="flex items-start justify-between gap-5 border-b border-slate-200 px-6 py-5 sm:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">Footage Detail</p>
            <h2 id="footage-editor-title" className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
              簡單整理素材
            </h2>
            <p className="mt-1 text-sm text-slate-500">只需要名稱、療程 Folder、用途同備註。</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-lg text-slate-500 transition hover:bg-slate-50"
          >
            ×
          </button>
        </div>

        <form onSubmit={saveChanges} className="space-y-5 p-6 sm:p-8">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">素材名稱</span>
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              required
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
            />
          </label>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">療程 Folder</span>
              <select
                value={targetFolderId}
                onChange={(event) => setTargetFolderId(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
              >
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.path}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">主要用途</span>
              <select
                value={usageType}
                onChange={(event) => setUsageType(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
              >
                {FOOTAGE_USAGE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">備註</span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={4}
              placeholder="例如：適合放片頭、畫面較穩、不要用原聲"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm leading-6 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
            />
          </label>

          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-500">
            原檔：{footage.name}<br />
            Google Drive 會繼續保存原始影片；App 只更新分類資料，不會重新壓縮或複製檔案。
          </div>

          {error && (
            <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={status === "saving"}
              className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {status === "saving" ? "儲存中..." : "儲存變更"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
