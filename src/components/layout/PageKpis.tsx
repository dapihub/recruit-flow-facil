import { cn } from "@/lib/utils";

interface KpiItemProps {
  label: string;
  value: string;
  accent?: boolean;
  danger?: boolean;
}

export function KpiItem({ label, value, accent, danger }: KpiItemProps) {
  const valueColor = accent ? "#6366f1" : danger ? "#ef4444" : "var(--fg)";
  return (
    <div
      className="flex flex-col gap-0.5 px-5 py-3 border-r last:border-r-0"
      style={{ borderColor: "var(--border)" }}
    >
      <p className="text-[11px]" style={{ color: "var(--fg-muted)" }}>{label}</p>
      <p className="text-base font-bold tabular-nums" style={{ color: valueColor }}>
        {value}
      </p>
    </div>
  );
}

export function PageKpis({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex items-stretch flex-wrap shrink-0"
      style={{
        background: "var(--bg-card)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      {children}
    </div>
  );
}
