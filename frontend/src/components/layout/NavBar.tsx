"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { User } from "@/lib/types";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/assistant", label: "Assistant" },
  { href: "/calendar", label: "Calendar" },
  { href: "/conflicts", label: "Conflicts" },
  { href: "/subjects", label: "Subjects" },
  { href: "/tasks", label: "Tasks" },
  { href: "/exams", label: "Exams" },
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

export function NavBar({ user }: { user: User | null }) {
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="sticky top-0 z-10 border-b border-ink-faint/15 bg-paper/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link href="/" className="font-display text-lg font-semibold tracking-tight text-ink">
          Smart Timetable
        </Link>
        {user ? (
          <div className="flex items-center gap-1">
            {LINKS.map((link) => {
              const active = pathname === link.href || pathname.startsWith(link.href + "/");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-navy text-white"
                      : "text-ink-soft hover:bg-paper-dim hover:text-ink"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            <div className="ml-3 flex items-center gap-2 border-l border-ink-faint/20 pl-3">
              <Link
                href="/settings"
                className="rounded-md px-2 py-1.5 text-sm text-ink-soft hover:bg-paper-dim hover:text-ink"
              >
                Settings
              </Link>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brass text-xs font-semibold text-white">
                {initials(user.full_name)}
              </span>
              <button
                onClick={handleLogout}
                className="rounded-md border border-ink-faint/25 px-3 py-1.5 text-sm text-ink-soft transition-colors hover:border-brick hover:text-brick"
              >
                Log out
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-ink-soft hover:text-ink">
              Log in
            </Link>
            <Link
              href="/register"
              className="rounded-md bg-navy px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-navy-dark"
            >
              Get started
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}