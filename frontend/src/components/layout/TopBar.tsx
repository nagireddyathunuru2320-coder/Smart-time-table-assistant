"use client";

import { Search } from "lucide-react";
import { NotificationBell } from "@/components/layout/NotificationBell";
import type { User } from "@/lib/types";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export function TopBar({ user }: { user: User | null }) {
  if (!user) return null;
  return (
    <div className="flex items-center justify-end gap-3 px-6 py-4">
      <button aria-label="Search" className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-ink-soft shadow-sm hover:text-ink"><Search size={16} /></button>
      <NotificationBell />
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-navy to-brass text-xs font-semibold text-white">{initials(user.full_name)}</span>
    </div>
  );
}
