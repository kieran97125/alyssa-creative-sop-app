"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function CreativeToolLauncher() {
  const pathname = usePathname();

  if (pathname?.startsWith("/login")) return null;

  const onRemixPage = pathname?.startsWith("/remix") || pathname?.startsWith("/footage");
  const href = onRemixPage ? "/" : "/remix";
  const label = onRemixPage ? "Creative App" : "Reference Remix";

  return (
    <Link
      href={href}
      className="fixed bottom-5 right-5 z-[70] flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-2xl transition hover:-translate-y-0.5 hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-200"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10" aria-hidden="true">
        {onRemixPage ? "✦" : "↗"}
      </span>
      <span>{label}</span>
    </Link>
  );
}
