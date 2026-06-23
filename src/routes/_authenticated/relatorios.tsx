import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  BarChart2,
  ChevronLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Briefcase,
  Users,
  AlertCircle,
  Printer,
  FileDown,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  format,
  startOfMonth,
  subMonths,
  isSameMonth,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { Header } from "@/components/layout/Header";
import { useHideValues } from "@/hooks/useHideValues";
import { fmtBRL } from "@/lib/utils";
import { useTransactions } from "@/hooks/useFinanceiro";
import { useJobs } from "@/hooks/useJobs";
import { useTasks } from "@/hooks/useTasks";
import { useProfiles } from "@/hooks/useProfiles";
import { useCrmOpportunities, useCrmStages } from "@/hooks/useCrm";
import { useClients } from "@/hooks/useClients";
import { JOB_STATUS_LABELS, JOB_STATUS_COLORS } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/relatorios")({
  component: RelatoriosPage,
});

// ─── Report registry ─────────────────────────────────────────

type ReportId =
  | "dre"
  | "vagas-andamento"
  | "performance-recrutador"
  | "funil-vendas"
  | "visao-executiva"
  | "faturamento-cliente"
  | "inadimplencia"
  | "fluxo-projetado"
  | "performance-vagas"
  | "coming-soon";

const CATEGORIES: {
  label: string;
  reports: { id: ReportId; label: string; desc: string }[];
}[] = [
  {
    label: "Financeiro",
    reports: [
      { id: "dre", label: "DRE", desc: "Demonstração de Resultado 12 meses" },
      { id: "fluxo-projetado", label: "Fluxo de Caixa Projetado", desc: "Projeção de entradas e saídas para os próximos 12 meses" },
      { id: "inadimplencia", label: "Inadimplência", desc: "Valores vencidos e em atraso por cliente" },
      { id: "faturamento-cliente", label: "Faturamento por Cliente", desc: "Receitas e despesas agrupadas por cliente" },
    ],
  },
  {
    label: "Vagas",
    reports: [
      { id: "vagas-andamento", label: "Vagas em Andamento", desc: "Distribuição por status" },
      { id: "performance-recrutador", label: "Performance por Recrutador", desc: "Vagas e tarefas por pessoa" },
      { id: "performance-vagas", label: "Saúde das Vagas", desc: "Semáforo de risco por vaga: Saudável / Atenção / Em Risco / Crítico" },
      { id: "coming-soon", label: "Tempo Médio de Fechamento", desc: "SLA por etapa" },
    ],
  },
  {
    label: "CRM & Vendas",
    reports: [
      { id: "funil-vendas", label: "Funil de Vendas", desc: "Oportunidades por etapa e valor" },
      { id: "coming-soon", label: "Conversão Comercial", desc: "Taxa de fechamento de propostas" },
    ],
  },
  {
    label: "Gerencial",
    reports: [
      { id: "visao-executiva", label: "Visão Executiva", desc: "Resumo dos KPIs do escritório" },
      { id: "coming-soon", label: "Faturamento por Recrutador", desc: "Fee gerado por pessoa" },
    ],
  },
];

// ─── Page ─────────────────────────────────────────────────────

