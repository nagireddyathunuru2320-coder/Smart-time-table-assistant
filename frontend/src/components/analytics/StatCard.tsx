export function StatCard({
  label,
  value,
  sublabel,
  accent = "navy",
}: {
  label: string;
  value: string;
  sublabel?: string;
  accent?: "navy" | "forest" | "brick" | "brass";
}) {
  const accentClasses: Record<string, string> = {
    navy: "text-navy",
    forest: "text-forest",
    brick: "text-brick",
    brass: "text-brass",
  };

  return (
    <div className="glass-panel rounded-2xl p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${accentClasses[accent]}`}>{value}</p>
      {sublabel && <p className="mt-1 text-xs text-ink-soft">{sublabel}</p>}
    </div>
  );
}
