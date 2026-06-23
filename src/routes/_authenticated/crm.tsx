import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search, TrendingUp, Calendar, User, LayoutList, Kanban, Pencil, Trash2, BarChart2, Lightbulb, DollarSign, Trophy, XCircle } from "lucide-react";
import { format, subMonths, startOfMonth, isSameMonth, subDays, getYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Header } from "@/components/layout/Header";
import { OportunidadeForm } from "@/components/crm/OportunidadeForm";
import { useHideValues } from "@/hooks/useHideValues";
import { fmtBRL } from "@/lib/utils";
import {
  useCrmStages,
  useCrmOpportunities,
  useUpdateOpportunity,
  useDeleteOpportunity,
  type CrmOpportunity,
  type CrmStage,
} from "@/hooks/useCrm";

export const Route = createFileRoute("/_authenticated/crm")({
  component: CrmPage,
});

function CrmPage() {
  const { hidden } = useHideValues();
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"kanban" | "table" | "insights">("kanban");
  const [formOpen, setFormOpen] = useState(false);
  const [editOpp, setEditOpp] = useState<CrmOpportunity | null>(null);
  const [defaultStageId, setDefaultStageId] = useState<string | undefined>();
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const { data: stages = [] } = useCrmStages();
  const { data: opportunities = [], isLoading } = useCrmOpportunities({ search: search || undefined });
  const updateOpp = useUpdateOpportunity();
  const deleteOpp = useDeleteOpportunity();

  const openOpps = opportunities.filter((o) => {
    const stage = stages.find((s) => s.id === o.stage_id);
    return !stage?.is_final;
  });

  const forecast = openOpps.reduce(
    (sum, o) => sum + (o.value ?? 0) * (o.probability / 100),
    0
  );

  const won = opportunities.filter((o) => {
    const stage = stages.find((s) => s.id === o.stage_id);
    return stage?.outcome === "won";
  });

  const now = new Date();
  const overdue = openOpps.filter(
    (o) => o.expected_close && new Date(o.expected_close) < now
  );

  function openCreate(stageId?: string) {
    setEditOpp(null);
    setDefaultStageId(stageId);
    setFormOpen(true);
  }

  function openEdit(opp: CrmOpportunity) {
    setEditOpp(opp);
    setDefaultStageId(undefined);
    setFormOpen(true);
  }

  function handleClose() {
    setFormOpen(false);
    setEditOpp(null);
    setDefaultStageId(undefined);
  }

  function handleDrop(e: React.DragEvent, targetStageId: string) {
    e.preventDefault();
    const oppId = e.dataTransfer.getData("oppId");
    if (!oppId) return;
    const opp = opportunities.find((o) => o.id === oppId);
    if (!opp || opp.stage_id === targetStageId) return;
    updateOpp.mutate({ id: oppId, stage_id: targetStageId });
    setDraggingId(null);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  const stageMap = new Map<string, CrmOpportunity[]>();
  for (const stage of stages) stageMap.set(stage.id, []);
  for (const opp of opportunities) {
    const list = stageMap.get(opp.stage_id);
    if (list) list.push(opp);
  }

  return (
    <div className="flex flex-col min-h-full">
      <Header
        title="CRM"
        subtitle="Pipeline comercial"
        actions={
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div
              className="flex rounded-lg overflow-hidden"
              style={{ border: "1px solid var(--border)" }}
            >
              <button
                onClick={() => setViewMode("kanban")}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors"
                style={
                  viewMode === "kanban"
                    ? { background: "var(--accent)", color: "#fff" }
                    : { background: "var(--bg-card)", color: "var(--fg-muted)" }
                }
                title="Kanban"
              >
                <Kanban className="w-3.5 h-3.5" /> Kanban
              </button>
              <button
                onClick={() => setViewMode("table")}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors"
                style={
                  viewMode === "table"
                    ? { background: "var(--accent)", color: "#fff" }
                    : { background: "var(--bg-card)", color: "var(--fg-muted)" }
                }
                title="Tabela"
              >
                <LayoutList className="w-3.5 h-3.5" /> Tabela
              </button>
              <button
                onClick={() => setViewMode("insights")}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors"
                style={
                  viewMode === "insights"
                    ? { background: "var(--accent)", color: "#fff" }
                    : { background: "var(--bg-card)", color: "var(--fg-muted)" }
                }
                title="Insights"
              >
                <Lightbulb className="w-3.5 h-3.5" /> Insights
              </button>
            </div>
            <button
              onClick={() => openCreate()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              <Plus className="w-4 h-4" /> Nova Oportunidade
            </button>
          </div>
        }
      />

      {/* Pipeline metrics strip */}
      <div
        className="grid grid-cols-4 gap-3 px-6 py-3 shrink-0"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        {[
          { label: "Forecast Total", value: fmtBRL(forecast, hidden), color: "var(--accent)" },
          { label: "Ações vencidas", value: overdue.length.toString(), color: overdue.length > 0 ? "#ef4444" : "var(--fg)" },
          { label: "Sem follow-up", value: "0", color: "var(--fg-muted)" }, // TODO: conectar ao backend
          { label: "Estagnados 7d+", value: "0", color: "var(--fg-muted)" }, // TODO: conectar ao backend
        ].map((m) => (
          <div
            key={m.label}
            className="rounded-xl px-4 py-3"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
          >
            <p className="text-xl font-bold" style={{ color: m.color }}>{m.value}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>{m.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="px-6 py-3 shrink-0">
        <div className="relative max-w-sm">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: "var(--fg-muted)" }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar oportunidades..."
            className="w-full pl-9 pr-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              color: "var(--fg)",
            }}
          />
        </div>
      </div>

      {/* Content */}
      {viewMode === "kanban" ? (
        <div className="flex-1 px-6 pb-6 overflow-x-auto">
          {isLoading ? (
            <KanbanSkeleton count={stages.length || 4} />
          ) : stages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <TrendingUp className="w-10 h-10 mb-4 opacity-20" style={{ color: "var(--fg-muted)" }} />
              <p className="text-sm" style={{ color: "var(--fg-muted)" }}>
                Nenhuma etapa configurada. Contate o administrador.
              </p>
            </div>
          ) : (
            <div className="flex gap-4 min-w-max pb-4" style={{ minHeight: 400 }}>
              {stages.map((stage) => {
                const opps = stageMap.get(stage.id) ?? [];
                const stageTotal = opps.reduce((s, o) => s + (o.value ?? 0), 0);
                return (
                  <KanbanColumn
                    key={stage.id}
                    stage={stage}
                    opps={opps}
                    stageTotal={stageTotal}
                    hidden={hidden}
                    draggingId={draggingId}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, stage.id)}
                    onAddCard={() => openCreate(stage.id)}
                    onEditCard={openEdit}
                    onDeleteCard={(id) => {
                      if (!confirm("Remover esta oportunidade?")) return;
                      deleteOpp.mutate(id);
                    }}
                    onDragStart={setDraggingId}
                    onDragEnd={() => setDraggingId(null)}
                  />
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 px-6 pb-6 overflow-x-auto">
          {isLoading ? (
            <TableSkeleton />
          ) : (
            <table className="w-full min-w-[800px]">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Nome", "Cliente", "Etapa", "Valor", "Responsável", "Atualizado em", ""].map((h) => (
                    <th
                      key={h}
                      className="text-left py-2 px-3 text-xs font-medium"
                      style={{ color: "var(--fg-muted)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {opportunities.map((opp) => {
                  const stage = stages.find((s) => s.id === opp.stage_id);
                  return (
                    <tr
                      key={opp.id}
                      className="group transition-colors hover:bg-[var(--border)]"
                      style={{ borderBottom: "1px solid var(--border)" }}
                    >
                      <td className="py-3 px-3">
                        <button
                          onClick={() => openEdit(opp)}
                          className="text-sm font-medium text-left hover:underline"
                          style={{ color: "var(--fg)" }}
                        >
                          {opp.title}
                        </button>
                      </td>
                      <td className="py-3 px-3 text-sm" style={{ color: "var(--fg-muted)" }}>
                        {opp.client?.name ?? "—"}
                      </td>
                      <td className="py-3 px-3">
                        {stage ? (
                          <span
                            className="text-xs px-2 py-1 rounded-full font-medium"
                            style={{
                              background: stage.color + "22",
                              color: stage.color,
                            }}
                          >
                            {stage.name}
                          </span>
                        ) : (
                          <span style={{ color: "var(--fg-muted)" }}>—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-sm font-medium" style={{ color: "var(--fg)" }}>
                        {opp.value != null ? fmtBRL(opp.value, hidden) : "—"}
                      </td>
                      <td className="py-3 px-3 text-sm" style={{ color: "var(--fg-muted)" }}>
                        {opp.assignee?.name ?? "—"}
                      </td>
                      <td className="py-3 px-3 text-sm" style={{ color: "var(--fg-muted)" }}>
                        {format(new Date(opp.updated_at), "dd/MM/yyyy", { locale: ptBR })}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEdit(opp)}
                            className="p-1.5 rounded-md hover:bg-[var(--border)]"
                            title="Editar"
                            style={{ color: "var(--fg-muted)" }}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (!confirm("Remover esta oportunidade?")) return;
                              deleteOpp.mutate(opp.id);
                            }}
                            className="p-1.5 rounded-md hover:bg-red-500/10"
                            title="Remover"
                            style={{ color: "#ef4444" }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {opportunities.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-sm" style={{ color: "var(--fg-muted)" }}>
                      Nenhuma oportunidade encontrada
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {viewMode === "insights" && (
        <div className="flex-1 px-6 pb-6">
          <InsightsView opportunities={opportunities} stages={stages} hidden={hidden} />
        </div>
      )}

      <OportunidadeForm
        key={editOpp?.id ?? `new-${defaultStageId}`}
        open={formOpen}
        onClose={handleClose}
        defaultValues={editOpp ?? undefined}
        defaultStageId={defaultStageId}
      />
    </div>
  );
}

// ─── Insights View ───────────────────────────────────────────

interface InsightsViewProps {
  opportunities: CrmOpportunity[];
  stages: CrmStage[];
  hidden: boolean;
}

type InsightsPeriod = "30d" | "90d" | "1y" | "all";

const PERIOD_LABELS: Record<InsightsPeriod, string> = {
  "30d": "Últimos 30 dias",
  "90d": "Últimos 90 dias",
  "1y": "Este ano",
  "all": "Tudo",
};

function InsightsView({ opportunities, stages, hidden }: InsightsViewProps) {
  const [period, setPeriod] = useState<InsightsPeriod>("all");

  const wonStages = stages.filter((s) => s.outcome === "won");
  const lostStages = stages.filter((s) => s.outcome === "lost");
  const wonIds = new Set(wonStages.map((s) => s.id));
  const lostIds = new Set(lostStages.map((s) => s.id));
  const finalIds = new Set(stages.filter((s) => s.is_final).map((s) => s.id));

  // Period filter
  const filtered = useMemo(() => {
    if (period === "all") return opportunities;
    const now = new Date();
    if (period === "30d") return opportunities.filter((o) => new Date(o.created_at) >= subDays(now, 30));
    if (period === "90d") return opportunities.filter((o) => new Date(o.created_at) >= subDays(now, 90));
    if (period === "1y") return opportunities.filter((o) => getYear(new Date(o.created_at)) === getYear(now));
    return opportunities;
  }, [opportunities, period]);

  const total = filtered.length;
  const open = filtered.filter((o) => !finalIds.has(o.stage_id)).length;
  const won = filtered.filter((o) => wonIds.has(o.stage_id)).length;
  const lost = filtered.filter((o) => lostIds.has(o.stage_id)).length;
  const closed = won + lost;
  const winRate = closed > 0 ? (won / closed) * 100 : 0;
  const wonValues = filtered.filter((o) => wonIds.has(o.stage_id)).map((o) => o.value ?? 0);
  const avgTicket = wonValues.length > 0 ? wonValues.reduce((s, v) => s + v, 0) / wonValues.length : 0;

  // Por responsável
  const byAssignee = useMemo(() => {
    const map = new Map<string, { name: string; total: number; value: number; won: number }>();
    for (const opp of filtered) {
      const key = opp.assignee?.id ?? "__none";
      const name = opp.assignee?.name ?? "Sem responsável";
      if (!map.has(key)) map.set(key, { name, total: 0, value: 0, won: 0 });
      const entry = map.get(key)!;
      entry.total++;
      entry.value += opp.value ?? 0;
      if (wonIds.has(opp.stage_id)) entry.won++;
    }
    return [...map.values()].sort((a, b) => b.total - a.total);
  }, [filtered, wonIds]);

  // Por mês (últimos 6) ou período selecionado
  const monthlyData = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => startOfMonth(subMonths(new Date(), 5 - i)));
    return months.map((month) => {
      const monthOpps = filtered.filter((o) => isSameMonth(new Date(o.created_at), month));
      return {
        month: format(month, "MMM", { locale: ptBR }),
        Abertas: monthOpps.filter((o) => !finalIds.has(o.stage_id)).length,
        Ganhas: monthOpps.filter((o) => wonIds.has(o.stage_id)).length,
        Perdidas: monthOpps.filter((o) => lostIds.has(o.stage_id)).length,
      };
    });
  }, [filtered, finalIds, wonIds, lostIds]);

  const kpis = [
    { label: "Total", value: total.toString(), color: "var(--accent)", icon: BarChart2 },
    { label: "Em aberto", value: open.toString(), color: "#6366f1", icon: TrendingUp },
    { label: "Ganhas", value: won.toString(), color: "#10b981", icon: Trophy },
    { label: "Perdidas", value: lost.toString(), color: "#ef4444", icon: XCircle },
    { label: "Win rate", value: closed > 0 ? `${winRate.toFixed(0)}%` : "—", color: winRate >= 50 ? "#10b981" : "#f59e0b", icon: TrendingUp },
    { label: "Ticket médio", value: avgTicket > 0 ? fmtBRL(avgTicket, hidden) : "—", color: "#3b82f6", icon: DollarSign },
  ];

  const chartTitle = period === "all" ? "Oportunidades — últimos 6 meses" : `Oportunidades — ${PERIOD_LABELS[period].toLowerCase()}`;

  return (
    <div className="space-y-6 pt-4">
      {/* Period selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <div
          className="flex rounded-lg overflow-hidden"
          style={{ border: "1px solid var(--border)" }}
        >
          {(Object.keys(PERIOD_LABELS) as InsightsPeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className="px-3 py-1.5 text-xs font-medium transition-colors"
              style={
                period === p
                  ? { background: "var(--accent)", color: "#fff" }
                  : { background: "var(--bg-card)", color: "var(--fg-muted)" }
              }
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
        <span className="text-xs" style={{ color: "var(--fg-muted)" }}>
          Exibindo {filtered.length} oportunidade{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="rounded-xl px-4 py-3"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
          >
            <k.icon className="w-4 h-4 mb-1" style={{ color: k.color }} />
            <p className="text-lg font-bold" style={{ color: k.color }}>{k.value}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>{k.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funil por etapa */}
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          <div className="px-4 py-3" style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border)" }}>
            <p className="text-sm font-semibold" style={{ color: "var(--fg)" }}>Funil por etapa</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border)" }}>
                {["Etapa", "Qtd", "Valor total"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-medium" style={{ color: "var(--fg-muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stages.map((stage, i) => {
                const stageOpps = filtered.filter((o) => o.stage_id === stage.id);
                const stageValue = stageOpps.reduce((s, o) => s + (o.value ?? 0), 0);
                return (
                  <tr key={stage.id} style={{ background: i % 2 === 0 ? "var(--bg)" : "var(--bg-card)", borderBottom: "1px solid var(--border)" }}>
                    <td className="px-4 py-2.5">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: stage.color }} />
                        <span style={{ color: "var(--fg)" }}>{stage.name}</span>
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-semibold" style={{ color: "var(--fg)" }}>{stageOpps.length}</td>
                    <td className="px-4 py-2.5" style={{ color: "#6366f1" }}>{fmtBRL(stageValue, hidden)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Distribuição por responsável */}
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          <div className="px-4 py-3" style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border)" }}>
            <p className="text-sm font-semibold" style={{ color: "var(--fg)" }}>Por responsável</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border)" }}>
                {["Responsável", "Total", "Ganhas", "Valor"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-medium" style={{ color: "var(--fg-muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {byAssignee.map((r, i) => (
                <tr key={r.name} style={{ background: i % 2 === 0 ? "var(--bg)" : "var(--bg-card)", borderBottom: "1px solid var(--border)" }}>
                  <td className="px-4 py-2.5 font-medium" style={{ color: "var(--fg)" }}>{r.name}</td>
                  <td className="px-4 py-2.5 text-center" style={{ color: "var(--fg)" }}>{r.total}</td>
                  <td className="px-4 py-2.5 text-center" style={{ color: "#10b981" }}>{r.won}</td>
                  <td className="px-4 py-2.5" style={{ color: "#6366f1" }}>{fmtBRL(r.value, hidden)}</td>
                </tr>
              ))}
              {byAssignee.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm" style={{ color: "var(--fg-muted)" }}>Sem dados</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Oportunidades por período */}
      <div className="rounded-xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <p className="text-sm font-semibold mb-4" style={{ color: "var(--fg)" }}>{chartTitle}</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthlyData} barCategoryGap="35%">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: "var(--fg-muted)" }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--fg-muted)" }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8 }}
              labelStyle={{ color: "var(--fg)" }}
            />
            <Bar dataKey="Abertas" fill="#6366f1" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Ganhas" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Perdidas" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Kanban Column ────────────────────────────────────────────

interface KanbanColumnProps {
  stage: CrmStage;
  opps: CrmOpportunity[];
  stageTotal: number;
  hidden: boolean;
  draggingId: string | null;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onAddCard: () => void;
  onEditCard: (opp: CrmOpportunity) => void;
  onDeleteCard: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
}

function KanbanColumn({
  stage,
  opps,
  stageTotal,
  hidden,
  draggingId,
  onDragOver,
  onDrop,
  onAddCard,
  onEditCard,
  onDeleteCard,
  onDragStart,
  onDragEnd,
}: KanbanColumnProps) {
  return (
    <div className="min-w-[260px] w-[272px] shrink-0 flex flex-col">
      {/* Column header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: stage.color }} />
          <span className="text-sm font-semibold" style={{ color: "var(--fg)" }}>
            {stage.name}
          </span>
          <span
            className="text-xs px-1.5 py-0.5 rounded-full font-medium"
            style={{ background: "var(--border)", color: "var(--fg-muted)" }}
          >
            {opps.length}
          </span>
        </div>
        {stageTotal > 0 && (
          <span className="text-xs" style={{ color: "var(--fg-muted)" }}>
            {hidden ? "R$ ···" : `R$ ${(stageTotal / 1000).toFixed(0)}k`}
          </span>
        )}
      </div>

      {/* Drop zone */}
      <div
        onDragOver={onDragOver}
        onDrop={onDrop}
        className="flex-1 rounded-xl p-2 space-y-2 transition-colors"
        style={{
          background: "var(--bg-card)",
          border: `2px dashed ${draggingId ? stage.color + "66" : "transparent"}`,
          minHeight: 120,
        }}
      >
        {opps.map((opp) => (
          <OppCard
            key={opp.id}
            opp={opp}
            hidden={hidden}
            isDragging={draggingId === opp.id}
            onClick={() => onEditCard(opp)}
            onDelete={() => onDeleteCard(opp.id)}
            onDragStart={() => onDragStart(opp.id)}
            onDragEnd={onDragEnd}
          />
        ))}

        {opps.length === 0 && !draggingId && (
          <div className="flex flex-col items-center justify-center py-6 rounded-lg" style={{ color: "var(--fg-muted)" }}>
            <p className="text-xs">Arraste cards aqui</p>
          </div>
        )}
      </div>

      {/* Add button */}
      <button
        onClick={onAddCard}
        className="mt-2 w-full flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-medium transition-opacity hover:opacity-80"
        style={{ color: "var(--fg-muted)", border: "1px dashed var(--border)" }}
      >
        <Plus className="w-3.5 h-3.5" /> Adicionar
      </button>
    </div>
  );
}

// ─── Opp Card ────────────────────────────────────────────────

interface OppCardProps {
  opp: CrmOpportunity;
  hidden: boolean;
  isDragging: boolean;
  onClick: () => void;
  onDelete: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}

function OppCard({ opp, hidden, isDragging, onClick, onDelete, onDragStart, onDragEnd }: OppCardProps) {
  const isOverdue = opp.expected_close && new Date(opp.expected_close) < new Date();

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("oppId", opp.id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className="rounded-xl p-3 cursor-pointer select-none transition-all hover:shadow-md"
      style={{
        background: "var(--bg)",
        border: "1px solid var(--border)",
        opacity: isDragging ? 0.4 : 1,
      }}
    >
      <p className="text-sm font-medium mb-2 leading-snug" style={{ color: "var(--fg)" }}>
        {opp.title}
      </p>

      {opp.client && (
        <p className="text-xs mb-1.5" style={{ color: "var(--fg-muted)" }}>
          {opp.client.name}
        </p>
      )}

      {opp.value !== null && (
        <p className="text-sm font-semibold mb-2" style={{ color: "var(--accent)" }}>
          {fmtBRL(opp.value, hidden)}
        </p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {opp.expected_close && (
            <span
              className="flex items-center gap-1 text-xs"
              style={{ color: isOverdue ? "#ef4444" : "var(--fg-muted)" }}
            >
              <Calendar className="w-3 h-3" />
              {format(new Date(opp.expected_close), "dd/MM", { locale: ptBR })}
            </span>
          )}
          {opp.assignee && (
            <span className="flex items-center gap-1 text-xs" style={{ color: "var(--fg-muted)" }}>
              <User className="w-3 h-3" />
              {opp.assignee.name.split(" ")[0]}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <span
            className="text-xs px-1.5 py-0.5 rounded-full"
            style={{ background: "var(--border)", color: "var(--fg-muted)" }}
          >
            {opp.probability}%
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="w-5 h-5 flex items-center justify-center rounded hover:opacity-100 text-red-400 hover:text-red-500 transition-opacity opacity-0 group-hover:opacity-100"
            title="Remover"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Skeletons ────────────────────────────────────────────────

function KanbanSkeleton({ count }: { count: number }) {
  return (
    <div className="flex gap-4 min-w-max">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="min-w-[260px] w-[272px] shrink-0 space-y-2 animate-pulse">
          <div className="h-5 w-24 rounded mb-3" style={{ background: "var(--border)" }} />
          <div className="rounded-xl p-2 space-y-2" style={{ background: "var(--bg-card)", minHeight: 120 }}>
            {Array.from({ length: 2 }).map((_, j) => (
              <div key={j} className="rounded-xl p-3" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                <div className="h-4 w-full rounded mb-2" style={{ background: "var(--border)" }} />
                <div className="h-3 w-2/3 rounded" style={{ background: "var(--border)" }} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-2 mt-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-12 rounded-lg animate-pulse" style={{ background: "var(--border)" }} />
      ))}
    </div>
  );
}
