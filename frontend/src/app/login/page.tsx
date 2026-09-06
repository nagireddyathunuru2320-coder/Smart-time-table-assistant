"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    setLoading(false);

    if (!response.ok) {
      const data = await response.json();
      setError(typeof data.detail === "string" ? data.detail : "Login failed");
      return;
    }

    const next = searchParams.get("next") ?? "/dashboard";
    router.push(next);
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-4">
      <div className="glass-panel w-full max-w-sm rounded-2xl p-8 shadow-sm">
        <h1 className="font-display mb-1 text-2xl font-semibold text-ink">Welcome back</h1>
        <p className="mb-6 text-sm text-ink-soft">Log in to see your schedule.</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-ink-faint/25 px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-navy"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-ink-faint/25 px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-navy"
            />
          </div>
          {error && <p className="rounded-md bg-brick-light px-3 py-2 text-sm text-brick">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-md bg-navy px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy-dark disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-ink-soft">
          No account?{" "}
          <Link href="/register" className="font-medium text-navy hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}