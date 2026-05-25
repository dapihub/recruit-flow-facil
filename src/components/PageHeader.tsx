import { ReactNode } from "react";

export function PageHeader({ title, subtitle, action }: {
  title: string; subtitle?: string; action?: ReactNode;
}) {
  return (
    <header className="flex items-center justify-between px-8 py-5 border-b border-border/50 bg-background">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </header>
  );
}

export function MetricCard({ label, value, hint, accent = "brand" }: {
  label: string; value: string | number; hint?: string;
  accent?: "brand" | "success" | "warning" | "info" | "destructive";
}) {
  const colors: Record<string, { bar: string; text: string }> = {
    brand:       { bar: "bg-orange-500",   text: "text-orange-500" },
    success:     { bar: "bg-emerald-500",  text: "text-emerald-600" },
    warning:     { bar: "bg-amber-500",    text: "text-amber-600" },
    info:        { bar: "bg-blue-500",     text: "text-blue-600" },
    destructive: { bar: "bg-red-500",      text: "text-red-600" },
  };
  const { bar, text } = colors[accent] ?? colors.brand;
  return (
    <div className="relative bg-card rounded-xl border border-border/60 px-5 py-4 overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${bar}`} />
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
      <p className={`text-2xl font-bold tabular-nums ${text}`}>{value}</p>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}
