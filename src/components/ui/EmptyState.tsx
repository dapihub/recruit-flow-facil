import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-6 animate-fade-in">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: "color-mix(in srgb, var(--accent) 12%, transparent)" }}
      >
        <Icon className="w-7 h-7" style={{ color: "var(--accent)", opacity: 0.8 }} />
      </div>
      <h3 className="text-base font-semibold mb-2" style={{ color: "var(--fg)" }}>
        {title}
      </h3>
      {description && (
        <p className="text-sm mb-6 max-w-xs leading-relaxed" style={{ color: "var(--fg-muted)" }}>
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
