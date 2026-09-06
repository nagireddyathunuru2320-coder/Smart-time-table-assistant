export interface StudyPlanBlock {
  id: number;
  entity_type: "task" | "exam";
  entity_id: number;
  title: string;
  start_at: string;
  end_at: string;
}

export interface UnmetNeed {
  entity_type: "task" | "exam";
  entity_id: number;
  title: string;
  unmet_minutes: number;
}

export interface StudyPlanResult {
  horizon_days: number;
  created: StudyPlanBlock[];
  unmet: UnmetNeed[];
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

export async function generateStudyPlan(days = 14): Promise<StudyPlanResult> {
  const response = await fetch(`/api/schedule/generate-study-plan?days=${days}`, {
    method: "POST",
  });
  return parseOrThrow(response);
}

