"use client";

import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import type { User } from "@/lib/types";

export function MobileNav({ user }: { user: User | null }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (!user) return null;

  return (
    <>
      {/* Floating hamburger — only visible on mobile */}
      <button
        onClick={() => setDrawerOpen(true)}
        aria-label="Open navigation menu"
        className="fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#14B8A6] to-[#0EA5E9] text-white shadow-lg md:hidden"
      >
        <Menu size={22} />
      </button>

      {/* Full-screen drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="flex-1 bg-black/40 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="mobile-drawer relative w-64 bg-[#0B1120]">
            <button
              onClick={() => setDrawerOpen(false)}
              aria-label="Close navigation menu"
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20"
            >
              <X size={16} />
            </button>
            <Sidebar user={user} onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}

