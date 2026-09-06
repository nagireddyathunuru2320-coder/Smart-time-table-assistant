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

export function Sidebar({ user }: { user: User | null }) {
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  if (!user) return null;

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col overflow-y-auto bg-[#141726] px-4 py-6">
      <div className="mb-8 flex items-center gap-2 px-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-navy text-white">
          <CalendarClock size={20} />
        </span>
        <span className="text-base font-semibold text-white">Smart Timetable</span>
      </div>
      <nav className="flex flex-1 flex-col gap-1">
        {LINKS.map((link) => {
          const active = pathname === link.href || pathname.startsWith(link.href + "/");
          const Icon = link.icon;
          return (
            <Link key={link.href} href={link.href} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${active ? "bg-navy text-white" : "text-white/60 hover:bg-white/5 hover:text-white"}`}>
              <Icon size={18} />
              {link.label}
            </Link>
          );
        })}
      </nav>
      <Link href="/settings" className={`mb-3 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${pathname.startsWith("/settings") ? "bg-navy text-white" : "text-white/60 hover:bg-white/5 hover:text-white"}`}>
        <SettingsIcon size={18} />
        Settings
      </Link>
      <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-navy to-brass text-xs font-semibold text-white">{initials(user.full_name)}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">{user.full_name}</p>
          <p className="text-xs text-white/50">Student</p>
        </div>
        <button onClick={handleLogout} aria-label="Log out" className="rounded-md p-1.5 text-white/50 hover:bg-white/10 hover:text-white">
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
