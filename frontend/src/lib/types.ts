export interface User {
  id: number;
  email: string;
  full_name: string;
  timezone: string;
  avatar_url: string | null;
  is_active: boolean;
  study_goal_minutes_per_week: number;
  created_at: string;
  updated_at: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  full_name: string;
  password: string;
  timezone?: string;
}

export interface ApiErrorBody {
  detail?: string | { msg: string }[];
}