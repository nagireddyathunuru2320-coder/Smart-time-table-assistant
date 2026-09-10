import type { LucideIcon } from "lucide-react";
import { TrendingUp } from "lucide-react";

export function StatCard({
  label,
  value,
  sublabel,
  accent = "navy",
  icon: Icon,
  trend,
  trendPositive = true,
}: {
  label: string;
  value: string;
  sublabel?: string;
  accent?: "navy" | "forest" | "brick" | "brass";
  icon?: LucideIcon;
  trend?: string;
  trendPositive?: boolean;
}) {
  const iconBgClasses: Record<string, string> = {
    navy: "bg-sky-50 text-sky-600 ring-1 ring-sky-200/50",
    forest: "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/50",
    brick: "bg-rose-50 text-rose-600 ring-1 ring-rose-200/50",
    brass: "bg-teal-50 text-teal-600 ring-1 ring-teal-200/50",
  };

  return (
    <div className="glass-panel relative flex flex-col justify-between overflow-hidden rounded-2xl p-5 shadow-xs">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${iconBgClasses[accent]}`}>
              <Icon size={16} />
            </div>
          )}
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">{label}</p>
        </div>

        {trend && (
          <span
            className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold ${
              trendPositive ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50" : "bg-rose-50 text-rose-700 ring-1 ring-rose-200/50"
            }`}
          >
            <TrendingUp size={11} />
            {trend}
          </span>
        )}
      </div>

      <div className="mt-3">
        <p className="font-display text-2xl font-bold tracking-tight text-ink">{value}</p>
        {sublabel && <p className="mt-1 text-xs text-ink-soft">{sublabel}</p>}
      </div>
    </div>
  );
}
