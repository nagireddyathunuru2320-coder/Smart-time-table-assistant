"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User as UserIcon, Mail, Lock, ArrowRight, Sparkles } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const registerResponse = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, full_name: fullName, password }),
    });

    if (!registerResponse.ok) {
      const data = await registerResponse.json();
      const message = Array.isArray(data.detail)
        ? data.detail.map((d: { msg: string }) => d.msg).join(", ")
        : data.detail ?? "Registration failed";
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
            <h2 className="font-display text-2xl font-bold tracking-tight text-ink">Create Your Account</h2>
            <p className="mt-1.5 text-xs text-ink-soft">Start organizing your semester with confidence</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink">Full Name</label>
              <div className="relative">
                <UserIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" size={16} />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Vivek G"
                  className="glass-input w-full py-2.5 pl-10 pr-4 text-sm text-ink outline-none"
                />
              </div>
            </div>

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
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="glass-input w-full py-2.5 pl-10 pr-4 text-sm text-ink outline-none"
                />
              </div>
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
              <span>{loading ? "Creating account..." : "Create Account"}</span>
              <ArrowRight size={16} />
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-ink-soft">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-navy hover:underline">
              Log in
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