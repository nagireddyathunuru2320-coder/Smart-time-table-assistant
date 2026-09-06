"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { SubjectBreakdownItem } from "@/lib/analytics-api";

export function SubjectBreakdownChart({ data }: { data: SubjectBreakdownItem[] }) {
  if (data.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-5">
        <p className="font-display text-sm font-semibold text-ink">Study time by subject</p>
        <p className="mt-6 text-center text-sm text-ink-soft">No completed study sessions yet.</p>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl p-5">
      <p className="font-display text-sm font-semibold text-ink">Study time by subject</p>
      <p className="mb-4 text-xs text-ink-soft">Total minutes studied per subject</p>
      <ResponsiveContainer width="100%" height={Math.max(160, data.length * 44)}>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
          <XAxis type="number" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="subject_name" tick={{ fontSize: 12, fill: "#1E2130" }} axisLine={false} tickLine={false} width={90} />
          <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid rgba(30,33,48,0.08)", fontSize: 12 }} />
          <Bar dataKey="minutes" radius={[0, 8, 8, 0]} barSize={20}>
            {data.map((entry) => <Cell key={entry.subject_id ?? entry.subject_name} fill={entry.subject_color} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
