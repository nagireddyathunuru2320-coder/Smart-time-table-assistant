"use client";

import { useState } from "react";
import {
  type Preferences,
  type PreferencesInput,
  type ProfileInput,
  updatePreferences,
  updateProfile,
} from "@/lib/settings-api";
import type { User } from "@/lib/types";
import { User as UserIcon, Sliders, CheckCircle2 } from "lucide-react";

export function SettingsForm({
  initialUser,
  initialPreferences,
}: {
  initialUser: User;
  initialPreferences: Preferences;
}) {
  const [profileForm, setProfileForm] = useState<ProfileInput>({
    full_name: initialUser.full_name,
    timezone: initialUser.timezone,
    study_goal_minutes_per_week: initialUser.study_goal_minutes_per_week,
  });
  const [prefForm, setPrefForm] = useState<PreferencesInput>({
    preferred_study_start: initialPreferences.preferred_study_start,
    preferred_study_end: initialPreferences.preferred_study_end,
    max_session_minutes: initialPreferences.max_session_minutes,
    min_session_minutes: initialPreferences.min_session_minutes,
    break_minutes: initialPreferences.break_minutes,
    buffer_minutes: initialPreferences.buffer_minutes,
    allow_auto_reschedule: initialPreferences.allow_auto_reschedule,
    email_notifications: initialPreferences.email_notifications,
    push_notifications: initialPreferences.push_notifications,
  });
  const [profileSaved, setProfileSaved] = useState(false);
  const [prefSaved, setPrefSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setProfileSaved(false);
    setSavingProfile(true);
    try {
      await updateProfile(profileForm);
      setProfileSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save profile");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePrefSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPrefSaved(false);
    setSavingPrefs(true);
    try {
      await updatePreferences(prefForm);
      setPrefSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save preferences");
    } finally {
      setSavingPrefs(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {error && (
        <p className="rounded-xl bg-brick-light px-4 py-2.5 text-xs font-medium text-brick">
          {error}
        </p>
      )}

      {/* Profile Form */}
      <form
        onSubmit={handleProfileSubmit}
        className="glass-panel flex flex-col gap-4 rounded-3xl p-6 sm:p-7 shadow-xs"
      >
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
            <UserIcon size={16} />
          </span>
          <h2 className="font-display text-base font-bold text-ink">Profile</h2>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-ink">Full Name</label>
          <input
            type="text"
            value={profileForm.full_name ?? ""}
            onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
            className="glass-input w-full max-w-md px-3.5 py-2 text-xs text-ink outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-ink">Timezone</label>
          <input
            type="text"
            value={profileForm.timezone ?? ""}
            onChange={(e) => setProfileForm({ ...profileForm, timezone: e.target.value })}
            placeholder="e.g. Asia/Kolkata"
            className="glass-input w-full max-w-md px-3.5 py-2 text-xs text-ink outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-ink">
            Weekly Study Goal (minutes)
          </label>
          <input
            type="number"
            min={0}
            max={10080}
            value={profileForm.study_goal_minutes_per_week ?? 0}
            onChange={(e) =>
              setProfileForm({
                ...profileForm,
                study_goal_minutes_per_week: Number(e.target.value),
              })
            }
            className="glass-input w-full max-w-md px-3.5 py-2 text-xs text-ink outline-none"
          />
        </div>

        <div className="mt-2 flex items-center gap-3">
          <button
            type="submit"
            disabled={savingProfile}
            className="btn-specular gradient-accent rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-xs disabled:opacity-50"
          >
            {savingProfile ? "Saving..." : "Save Profile"}
          </button>
          {profileSaved && (
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
              <CheckCircle2 size={14} /> Saved
            </span>
          )}
        </div>
      </form>

      {/* Preferences Form */}
      <form
        onSubmit={handlePrefSubmit}
        className="glass-panel flex flex-col gap-4 rounded-3xl p-6 sm:p-7 shadow-xs"
      >
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
            <Sliders size={16} />
          </span>
          <h2 className="font-display text-base font-bold text-ink">Study Preferences</h2>
        </div>

        <div className="grid max-w-md grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">Study Window Start</label>
            <input
              type="time"
              value={prefForm.preferred_study_start ?? ""}
              onChange={(e) =>
                setPrefForm({ ...prefForm, preferred_study_start: e.target.value })
              }
              className="glass-input w-full px-3.5 py-2 text-xs text-ink outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">Study Window End</label>
            <input
              type="time"
              value={prefForm.preferred_study_end ?? ""}
              onChange={(e) =>
                setPrefForm({ ...prefForm, preferred_study_end: e.target.value })
              }
              className="glass-input w-full px-3.5 py-2 text-xs text-ink outline-none"
            />
          </div>
        </div>

        <div className="grid max-w-md grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">Max Session (min)</label>
            <input
              type="number"
              min={15}
              max={360}
              value={prefForm.max_session_minutes ?? 90}
              onChange={(e) =>
                setPrefForm({ ...prefForm, max_session_minutes: Number(e.target.value) })
              }
              className="glass-input w-full px-3.5 py-2 text-xs text-ink outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">Min Session (min)</label>
            <input
              type="number"
              min={5}
              max={240}
              value={prefForm.min_session_minutes ?? 25}
              onChange={(e) =>
                setPrefForm({ ...prefForm, min_session_minutes: Number(e.target.value) })
              }
              className="glass-input w-full px-3.5 py-2 text-xs text-ink outline-none"
            />
          </div>
        </div>

        <div className="grid max-w-md grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">Break (min)</label>
            <input
              type="number"
              min={0}
              max={120}
              value={prefForm.break_minutes ?? 10}
              onChange={(e) =>
                setPrefForm({ ...prefForm, break_minutes: Number(e.target.value) })
              }
              className="glass-input w-full px-3.5 py-2 text-xs text-ink outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">Buffer (min)</label>
            <input
              type="number"
              min={0}
              max={120}
              value={prefForm.buffer_minutes ?? 15}
              onChange={(e) =>
                setPrefForm({ ...prefForm, buffer_minutes: Number(e.target.value) })
              }
              className="glass-input w-full px-3.5 py-2 text-xs text-ink outline-none"
            />
          </div>
        </div>

        <div className="mt-2 flex flex-col gap-2.5 text-xs text-ink">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={prefForm.allow_auto_reschedule ?? false}
              onChange={(e) =>
                setPrefForm({ ...prefForm, allow_auto_reschedule: e.target.checked })
              }
              className="h-3.5 w-3.5 rounded accent-navy"
            />
            <span>Allow automatic rescheduling</span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={prefForm.email_notifications ?? false}
              onChange={(e) =>
                setPrefForm({ ...prefForm, email_notifications: e.target.checked })
              }
              className="h-3.5 w-3.5 rounded accent-navy"
            />
            <span>Email notifications</span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={prefForm.push_notifications ?? false}
              onChange={(e) =>
                setPrefForm({ ...prefForm, push_notifications: e.target.checked })
              }
              className="h-3.5 w-3.5 rounded accent-navy"
            />
            <span>Push notifications</span>
          </label>
        </div>

        <div className="mt-2 flex items-center gap-3">
          <button
            type="submit"
            disabled={savingPrefs}
            className="btn-specular gradient-accent rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-xs disabled:opacity-50"
          >
            {savingPrefs ? "Saving..." : "Save Preferences"}
          </button>
          {prefSaved && (
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
              <CheckCircle2 size={14} /> Saved
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
