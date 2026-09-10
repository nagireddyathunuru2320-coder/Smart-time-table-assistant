"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { SubjectBreakdownItem } from "@/lib/analytics-api";

const SEGMENT_COLORS = ["#14B8A6", "#0EA5E9", "#6366F1", "#F59E0B", "#F43F5E", "#8B5CF6", "#EC4899"];

export function SubjectBreakdownChart({ data }: { data: SubjectBreakdownItem[] }) {
  if (data.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-5">
        <p className="font-display text-sm font-semibold text-ink">Subject Distribution</p>
        <p className="mt-6 text-center text-sm text-ink-soft">No completed study sessions yet.</p>
      </div>
    );
  }

  const totalMinutes = data.reduce((sum, item) => sum + item.minutes, 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMins = totalMinutes % 60;
  const totalLabel = totalHours > 0 ? `${totalHours}h ${remainingMins}m` : `${totalMinutes}m`;

  return (
    <div className="glass-panel rounded-2xl p-5">
      <p className="font-display text-sm font-semibold text-ink">Subject Distribution</p>
      <p className="mb-4 text-xs text-ink-soft">Share of study time across subjects</p>

      <div className="flex flex-col items-center gap-6 md:flex-row md:justify-around">
        <div className="relative flex items-center justify-center" style={{ width: 220, height: 220 }}>
          <ResponsiveContainer width={220} height={220}>
            <PieChart>
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid rgba(15,23,42,0.08)", fontSize: 12 }}
                formatter={(value: unknown) => [`${value ?? 0} min`, "Study time"]}
              />
              <Pie
                data={data}
                dataKey="minutes"
                nameKey="subject_name"
                innerRadius={65}
                outerRadius={95}
                paddingAngle={3}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={entry.subject_id ?? entry.subject_name}
                    fill={SEGMENT_COLORS[index % SEGMENT_COLORS.length]}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="font-display text-lg font-bold text-ink">{totalLabel}</span>
            <span className="text-xs text-ink-soft">Total</span>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-2.5">
          {data.map((entry, index) => {
            const pct = totalMinutes > 0 ? Math.round((entry.minutes / totalMinutes) * 100) : 0;
            return (
              <div key={entry.subject_id ?? entry.subject_name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: SEGMENT_COLORS[index % SEGMENT_COLORS.length] }}
                  />
                  <span className="font-medium text-ink">{entry.subject_name}</span>
                </div>
                <span className="font-mono text-ink-soft">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
