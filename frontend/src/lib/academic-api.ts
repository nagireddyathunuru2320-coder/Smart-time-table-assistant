export interface Subject {
  id: number;
  user_id: number;
  name: string;
  code: string | null;
  color: string;
  instructor: string | null;
  difficulty: number;
  weekly_target_minutes: number;
  notes: string | null;
}

export interface SubjectInput {
  name: string;
  code?: string | null;
  color?: string;
  instructor?: string | null;
  difficulty?: number;
  weekly_target_minutes?: number;
  notes?: string | null;
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

export async function listSubjects(): Promise<Subject[]> {
  const response = await fetch("/api/subjects", { cache: "no-store" });
  return parseOrThrow(response);
}

export async function createSubject(input: SubjectInput): Promise<Subject> {
  const response = await fetch("/api/subjects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseOrThrow(response);
}

export async function updateSubject(id: number, input: Partial<SubjectInput>): Promise<Subject> {
  const response = await fetch(`/api/subjects/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseOrThrow(response);
}

export async function deleteSubject(id: number): Promise<void> {
  const response = await fetch(`/api/subjects/${id}`, { method: "DELETE" });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail ?? "Delete failed");
  }
}

export interface Task {
  id: number;
  user_id: number;
  subject_id: number | null;
  title: string;
  description: string | null;
  task_type: string;
  priority: number;
  difficulty: number;
  estimated_minutes: number;
  completed_minutes: number;
  deadline_at: string | null;
  status: string;
  completed_at: string | null;
}

export interface TaskInput {
  subject_id?: number | null;
  title: string;
  description?: string | null;
  task_type?: string;
  priority?: number;
  difficulty?: number;
  estimated_minutes?: number;
  deadline_at?: string | null;
  status?: string;
}

export async function listTasks(): Promise<Task[]> {
  const response = await fetch("/api/tasks", { cache: "no-store" });
  return parseOrThrow(response);
}

export async function createTask(input: TaskInput): Promise<Task> {
  const response = await fetch("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseOrThrow(response);
}

export async function updateTask(id: number, input: Partial<TaskInput>): Promise<Task> {
  const response = await fetch(`/api/tasks/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseOrThrow(response);
}

export async function deleteTask(id: number): Promise<void> {
  const response = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail ?? "Delete failed");
  }
}

export interface Exam {
  id: number;
  user_id: number;
  subject_id: number | null;
  title: string;
  exam_at: string;
  duration_minutes: number;
  location: string | null;
  difficulty: number;
  priority: number;
  study_required_minutes: number;
  notes: string | null;
}

export interface ExamInput {
  subject_id?: number | null;
  title: string;
  exam_at: string;
  duration_minutes?: number;
  location?: string | null;
  difficulty?: number;
  priority?: number;
  study_required_minutes?: number;
  notes?: string | null;
}

export async function listExams(): Promise<Exam[]> {
  const response = await fetch("/api/exams", { cache: "no-store" });
  return parseOrThrow(response);
}

export async function createExam(input: ExamInput): Promise<Exam> {
  const response = await fetch("/api/exams", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseOrThrow(response);
}

export async function updateExam(id: number, input: Partial<ExamInput>): Promise<Exam> {
  const response = await fetch(`/api/exams/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseOrThrow(response);
}

export async function deleteExam(id: number): Promise<void> {
  const response = await fetch(`/api/exams/${id}`, { method: "DELETE" });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail ?? "Delete failed");
  }
}
