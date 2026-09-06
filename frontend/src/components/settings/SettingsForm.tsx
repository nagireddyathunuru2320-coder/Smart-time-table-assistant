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
      {error && <p className="rounded-md bg-brick-light px-3 py-2 text-sm text-brick">{error}</p>}

      <form onSubmit={handleProfileSubmit} className="glass-panel flex flex-col gap-4 rounded-2xl p-6 shadow-sm">
        <h2 className="font-display text-lg font-semibold text-ink">Profile</h2>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Full name</label>
          <input type="text" value={profileForm.full_name ?? ""} onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })} className="w-full max-w-sm rounded-md border border-ink-faint/25 px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-navy" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Timezone</label>
          <input type="text" value={profileForm.timezone ?? ""} onChange={(e) => setProfileForm({ ...profileForm, timezone: e.target.value })} placeholder="e.g. Asia/Kolkata" className="w-full max-w-sm rounded-md border border-ink-faint/25 px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-navy" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Weekly study goal (minutes)</label>
          <input type="number" min={0} max={10080} value={profileForm.study_goal_minutes_per_week ?? 0} onChange={(e) => setProfileForm({ ...profileForm, study_goal_minutes_per_week: Number(e.target.value) })} className="w-full max-w-sm rounded-md border border-ink-faint/25 px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-navy" />
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" disabled={savingProfile} className="rounded-md bg-navy px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy-dark disabled:opacity-50">{savingProfile ? "Saving..." : "Save profile"}</button>
          {profileSaved && <span className="text-sm text-forest">Saved</span>}
        </div>
      </form>

      <form onSubmit={handlePrefSubmit} className="glass-panel flex flex-col gap-4 rounded-2xl p-6 shadow-sm">
        <h2 className="font-display text-lg font-semibold text-ink">Study preferences</h2>
        <div className="grid max-w-md grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Study window start</label>
            <input type="time" value={prefForm.preferred_study_start ?? ""} onChange={(e) => setPrefForm({ ...prefForm, preferred_study_start: e.target.value })} className="w-full rounded-md border border-ink-faint/25 px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-navy" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Study window end</label>
            <input type="time" value={prefForm.preferred_study_end ?? ""} onChange={(e) => setPrefForm({ ...prefForm, preferred_study_end: e.target.value })} className="w-full rounded-md border border-ink-faint/25 px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-navy" />
          </div>
        </div>
        <div className="grid max-w-md grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Max session (min)</label>
            <input type="number" min={15} max={360} value={prefForm.max_session_minutes ?? 90} onChange={(e) => setPrefForm({ ...prefForm, max_session_minutes: Number(e.target.value) })} className="w-full rounded-md border border-ink-faint/25 px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-navy" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Min session (min)</label>
            <input type="number" min={5} max={240} value={prefForm.min_session_minutes ?? 25} onChange={(e) => setPrefForm({ ...prefForm, min_session_minutes: Number(e.target.value) })} className="w-full rounded-md border border-ink-faint/25 px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-navy" />
          </div>
        </div>
        <div className="grid max-w-md grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Break (min)</label>
            <input type="number" min={0} max={120} value={prefForm.break_minutes ?? 10} onChange={(e) => setPrefForm({ ...prefForm, break_minutes: Number(e.target.value) })} className="w-full rounded-md border border-ink-faint/25 px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-navy" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Buffer (min)</label>
            <input type="number" min={0} max={120} value={prefForm.buffer_minutes ?? 15} onChange={(e) => setPrefForm({ ...prefForm, buffer_minutes: Number(e.target.value) })} className="w-full rounded-md border border-ink-faint/25 px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-navy" />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm text-ink"><input type="checkbox" checked={prefForm.allow_auto_reschedule ?? false} onChange={(e) => setPrefForm({ ...prefForm, allow_auto_reschedule: e.target.checked })} className="h-4 w-4 accent-navy" />Allow automatic rescheduling</label>
          <label className="flex items-center gap-2 text-sm text-ink"><input type="checkbox" checked={prefForm.email_notifications ?? false} onChange={(e) => setPrefForm({ ...prefForm, email_notifications: e.target.checked })} className="h-4 w-4 accent-navy" />Email notifications</label>
          <label className="flex items-center gap-2 text-sm text-ink"><input type="checkbox" checked={prefForm.push_notifications ?? false} onChange={(e) => setPrefForm({ ...prefForm, push_notifications: e.target.checked })} className="h-4 w-4 accent-navy" />Push notifications</label>
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" disabled={savingPrefs} className="rounded-md bg-navy px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy-dark disabled:opacity-50">{savingPrefs ? "Saving..." : "Save preferences"}</button>
          {prefSaved && <span className="text-sm text-forest">Saved</span>}
        </div>
      </form>
    </div>
  );
}
