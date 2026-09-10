"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  type CalendarAccount,
  disconnectAccount,
  getGoogleAuthorizeUrl,
  listCalendarAccounts,
  triggerSync,
} from "@/lib/calendar-accounts-api";
import { Calendar, RefreshCw } from "lucide-react";

function statusBadgeClasses(status: string): string {
  if (status === "synced") return "badge-done";
  if (status === "error") return "badge-high";
  return "badge-low";
}

export function ConnectedCalendars() {
  const searchParams = useSearchParams();
  const [accounts, setAccounts] = useState<CalendarAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [syncingId, setSyncingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  useEffect(() => {
    const connected = searchParams.get("calendar_connected");
    const calendarError = searchParams.get("calendar_error");
    const updateBanner = window.setTimeout(() => {
      if (connected) setBanner("Google Calendar connected successfully.");
      if (calendarError) setError(calendarError);
    }, 0);
    return () => window.clearTimeout(updateBanner);
  }, [searchParams]);

  async function refresh() {
    try {
      setAccounts(await listCalendarAccounts());
    } catch {
      // Leave the current list on transient failure.
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const initialRefresh = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(initialRefresh);
  }, []);

  async function handleConnect() {
    setConnecting(true);
    setError(null);
    try {
      window.location.href = await getGoogleAuthorizeUrl();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start connection");
      setConnecting(false);
    }
  }

  async function handleSync(id: number) {
    setSyncingId(id);
    setError(null);
    try {
      const log = await triggerSync(id);
      if (log.status === "failed") setError(log.error_message ?? "Sync failed");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncingId(null);
    }
  }

  async function handleDisconnect(id: number) {
    if (!window.confirm("Disconnect this calendar? Previously synced events will remain on your calendar.")) return;
    try {
      await disconnectAccount(id);
      setAccounts((prev) => prev.filter((account) => account.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not disconnect");
    }
  }

  return (
    <div className="glass-panel flex flex-col gap-4 rounded-3xl p-6 sm:p-7 shadow-xs">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
            <Calendar size={16} />
          </span>
          <div>
            <h2 className="font-display text-base font-bold text-ink">Connected Calendars</h2>
            <p className="mt-0.5 text-xs text-ink-soft">Pull events from Google Calendar into your schedule.</p>
          </div>
        </div>
        <button
          onClick={handleConnect}
          disabled={connecting}
          className="btn-specular gradient-accent rounded-xl px-4 py-2 text-xs font-bold text-white shadow-xs disabled:opacity-50"
        >
          {connecting ? "Redirecting..." : "Connect Google Calendar"}
        </button>
      </div>

      {banner && (
        <p className="rounded-xl bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200/50">
          {banner}
        </p>
      )}

      {error && (
        <p className="rounded-xl bg-brick-light px-4 py-2.5 text-xs font-medium text-brick">
          {error}
        </p>
      )}

      {loading ? (
        <p className="py-4 text-center text-xs text-ink-soft">Loading connected accounts...</p>
      ) : accounts.length === 0 ? (
        <p className="py-4 text-center text-xs text-ink-soft">No calendars connected yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {accounts.map((account) => (
            <li
              key={account.id}
              className="flex items-center justify-between gap-4 rounded-2xl border border-ink/5 bg-paper/50 p-4"
            >
              <div>
                <p className="text-xs font-bold text-ink">{account.display_name}</p>
                <p className="text-[11px] text-ink-soft">{account.email}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${statusBadgeClasses(account.sync_status)}`}>
                    {account.sync_status}
                  </span>
                  {account.last_synced_at && (
                    <span className="text-[10px] text-ink-faint">
                      Synced {new Date(account.last_synced_at).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSync(account.id)}
                  disabled={syncingId === account.id}
                  className="flex items-center gap-1 rounded-lg border border-ink/10 bg-white px-2.5 py-1 text-xs font-semibold text-ink-soft hover:bg-paper-dim disabled:opacity-50"
                >
                  <RefreshCw size={12} className={syncingId === account.id ? "animate-spin" : ""} />
                  <span>{syncingId === account.id ? "Syncing..." : "Sync"}</span>
                </button>
                <button
                  onClick={() => handleDisconnect(account.id)}
                  className="rounded-lg border border-rose-200 bg-rose-50/70 px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-100"
                >
                  Disconnect
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
