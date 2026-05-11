import { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex items-center justify-between px-8 py-6 bg-card border-b">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

export function MetricCard({
  label,
  value,
  hint,
  accent = "brand",
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: "brand" | "success" | "warning" | "info";
}) {
  const bar: Record<string, string> = {
    brand: "bg-brand",
    success: "bg-success",
    warning: "bg-warning",
    info: "bg-info",
  };
  return (
    <div className="bg-card rounded-xl border p-5 relative overflow-hidden">
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${bar[accent]}`} />
      <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{label}</p>
      <p className="text-3xl font-bold mt-2 text-foreground">{value}</p>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}
