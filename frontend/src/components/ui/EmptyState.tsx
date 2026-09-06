import type { LucideIcon } from "lucide-react";
import { Sparkles } from "lucide-react";

export function EmptyState({ icon: Icon = Sparkles, title, description }: { icon?: LucideIcon; title: string; description: string }) {
  return (
    <div className="glass-panel flex flex-col items-center justify-center rounded-2xl p-10 text-center">
      <div className="relative mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-brass-light">
        <div className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-forest-light" />
        <div className="absolute -bottom-1 -left-2 h-4 w-4 rounded-full bg-brick-light" />
        <Icon size={32} className="text-navy" />
      </div>
      <p className="font-display text-base font-semibold text-ink">{title}</p>
      <p className="mt-1 max-w-xs text-sm text-ink-soft">{description}</p>
    </div>
  );
}
