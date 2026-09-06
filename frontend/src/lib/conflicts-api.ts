export interface Conflict {
  id: number;
  user_id: number;
  conflict_type: string;
  severity: "low" | "medium" | "high";
  status: "open" | "resolved" | "dismissed";
  title: string;
  description: string;
  affected_entity_type: string | null;
  affected_entity_id: number | null;
  secondary_entity_id: number | null;
  created_at: string;
  updated_at: string;
}

async function parseOrThrow(response: Response) {
  const data = await response.json();
  if (!response.ok) {
    const message = Array.isArray(data.detail)
      ? data.detail.map((d: { msg: string }) => d.msg).join(", ")
      : data.detail ?? "Request failed";
    throw new Error(message);
  }
  return data;
}

export async function listConflicts(status?: string): Promise<Conflict[]> {
  const url = status ? `/api/conflicts?status=${status}` : "/api/conflicts";
  const response = await fetch(url, { cache: "no-store" });
  return parseOrThrow(response);
}

export async function updateConflictStatus(
  id: number,
  status: "open" | "resolved" | "dismissed",
): Promise<Conflict> {
  const response = await fetch(`/api/conflicts/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  return parseOrThrow(response);
}

