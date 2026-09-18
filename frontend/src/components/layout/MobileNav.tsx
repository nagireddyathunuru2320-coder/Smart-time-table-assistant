"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  CheckSquare,
  Bot,
  MoreHorizontal,
  BarChart3,
  BookOpen,
  GraduationCap,
  AlertTriangle,
  Settings as SettingsIcon,
  LogOut,
  X,
  Sparkles,
} from "lucide-react";
import type { User } from "@/lib/types";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export function MobileNav({ user }: { user: User | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);

  if (!user) return null;

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const isDashboard = pathname === "/dashboard";
  const isCalendar = pathname.startsWith("/calendar");
  const isTasks = pathname.startsWith("/tasks");
  const isAssistant = pathname.startsWith("/assistant");

  // Secondary links for the "More" bottom sheet
  const moreLinks = [
    { href: "/analytics", label: "Analytics", icon: BarChart3, desc: "Study trends & progress" },
    { href: "/subjects", label: "Subjects", icon: BookOpen, desc: "Manage courses & curriculum" },
    { href: "/exams", label: "Exams", icon: GraduationCap, desc: "Exam schedules & countdowns" },
    { href: "/conflicts", label: "Conflicts", icon: AlertTriangle, desc: "Schedule clashes & resolutions" },
    { href: "/settings", label: "Settings", icon: SettingsIcon, desc: "Preferences & profile" },
  ];

  return (
    <>
      {/* ================= BOTTOM NAVIGATION DOCK (MOBILE ONLY) ================= */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 block md:hidden bg-[#0B1120]/95 backdrop-blur-2xl border-t border-white/10 shadow-[0_-8px_25px_rgba(0,0,0,0.35)]"
      >
        <div className="relative mx-auto flex max-w-lg items-center justify-around px-2 py-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {/* 1. Left Item 1: Calendar */}
          <Link
            href="/calendar"
            className={`flex flex-col items-center justify-center py-1 px-3 transition-colors ${
              isCalendar ? "text-teal-400 font-semibold" : "text-slate-400 hover:text-white"
            }`}
          >
            <span className="relative">
              <Calendar size={19} />
              {isCalendar && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-teal-400 shadow-[0_0_6px_#2dd4bf]" />
              )}
            </span>
            <span className="mt-1 text-[10px] tracking-tight">Calendar</span>
          </Link>

          {/* 2. Left Item 2: Tasks */}
          <Link
            href="/tasks"
            className={`flex flex-col items-center justify-center py-1 px-3 transition-colors ${
              isTasks ? "text-teal-400 font-semibold" : "text-slate-400 hover:text-white"
            }`}
          >
            <span className="relative">
              <CheckSquare size={19} />
              {isTasks && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-teal-400 shadow-[0_0_6px_#2dd4bf]" />
              )}
            </span>
            <span className="mt-1 text-[10px] tracking-tight">Tasks</span>
          </Link>

          {/* 3. CENTER: DASHBOARD (ELEVATED PROMINENT BUTTON) */}
          <div className="flex flex-col items-center">
            <Link
              href="/dashboard"
              aria-label="Dashboard"
              className={`relative -top-4 flex h-13 w-13 items-center justify-center rounded-2xl shadow-xl transition-transform active:scale-95 ${
                isDashboard
                  ? "bg-gradient-to-tr from-teal-400 via-sky-500 to-cyan-400 text-white shadow-sky-500/40 ring-4 ring-[#0B1120] scale-105"
                  : "bg-gradient-to-tr from-slate-800 to-slate-700 text-slate-200 shadow-black/40 ring-4 ring-[#0B1120] hover:scale-100"
              }`}
            >
              <LayoutDashboard size={22} className={isDashboard ? "drop-shadow" : ""} />
              {/* Pulsing subtle glow for center hero button */}
              {isDashboard && (
                <span className="pointer-events-none absolute inset-0 rounded-2xl bg-cyan-400/20 animate-pulse" />
              )}
            </Link>
            <span
              className={`-mt-3 text-[10px] font-bold tracking-tight transition-colors ${
                isDashboard ? "text-teal-400" : "text-slate-400"
              }`}
            >
              Dashboard
            </span>
          </div>

          {/* 4. Right Item 1: Assistant */}
          <Link
            href="/assistant"
            className={`flex flex-col items-center justify-center py-1 px-3 transition-colors ${
              isAssistant ? "text-teal-400 font-semibold" : "text-slate-400 hover:text-white"
            }`}
          >
            <span className="relative">
              <Bot size={19} />
              {isAssistant && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-teal-400 shadow-[0_0_6px_#2dd4bf]" />
              )}
            </span>
            <span className="mt-1 text-[10px] tracking-tight">AI Tutor</span>
          </Link>

          {/* 5. Right Item 2: More Menu Trigger */}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            aria-label="More options"
            className={`flex flex-col items-center justify-center py-1 px-3 transition-colors ${
              moreOpen ? "text-teal-400 font-semibold" : "text-slate-400 hover:text-white"
            }`}
          >
            <span className="relative">
              <MoreHorizontal size={19} />
              {moreOpen && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-teal-400 shadow-[0_0_6px_#2dd4bf]" />
              )}
            </span>
            <span className="mt-1 text-[10px] tracking-tight">More</span>
          </button>
        </div>
      </nav>

      {/* ================= MORE OPTIONS BOTTOM SHEET (SLIDE-UP) ================= */}
      {moreOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end md:hidden animate-in fade-in duration-200">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMoreOpen(false)}
          />

          {/* Bottom Sheet Modal */}
          <div className="relative z-10 w-full rounded-t-3xl border-t border-white/15 bg-[#0B1120]/95 p-5 pb-8 backdrop-blur-2xl shadow-2xl animate-in slide-in-from-bottom duration-250">
            {/* Grab handle indicator */}
            <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-white/20" />

            {/* Header */}
            <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-teal-500/20 text-teal-400">
                  <Sparkles size={14} />
                </span>
                <span className="text-sm font-bold text-white">More Navigation</span>
              </div>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                aria-label="Close menu"
                className="rounded-full bg-white/10 p-1.5 text-slate-400 hover:bg-white/20 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {/* Links Grid */}
            <div className="grid grid-cols-1 gap-2">
              {moreLinks.map((item) => {
                const Icon = item.icon;
                const active = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={`flex items-center gap-3 rounded-2xl p-3 transition-all ${
                      active
                        ? "bg-gradient-to-r from-teal-500/20 to-sky-500/20 border border-teal-500/40 text-teal-300"
                        : "bg-white/[0.04] border border-white/5 text-slate-300 hover:bg-white/[0.08] hover:text-white"
                    }`}
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        active
                          ? "bg-gradient-to-br from-teal-400 to-sky-500 text-white shadow-md shadow-teal-500/30"
                          : "bg-white/10 text-slate-300"
                      }`}
                    >
                      <Icon size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{item.label}</p>
                      <p className="text-[11px] text-slate-400 truncate">{item.desc}</p>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* User Profile & Logout section in sheet */}
            <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.05] p-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-sky-500 text-xs font-bold text-white shadow-xs">
                  {initials(user.full_name)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-white">{user.full_name}</p>
                  <p className="text-[10px] text-slate-400">Signed In</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition-colors"
              >
                <LogOut size={13} />
                <span>Log out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
