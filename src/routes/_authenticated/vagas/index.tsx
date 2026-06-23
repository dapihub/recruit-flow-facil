import { useState, useMemo } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Briefcase, Plus, Pencil, Trash2, Search,
  Download, LayoutList, Kanban, X,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { Header } from "@/components/layout/Header";
import { PageKpis, KpiItem } from "@/components/layout/PageKpis";
import { EmptyState } from "@/components/ui/EmptyState";
import { JobStatusBadge, PriorityBadge } from "@/components/ui/Badges";
import { VagaForm } from "@/components/vagas/VagaForm";
import { useJobs, useDeleteJob, type JobWithJoins } from "@/hooks/useJobs";
import { useHideValues } from "@/hooks/useHideValues";
import { fmtBRL } from "@/lib/utils";
import type { JobStatus } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/vagas/")({
  component: VagasPage,
});

// ─── Constants ────────────────────────────────────────────────

const SENIORITY_LABELS: Record<string, string> = {
  intern: "Estágio",
  junior: "Júnior",
  mid: "Pleno",
  senior: "Sênior",
  specialist: "Especialista",
  lead: "Lead",
};

const KANBAN_COLUMNS: { status: JobStatus; label: string }[] = [
  { status: "open", label: "Triagem" },
  { status: "screening", label: "Entrevista RH" },
  { status: "interviewing", label: "Entrevista Técnica" },
  { status: "proposal", label: "Proposta" },
  { status: "closed", label: "Fechada" },
  { status: "cancelled", label: "Cancelada" },
  { status: "paused", label: "Pausada" },
];

type SortOption = "recent" | "deadline" | "fee";
type ViewMode = "list" | "kanban";

// ─── CSV Export ───────────────────────────────────────────────