function RelatoriosPage() {
  const [selectedReport, setSelectedReport] = useState<ReportId | null>(null);
  const { hidden } = useHideValues();

  // Hooks at page level for CSV export (cached by TanStack Query)
  const { data: transactions = [] } = useTransactions();
  const { data: jobs = [] } = useJobs();
  const { data: opps = [] } = useCrmOpportunities();
  const { data: stages = [] } = useCrmStages();

  function handlePrint() {
    window.print();
  }

  function handleExportCSV() {
    if (!selectedReport || selectedReport === "coming-soon") return;
    let rows: string[][] = [];

    if (selectedReport === "dre") {
      const months = Array.from({ length: 12 }, (_, i) => startOfMonth(subMonths(new Date(), 11 - i)));
      rows = [["Mês", "Receitas", "Despesas", "Resultado", "Margem"]];
      for (const month of months) {
        const paid = transactions.filter((t) => t.status === "paid" && isSameMonth(new Date(t.date), month));
        const rec = paid.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
        const desp = paid.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
        const res = rec - desp;
        const m = rec > 0 ? ((res / rec) * 100).toFixed(1) : "0";
        rows.push([format(month, "MMM/yy", { locale: ptBR }), rec.toFixed(2), desp.toFixed(2), res.toFixed(2), `${m}%`]);
      }
    } else if (selectedReport === "vagas-andamento") {
      rows = [["Título", "Status", "Prazo", "Recrutador"]];
      for (const j of jobs) {
        rows.push([j.title, j.status, j.deadline ?? "", j.recruiter?.name ?? ""]);
      }
    } else if (selectedReport === "funil-vendas") {
      rows = [["Etapa", "Qtd", "Valor Total", "Forecast"]];
      for (const s of stages) {
        const stageOpps = opps.filter((o) => o.stage_id === s.id);
        const value = stageOpps.reduce((sum, o) => sum + (o.value ?? 0), 0);
        const forecast = stageOpps.reduce((sum, o) => sum + (o.value ?? 0) * (o.probability / 100), 0);
        rows.push([s.name, stageOpps.length.toString(), value.toFixed(2), forecast.toFixed(2)]);
      }
    } else if (selectedReport === "performance-recrutador") {
      rows = [["Título", "Status", "Recrutador", "Prazo"]];
      for (const j of jobs) {
        rows.push([j.title, j.status, j.recruiter?.name ?? "", j.deadline ?? ""]);
      }
    } else {
      rows = [["Sem dados exportáveis para este relatório"]];
    }

    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `themis-${selectedReport}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (selectedReport && selectedReport !== "coming-soon") {
    return (
      <div className="flex flex-col min-h-full">
        <Header
          title={
            CATEGORIES.flatMap((c) => c.reports).find(
              (r) => r.id === selectedReport
            )?.label ?? "Relatório"
          }
          actions={
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                title="Imprimir / PDF"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
                style={{ border: "1px solid var(--border)", color: "var(--fg-muted)" }}
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">Imprimir</span>
              </button>
              <button
                onClick={handleExportCSV}
                title="Exportar CSV"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
                style={{ border: "1px solid var(--border)", color: "var(--fg-muted)" }}
              >
                <FileDown className="w-4 h-4" />
                <span className="hidden sm:inline">CSV</span>
              </button>
              <button
                onClick={() => setSelectedReport(null)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium"
                style={{ border: "1px solid var(--border)", color: "var(--fg)" }}
              >
                <ChevronLeft className="w-4 h-4" /> Relatórios
              </button>
            </div>
          }
        />
        <div className="flex-1 p-6">
          <ReportContent id={selectedReport} hidden={hidden} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Relatórios" />
      <div className="flex-1 p-6 space-y-8">
        {CATEGORIES.map((cat) => (
          <div key={cat.label}>
            <h2
              className="text-xs font-semibold uppercase tracking-wider mb-3"
              style={{ color: "var(--fg-muted)" }}
            >
              {cat.label}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {cat.reports.map((report) => {
                const isLive = report.id !== "coming-soon";
                return (
                  <button
                    key={report.label}
                    onClick={() => isLive && setSelectedReport(report.id)}
                    className="flex flex-col gap-1 p-4 rounded-xl text-left transition-all"
                    style={{
                      background: "var(--bg-card)",
                      border: "1px solid var(--border)",
                      cursor: isLive ? "pointer" : "default",
                      opacity: isLive ? 1 : 0.6,
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <BarChart2
                        className="w-4 h-4 shrink-0 mt-0.5"
                        style={{ color: isLive ? "var(--accent)" : "var(--fg-muted)" }}
                      />
                      {!isLive && (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full"
                          style={{
                            background: "var(--border)",
                            color: "var(--fg-muted)",
                          }}
                        >
                          Em breve
                        </span>
                      )}
                    </div>
                    <p
                      className="text-sm font-medium mt-1"
                      style={{ color: "var(--fg)" }}
                    >
                      {report.label}
                    </p>
                    <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
                      {report.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Report content router ────────────────────────────────────

function ReportContent({ id, hidden }: { id: ReportId; hidden: boolean }) {
  switch (id) {
    case "dre":
      return <DrePage hidden={hidden} />;
    case "vagas-andamento":
      return <VagasAndamentoPage hidden={hidden} />;
    case "performance-recrutador":
      return <PerformanceRecrutadorPage hidden={hidden} />;
    case "funil-vendas":
      return <FunilVendasPage hidden={hidden} />;
    case "visao-executiva":
      return <VisaoExecutivaPage hidden={hidden} />;
    case "faturamento-cliente":
      return <FaturamentoClientePage hidden={hidden} />;
    case "inadimplencia":
      return <InadimplenciaPage hidden={hidden} />;
    case "fluxo-projetado":
      return <FluxoProjetadoPage hidden={hidden} />;
    case "performance-vagas":
      return <PerformanceVagasPage />;
    default:
      return null;
  }
}

// ─── DRE ─────────────────────────────────────────────────────

function DrePage({ hidden }: { hidden: boolean }) {
  const { data: transactions = [] } = useTransactions();

  const months = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) =>
        startOfMonth(subMonths(new Date(), 11 - i))
      ),
    []
  );

  const rows = useMemo(
    () =>
      months.map((month) => {
        const paid = transactions.filter(
          (t) =>
            t.status === "paid" && isSameMonth(new Date(t.date), month)
        );
        const receitas = paid
          .filter((t) => t.type === "income")
          .reduce((s, t) => s + t.amount, 0);
        const despesas = paid
          .filter((t) => t.type === "expense")
          .reduce((s, t) => s + t.amount, 0);
        return {
          month: format(month, "MMM/yy", { locale: ptBR }),
          Receitas: receitas,
          Despesas: despesas,
          Resultado: receitas - despesas,
        };
      }),
    [transactions, months]
  );

  const totReceitas = rows.reduce((s, r) => s + r.Receitas, 0);
  const totDespesas = rows.reduce((s, r) => s + r.Despesas, 0);
  const totResultado = totReceitas - totDespesas;
  const margem = totReceitas > 0 ? (totResultado / totReceitas) * 100 : 0;

  const fmtY = (v: number) =>
    v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v);

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-xl p-3 text-sm shadow-lg space-y-1" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <p className="font-semibold mb-1" style={{ color: "var(--fg)" }}>{label}</p>
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.color }}>{p.name}: {fmtBRL(p.value, hidden)}</p>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Receitas (12m)", value: totReceitas, color: "#10b981", icon: TrendingUp },
          { label: "Despesas (12m)", value: totDespesas, color: "#ef4444", icon: TrendingDown },
          { label: "Resultado (12m)", value: totResultado, color: totResultado >= 0 ? "#10b981" : "#ef4444", icon: DollarSign },
          { label: "Margem", value: null, raw: `${margem.toFixed(1)}%`, color: margem >= 20 ? "#10b981" : margem >= 0 ? "#f59e0b" : "#ef4444", icon: BarChart2 },
        ].map((k) => (
          <KpiCard key={k.label} label={k.label} value={k.raw ?? fmtBRL(k.value!, hidden)} color={k.color} icon={k.icon} />
        ))}
      </div>
      <div className="rounded-xl p-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", filter: hidden ? "blur(8px)" : undefined }}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={rows} barCategoryGap="30%" barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--fg-muted)" }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={fmtY} tick={{ fontSize: 11, fill: "var(--fg-muted)" }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 16, color: "var(--fg-muted)" }} />
            <Bar dataKey="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Resultado" fill="#6366f1" radius={[4, 4, 0, 0]} opacity={0.8} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border)" }}>
              {["Mês", "Receitas", "Despesas", "Resultado", "Margem"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--fg-muted)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...rows].reverse().map((r, i) => {
              const m = r.Receitas > 0 ? (r.Resultado / r.Receitas) * 100 : 0;
              return (
                <tr key={r.month} style={{ background: i % 2 === 0 ? "var(--bg)" : "var(--bg-card)", borderBottom: "1px solid var(--border)" }}>
                  <td className="px-4 py-2.5 font-medium" style={{ color: "var(--fg)" }}>{r.month}</td>
                  <td className="px-4 py-2.5" style={{ color: "#10b981" }}>{fmtBRL(r.Receitas, hidden)}</td>
                  <td className="px-4 py-2.5" style={{ color: "#ef4444" }}>{fmtBRL(r.Despesas, hidden)}</td>
                  <td className="px-4 py-2.5 font-semibold" style={{ color: r.Resultado >= 0 ? "#10b981" : "#ef4444" }}>{fmtBRL(r.Resultado, hidden)}</td>
                  <td className="px-4 py-2.5" style={{ color: m >= 20 ? "#10b981" : m >= 0 ? "#f59e0b" : "#ef4444" }}>{m.toFixed(1)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Vagas em Andamento ───────────────────────────────────────

const PIE_COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#6b7280", "#ef4444", "#eab308"];

function VagasAndamentoPage({ hidden: _hidden }: { hidden: boolean }) {
  const { data: jobs = [] } = useJobs();
  const statusKeys = Object.keys(JOB_STATUS_LABELS) as (keyof typeof JOB_STATUS_LABELS)[];

  const pieData = statusKeys
    .map((s) => ({ name: JOB_STATUS_LABELS[s], value: jobs.filter((j) => j.status === s).length, color: JOB_STATUS_COLORS[s] }))
    .filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <KpiCard label="Total de Vagas" value={jobs.length.toString()} color="var(--accent)" icon={Briefcase} />
        <KpiCard label="Abertas / Triagem" value={jobs.filter((j) => ["open", "screening"].includes(j.status)).length.toString()} color="#10b981" icon={TrendingUp} />
        <KpiCard label="Em Proposta" value={jobs.filter((j) => j.status === "proposal").length.toString()} color="#f59e0b" icon={DollarSign} />
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="rounded-xl p-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--fg)" }}>Distribuição por Status</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border)" }}>
                <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--fg-muted)" }}>Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium" style={{ color: "var(--fg-muted)" }}>Qtd</th>
                <th className="px-4 py-3 text-right text-xs font-medium" style={{ color: "var(--fg-muted)" }}>%</th>
              </tr>
            </thead>
            <tbody>
              {statusKeys.map((s, i) => {
                const count = jobs.filter((j) => j.status === s).length;
                const pct = jobs.length > 0 ? ((count / jobs.length) * 100).toFixed(1) : "0";
                return (
                  <tr key={s} style={{ background: i % 2 === 0 ? "var(--bg)" : "var(--bg-card)", borderBottom: "1px solid var(--border)" }}>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: JOB_STATUS_COLORS[s] }} />
                        <span style={{ color: "var(--fg)" }}>{JOB_STATUS_LABELS[s]}</span>
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold" style={{ color: "var(--fg)" }}>{count}</td>
                    <td className="px-4 py-2.5 text-right" style={{ color: "var(--fg-muted)" }}>{pct}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Performance por Recrutador ───────────────────────────────

function PerformanceRecrutadorPage({ hidden: _hidden }: { hidden: boolean }) {
  const { data: jobs = [] } = useJobs();
  const { data: tasks = [] } = useTasks();
  const { data: profiles = [] } = useProfiles();

  const data = useMemo(
    () =>
      profiles.map((p) => ({
        name: p.name.split(" ")[0],
        "Vagas Ativas": jobs.filter((j) => j.recruiter_id === p.id && !["closed", "cancelled"].includes(j.status)).length,
        "Vagas Fechadas": jobs.filter((j) => j.recruiter_id === p.id && j.status === "closed").length,
        "Tarefas Concluídas": tasks.filter((t) => t.assignee_id === p.id && t.status === "done").length,
        "Tarefas Pendentes": tasks.filter((t) => t.assignee_id === p.id && t.status !== "done").length,
      })),
    [jobs, tasks, profiles]
  );

  return (
    <div className="space-y-6">
      <div className="rounded-xl p-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--fg)" }}>Vagas por Recrutador</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} barCategoryGap="35%">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: "var(--fg-muted)" }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--fg-muted)" }} axisLine={false} tickLine={false} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12, color: "var(--fg-muted)" }} />
            <Bar dataKey="Vagas Ativas" fill="#6366f1" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Vagas Fechadas" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border)" }}>
              {["Recrutador", "Vagas Ativas", "Vagas Fechadas", "Tarefas Concluídas", "Tarefas Pendentes"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--fg-muted)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((r, i) => (
              <tr key={r.name} style={{ background: i % 2 === 0 ? "var(--bg)" : "var(--bg-card)", borderBottom: "1px solid var(--border)" }}>
                <td className="px-4 py-2.5 font-medium" style={{ color: "var(--fg)" }}>{profiles[i]?.name ?? r.name}</td>
                <td className="px-4 py-2.5 text-center" style={{ color: "#6366f1" }}>{r["Vagas Ativas"]}</td>
                <td className="px-4 py-2.5 text-center" style={{ color: "#10b981" }}>{r["Vagas Fechadas"]}</td>
                <td className="px-4 py-2.5 text-center" style={{ color: "#10b981" }}>{r["Tarefas Concluídas"]}</td>
                <td className="px-4 py-2.5 text-center" style={{ color: "var(--fg-muted)" }}>{r["Tarefas Pendentes"]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Funil de Vendas ─────────────────────────────────────────

function FunilVendasPage({ hidden }: { hidden: boolean }) {
  const { data: opps = [] } = useCrmOpportunities();
  const { data: stages = [] } = useCrmStages();

  const data = useMemo(
    () =>
      stages.map((s) => {
        const stageOpps = opps.filter((o) => o.stage_id === s.id);
        const totalValue = stageOpps.reduce((sum, o) => sum + (o.value ?? 0), 0);
        const forecast = stageOpps.reduce((sum, o) => sum + (o.value ?? 0) * (o.probability / 100), 0);
        return { name: s.name, count: stageOpps.length, value: totalValue, forecast, color: s.color };
      }),
    [opps, stages]
  );

  const totalForecast = data.reduce((s, d) => s + d.forecast, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <KpiCard label="Total de Oportunidades" value={opps.length.toString()} color="var(--accent)" icon={TrendingUp} />
        <KpiCard label="Forecast Total" value={fmtBRL(totalForecast, hidden)} color="#10b981" icon={DollarSign} />
        <KpiCard label="Etapas" value={stages.length.toString()} color="#6366f1" icon={BarChart2} />
      </div>
      <div className="rounded-xl p-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", filter: hidden ? "blur(8px)" : undefined }}>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} layout="vertical" barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: "var(--fg-muted)" }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "var(--fg-muted)" }} axisLine={false} tickLine={false} width={100} />
            <Tooltip formatter={(v: number) => fmtBRL(v, hidden)} />
            <Bar dataKey="value" name="Valor Total" fill="#6366f1" radius={[0, 4, 4, 0]} opacity={0.5} />
            <Bar dataKey="forecast" name="Forecast" fill="#10b981" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border)" }}>
              {["Etapa", "Qtd", "Valor Total", "Forecast"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--fg-muted)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((r, i) => (
              <tr key={r.name} style={{ background: i % 2 === 0 ? "var(--bg)" : "var(--bg-card)", borderBottom: "1px solid var(--border)" }}>
                <td className="px-4 py-2.5">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: r.color }} />
                    <span style={{ color: "var(--fg)" }}>{r.name}</span>
                  </span>
                </td>
                <td className="px-4 py-2.5 font-semibold" style={{ color: "var(--fg)" }}>{r.count}</td>
                <td className="px-4 py-2.5" style={{ color: "#6366f1" }}>{fmtBRL(r.value, hidden)}</td>
                <td className="px-4 py-2.5 font-semibold" style={{ color: "#10b981" }}>{fmtBRL(r.forecast, hidden)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Visão Executiva ─────────────────────────────────────────

function VisaoExecutivaPage({ hidden }: { hidden: boolean }) {
  const { data: transactions = [] } = useTransactions();
  const { data: jobs = [] } = useJobs();
  const { data: opps = [] } = useCrmOpportunities();
  const { data: stages = [] } = useCrmStages();
  const { data: clients = [] } = useClients();
  const { data: profiles = [] } = useProfiles();

  const now = new Date();
  const currentMonth = startOfMonth(now);

  const monthTx = transactions.filter(
    (t) => t.status === "paid" && isSameMonth(new Date(t.date), currentMonth)
  );
  const monthRevenue = monthTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const monthExpense = monthTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const monthResult = monthRevenue - monthExpense;

  const openJobs = jobs.filter((j) => !["closed", "cancelled"].includes(j.status)).length;
  const overdueJobs = jobs.filter((j) => j.deadline && new Date(j.deadline) < now && j.status !== "closed").length;

  const openOpps = opps.filter((o) => {
    const stage = stages.find((s) => s.id === o.stage_id);
    return !stage?.is_final;
  });
  const forecast = openOpps.reduce((s, o) => s + (o.value ?? 0) * (o.probability / 100), 0);

  const kpis = [
    { label: "Receita do Mês", value: fmtBRL(monthRevenue, hidden), color: "#10b981", icon: TrendingUp },
    { label: "Resultado do Mês", value: fmtBRL(monthResult, hidden), color: monthResult >= 0 ? "#10b981" : "#ef4444", icon: DollarSign },
    { label: "Vagas em Aberto", value: openJobs.toString(), color: "#6366f1", icon: Briefcase },
    { label: "Vagas Vencidas", value: overdueJobs.toString(), color: overdueJobs > 0 ? "#ef4444" : "#6b7280", icon: AlertCircle },
    { label: "Forecast CRM", value: fmtBRL(forecast, hidden), color: "#f59e0b", icon: TrendingUp },
    { label: "Clientes Ativos", value: clients.length.toString(), color: "#3b82f6", icon: Users },
    { label: "Time", value: profiles.length.toString(), color: "#8b5cf6", icon: Users },
    { label: "Opor. Abertas", value: openOpps.length.toString(), color: "#f59e0b", icon: BarChart2 },
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {kpis.map((k) => (
        <KpiCard key={k.label} label={k.label} value={k.value} color={k.color} icon={k.icon} />
      ))}
    </div>
  );
}

// ─── Faturamento por Cliente ──────────────────────────────────

function FaturamentoClientePage({ hidden }: { hidden: boolean }) {
  const { data: transactions = [] } = useTransactions();
  const { data: clients = [] } = useClients({ includeInactive: true });

  const rows = useMemo(() => {
    const map = new Map<string, { name: string; income: number; expense: number }>();
    for (const t of transactions) {
      if (t.status !== "paid") continue;
      const key = t.client_id ?? "__none";
      const name = clients.find((c) => c.id === t.client_id)?.name ?? "Sem cliente";
      if (!map.has(key)) map.set(key, { name, income: 0, expense: 0 });
      const row = map.get(key)!;
      if (t.type === "income") row.income += t.amount;
      else row.expense += t.amount;
    }
    return [...map.values()]
      .map((r) => ({ ...r, saldo: r.income - r.expense }))
      .sort((a, b) => b.income - a.income);
  }, [transactions, clients]);

  const totIncome = rows.reduce((s, r) => s + r.income, 0);
  const totExpense = rows.reduce((s, r) => s + r.expense, 0);
  const posCount = rows.filter((r) => r.saldo >= 0).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <KpiCard label="Receitas Pagas" value={fmtBRL(totIncome, hidden)} color="#10b981" icon={TrendingUp} />
        <KpiCard label="Despesas Pagas" value={fmtBRL(totExpense, hidden)} color="#ef4444" icon={TrendingDown} />
        <KpiCard label="Clientes c/ Saldo +" value={posCount.toString()} color="var(--accent)" icon={Users} />
      </div>
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border)" }}>
              {["Cliente", "Receitas", "Despesas", "Saldo"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--fg-muted)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.name} style={{ background: i % 2 === 0 ? "var(--bg)" : "var(--bg-card)", borderBottom: "1px solid var(--border)" }}>
                <td className="px-4 py-2.5 font-medium" style={{ color: "var(--fg)" }}>{r.name}</td>
                <td className="px-4 py-2.5" style={{ color: "#10b981" }}>{fmtBRL(r.income, hidden)}</td>
                <td className="px-4 py-2.5" style={{ color: "#ef4444" }}>{fmtBRL(r.expense, hidden)}</td>
                <td className="px-4 py-2.5 font-semibold" style={{ color: r.saldo >= 0 ? "#10b981" : "#ef4444" }}>{fmtBRL(r.saldo, hidden)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-sm" style={{ color: "var(--fg-muted)" }}>Sem dados de faturamento</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Inadimplência ────────────────────────────────────────────

function InadimplenciaPage({ hidden }: { hidden: boolean }) {
  const { data: transactions = [] } = useTransactions();
  const { data: clients = [] } = useClients({ includeInactive: true });
  const now = new Date();

  const overdue = useMemo(() =>
    transactions
      .filter((t) =>
        t.status === "overdue" ||
        (t.status === "pending" && t.due_date && new Date(t.due_date) < now)
      )
      .sort((a, b) => {
        const da = a.due_date ? new Date(a.due_date).getTime() : 0;
        const db = b.due_date ? new Date(b.due_date).getTime() : 0;
        return da - db;
      }),
  [transactions]);

  const total = overdue.reduce((s, t) => s + t.amount, 0);
  const oldest = overdue[0]?.due_date
    ? format(new Date(overdue[0].due_date), "dd/MM/yyyy", { locale: ptBR })
    : "—";

  if (overdue.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ background: "#10b98122" }}>
          <AlertCircle className="w-6 h-6" style={{ color: "#10b981" }} />
        </div>
        <p className="text-base font-semibold mb-1" style={{ color: "var(--fg)" }}>Nenhum pagamento em atraso</p>
        <p className="text-sm" style={{ color: "var(--fg-muted)" }}>Todos os recebimentos estão em dia.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <KpiCard label="Total em Atraso" value={fmtBRL(total, hidden)} color="#ef4444" icon={AlertCircle} />
        <KpiCard label="Operações" value={overdue.length.toString()} color="#f59e0b" icon={DollarSign} />
        <KpiCard label="Mais Antigo" value={oldest} color="var(--fg-muted)" icon={TrendingDown} />
      </div>
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border)" }}>
              {["Cliente", "Descrição", "Vencimento", "Dias em atraso", "Valor"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--fg-muted)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {overdue.map((t, i) => {
              const dueDate = t.due_date ? new Date(t.due_date) : null;
              const dias = dueDate ? Math.floor((now.getTime() - dueDate.getTime()) / 86400000) : 0;
              const clientName = clients.find((c) => c.id === t.client_id)?.name ?? "—";
              return (
                <tr key={t.id} style={{ background: i % 2 === 0 ? "var(--bg)" : "var(--bg-card)", borderBottom: "1px solid var(--border)" }}>
                  <td className="px-4 py-2.5" style={{ color: "var(--fg)" }}>{clientName}</td>
                  <td className="px-4 py-2.5" style={{ color: "var(--fg)" }}>{t.description}</td>
                  <td className="px-4 py-2.5" style={{ color: "var(--fg-muted)" }}>
                    {dueDate ? format(dueDate, "dd/MM/yyyy", { locale: ptBR }) : "—"}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: "#ef444422", color: "#ef4444" }}>
                      {dias}d
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-semibold" style={{ color: "#ef4444" }}>{fmtBRL(t.amount, hidden)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Fluxo de Caixa Projetado ─────────────────────────────────

function FluxoProjetadoPage({ hidden }: { hidden: boolean }) {
  const { data: transactions = [] } = useTransactions();

  const rows = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => startOfMonth(subMonths(new Date(), 5 - i + 0)));
    const now = new Date();
    return months.map((month) => {
      const isPast = month < startOfMonth(now);
      const monthTx = transactions.filter((t) =>
        isPast
          ? t.status === "paid" && isSameMonth(new Date(t.date), month)
          : t.status === "pending" && t.due_date && isSameMonth(new Date(t.due_date), month)
      );
      const receitas = monthTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
      const despesas = monthTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
      return {
        month: format(month, "MMM/yy", { locale: ptBR }),
        receitas,
        despesas,
        saldo: receitas - despesas,
        isPast,
      };
    });
  }, [transactions]);

  const paidIncome = transactions.filter((t) => t.type === "income" && t.status === "paid").reduce((s, t) => s + t.amount, 0);
  const paidExpense = transactions.filter((t) => t.type === "expense" && t.status === "paid").reduce((s, t) => s + t.amount, 0);
  const caixaAtual = paidIncome - paidExpense;
  const recProj = transactions.filter((t) => t.type === "income" && t.status === "pending").reduce((s, t) => s + t.amount, 0);
  const saldoFinal = rows.reduce((s, r) => s + r.saldo, 0);

  const chartData = rows.map((r) => ({
    month: r.month,
    Receitas: r.receitas,
    Despesas: r.despesas,
    Saldo: r.saldo,
    opacity: r.isPast ? 1 : 0.5,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <KpiCard label="Caixa Atual" value={fmtBRL(caixaAtual, hidden)} color={caixaAtual >= 0 ? "#10b981" : "#ef4444"} icon={DollarSign} />
        <KpiCard label="Receitas Projetadas" value={fmtBRL(recProj, hidden)} color="#10b981" icon={TrendingUp} />
        <KpiCard label="Saldo Projetado (12m)" value={fmtBRL(saldoFinal, hidden)} color={saldoFinal >= 0 ? "#10b981" : "#ef4444"} icon={BarChart2} />
      </div>
      <div className="rounded-xl p-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", filter: hidden ? "blur(8px)" : undefined }}>
        <p className="text-xs mb-4" style={{ color: "var(--fg-muted)" }}>Barras transparentes = valores projetados (pendentes)</p>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} barCategoryGap="30%" barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--fg-muted)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "var(--fg-muted)" }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
            <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8 }} formatter={(v: number) => fmtBRL(v, hidden)} />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 16, color: "var(--fg-muted)" }} />
            <Bar dataKey="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} opacity={0.85} />
            <Bar dataKey="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} opacity={0.85} />
            <Bar dataKey="Saldo" fill="#6366f1" radius={[4, 4, 0, 0]} opacity={0.7} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border)" }}>
              {["Mês", "Tipo", "Receitas", "Despesas", "Saldo"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--fg-muted)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...rows].reverse().map((r, i) => (
              <tr key={r.month} style={{ background: i % 2 === 0 ? "var(--bg)" : "var(--bg-card)", borderBottom: "1px solid var(--border)" }}>
                <td className="px-4 py-2.5 font-medium" style={{ color: "var(--fg)" }}>{r.month}</td>
                <td className="px-4 py-2.5">
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: r.isPast ? "#10b98122" : "#6366f122", color: r.isPast ? "#10b981" : "#6366f1" }}>
                    {r.isPast ? "Realizado" : "Projetado"}
                  </span>
                </td>
                <td className="px-4 py-2.5" style={{ color: "#10b981" }}>{fmtBRL(r.receitas, hidden)}</td>
                <td className="px-4 py-2.5" style={{ color: "#ef4444" }}>{fmtBRL(r.despesas, hidden)}</td>
                <td className="px-4 py-2.5 font-semibold" style={{ color: r.saldo >= 0 ? "#10b981" : "#ef4444" }}>{fmtBRL(r.saldo, hidden)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Performance / Saúde das Vagas ───────────────────────────

type VagaHealth = "Saudável" | "Atenção" | "Em Risco" | "Crítico";
const HEALTH_COLOR: Record<VagaHealth, string> = {
  Saudável: "#10b981",
  Atenção: "#f59e0b",
  "Em Risco": "#f97316",
  Crítico: "#ef4444",
};

function getHealth(job: { status: string; deadline?: string | null }): VagaHealth {
  const now = new Date();
  if (job.status === "cancelled") return "Crítico";
  if (job.status === "closed") return "Saudável";
  if (job.deadline) {
    const d = new Date(job.deadline);
    const daysLeft = (d.getTime() - now.getTime()) / 86400000;
    if (daysLeft < 0) return "Crítico";
    if (daysLeft < 7) return "Em Risco";
    if (daysLeft < 14) return "Atenção";
  }
  return "Saudável";
}

function PerformanceVagasPage() {
  const { data: jobs = [] } = useJobs();

  const rows = useMemo(() =>
    jobs.map((j) => ({ job: j, health: getHealth(j) })),
  [jobs]);

  const counts: Record<VagaHealth, number> = { Saudável: 0, Atenção: 0, "Em Risco": 0, Crítico: 0 };
  for (const r of rows) counts[r.health]++;

  const pieData = (Object.entries(counts) as [VagaHealth, number][])
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value, color: HEALTH_COLOR[name] }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {(Object.entries(counts) as [VagaHealth, number][]).map(([label, count]) => (
          <KpiCard key={label} label={label} value={count.toString()} color={HEALTH_COLOR[label]} icon={Briefcase} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="rounded-xl p-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--fg)" }}>Distribuição por Saúde</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={85} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border)" }}>
                {["Vaga", "Cliente", "Recrutador", "Prazo", "Saúde"].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left text-xs font-medium" style={{ color: "var(--fg-muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ job: j, health }, i) => (
                <tr key={j.id} style={{ background: i % 2 === 0 ? "var(--bg)" : "var(--bg-card)", borderBottom: "1px solid var(--border)" }}>
                  <td className="px-3 py-2.5 font-medium truncate max-w-[140px]" style={{ color: "var(--fg)" }}>{j.title}</td>
                  <td className="px-3 py-2.5 text-xs" style={{ color: "var(--fg-muted)" }}>{j.client?.name ?? "—"}</td>
                  <td className="px-3 py-2.5 text-xs" style={{ color: "var(--fg-muted)" }}>{j.recruiter?.name?.split(" ")[0] ?? "—"}</td>
                  <td className="px-3 py-2.5 text-xs" style={{ color: "var(--fg-muted)" }}>{j.deadline ? format(new Date(j.deadline), "dd/MM/yy", { locale: ptBR }) : "—"}</td>
                  <td className="px-3 py-2.5">
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: HEALTH_COLOR[health] + "22", color: HEALTH_COLOR[health] }}>{health}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Shared components ────────────────────────────────────────

function KpiCard({
  label,
  value,
  color,
  icon: Icon,
}: {
  label: string;
  value: string;
  color: string;
  icon: React.ElementType;
}) {
  return (
    <div
      className="rounded-xl p-4"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" style={{ color }} />
        <span className="text-xs" style={{ color: "var(--fg-muted)" }}>
          {label}
        </span>
      </div>
      <p className="text-lg font-bold" style={{ color }}>
        {value}
      </p>
    </div>
  );
}
