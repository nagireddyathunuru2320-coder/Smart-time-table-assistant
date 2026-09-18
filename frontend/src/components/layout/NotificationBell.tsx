"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, CheckSquare, GraduationCap, Trash2, X } from "lucide-react";
import {
  type Notification,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  deleteNotification,
  clearAllNotifications,
} from "@/lib/notifications-api";

async function listInAppNotifications(): Promise<Notification[]> {
  const notifications = await listNotifications();
  return notifications.filter((notification) => notification.channel === "in_app");
}

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

  const mountedRef = useRef(true);

  async function refresh() {
    try {
      const data = await listInAppNotifications();
      if (mountedRef.current) setNotifications(data);
    } catch {
      // Keep the existing list if a background refresh fails.
    } finally {
      if (mountedRef.current) setLoaded(true);
    }
  }

  useEffect(() => {
    mountedRef.current = true;
    async function loadInitialNotifications() {
      try {
        const data = await listInAppNotifications();
        if (mountedRef.current) setNotifications(data);
      } catch {
        // Keep the initial list empty if loading fails.
      } finally {
        if (mountedRef.current) setLoaded(true);
      }
    }

    void loadInitialNotifications();
    // Poll every 60 seconds
    const interval = setInterval(() => void refresh(), 60000);
    return () => {
      mountedRef.current = false;
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

  async function handleDelete(id: number, e: React.MouseEvent) {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
    try {
      await deleteNotification(id);
    } catch {
      refresh();
    }
  }

  async function handleClearAll() {
    setNotifications([]);
    try {
      await clearAllNotifications();
    } catch {
      refresh();
    }
  }

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        aria-label="Notifications"
        aria-expanded={open}
        onClick={() => setOpen((isOpen) => !isOpen)}
        className={`relative flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-200 ${
          open
            ? "border-sky-400 bg-sky-50 text-sky-600 shadow-md shadow-sky-500/15"
            : "border-slate-200/80 bg-white/80 text-slate-600 shadow-xs hover:border-slate-300 hover:bg-white hover:text-slate-900"
        }`}
      >
        <Bell size={18} className={unreadCount > 0 ? "animate-[bounce_2s_infinite]" : ""} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4.5 min-w-[1.125rem] items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="notification-dropdown w-84 sm:w-96 p-3 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="mb-2 flex items-center justify-between border-b border-slate-100 pb-2.5 px-2">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-sky-500"></span>
              <p className="font-display text-sm font-bold text-slate-800">Notifications</p>
              {unreadCount > 0 && (
                <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-semibold text-sky-700">
                  {unreadCount} new
                </span>
              )}
            </div>
            {notifications.length > 0 && (
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs font-semibold text-sky-600 hover:text-sky-800 transition-colors"
                  >
                    Mark read
                  </button>
                )}
                <span className="text-slate-200">•</span>
                <button
                  onClick={handleClearAll}
                  className="text-xs font-medium text-slate-400 hover:text-rose-600 transition-colors flex items-center gap-1"
                  title="Delete all notifications"
                >
                  <Trash2 size={12} />
                  <span>Clear</span>
                </button>
              </div>
            )}
          </div>

          <div className="max-h-84 overflow-y-auto pr-0.5">
            {!loaded ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-sky-500 border-t-transparent mb-2"></div>
                <p className="text-xs font-medium text-slate-500">Checking for updates...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-50 to-sky-50 border border-teal-100 text-teal-600 shadow-xs">
                  <Bell size={20} className="text-teal-500 opacity-80" />
                </div>
                <p className="text-sm font-semibold text-slate-800">All caught up!</p>
                <p className="mt-1 text-xs text-slate-500">No notifications remaining.</p>
              </div>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {notifications.map((notification) => {
                  const isExam = notification.notification_type === "exam_reminder";
                  const Icon = isExam ? GraduationCap : CheckSquare;
                  const isUnread = notification.status === "unread";
                  return (
                    <li key={notification.id} className="group relative">
                      <div
                        onClick={() => handleOpen(notification.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleOpen(notification.id); }}
                        className={`flex w-full cursor-pointer items-start gap-3 rounded-xl p-2.5 text-left transition-all duration-150 ${
                          isUnread
                            ? "bg-sky-50/70 hover:bg-sky-50 border border-sky-100/80"
                            : "bg-transparent hover:bg-slate-50 border border-transparent"
                        }`}
                      >
                        <span
                          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors ${
                            isExam
                              ? "bg-purple-100 text-purple-700"
                              : "bg-teal-100 text-teal-700"
                          }`}
                        >
                          <Icon size={15} />
                        </span>
                        <span className="min-w-0 flex-1 pr-6">
                          <span className="flex items-center justify-between gap-1">
                            <span className={`block truncate text-xs font-semibold ${isUnread ? "text-slate-900" : "text-slate-700"}`}>
                              {notification.title}
                            </span>
                            <span className="shrink-0 text-[10px] font-medium text-slate-400">
                              {timeAgo(notification.created_at)}
                            </span>
                          </span>
                          <span className="mt-0.5 block text-[11px] leading-relaxed text-slate-500 line-clamp-2">
                            {notification.body}
                          </span>
                        </span>
                        {isUnread && (
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-sky-500 shadow-xs ring-2 ring-sky-200" />
                        )}
                      </div>

                      {/* Delete notification button */}
                      <button
                        type="button"
                        onClick={(e) => handleDelete(notification.id, e)}
                        title="Delete notification"
                        className="absolute right-2 top-2.5 flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 opacity-60 sm:opacity-0 transition-opacity hover:bg-rose-50 hover:text-rose-600 sm:group-hover:opacity-100"
                        aria-label="Delete notification"
                      >
                        <Trash2 size={13} />
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
