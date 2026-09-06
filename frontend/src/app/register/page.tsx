"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-4">
      <div className="glass-panel w-full max-w-sm rounded-2xl p-8 shadow-sm">
        <h1 className="font-display mb-1 text-2xl font-semibold text-ink">Create your account</h1>
        <p className="mb-6 text-sm text-ink-soft">Start organizing your semester.</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Full name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-md border border-ink-faint/25 px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-navy"
            />
          </div>
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
              minLength={8}
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
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-ink-soft">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-navy hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}