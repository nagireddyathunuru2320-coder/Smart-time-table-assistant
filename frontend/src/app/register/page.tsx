"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Sparkles, GraduationCap } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const registerResponse = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, full_name: fullName, password }),
      });

      let registerData: any = null;
      try {
        registerData = await registerResponse.json();
      } catch {
        registerData = null;
      }

      if (!registerResponse.ok) {
        const message =
          registerData && Array.isArray(registerData.detail)
            ? registerData.detail.map((d: { msg: string }) => d.msg).join(", ")
            : registerData && typeof registerData.detail === "string"
            ? registerData.detail
            : registerResponse.status === 503
            ? "Backend server is unreachable. Please ensure the backend is running."
            : "Registration failed. Please try again.";
        setError(message);
        setLoading(false);
        return;
      }

      const loginResponse = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      setLoading(false);

      if (!loginResponse.ok) {
        router.push("/login");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setLoading(false);
      setError("Network error. Please check your connection and try again.");
    }
  }

  return (
    <div className="relative flex min-h-screen w-full overflow-hidden lg:items-center lg:justify-between">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/auth-bg.jpg')" }}
      />
      {/* Dark overlay — stronger on mobile so form is readable */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#080E1B]/80 via-[#080E1B]/50 to-[#080E1B]/70 lg:bg-gradient-to-r lg:from-[#080E1B]/55 lg:via-transparent lg:to-transparent" />

      {/* Top right minimal navigation — desktop only */}
      <div className="absolute right-8 top-7 z-20 hidden items-center gap-3 text-xs font-semibold tracking-[0.25em] text-slate-400/90 lg:flex">
        <span>— PLAN</span>
        <span>/</span>
        <span>LEARN</span>
        <span>/</span>
        <span>ACHIEVE</span>
      </div>

      {/* Left panel — hidden on mobile, visible on desktop */}
      <div className="relative z-10 hidden lg:flex lg:min-h-screen lg:w-[48%] lg:flex-col lg:justify-between lg:px-14 lg:py-10">
        {/* Top brand header */}
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-teal-500 shadow-lg shadow-cyan-500/30">
            <Sparkles size={18} className="text-white" />
          </span>
          <span className="text-sm font-bold tracking-widest text-white drop-shadow-md">SMART TIMETABLE</span>
        </div>

        {/* Middle Hero content */}
        <div className="my-auto max-w-md py-6">
          <h1 className="text-5xl xl:text-6xl font-extrabold leading-[1.08] tracking-tight text-white drop-shadow-lg">
            Start Your
            <br />
            Journey
            <br />
            Toward
            <br />
            <span className="bg-gradient-to-r from-cyan-300 via-sky-300 to-teal-200 bg-clip-text text-transparent drop-shadow">
              Success.
            </span>
          </h1>

          <p className="mt-5 text-sm sm:text-base leading-relaxed text-slate-200/95 drop-shadow">
            Create your workspace and start planning smarter, studying better, and achieving more.
          </p>

          {/* Quote Badge */}
          <div className="mt-7 inline-flex items-center gap-3.5 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-md shadow-2xl shadow-black/40">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/30 border border-cyan-400/50 text-cyan-200 shadow-inner">
              <GraduationCap size={20} />
            </span>
            <p className="text-sm font-medium italic leading-snug text-white drop-shadow">
              &ldquo;Good Students Build
              <br />
              Great Futures&rdquo;
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2.5 text-xs text-slate-300/90 drop-shadow">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-[11px] font-bold text-white border border-white/25">
            N
          </span>
          <span>© Smart Timetable. Built for ambitious students.</span>
        </div>
      </div>

      {/* Mobile top bar — visible only on mobile */}
      <div className="absolute left-0 right-0 top-0 z-20 flex items-center gap-2.5 px-5 py-5 lg:hidden">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-teal-500 shadow-lg shadow-cyan-500/30">
          <Sparkles size={18} className="text-white" />
        </span>
        <span className="text-sm font-bold tracking-widest text-white drop-shadow-md">SMART TIMETABLE</span>
      </div>

      {/* Right panel (Floating Frosted Glass Card) */}
      <div className="relative z-10 flex min-h-screen w-full flex-col items-center justify-center px-3 pb-6 pt-20 sm:px-5 lg:min-h-0 lg:flex-1 lg:px-12 lg:py-10">
        {/* Cyan ambient underglow leaking beneath the glass card */}
        <div className="auth-card-ambient-glow" />

        {/* THE AUTHENTIC FROSTED GLASS CARD */}
        <div className="auth-glass-card relative z-10 w-full p-6 sm:p-8 lg:max-w-[420px] lg:p-9">
          {/* Card Header */}
          <div className="mb-7 flex flex-col items-center text-center">
            <span className="mb-4 flex h-13 w-13 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0B1528] via-[#0F1D36] to-[#0A101D] border border-cyan-400/40 shadow-xl shadow-cyan-950/30">
              <Sparkles size={22} className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.7)]" />
            </span>
            <h2 className="text-2xl sm:text-[28px] font-bold tracking-tight text-slate-900">
              Create Account
            </h2>
            <p className="mt-1.5 text-sm font-medium text-slate-500">
              Start organizing your semester today
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Full name</label>
              <div className="relative">
                <User
                  size={17}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  type="text"
                  required
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="auth-glass-input py-3 pl-11 pr-4 text-sm font-medium"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Email</label>
              <div className="relative">
                <Mail
                  size={17}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  type="email"
                  required
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="auth-glass-input py-3 pl-11 pr-4 text-sm font-medium"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Password</label>
              <div className="relative">
                <Lock
                  size={17}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="auth-glass-input py-3 pl-11 pr-11 text-sm font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors p-1"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50/95 px-3.5 py-2.5 text-sm font-medium text-rose-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="auth-btn-primary mt-2"
            >
              <span>{loading ? "Creating account..." : "Create Account"}</span>
              {!loading && <ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" />}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-sky-600 hover:text-sky-700 hover:underline transition-colors">
              Log in
            </Link>
          </p>
          <p className="mt-3 text-center text-xs italic text-slate-400 font-normal">
            Don&apos;t just study. Build a better you.
          </p>
        </div>

        {/* Mobile footer */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-300/80 drop-shadow lg:hidden">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold text-white border border-white/25">N</span>
          <span>© Smart Timetable. Built for ambitious students.</span>
        </div>
      </div>
    </div>
  );
}