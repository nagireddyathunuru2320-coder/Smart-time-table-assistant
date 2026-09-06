"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DailyTrendPoint } from "@/lib/analytics-api";

export function DailyTrendChart({ data }: { data: DailyTrendPoint[] }) {
  const formatted = data.map((point) => ({
    ...point,
    label: new Date(`${point.day}T00:00:00`).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    }),
  }));

  return (
    <div className="glass-panel rounded-2xl p-5">
      <p className="font-display text-sm font-semibold text-ink">Study time trend</p>
      <p className="mb-4 text-xs text-ink-soft">Planned vs. actual minutes, last {data.length} days</p>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={formatted}>
          <defs>
            <linearGradient id="plannedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8B7CFA" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#8B7CFA" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6D5DFC" stopOpacity={0.5} />
              <stop offset="95%" stopColor="#6D5DFC" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,33,48,0.08)" />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} width={32} />
          <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid rgba(30,33,48,0.08)", fontSize: 12 }} />
          <Area type="monotone" dataKey="planned_minutes" name="Planned" stroke="#8B7CFA" fill="url(#plannedGradient)" strokeWidth={2} />
          <Area type="monotone" dataKey="actual_minutes" name="Actual" stroke="#6D5DFC" fill="url(#actualGradient)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
