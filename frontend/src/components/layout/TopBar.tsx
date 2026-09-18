"use client";

import { NotificationBell } from "@/components/layout/NotificationBell";
import type { User } from "@/lib/types";
import { Sparkles } from "lucide-react";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export function TopBar({ user }: { user: User | null }) {
  if (!user) return null;

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/60 bg-white/70 px-4 py-3 sm:px-8 backdrop-blur-xl transition-all shadow-[0_2px_12px_rgba(15,23,42,0.03)]">
      {/* Left side: Workspace branding / live indicator */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-full border border-sky-200/60 bg-sky-50/70 px-3 py-1 shadow-2xs backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-500" />
          </span>
          <span className="text-[11px] font-semibold tracking-wide text-slate-700">
            Study Workspace
          </span>
        </div>
        <div className="hidden items-center gap-1.5 text-xs text-slate-500 md:flex">
          <Sparkles size={13} className="text-teal-500" />
          <span className="font-medium">All systems synced</span>
        </div>
      </div>

      {/* Right side: Notification Bell & Quick Profile summary */}
      <div className="flex items-center gap-3.5">
        <NotificationBell />
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200/60">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-sky-600 text-xs font-bold text-white shadow-xs">
            {getInitials(user.full_name)}
          </span>
          <span className="hidden text-xs font-semibold text-slate-700 sm:inline-block">
            {user.full_name.split(" ")[0]}
          </span>
        </div>
      </div>
    </header>
  );
}
