"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, ArrowRight, Sparkles } from "lucide-react";

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
    <div className="flex min-h-screen bg-[#EEF2F7]">
      {/* Left decorative branding column */}
      <div className="relative hidden w-5/12 flex-col justify-between overflow-hidden bg-gradient-to-br from-[#0B1120] via-[#0D1B2A] to-[#0F3D3A] p-12 text-white md:flex lg:p-16">
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 text-teal-400">
            <Sparkles size={18} />
            <span className="text-xs font-bold uppercase tracking-[0.25em]">Smart Timetable</span>
          </div>
        </div>

        <div className="relative z-10 my-auto">
          <h1 className="text-4xl font-extrabold leading-[1.15] tracking-tight lg:text-5xl">
            Smarter <br />
            Study. <br />
            Brighter <br />
            <span className="gradient-text">Tomorrow.</span>
          </h1>
          <p className="mt-4 text-xs tracking-wider text-white/50 uppercase">
            Organize · Plan · Learn · Achieve
          </p>

          <div className="mt-10 max-w-xs rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
            <p className="text-sm font-medium italic text-white/80">
              &ldquo;Good Students Build Great Futures&rdquo;
            </p>
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-xs text-white/40">© Smart Timetable. Built for ambitious students.</p>
        </div>
      </div>

      {/* Right form column */}
      <div className="flex flex-1 items-center justify-center p-6 md:p-12">
        <div className="glass-panel w-full max-w-md rounded-3xl p-8 sm:p-10">
          <div className="mb-6 text-center">
            <h2 className="font-display text-2xl font-bold tracking-tight text-ink">Welcome Back</h2>
            <p className="mt-1.5 text-xs text-ink-soft">Sign in to continue to your workspace</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink">Email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" size={16} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="glass-input w-full py-2.5 pl-10 pr-4 text-sm text-ink outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink">Password</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" size={16} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="glass-input w-full py-2.5 pl-10 pr-4 text-sm text-ink outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-ink-soft">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="h-3.5 w-3.5 rounded accent-navy" />
                <span>Remember me</span>
              </label>
              <span className="cursor-pointer text-navy hover:underline">Forgot password?</span>
            </div>

            {error && (
              <p className="rounded-xl bg-brick-light px-3.5 py-2.5 text-xs font-medium text-brick">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-specular gradient-accent mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white shadow-md disabled:opacity-50"
            >
              <span>{loading ? "Signing in..." : "Sign In"}</span>
              <ArrowRight size={16} />
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-ink-soft">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-semibold text-navy hover:underline">
              Register
            </Link>
          </p>

          <p className="mt-4 text-center text-[11px] text-ink-faint italic">
            Don&apos;t just study. Build a better you.
          </p>
        </div>
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