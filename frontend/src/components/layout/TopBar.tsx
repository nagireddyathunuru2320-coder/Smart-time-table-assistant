"use client";

import { NotificationBell } from "@/components/layout/NotificationBell";
import type { User } from "@/lib/types";

export function TopBar({ user }: { user: User | null }) {
  if (!user) return null;
  return (
    <header className="sticky top-0 z-30 flex items-center justify-end gap-4 border-b border-ink/5 bg-paper/80 px-8 py-3.5 backdrop-blur-md">
      <NotificationBell />
    </header>
  );
}
