"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus("loading");
    setError("");

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || "登入失敗");
      }

      const nextPath = searchParams.get("next") || "/";
      router.replace(nextPath);
      router.refresh();
    } catch (err) {
      setError(err?.message || "登入失敗");
    } finally {
      setStatus("idle");
    }
  }

  return (
    <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
      <div className="mb-6">
        <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
          ✦
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">
          AI Creative Script Generator
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          Internal creative automation tool. Please enter password to continue.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter internal password"
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
        />

        <button
          type="submit"
          disabled={status === "loading"}
          className="mt-4 w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
        >
          {status === "loading" ? "Checking..." : "Login"}
        </button>
      </form>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <p className="mt-6 text-xs leading-relaxed text-slate-400">
        Internal use only. Do not share this link externally.
      </p>
    </div>
  );
}

function LoginFallback() {
  return (
    <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
      <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
        ✦
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-950">
        AI Creative Script Generator
      </h1>
      <p className="mt-2 text-sm text-slate-500">Loading login...</p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6">
      <Suspense fallback={<LoginFallback />}>
        <LoginForm />
      </Suspense>
    </main>
  );
}