function exportToCSV(rows: JobWithJoins[]) {
  const header = ["Cargo", "Cliente", "Status", "Prioridade", "Senioridade", "Recrutador", "Prazo", "Fee (R$)"];
  const lines = rows.map((j) =>
    [
      j.title,
      j.client?.name ?? "",
      j.status,
      j.priority,
      j.seniority ?? "",
      j.recruiter?.name ?? "",
      j.deadline ? format(new Date(j.deadline), "dd/MM/yyyy") : "",
      j.fee_value ?? "",
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",")
  );
  const csv = [header.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "vagas.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// ─── SLA Badge ────────────────────────────────────────────────

function SlaBadge({ deadline }: { deadline: string }) {
  const days = differenceInDays(new Date(deadline), new Date());
  const color =
    days > 14 ? "#10b981" : days >= 7 ? "#f59e0b" : "#ef4444";
  const bg = days > 14 ? "#10b98122" : days >= 7 ? "#f59e0b22" : "#ef444422";
  return (
    <span
      className="ml-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
      style={{ background: bg, color }}
    >
      {days < 0 ? `${Math.abs(days)}d atraso` : `${days}d`}
    </span>
  );
}

// ─── Recruiter Avatar ─────────────────────────────────────────

function RecruiterAvatar({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
        style={{ background: "var(--accent)22", color: "var(--accent)" }}
      >
        {name.charAt(0).toUpperCase()}
      </div>
      <span className="text-sm" style={{ color: "var(--fg-muted)" }}>
        {name}
      </span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────

function VagasPage() {
  const { hidden } = useHideValues();
  const navigate = useNavigate();

  // View & filter state
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<JobStatus | "">("");
  const [clientFilter, setClientFilter] = useState("");
  const [seniorityFilter, setSeniorityFilter] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("recent");

  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [editJob, setEditJob] = useState<JobWithJoins | null>(null);

  // Data — fetch without status filter (we handle it client-side for kanban)
  const { data: allJobs = [], isLoading } = useJobs({
    search: search || undefined,
  });
  const deleteJob = useDeleteJob();

  // Unique clients from loaded jobs
  const uniqueClients = useMemo(() => {
    const seen = new Map<string, string>();
    allJobs.forEach((j) => {
      if (j.client) seen.set(j.client.id, j.client.name);
    });
    return Array.from(seen.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [allJobs]);

  // Filtered + sorted jobs (list view)
  const filteredJobs = useMemo(() => {
    let result = allJobs.filter((j) => {
      if (statusFilter && j.status !== statusFilter) return false;
      if (clientFilter && j.client?.id !== clientFilter) return false;
      if (seniorityFilter && j.seniority !== seniorityFilter) return false;
      return true;
    });

    if (sortBy === "deadline") {
      result = [...result].sort((a, b) => {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      });
    } else if (sortBy === "fee") {
      result = [...result].sort((a, b) => (b.fee_value ?? 0) - (a.fee_value ?? 0));
    }
    // "recent" = default order from API

    return result;
  }, [allJobs, statusFilter, clientFilter, seniorityFilter, sortBy]);

  const hasActiveFilters = !!(statusFilter || clientFilter || seniorityFilter || sortBy !== "recent");

  // KPIs (from all jobs, no filters)
  const total = allJobs.length;
  const open = allJobs.filter((j) => j.status === "open").length;
  const inProcess = allJobs.filter((j) =>
    ["screening", "interviewing", "proposal"].includes(j.status)
  ).length;
  const closed = allJobs.filter((j) => j.status === "closed").length;
  const totalFees = allJobs.reduce((s, j) => s + (j.fee_value ?? 0), 0);

  const handleRowClick = (jobId: string) =>
    navigate({ to: "/vagas/$vagaId", params: { vagaId: jobId } });

  const openCreate = () => { setEditJob(null); setFormOpen(true); };
  const openEdit = (e: React.MouseEvent, job: JobWithJoins) => {
    e.stopPropagation();
    setEditJob(job);
    setFormOpen(true);
  };
  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Remover esta vaga?")) deleteJob.mutate(id);
  };
  const clearFilters = () => {
    setStatusFilter("");
    setClientFilter("");
    setSeniorityFilter("");
    setSortBy("recent");
  };

  const SEL_STYLE = {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    color: "var(--fg)",
  };

  return (
    <div className="flex flex-col min-h-full">
      <Header
        title="Vagas"
        subtitle="Engajamentos ativos com clientes"
        actions={
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div
              className="flex rounded-lg overflow-hidden"
              style={{ border: "1px solid var(--border)" }}
            >
              <button
                onClick={() => setViewMode("list")}
                className="p-1.5 transition-colors"
                style={{
                  background: viewMode === "list" ? "var(--accent)" : "var(--bg-card)",
                  color: viewMode === "list" ? "#fff" : "var(--fg-muted)",
                }}
                title="Lista"
              >
                <LayoutList className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("kanban")}
                className="p-1.5 transition-colors"
                style={{
                  background: viewMode === "kanban" ? "var(--accent)" : "var(--bg-card)",
                  color: viewMode === "kanban" ? "#fff" : "var(--fg-muted)",
                }}
                title="Kanban"
              >
                <Kanban className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={openCreate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              <Plus className="w-4 h-4" /> Nova Vaga
            </button>
          </div>
        }
      />

      <PageKpis>
        <KpiItem label="Total" value={String(total)} />
        <KpiItem label="Abertas" value={String(open)} accent />
        <KpiItem label="Em Processo" value={String(inProcess)} />
        <KpiItem label="Fechadas" value={String(closed)} />
        <KpiItem label="Fees Totais" value={fmtBRL(totalFees, hidden)} />
      </PageKpis>

      {/* Filtros */}
      <div
        className="flex flex-wrap items-center gap-2 px-6 py-3 shrink-0"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "var(--fg-muted)" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar vaga..."
            className="pl-9 pr-3 py-1.5 rounded-lg text-sm focus:outline-none w-44"
            style={SEL_STYLE}
          />
        </div>

        {/* Status */}
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as JobStatus | "")} className="px-2 py-1.5 rounded-lg text-sm focus:outline-none" style={SEL_STYLE}>
          <option value="">Todos os status</option>
          <option value="open">Aberta</option>
          <option value="screening">Triagem</option>
          <option value="interviewing">Entrevistas</option>
          <option value="proposal">Proposta</option>
          <option value="closed">Fechada</option>
          <option value="cancelled">Cancelada</option>
          <option value="paused">Pausada</option>
        </select>

        {/* Cliente */}
        <select value={clientFilter} onChange={(e) => setClientFilter(e.target.value)} className="px-2 py-1.5 rounded-lg text-sm focus:outline-none" style={SEL_STYLE}>
          <option value="">Todos os clientes</option>
          {uniqueClients.map(([id, name]) => (
            <option key={id} value={id}>{name}</option>
          ))}
        </select>

        {/* Senioridade */}
        <select value={seniorityFilter} onChange={(e) => setSeniorityFilter(e.target.value)} className="px-2 py-1.5 rounded-lg text-sm focus:outline-none" style={SEL_STYLE}>
          <option value="">Todas as senioridades</option>
          {Object.entries(SENIORITY_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>

        {/* Ordenação */}
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)} className="px-2 py-1.5 rounded-lg text-sm focus:outline-none" style={SEL_STYLE}>
          <option value="recent">Mais recentes</option>
          <option value="deadline">Prazo mais próximo</option>
          <option value="fee">Maior fee</option>
        </select>

        {/* Limpar filtros */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs"
            style={{ border: "1px solid var(--border)", color: "var(--fg-muted)" }}
          >
            <X className="w-3 h-3" /> Limpar
          </button>
        )}

        {/* Export */}
        <button
          onClick={() => exportToCSV(filteredJobs)}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm"
          style={{ border: "1px solid var(--border)", color: "var(--fg-muted)" }}
        >
          <Download className="w-3.5 h-3.5" /> Exportar CSV
        </button>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="px-6 py-4"><TableSkeleton /></div>
        ) : filteredJobs.length === 0 ? (
          <div className="px-6 py-4">
            <EmptyState
              icon={Briefcase}
              title={search || hasActiveFilters ? "Nenhuma vaga encontrada" : "Nenhuma vaga cadastrada"}
              description={
                search || hasActiveFilters
                  ? "Tente ajustar os filtros."
                  : "Cadastre vagas para acompanhar o pipeline de recrutamento e os fees por processo."
              }
              action={
                !search && !hasActiveFilters ? (
                  <button
                    onClick={openCreate}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium"
                    style={{ background: "var(--accent)", color: "#fff" }}
                  >
                    <Plus className="w-4 h-4" /> Nova Vaga
                  </button>
                ) : undefined
              }
            />
          </div>
        ) : viewMode === "kanban" ? (
          <KanbanView jobs={filteredJobs} onRowClick={handleRowClick} />
        ) : (
          <div className="px-6 py-4 overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Cargo / Cliente", "Status", "Senioridade", "Recrutador", "Prazo / SLA", "Fee", ""].map((h) => (
                    <th key={h} className="text-left py-2 px-3 text-xs font-medium" style={{ color: "var(--fg-muted)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map((job) => (
                  <tr
                    key={job.id}
                    onClick={() => handleRowClick(job.id)}
                    className="group cursor-pointer transition-colors hover:bg-[var(--border)]"
                    style={{ borderBottom: "1px solid var(--border)" }}
                  >
                    <td className="py-3 px-3 min-w-[200px]">
                      <p className="text-sm font-medium" style={{ color: "var(--fg)" }}>{job.title}</p>
                      {job.client && (
                        <p className="text-xs" style={{ color: "var(--fg-muted)" }}>{job.client.name}</p>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <JobStatusBadge status={job.status} />
                    </td>
                    <td className="py-3 px-3 text-sm" style={{ color: "var(--fg-muted)" }}>
                      {job.seniority ? SENIORITY_LABELS[job.seniority] ?? job.seniority : "—"}
                    </td>
                    <td className="py-3 px-3">
                      {job.recruiter ? <RecruiterAvatar name={job.recruiter.name} /> : <span className="text-sm" style={{ color: "var(--fg-muted)" }}>—</span>}
                    </td>
                    <td className="py-3 px-3">
                      {job.deadline ? (
                        <div className="flex items-center flex-wrap gap-0.5">
                          <span className="text-sm" style={{ color: "var(--fg-muted)" }}>
                            {format(new Date(job.deadline), "dd/MM/yyyy")}
                          </span>
                          <SlaBadge deadline={job.deadline} />
                        </div>
                      ) : (
                        <span className="text-sm" style={{ color: "var(--fg-muted)" }}>—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-sm font-medium" style={{ color: "var(--fg)" }}>
                      {job.fee_value ? fmtBRL(job.fee_value, false) : "—"}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => openEdit(e, job)} className="p-1.5 rounded-md hover:bg-[var(--border)]" title="Editar" style={{ color: "var(--fg-muted)" }}>
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={(e) => handleDelete(e, job.id)} className="p-1.5 rounded-md hover:bg-red-500/10" title="Remover" style={{ color: "#ef4444" }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <VagaForm
        key={editJob?.id ?? "new"}
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditJob(null); }}
        defaultValues={editJob ?? undefined}
      />
    </div>
  );
}

// ─── Kanban View ──────────────────────────────────────────────

function KanbanView({
  jobs,
  onRowClick,
}: {
  jobs: JobWithJoins[];
  onRowClick: (id: string) => void;
}) {
  return (
    <div className="flex gap-3 overflow-x-auto px-6 py-4 h-full" style={{ minHeight: 0 }}>
      {KANBAN_COLUMNS.map((col) => {
        const colJobs = jobs.filter((j) => j.status === col.status);
        return (
          <div key={col.status} className="shrink-0 flex flex-col gap-2" style={{ minWidth: 220, width: 220 }}>
            {/* Column header */}
            <div className="flex items-center justify-between px-2 py-1.5 rounded-lg" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <span className="text-xs font-semibold" style={{ color: "var(--fg)" }}>{col.label}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: "var(--border)", color: "var(--fg-muted)" }}>
                {colJobs.length}
              </span>
            </div>
            {/* Cards */}
            {colJobs.map((job) => (
              <div
                key={job.id}
                onClick={() => onRowClick(job.id)}
                className="cursor-pointer rounded-xl p-3 space-y-2 transition-all hover:shadow-md"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
              >
                <p className="text-sm font-medium leading-tight" style={{ color: "var(--fg)" }}>{job.title}</p>
                {job.client && (
                  <p className="text-xs" style={{ color: "var(--fg-muted)" }}>{job.client.name}</p>
                )}
                <div className="flex items-center justify-between">
                  {job.recruiter ? (
                    <div className="flex items-center gap-1">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold" style={{ background: "var(--accent)22", color: "var(--accent)" }}>
                        {job.recruiter.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs" style={{ color: "var(--fg-muted)" }}>{job.recruiter.name.split(" ")[0]}</span>
                    </div>
                  ) : <span />}
                  {job.deadline && <SlaBadge deadline={job.deadline} />}
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="space-y-2 mt-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-14 rounded-lg animate-pulse" style={{ background: "var(--border)" }} />
      ))}
    </div>
  );
}
