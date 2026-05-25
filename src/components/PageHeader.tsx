import { ReactNode } from "react";

export function PageHeader({ title, subtitle, action }: {
  title: string; subtitle?: string; action?: ReactNode;
}) {
  return (
    <header className="flex items-center justify-between px-8 py-5 border-b border-zinc-200 bg-white">
      <div>
        <h1 className="text-lg font-semibold text-zinc-900">{title}</h1>
        {subtitle && <p className="text-sm text-zinc-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </header>
  );
}

export function MetricCard({ label, value, hint, accent = "neutral" }: {
  label: string; value: string | number; hint?: string;
  accent?: "brand" | "success" | "warning" | "info" | "destructive" | "neutral";
}) {
  return (
    <div className="bg-white rounded-lg border border-zinc-200 px-5 py-4">
      <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 mb-1">{label}</p>
      <p className="text-xl font-semibold tabular-nums text-zinc-900">{value}</p>
      {hint && <p className="text-xs text-zinc-400 mt-0.5">{hint}</p>}
    </div>
  );
}
