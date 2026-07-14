import type { LucideIcon } from "lucide-react";

type Tone = "neutral" | "teal" | "green" | "orange" | "red" | "indigo";

const TONE_COLORS: Record<Tone, string> = {
  neutral: "#6b7280",
  teal: "#14b8a6",
  green: "#10b981",
  orange: "#f59e0b",
  red: "#ef4444",
  indigo: "#6366f1",
};

interface KpiItemProps {
  label: string;
  value: string;
  /** Backwards-compat: highlights value using accent (teal) tone. */
  accent?: boolean;
  /** Backwards-compat: highlights value in destructive (red) tone. */
  danger?: boolean;
  /** Optional explicit tone; overrides accent/danger. */
  tone?: Tone;
  /** Optional icon rendered at the top-right of the card. */
  icon?: LucideIcon;
}

export function KpiItem({ label, value, accent, danger, tone, icon: Icon }: KpiItemProps) {
  const resolvedTone: Tone = tone ?? (danger ? "red" : accent ? "teal" : "neutral");
  const color = TONE_COLORS[resolvedTone];
  const isNeutral = resolvedTone === "neutral";

  return (
    <div
      className="rounded-xl p-4 flex items-start justify-between gap-3 transition-colors"
      style={{
        background: isNeutral
          ? "var(--bg-card)"
          : `color-mix(in srgb, ${color} 8%, var(--bg-card))`,
        border: `1px solid ${
          isNeutral ? "var(--border)" : `color-mix(in srgb, ${color} 40%, transparent)`
        }`,
      }}
    >
      <div className="min-w-0">
        <p
          className="text-[10px] font-semibold uppercase tracking-wider truncate"
          style={{ color: "var(--fg-muted)" }}
        >
          {label}
        </p>
        <p
          className="font-display text-xl mt-1 tabular-nums truncate"
          style={{ color: isNeutral ? "var(--fg)" : color }}
        >
          {value}
        </p>
      </div>
      {Icon && (
        <span
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{
            background: `color-mix(in srgb, ${color} 15%, transparent)`,
            color,
          }}
        >
          <Icon className="w-4 h-4" />
        </span>
      )}
    </div>
  );
}

export function PageKpis({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="shrink-0 px-6 py-4 grid gap-3"
      style={{
        background: "var(--bg)",
        borderBottom: "1px solid var(--border)",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
      }}
    >
      {children}
    </div>
  );
}
