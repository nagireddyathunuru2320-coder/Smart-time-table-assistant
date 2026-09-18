"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  Bot,
  Calendar,
  CalendarClock,
  CheckSquare,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Settings as SettingsIcon,
} from "lucide-react";
import type { User } from "@/lib/types";

const LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/assistant", label: "Assistant", icon: Bot },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/conflicts", label: "Conflicts", icon: AlertTriangle },
  { href: "/subjects", label: "Subjects", icon: BookOpen },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/exams", label: "Exams", icon: GraduationCap },
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export function Sidebar({ user, onNavigate }: { user: User | null; onNavigate?: () => void }) {
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  if (!user) return null;

  return (
    <aside className="desktop-sidebar flex h-full w-64 shrink-0 flex-col overflow-y-auto bg-[#0B1120]/90 backdrop-blur-2xl px-4 py-6 border-r border-white/10 shadow-xl">
      <div className="mb-8 flex items-center gap-3 px-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-sky-500 text-white shadow-lg shadow-teal-500/30 border border-white/20">
          <CalendarClock size={20} />
        </span>
        <div>
          <span className="block text-base font-bold tracking-tight text-white drop-shadow-xs">Smart Timetable</span>
          <span className="block text-[10px] font-semibold tracking-wider text-teal-400/90 uppercase">Plan · Learn · Achieve</span>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-1.5">
        {LINKS.map((link) => {
          const active = pathname === link.href || pathname.startsWith(link.href + "/");
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                active
                  ? "bg-gradient-to-r from-teal-500 to-sky-500 text-white shadow-lg shadow-teal-500/25 border border-white/20 font-semibold"
                  : "text-slate-400 hover:bg-white/[0.08] hover:text-white"
              }`}
            >
              <Icon size={18} className={active ? "text-white" : "text-slate-400 group-hover:text-white"} />
              {link.label}
            </Link>
          );
        })}
      </nav>
      <Link
        href="/settings"
        onClick={onNavigate}
        className={`mb-3 flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
          pathname.startsWith("/settings")
            ? "bg-gradient-to-r from-teal-500 to-sky-500 text-white shadow-lg shadow-teal-500/25 border border-white/20 font-semibold"
            : "text-slate-400 hover:bg-white/[0.08] hover:text-white"
        }`}
      >
        <SettingsIcon size={18} />
        Settings
      </Link>
      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-3 backdrop-blur-md transition-colors hover:bg-white/[0.09]">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-sky-500 text-xs font-bold text-white shadow-xs">
          {initials(user.full_name)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{user.full_name}</p>
          <p className="text-[11px] font-medium text-teal-300/80">Active Student</p>
        </div>
        <button
          onClick={handleLogout}
          aria-label="Log out"
          className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-rose-400 transition-colors"
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
