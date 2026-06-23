import { cn } from "@/lib/utils";

interface KpiItemProps {
  label: string;
  value: string;
  accent?: boolean;
}

export function KpiItem({ label, value, accent }: KpiItemProps) {
  return (
    <div className="flex flex-col gap-0.5 px-4 py-2.5">
      <p className="text-xs" style={{ color: "var(--fg-muted)" }}>{label}</p>
      <p
        className={cn("text-lg font-bold", accent && "text-indigo-500")}
        style={accent ? undefined : { color: "var(--fg)" }}
      >
        {value}
      </p>
    </div>
  );
}

export function PageKpis({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex items-center flex-wrap gap-x-2 gap-y-1 px-6 py-1 shrink-0"
      style={{
        background: "var(--bg-card)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      {children}
    </div>
  );
}
