"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, CheckSquare, GraduationCap } from "lucide-react";
import {
  type Notification,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/notifications-api";

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  async function refresh() {
    try {
      const data = await listNotifications();
      setNotifications(data);
    } catch {
      // Keep the existing list if a background refresh fails.
    } finally {
      setLoaded(true);
    }
  }

  useEffect(() => {
    const initialRefresh = window.setTimeout(() => void refresh(), 0);
    const interval = setInterval(refresh, 60000);
    return () => {
      window.clearTimeout(initialRefresh);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((notification) => notification.status === "unread").length;

  async function handleOpen(id: number) {
    setNotifications((prev) => prev.map((notification) => notification.id === id ? { ...notification, status: "read" } : notification));
    try {
      await markNotificationRead(id);
    } catch {
      refresh();
    }
  }

  async function handleMarkAllRead() {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, status: "read" })));
    try {
      await markAllNotificationsRead();
    } catch {
      refresh();
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        aria-label="Notifications"
        aria-expanded={open}
        onClick={() => setOpen((isOpen) => !isOpen)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white text-ink-soft shadow-sm hover:text-ink"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brick px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="glass-panel absolute right-0 top-11 z-20 w-80 rounded-2xl p-2">
          <div className="flex items-center justify-between px-2 py-1.5">
            <p className="text-sm font-semibold text-ink">Notifications</p>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="text-xs font-medium text-navy hover:underline">
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {!loaded ? (
              <p className="px-2 py-6 text-center text-sm text-ink-soft">Loading...</p>
            ) : notifications.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-ink-soft">You&apos;re all caught up.</p>
            ) : (
              <ul className="flex flex-col gap-1">
                {notifications.map((notification) => {
                  const Icon = notification.notification_type === "exam_reminder" ? GraduationCap : CheckSquare;
                  return (
                    <li key={notification.id}>
                      <button
                        onClick={() => handleOpen(notification.id)}
                        className={`flex w-full items-start gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-paper-dim ${notification.status === "unread" ? "bg-brass-light/40" : ""}`}
                      >
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brass-light text-navy">
                          <Icon size={15} />
                        </span>
                        <span className="flex-1">
                          <span className="block text-sm font-medium text-ink">{notification.title}</span>
                          <span className="block text-xs text-ink-soft">{notification.body}</span>
                          <span className="mt-0.5 block text-[11px] text-ink-faint">{timeAgo(notification.created_at)}</span>
                        </span>
                        {notification.status === "unread" && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-navy" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
