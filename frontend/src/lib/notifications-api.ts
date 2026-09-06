export interface Notification {
  id: number;
  user_id: number;
  channel: string;
  notification_type: string;
  title: string;
  body: string;
  scheduled_for: string;
  sent_at: string | null;
  status: "unread" | "read";
  related_entity_type: string | null;
  related_entity_id: number | null;
  created_at: string;
}

async function parseOrThrow(response: Response) {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail ?? "Request failed");
  }
  return data;
}

export async function listNotifications(): Promise<Notification[]> {
  const response = await fetch("/api/notifications", { cache: "no-store" });
  return parseOrThrow(response);
}

export async function markNotificationRead(id: number): Promise<Notification> {
  const response = await fetch(`/api/notifications/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "read" }),
  });
  return parseOrThrow(response);
}

export async function markAllNotificationsRead(): Promise<Notification[]> {
  const response = await fetch("/api/notifications/mark-all-read", { method: "POST" });
  return parseOrThrow(response);
}
