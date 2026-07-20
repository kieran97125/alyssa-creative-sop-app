"use client";

function formatDuration(durationMillis) {
  const totalSeconds = Math.max(0, Math.round(Number(durationMillis || 0) / 1000));
  if (!totalSeconds) return "片長未讀取";
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes ? `${minutes}:${String(seconds).padStart(2, "0")}` : `${seconds}s`;
}

function formatSize(size) {
  const bytes = Number(size || 0);
  if (!bytes) return "";
  const megabytes = bytes / 1024 / 1024;
  return `${megabytes.toFixed(megabytes >= 100 ? 0 : 1)} MB`;
}

export function FootageCard({ footage, selected, onToggle, onEdit }) {
  const dimensions = footage.width && footage.height ? `${footage.width}×${footage.height}` : "";

  return (
    <article
      className={`group overflow-hidden rounded-[26px] border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        selected ? "border-indigo-500 ring-4 ring-indigo-100" : "border-slate-200"
      }`}
    >
      <button
        type="button"
        onClick={() => onToggle(footage.id)}
        aria-pressed={selected}
        className="relative block aspect-video w-full overflow-hidden bg-slate-100 text-left"
      >
        {footage.thumbnailLink ? (
          <img
            src={footage.thumbnailLink}
            alt={`${footage.displayName} preview`}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 px-5 text-center">
            <span className="text-3xl">▶</span>
            <span className="mt-3 text-xs font-semibold text-slate-500">Google Drive Video</span>
          </div>
        )}
        <span
          className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border text-sm font-bold shadow-sm ${
            selected
              ? "border-indigo-600 bg-indigo-600 text-white"
              : "border-white/80 bg-white/90 text-slate-500"
          }`}
        >
          {selected ? "✓" : "+"}
        </span>
        <span className="absolute bottom-3 left-3 rounded-full bg-slate-950/80 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
          {formatDuration(footage.durationMillis)}
        </span>
      </button>

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-slate-950">{footage.displayName}</p>
            <p className="mt-1 truncate text-xs text-slate-500">{footage.folderPath}</p>
          </div>
          <button
            type="button"
            onClick={() => onEdit(footage)}
            className="shrink-0 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:bg-slate-50"
          >
            編輯
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
            {footage.usageType || "未分類"}
          </span>
          {dimensions && (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{dimensions}</span>
          )}
          {formatSize(footage.size) && (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {formatSize(footage.size)}
            </span>
          )}
        </div>

        {footage.notes && <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-600">{footage.notes}</p>}

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <span className="truncate text-xs font-medium text-slate-400">{footage.treatment}</span>
          <a
            href={footage.webViewLink}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 text-xs font-semibold text-slate-700 underline decoration-slate-300 underline-offset-4 hover:text-slate-950"
          >
            Drive 開啟
          </a>
        </div>
      </div>
    </article>
  );
}
