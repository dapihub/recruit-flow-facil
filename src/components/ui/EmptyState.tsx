import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
      <Icon
        className="w-10 h-10 mb-4 opacity-20"
        style={{ color: "var(--fg-muted)" }}
      />
      <h3
        className="text-base font-semibold mb-2"
        style={{ color: "var(--fg)" }}
      >
        {title}
      </h3>
      {description && (
        <p className="text-sm mb-6 max-w-xs" style={{ color: "var(--fg-muted)" }}>
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
