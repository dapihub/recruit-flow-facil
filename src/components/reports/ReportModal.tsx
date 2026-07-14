import { useEffect, type ReactNode } from "react";
import { X, Printer, FileSpreadsheet, LucideIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Tone = "neutral" | "teal" | "green" | "orange" | "red" | "indigo";

const TONE_COLORS: Record<Tone, string> = {
  neutral: "#6b7280",
  teal: "#14b8a6",
  green: "#10b981",
  orange: "#f59e0b",
  red: "#ef4444",
  indigo: "#6366f1",
};

export interface ReportKpi {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: Tone;
}

export interface ReportSection {
  title: string;
  icon?: LucideIcon;
  counter?: { label: string; value: string };
  children: ReactNode;
}

interface ReportModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  brand?: string;
  generatedAt?: Date;
  kpis: ReportKpi[];
  sections: ReportSection[];
  onExport?: () => void;
  exportLabel?: string;
  footer?: string;
}

export function ReportModal({
  open,
  onClose,
  title,
  subtitle,
  brand = "Themis",
  generatedAt = new Date(),
  kpis,
  sections,
  onExport,
  exportLabel = "Excel",
  footer,
}: ReportModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const dateStr = format(generatedAt, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-6 animate-fade-in print:static print:p-0"
      style={{ background: "rgba(3, 3, 12, 0.72)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="report-modal w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl flex flex-col shadow-2xl print:max-h-none print:shadow-none print:rounded-none"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
        }}
      >
        {/* Toolbar */}
        <div
          className="flex items-center justify-between px-6 py-3 shrink-0 print:hidden"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <p className="text-sm font-semibold" style={{ color: "var(--fg)" }}>
            {title}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{ border: "1px solid var(--border)", color: "var(--fg)" }}
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir / PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Fechar"
              className="p-1.5 rounded-lg hover:bg-[var(--bg)] transition-colors"
              style={{ color: "var(--fg-muted)" }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Header block */}
          <div className="flex items-start justify-between gap-6">
            <div>
              <h2 className="font-display text-2xl tracking-tight" style={{ color: "var(--fg)" }}>
                {title}
              </h2>
              {subtitle && (
                <p className="text-sm mt-1" style={{ color: "var(--fg-muted)" }}>
                  {subtitle}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold" style={{ color: "#14b8a6" }}>
                {brand}
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--fg-muted)" }}>
                Gerado em: {dateStr}
              </p>
              {onExport && (
                <button
                  type="button"
                  onClick={onExport}
                  className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors print:hidden ml-auto"
                  style={{ border: "1px solid var(--border)", color: "var(--fg)" }}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  {exportLabel}
                </button>
              )}
            </div>
          </div>

          <div style={{ borderTop: "1px solid var(--border)" }} />

          {/* KPI cards */}
          {kpis.length > 0 && (
            <div
              className="grid gap-3"
              style={{ gridTemplateColumns: `repeat(${Math.min(kpis.length, 4)}, minmax(0, 1fr))` }}
            >
              {kpis.map((kpi) => {
                const color = TONE_COLORS[kpi.tone ?? "neutral"];
                const Icon = kpi.icon;
                const isNeutral = (kpi.tone ?? "neutral") === "neutral";
                return (
                  <div
                    key={kpi.label}
                    className="rounded-xl p-4 flex items-start justify-between gap-3 transition-colors"
                    style={{
                      background: isNeutral
                        ? "var(--bg)"
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
                        {kpi.label}
                      </p>
                      <p
                        className="font-display text-xl mt-1 tabular-nums truncate"
                        style={{ color: isNeutral ? "var(--fg)" : color }}
                      >
                        {kpi.value}
                      </p>
                    </div>
                    <span
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        background: `color-mix(in srgb, ${color} 15%, transparent)`,
                        color,
                      }}
                    >
                      <Icon className="w-4 h-4" />
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Sections */}
          {sections.map((section, idx) => {
            const Icon = section.icon;
            return (
              <div
                key={idx}
                className="rounded-xl overflow-hidden"
                style={{ border: "1px solid var(--border)", background: "var(--bg)" }}
              >
                <div
                  className="flex items-center justify-between px-4 py-3"
                  style={{ borderBottom: "1px solid var(--border)" }}
                >
                  <div className="flex items-center gap-2">
                    {Icon && <Icon className="w-4 h-4" style={{ color: "#14b8a6" }} />}
                    <p className="text-sm font-semibold" style={{ color: "var(--fg)" }}>
                      {section.title}
                    </p>
                  </div>
                  {section.counter && (
                    <div className="text-right">
                      <p
                        className="text-[10px] font-semibold uppercase tracking-wider"
                        style={{ color: "var(--fg-muted)" }}
                      >
                        {section.counter.label}
                      </p>
                      <p className="text-sm font-semibold tabular-nums" style={{ color: "var(--fg)" }}>
                        {section.counter.value}
                      </p>
                    </div>
                  )}
                </div>
                <div>{section.children}</div>
              </div>
            );
          })}

          {footer && (
            <p
              className="text-center text-xs pt-2"
              style={{ color: "var(--fg-muted)" }}
            >
              {footer}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
