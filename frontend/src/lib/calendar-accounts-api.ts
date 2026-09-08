export interface CalendarAccount {
  id: number;
  user_id: number;
  provider: string;
  provider_account_id: string | null;
  display_name: string;
  email: string | null;
  sync_enabled: boolean;
  sync_status: string;
  last_synced_at: string | null;
  created_at: string;
}

export interface SyncLog {
  id: number;
  calendar_account_id: number | null;
  provider: string;
  started_at: string;
  finished_at: string | null;
  status: string;
  events_created: number;
  events_updated: number;
  events_deleted: number;
  error_message: string | null;
}

async function parseOrThrow(response: Response) {
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail ?? "Request failed");
  return data;
}

export async function listCalendarAccounts(): Promise<CalendarAccount[]> {
  return parseOrThrow(await fetch("/api/calendar-accounts", { cache: "no-store" }));
}

export async function getGoogleAuthorizeUrl(): Promise<string> {
  const data = await parseOrThrow(await fetch("/api/calendar-accounts/google/authorize-url"));
  return data.url;
}

export async function triggerSync(accountId: number): Promise<SyncLog> {
  return parseOrThrow(await fetch(`/api/calendar-accounts/${accountId}/sync`, { method: "POST" }));
}

export async function disconnectAccount(accountId: number): Promise<void> {
  const response = await fetch(`/api/calendar-accounts/${accountId}`, { method: "DELETE" });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail ?? "Failed to disconnect");
  }
}
