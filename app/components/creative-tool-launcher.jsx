"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const FOOTAGE_SELECTION_STORAGE_KEY = "alyssaCreativeSop.footageSelection.v1";

function readSelectionCount() {
  if (typeof window === "undefined") return 0;

  try {
    const parsed = JSON.parse(window.localStorage.getItem(FOOTAGE_SELECTION_STORAGE_KEY) || "null");
    return Array.isArray(parsed?.items) ? parsed.items.length : 0;
  } catch {
    return 0;
  }
}

export function CreativeToolLauncher() {
  const pathname = usePathname();
  const [selectionCount, setSelectionCount] = useState(0);

  useEffect(() => {
    const refresh = () => setSelectionCount(readSelectionCount());
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("alyssa-footage-selection-updated", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("alyssa-footage-selection-updated", refresh);
    };
  }, []);

  if (pathname?.startsWith("/login")) return null;

  const onFootagePage = pathname?.startsWith("/footage");
  const href = onFootagePage ? "/" : "/footage";
  const label = onFootagePage ? "Creative App" : "Footage Library";

  return (
    <Link
      href={href}
      className="fixed bottom-5 right-5 z-[70] flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-2xl transition hover:-translate-y-0.5 hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-200"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10" aria-hidden="true">
        {onFootagePage ? "✦" : "▶"}
      </span>
      <span>{label}</span>
      {!onFootagePage && selectionCount > 0 && (
        <span className="rounded-full bg-indigo-500 px-2 py-0.5 text-xs font-bold text-white">
          {selectionCount}
        </span>
      )}
    </Link>
  );
}
