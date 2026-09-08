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

function statusBadgeClasses(status: string): string {
  if (status === "synced") return "bg-forest-light text-forest";
  if (status === "error") return "bg-brick-light text-brick";
  return "bg-paper-dim text-ink-soft";
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
    <div className="glass-panel flex flex-col gap-4 rounded-2xl p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">Connected calendars</h2>
          <p className="mt-1 text-sm text-ink-soft">Pull events from Google Calendar into your schedule (read-only, one-way).</p>
        </div>
        <button onClick={handleConnect} disabled={connecting} className="rounded-md bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-dark disabled:opacity-50">
          {connecting ? "Redirecting..." : "Connect Google Calendar"}
        </button>
      </div>
      {banner && <p className="rounded-md bg-forest-light px-3 py-2 text-sm text-forest">{banner}</p>}
      {error && <p className="rounded-md bg-brick-light px-3 py-2 text-sm text-brick">{error}</p>}
      {loading ? <p className="text-sm text-ink-soft">Loading...</p> : accounts.length === 0 ? <p className="text-sm text-ink-soft">No calendars connected yet.</p> : (
        <ul className="flex flex-col gap-3">
          {accounts.map((account) => (
            <li key={account.id} className="flex items-center justify-between rounded-xl border border-ink-faint/15 p-4">
              <div>
                <p className="text-sm font-medium text-ink">{account.display_name}</p>
                <p className="text-xs text-ink-soft">{account.email}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClasses(account.sync_status)}`}>{account.sync_status}</span>
                  {account.last_synced_at && <span className="text-xs text-ink-faint">Last synced {new Date(account.last_synced_at).toLocaleString()}</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleSync(account.id)} disabled={syncingId === account.id} className="rounded-md border border-ink-faint/25 px-3 py-1.5 text-sm text-ink-soft hover:bg-paper-dim disabled:opacity-50">
                  {syncingId === account.id ? "Syncing..." : "Sync now"}
                </button>
                <button onClick={() => handleDisconnect(account.id)} className="rounded-md border border-brick/30 px-3 py-1.5 text-sm text-brick hover:bg-brick-light">Disconnect</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
