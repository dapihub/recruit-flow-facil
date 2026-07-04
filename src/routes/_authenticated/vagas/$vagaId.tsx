import { useState, useRef } from "react";
import { toast } from "sonner";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ChevronLeft,
  Pencil,
  Plus,
  CheckSquare,
  Trash2,
  DollarSign,
  Users,
  Activity,
  CheckCircle2,
  Circle,
  Phone,
  Video,
  FileText,
  Calendar,
  ChevronDown,
  ChevronUp,
  StickyNote,
  Receipt,
  MessageCircle,
  Zap,
  Send,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  UserPlus,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Header } from "@/components/layout/Header";
import { JobStatusBadge, PriorityBadge, TaskStatusBadge } from "@/components/ui/Badges";
import { EmptyState } from "@/components/ui/EmptyState";
import { VagaForm } from "@/components/vagas/VagaForm";
import { TarefaForm } from "@/components/tarefas/TarefaForm";
import { useAuth } from "@/lib/auth";
import { useJob } from "@/hooks/useJobs";
import { useJobTasks, useUpdateTask, useDeleteTask } from "@/hooks/useTasks";
import { useContatos } from "@/hooks/useContatos";
import { useTransactions } from "@/hooks/useFinanceiro";
import {
  useMeetings,
  MEETING_TYPE_LABELS,
  MEETING_STATUS_LABELS,
  MEETING_STATUS_COLORS,
  type MeetingType,
} from "@/hooks/useMeetings";
import { useHideValues } from "@/hooks/useHideValues";
import { fmtBRL, fmtDate, cn } from "@/lib/utils";
import {
  CONTRACT_TYPE_LABELS,
  WORK_MODEL_LABELS,
  SENIORITY_LABELS,
  FEE_MODEL_LABELS,
} from "@/lib/constants";
import type { TaskWithJoins } from "@/hooks/useTasks";

export const Route = createFileRoute("/_authenticated/vagas/$vagaId")({
  component: VagaDetailPage,
});

const TABS = [
  { id: "overview", label: "Visão Geral" },
  { id: "tasks", label: "Tarefas" },
  { id: "notas", label: "Notas" },
  { id: "financial", label: "Financeiro" },
  { id: "contatos", label: "Contatos" },
  { id: "meetings", label: "Reuniões" },
  { id: "nf", label: "NF" },
  { id: "chat", label: "Chat" },
  { id: "automacoes", label: "Automações" },
  { id: "activities", label: "Atividades" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function VagaDetailPage() {
  const { vagaId } = Route.useParams();
  const { hidden } = useHideValues();
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [editOpen, setEditOpen] = useState(false);
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [editTask, setEditTask] = useState<TaskWithJoins | null>(null);

  const { data: job, isLoading } = useJob(vagaId);
  const { data: jobTasks = [] } = useJobTasks(vagaId);

  if (isLoading) {
    return (
      <div className="flex-1 p-6 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-8 rounded-lg animate-pulse"
            style={{ background: "var(--border)" }}
          />
        ))}
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex-1 flex items-center justify-center py-20 text-center">
        <div>
          <p className="font-semibold" style={{ color: "var(--fg)" }}>
            Vaga não encontrada.
          </p>
          <Link
            to="/vagas"
            className="text-sm mt-2 inline-block"
            style={{ color: "var(--accent)" }}
          >
            Voltar para Vagas
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <Header
        title={job.title}
        subtitle={job.client?.name ?? undefined}
        actions={
          <div className="flex items-center gap-2">
            <JobStatusBadge status={job.status} />
            <button
              onClick={() => setEditOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hover:opacity-80"
              style={{ border: "1px solid var(--border)", color: "var(--fg)" }}
            >
              <Pencil className="w-3.5 h-3.5" /> Editar
            </button>
          </div>
        }
      />

      {/* Back + Tabs */}
      <div
        className="px-6 shrink-0"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <Link
          to="/vagas"
          className="inline-flex items-center gap-1 text-xs mb-3 mt-3 transition-colors hover:opacity-70"
          style={{ color: "var(--fg-muted)" }}
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Vagas
        </Link>
        <div className="flex gap-0 overflow-x-auto whitespace-nowrap">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium transition-colors -mb-px ${activeTab !== tab.id ? "hover:text-[var(--fg)]" : ""}`}
              style={
                activeTab === tab.id
                  ? { borderBottom: "2px solid var(--accent)", color: "var(--accent)" }
                  : { color: "var(--fg-muted)" }
              }
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Performance banner + KPI cards */}
      <PerformanceSection job={job} tasks={jobTasks} hidden={hidden} />

      {/* Tab content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {activeTab === "overview" && <OverviewTab job={job} hidden={hidden} />}
        {activeTab === "tasks" && (
          <TasksTab
            vagaId={vagaId}
            onNewTask={() => { setEditTask(null); setTaskFormOpen(true); }}
            onEditTask={(t) => { setEditTask(t); setTaskFormOpen(true); }}
          />
        )}
        {activeTab === "notas" && <NotasTab vagaId={vagaId} />}
        {activeTab === "financial" && <FinanceiroVagaTab job={job} hidden={hidden} />}
        {activeTab === "contatos" && <ContatosVagaTab job={job} />}
        {activeTab === "meetings" && <ReunioesVagaTab job={job} />}
        {activeTab === "nf" && <NfTab job={job} />}
        {activeTab === "chat" && <ChatVagaTab vagaId={vagaId} jobTitle={job.title} />}
        {activeTab === "automacoes" && <AutomacoesVagaTab vagaId={vagaId} />}
        {activeTab === "activities" && <AtividadesVagaTab job={job} />}
      </div>

      <VagaForm
        key={`edit-${vagaId}`}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        defaultValues={job}
      />
      <TarefaForm
        key={editTask?.id ?? `new-task-${vagaId}`}
        open={taskFormOpen}
        onClose={() => {
          setTaskFormOpen(false);
          setEditTask(null);
        }}
        defaultValues={editTask ?? undefined}
        defaultJobId={vagaId}
      />
    </div>
  );
}

// ─── Visão Geral ─────────────────────────────────────────────

type JobData = NonNullable<ReturnType<typeof useJob>["data"]>;

function OverviewTab({ job, hidden }: { job: JobData; hidden: boolean }) {
  const infoItems: { label: string; value: React.ReactNode }[] = [
    { label: "Cliente", value: job.client?.name ?? "—" },
    { label: "Recrutador", value: job.recruiter?.name ?? "—" },
    { label: "Prioridade", value: <PriorityBadge priority={job.priority} /> },
    {
      label: "Contrato",
      value: job.contract_type
        ? CONTRACT_TYPE_LABELS[job.contract_type]
        : "—",
    },
    {
      label: "Modelo",
      value: job.work_model ? WORK_MODEL_LABELS[job.work_model] : "—",
    },
    {
      label: "Senioridade",
      value: job.seniority ? SENIORITY_LABELS[job.seniority] : "—",
    },
    { label: "Headcount", value: String(job.headcount) },
    {
      label: "Faixa Salarial",
      value:
        job.salary_min || job.salary_max
          ? `${job.salary_min ? fmtBRL(job.salary_min, hidden) : "—"} → ${job.salary_max ? fmtBRL(job.salary_max, hidden) : "—"}`
          : "—",
    },
    {
      label: "Modelo de Fee",
      value: job.fee_model ? FEE_MODEL_LABELS[job.fee_model] : "—",
    },
    {
      label: "Fee",
      value: job.fee_value ? fmtBRL(job.fee_value, hidden) : "—",
    },
    { label: "Abertura", value: fmtDate(job.opened_at) },
    { label: "Prazo", value: job.deadline ? fmtDate(job.deadline) : "—" },
  ];

  return (
    <div className="space-y-5 max-w-4xl">
      <div
        className="rounded-xl p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
        }}
      >
        {infoItems.map(({ label, value }) => (
          <div key={label}>
            <p className="text-xs mb-0.5" style={{ color: "var(--fg-muted)" }}>
              {label}
            </p>
            {typeof value === "string" ? (
              <p
                className="text-sm font-medium"
                style={{ color: "var(--fg)" }}
              >
                {value}
              </p>
            ) : (
              <div className="mt-0.5">{value}</div>
            )}
          </div>
        ))}
      </div>

      {job.description && (
        <Section title="Descrição / Briefing">
          <p
            className="text-sm leading-relaxed whitespace-pre-wrap"
            style={{ color: "var(--fg)" }}
          >
            {job.description}
          </p>
        </Section>
      )}

      {job.required_skills && (
        <Section title="Habilidades Necessárias">
          <p
            className="text-sm leading-relaxed whitespace-pre-wrap"
            style={{ color: "var(--fg)" }}
          >
            {job.required_skills}
          </p>
        </Section>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
      }}
    >
      <h3
        className="text-xs font-semibold uppercase tracking-wider mb-3"
        style={{ color: "var(--fg-muted)" }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

// ─── Tarefas ─────────────────────────────────────────────────

function TasksTab({
  vagaId,
  onNewTask,
  onEditTask,
}: {
  vagaId: string;
  onNewTask: () => void;
  onEditTask: (t: TaskWithJoins) => void;
}) {
  const { data: tasks = [], isLoading } = useJobTasks(vagaId);
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const toggleDone = (task: TaskWithJoins) => {
    const isDone = task.status === "done";
    updateTask.mutate({
      id: task.id,
      status: isDone ? "not_started" : "done",
      completed_at: isDone ? null : new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: "var(--fg-muted)" }}>
          {tasks.length} {tasks.length === 1 ? "tarefa" : "tarefas"}
        </p>
        <button
          onClick={onNewTask}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          <Plus className="w-4 h-4" /> Nova Tarefa
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-14 rounded-xl animate-pulse"
              style={{ background: "var(--border)" }}
            />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="Nenhuma tarefa"
          description="Adicione tarefas para acompanhar o andamento desta vaga."
          action={
            <button
              onClick={onNewTask}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              <Plus className="w-4 h-4" /> Nova Tarefa
            </button>
          }
        />
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => {
            const done = task.status === "done";
            const overdue =
              task.due_date &&
              new Date(task.due_date) < new Date() &&
              !done;
            return (
              <div
                key={task.id}
                className="flex items-center gap-3 px-4 py-3 rounded-xl group"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                }}
              >
                <button
                  onClick={() => toggleDone(task)}
                  className="shrink-0 transition-colors"
                  style={{ color: done ? "#10b981" : "var(--fg-muted)" }}
                >
                  {done ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      done && "line-through opacity-50"
                    )}
                    style={{ color: "var(--fg)" }}
                  >
                    {task.title}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5">
                    {task.assignee && (
                      <span
                        className="text-xs"
                        style={{ color: "var(--fg-muted)" }}
                      >
                        {task.assignee.name}
                      </span>
                    )}
                    {task.due_date && (
                      <span
                        className="text-xs"
                        style={{
                          color: overdue ? "#ef4444" : "var(--fg-muted)",
                        }}
                      >
                        {format(new Date(task.due_date), "dd/MM/yyyy")}
                      </span>
                    )}
                  </div>
                </div>
                <PriorityBadge priority={task.priority} />
                <TaskStatusBadge status={task.status} />
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onEditTask(task)}
                    className="p-1.5 rounded-md hover:bg-[var(--border)]"
                    style={{ color: "var(--fg-muted)" }}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Remover tarefa?")) deleteTask.mutate(task.id);
                    }}
                    className="p-1.5 rounded-md hover:bg-red-500/10"
                    style={{ color: "#ef4444" }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Financeiro da Vaga ──────────────────────────────────────

const TX_STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  paid: "#10b981",
  overdue: "#ef4444",
  cancelled: "#6b7280",
};
const TX_STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  paid: "Pago",
  overdue: "Vencido",
  cancelled: "Cancelado",
};

function FinanceiroVagaTab({ job, hidden }: { job: JobData; hidden: boolean }) {
  const { data: allTx = [], isLoading } = useTransactions();
  const clientTx = allTx
    .filter((t) => t.client_id === job.client_id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const receitas = clientTx
    .filter((t) => t.type === "income" && t.status === "paid")
    .reduce((s, t) => s + t.amount, 0);
  const despesas = clientTx
    .filter((t) => t.type === "expense" && t.status === "paid")
    .reduce((s, t) => s + t.amount, 0);
  const saldo = receitas - despesas;

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-10 rounded-lg animate-pulse" style={{ background: "var(--border)" }} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-4xl">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Receitas pagas", value: fmtBRL(receitas, hidden), color: "#10b981" },
          { label: "Despesas pagas", value: fmtBRL(despesas, hidden), color: "#ef4444" },
          { label: "Saldo", value: fmtBRL(saldo, hidden), color: saldo >= 0 ? "#10b981" : "#ef4444" },
        ].map((k) => (
          <div key={k.label} className="rounded-xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <p className="text-xs mb-1" style={{ color: "var(--fg-muted)" }}>{k.label}</p>
            <p className="text-lg font-bold" style={{ color: k.color }}>{k.value}</p>
          </div>
        ))}
      </div>

      {clientTx.length === 0 ? (
        <EmptyState
          icon={DollarSign}
          title="Sem operações para este cliente"
          description="As transações vinculadas ao cliente desta vaga aparecerão aqui."
        />
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border)" }}>
                {["Data", "Descrição", "Tipo", "Status", "Valor"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--fg-muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clientTx.map((t, i) => (
                <tr key={t.id} style={{ background: i % 2 === 0 ? "var(--bg)" : "var(--bg-card)", borderBottom: "1px solid var(--border)" }}>
                  <td className="px-4 py-2.5 text-xs" style={{ color: "var(--fg-muted)" }}>
                    {format(new Date(t.date), "dd/MM/yyyy")}
                  </td>
                  <td className="px-4 py-2.5" style={{ color: "var(--fg)" }}>{t.description}</td>
                  <td className="px-4 py-2.5">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{
                        background: t.type === "income" ? "color-mix(in srgb, #10b981 12%, transparent)" : "color-mix(in srgb, #ef4444 12%, transparent)",
                        color: t.type === "income" ? "#10b981" : "#ef4444",
                      }}
                    >
                      {t.type === "income" ? "Receita" : "Despesa"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{
                        background: `color-mix(in srgb, ${TX_STATUS_COLORS[t.status] ?? "#6b7280"} 12%, transparent)`,
                        color: TX_STATUS_COLORS[t.status] ?? "#6b7280",
                      }}
                    >
                      {TX_STATUS_LABELS[t.status] ?? t.status}
                    </span>
                  </td>
                  <td
                    className="px-4 py-2.5 font-semibold"
                    style={{ color: t.type === "income" ? "#10b981" : "#ef4444" }}
                  >
                    {fmtBRL(t.amount, hidden)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Reuniões da Vaga ─────────────────────────────────────────

const MEETING_TYPE_ICONS: Record<MeetingType, React.ElementType> = {
  call: Phone,
  video_call: Video,
  in_person: Users,
  other: FileText,
};

function ReunioesVagaTab({ job }: { job: JobData }) {
  const { data: allMeetings = [], isLoading } = useMeetings();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const meetings = allMeetings
    .filter((m) => m.client_id === job.client_id)
    .sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: "var(--border)" }} />
        ))}
      </div>
    );
  }

  if (meetings.length === 0) {
    return (
      <EmptyState
        icon={Calendar}
        title="Sem reuniões com este cliente"
        description="Reuniões e atas vinculadas ao cliente desta vaga aparecerão aqui."
      />
    );
  }

  return (
    <div className="space-y-2 max-w-3xl">
      {meetings.map((m) => {
        const Icon = MEETING_TYPE_ICONS[m.type];
        const isExpanded = expandedId === m.id;
        const hasNotes = m.agenda || m.notes;
        return (
          <div key={m.id} className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-3 px-4 py-3" style={{ background: "var(--bg-card)" }}>
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "color-mix(in srgb, var(--accent) 12%, transparent)", color: "var(--accent)" }}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium" style={{ color: "var(--fg)" }}>{m.title}</span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: `color-mix(in srgb, ${MEETING_STATUS_COLORS[m.status]} 12%, transparent)`, color: MEETING_STATUS_COLORS[m.status] }}
                  >
                    {MEETING_STATUS_LABELS[m.status]}
                  </span>
                </div>
                <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>
                  {format(new Date(m.scheduled_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  {" · "}
                  {MEETING_TYPE_LABELS[m.type]}
                </p>
              </div>
              {hasNotes && (
                <button
                  onClick={() => setExpandedId(isExpanded ? null : m.id)}
                  className="p-1.5 rounded-lg hover:opacity-80"
                  style={{ color: "var(--fg-muted)" }}
                >
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              )}
            </div>
            {isExpanded && hasNotes && (
              <div className="px-4 py-3 space-y-2" style={{ borderTop: "1px solid var(--border)", background: "var(--bg)" }}>
                {m.agenda && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--fg-muted)" }}>Pauta</p>
                    <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--fg)" }}>{m.agenda}</p>
                  </div>
                )}
                {m.notes && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--fg-muted)" }}>Ata</p>
                    <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--fg)" }}>{m.notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Atividades da Vaga ───────────────────────────────────────

function AtividadesVagaTab({ job }: { job: JobData }) {
  const events: { label: string; detail?: string; date?: string }[] = [];

  if ("created_at" in job && job.created_at) {
    events.push({ label: "Vaga criada", date: fmtDate(job.created_at as string) });
  }
  if (job.opened_at) {
    events.push({ label: "Abertura definida", date: fmtDate(job.opened_at) });
  }
  events.push({ label: "Status atual", detail: job.status });
  if (job.deadline) {
    events.push({ label: "Prazo", date: fmtDate(job.deadline) });
  }

  return (
    <div className="max-w-lg">
      <div className="relative pl-6">
        {/* Vertical line */}
        <div
          className="absolute left-2 top-2 bottom-2 w-px"
          style={{ background: "var(--border)" }}
        />
        <div className="space-y-6">
          {events.map((ev, i) => (
            <div key={i} className="relative flex items-start gap-3">
              {/* Dot */}
              <div
                className="absolute -left-4 mt-1 w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: "var(--accent)" }}
              />
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--fg)" }}>
                  {ev.label}
                  {ev.detail && (
                    <span className="ml-1 font-normal" style={{ color: "var(--fg-muted)" }}>— {ev.detail}</span>
                  )}
                </p>
                {ev.date && (
                  <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>{ev.date}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Performance Banner + KPIs ───────────────────────────────

function PerformanceSection({
  job,
  tasks,
  hidden,
}: {
  job: JobData;
  tasks: TaskWithJoins[];
  hidden: boolean;
}) {
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "done").length;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  const now = new Date();
  const isOverdue = job.deadline && new Date(job.deadline) < now;
  const daysLeft = job.deadline
    ? Math.ceil((new Date(job.deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const score =
    progress >= 80 && !isOverdue ? "Bom"
    : progress >= 50 ? "Atenção"
    : "Crítico";

  const scoreColor =
    score === "Bom" ? "#10b981"
    : score === "Atenção" ? "#f59e0b"
    : "#ef4444";

  const ScoreIcon =
    score === "Bom" ? CheckCircle
    : score === "Atenção" ? AlertTriangle
    : AlertCircle;

  return (
    <div
      className="px-6 py-3 shrink-0 space-y-3"
      style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-card)" }}
    >
      {/* Performance banner */}
      <div
        className="flex items-center justify-between rounded-xl px-4 py-2.5"
        style={{ background: scoreColor + "14", border: `1px solid ${scoreColor}44` }}
      >
        <div className="flex items-center gap-2.5">
          <ScoreIcon className="w-4 h-4 shrink-0" style={{ color: scoreColor }} />
          <div>
            <span className="text-sm font-semibold" style={{ color: scoreColor }}>
              Performance: {score}
            </span>
            <span className="text-xs ml-2" style={{ color: "var(--fg-muted)" }}>
              {total === 0 ? "Nenhuma tarefa" : `${done}/${total} tarefas concluídas`}
              {daysLeft !== null && ` · ${daysLeft > 0 ? `${daysLeft}d restantes` : "Prazo vencido"}`}
            </span>
          </div>
        </div>
        <span
          className="text-2xl font-bold tabular-nums"
          style={{ color: scoreColor }}
        >
          {progress}%
        </span>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Progresso", value: `${progress}%`, sub: `${done}/${total} tarefas` },
          {
            label: "Valor do Fee",
            value: job.fee_value ? fmtBRL(job.fee_value, hidden) : "—",
            sub: job.fee_model ?? "—",
          },
          {
            label: "Data de Início",
            value: job.opened_at ? format(new Date(job.opened_at), "dd/MM/yyyy") : "—",
            sub: "Abertura da vaga",
          },
          {
            label: "Prazo",
            value: job.deadline ? format(new Date(job.deadline), "dd/MM/yyyy") : "—",
            sub: isOverdue ? "Vencido" : daysLeft !== null ? `${daysLeft}d restantes` : "Sem prazo",
            color: isOverdue ? "#ef4444" : undefined,
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-lg px-3 py-2"
            style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
          >
            <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: "var(--fg-muted)" }}>
              {kpi.label}
            </p>
            <p className="text-sm font-bold" style={{ color: kpi.color ?? "var(--fg)" }}>
              {kpi.value}
            </p>
            <p className="text-[10px] mt-0.5" style={{ color: "var(--fg-muted)" }}>{kpi.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Notas ───────────────────────────────────────────────────

function NotasTab({ vagaId }: { vagaId: string }) {
  const key = `themis:notas:${vagaId}`;
  const [content, setContent] = useState(() => localStorage.getItem(key) ?? "");
  const [saved, setSaved] = useState(true);

  function handleChange(v: string) {
    setContent(v);
    setSaved(false);
  }

  function handleSave() {
    localStorage.setItem(key, content);
    setSaved(true);
  }

  return (
    <div className="max-w-3xl space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StickyNote className="w-4 h-4" style={{ color: "var(--fg-muted)" }} />
          <p className="text-sm font-medium" style={{ color: "var(--fg)" }}>Notas da Vaga</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saved}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-opacity"
          style={{ background: "var(--accent)", color: "#fff", opacity: saved ? 0.5 : 1 }}
        >
          {saved ? "Salvo" : "Salvar"}
        </button>
      </div>
      <textarea
        value={content}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Escreva notas sobre esta vaga... briefing, observações do cliente, pontos de atenção..."
        className="w-full min-h-[360px] px-4 py-3 rounded-xl text-sm resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          color: "var(--fg)",
        }}
      />
      <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
        {content.length} caracteres · Salvo localmente
      </p>
    </div>
  );
}

// ─── Contatos da Vaga ─────────────────────────────────────────

function ContatosVagaTab({ job }: { job: JobData }) {
  const { data: contatos = [], isLoading } = useContatos(
    job.client_id ? { client_id: job.client_id } : undefined
  );

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: "var(--border)" }} />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-4">
      {job.client && (
        <div
          className="rounded-xl p-4"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--fg-muted)" }}>
            Cliente do Projeto
          </p>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
              style={{ background: "color-mix(in srgb, var(--accent) 12%, transparent)", color: "var(--accent)" }}
            >
              {job.client.name.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--fg)" }}>{job.client.name}</p>
              <p className="text-xs" style={{ color: "var(--fg-muted)" }}>Cliente</p>
            </div>
          </div>
        </div>
      )}

      <div
        className="rounded-xl overflow-hidden"
        style={{ border: "1px solid var(--border)" }}
      >
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-card)" }}
        >
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" style={{ color: "var(--fg-muted)" }} />
            <p className="text-sm font-medium" style={{ color: "var(--fg)" }}>Contatos vinculados</p>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full"
              style={{ background: "var(--border)", color: "var(--fg-muted)" }}
            >
              {contatos.length}
            </span>
          </div>
          <Link
            to="/contatos"
            className="flex items-center gap-1 text-xs"
            style={{ color: "var(--accent)" }}
          >
            <UserPlus className="w-3.5 h-3.5" /> Gerenciar
          </Link>
        </div>

        {contatos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center px-4">
            <Users className="w-8 h-8 mb-3 opacity-20" style={{ color: "var(--fg-muted)" }} />
            <p className="text-sm" style={{ color: "var(--fg-muted)" }}>
              Nenhum contato vinculado a este cliente
            </p>
            <Link
              to="/contatos"
              className="mt-3 text-xs px-3 py-1.5 rounded-lg"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              Adicionar contato
            </Link>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {contatos.map((c) => (
              <div key={c.id} className="flex items-center gap-3 px-4 py-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: "color-mix(in srgb, var(--accent) 12%, transparent)", color: "var(--accent)" }}
                >
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: "var(--fg)" }}>{c.name}</p>
                  <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
                    {[c.role, c.email, c.phone].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── NF ──────────────────────────────────────────────────────

function NfTab({ job }: { job: JobData }) {
  const key = `themis:nf:${job.id}`;
  const [form, setForm] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(key) ?? "{}");
    } catch {
      return {};
    }
  });

  const set = (field: string, value: string) => setForm((p: any) => ({ ...p, [field]: value }));

  function handleSave() {
    localStorage.setItem(key, JSON.stringify(form));
    toast.success("Configuração de NF salva");
  }

  const INPUT_STYLE = {
    background: "var(--bg)",
    border: "1px solid var(--border)",
    color: "var(--fg)",
  };
  const INPUT_CLASS = "w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40";

  const Section2 = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="rounded-xl p-5 space-y-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--fg-muted)" }}>{title}</p>
      {children}
    </div>
  );

  return (
    <div className="max-w-2xl space-y-5">
      <Section2 title="Dados do Tomador">
        {[
          { key: "tomador_nome", label: "Nome / Razão Social" },
          { key: "tomador_cnpj", label: "CNPJ / CPF" },
          { key: "tomador_email", label: "Email" },
          { key: "tomador_endereco", label: "Endereço" },
        ].map(({ key: k, label }) => (
          <div key={k}>
            <label className="text-xs font-medium block mb-1" style={{ color: "var(--fg-muted)" }}>{label}</label>
            <input value={form[k] ?? ""} onChange={(e) => set(k, e.target.value)} className={INPUT_CLASS} style={INPUT_STYLE} />
          </div>
        ))}
      </Section2>

      <Section2 title="Dados do Serviço">
        {[
          { key: "servico_descricao", label: "Descrição do Serviço" },
          { key: "servico_codigo", label: "Código do Serviço (CNAE)" },
          { key: "servico_aliquota", label: "Alíquota ISS (%)" },
        ].map(({ key: k, label }) => (
          <div key={k}>
            <label className="text-xs font-medium block mb-1" style={{ color: "var(--fg-muted)" }}>{label}</label>
            <input value={form[k] ?? ""} onChange={(e) => set(k, e.target.value)} className={INPUT_CLASS} style={INPUT_STYLE} />
          </div>
        ))}
      </Section2>

      <Section2 title="Configuração de E-mail">
        {[
          { key: "email_para", label: "Enviar NF para" },
          { key: "email_cc", label: "CC" },
          { key: "email_assunto", label: "Assunto" },
        ].map(({ key: k, label }) => (
          <div key={k}>
            <label className="text-xs font-medium block mb-1" style={{ color: "var(--fg-muted)" }}>{label}</label>
            <input value={form[k] ?? ""} onChange={(e) => set(k, e.target.value)} className={INPUT_CLASS} style={INPUT_STYLE} />
          </div>
        ))}
      </Section2>

      <button
        onClick={handleSave}
        className="px-4 py-2 rounded-lg text-sm font-medium"
        style={{ background: "var(--accent)", color: "#fff" }}
      >
        Salvar configuração
      </button>
    </div>
  );
}

// ─── Chat da Vaga ─────────────────────────────────────────────

type ChatMessage = { id: string; text: string; sender: string; at: string };

function ChatVagaTab({ vagaId, jobTitle }: { vagaId: string; jobTitle: string }) {
  const key = `themis:chat:${vagaId}`;
  const { profile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try { return JSON.parse(localStorage.getItem(key) ?? "[]"); } catch { return []; }
  });
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  function send() {
    if (!text.trim()) return;
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      text: text.trim(),
      sender: profile?.name ?? "Eu",
      at: new Date().toISOString(),
    };
    const next = [...messages, msg];
    setMessages(next);
    localStorage.setItem(key, JSON.stringify(next));
    setText("");
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  return (
    <div className="flex flex-col max-w-3xl h-[520px]" style={{ border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
      <div className="px-4 py-3 flex items-center gap-2 shrink-0" style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border)" }}>
        <MessageCircle className="w-4 h-4" style={{ color: "var(--accent)" }} />
        <p className="text-sm font-medium" style={{ color: "var(--fg)" }}>{jobTitle}</p>
        <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "var(--border)", color: "var(--fg-muted)" }}>
          Chat da Vaga
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ background: "var(--bg)" }}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "color-mix(in srgb, var(--accent) 12%, transparent)" }}
            >
              <MessageCircle className="w-5 h-5" style={{ color: "var(--accent)", opacity: 0.8 }} />
            </div>
            <p className="text-sm font-semibold mb-1" style={{ color: "var(--fg)" }}>Nenhuma mensagem ainda</p>
            <p className="text-xs" style={{ color: "var(--fg-muted)" }}>Inicie uma conversa sobre esta vaga</p>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className="flex items-start gap-2">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5"
              style={{ background: "color-mix(in srgb, var(--accent) 12%, transparent)", color: "var(--accent)" }}
            >
              {msg.sender.charAt(0)}
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-semibold" style={{ color: "var(--fg)" }}>{msg.sender}</span>
                <span className="text-[10px]" style={{ color: "var(--fg-muted)" }}>
                  {format(new Date(msg.at), "HH:mm dd/MM")}
                </span>
              </div>
              <p
                className="text-sm mt-0.5 px-3 py-2 rounded-xl inline-block"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--fg)" }}
              >
                {msg.text}
              </p>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div
        className="flex items-center gap-2 px-3 py-3 shrink-0"
        style={{ background: "var(--bg-card)", borderTop: "1px solid var(--border)" }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
          placeholder="Escreva uma mensagem..."
          className="flex-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg)" }}
        />
        <button
          onClick={send}
          disabled={!text.trim()}
          className="p-2 rounded-lg transition-opacity disabled:opacity-40"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Automações da Vaga ───────────────────────────────────────

function AutomacoesVagaTab({ vagaId }: { vagaId: string }) {
  const key = `themis:automacoes:${vagaId}`;
  const [automations, setAutomations] = useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem(key) ?? "[]"); } catch { return []; }
  });
  const [adding, setAdding] = useState(false);
  const [trigger, setTrigger] = useState("Candidato movido de etapa");
  const [action, setAction] = useState("Criar tarefa automática");
  const [name, setName] = useState("");

  function saveAll(updated: any[]) {
    setAutomations(updated);
    localStorage.setItem(key, JSON.stringify(updated));
  }

  function add() {
    if (!name.trim()) return;
    saveAll([...automations, { id: crypto.randomUUID(), name: name.trim(), trigger, action, active: true }]);
    setAdding(false);
    setName("");
  }

  const TRIGGERS = ["Candidato movido de etapa", "Tarefa concluída", "Vaga atualizada", "Reunião agendada"];
  const ACTIONS = ["Criar tarefa automática", "Notificar responsável", "Enviar email", "Atualizar status"];

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4" style={{ color: "var(--accent)" }} />
          <p className="text-sm font-medium" style={{ color: "var(--fg)" }}>Automações desta vaga</p>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          <Plus className="w-3.5 h-3.5" /> Nova Automação
        </button>
      </div>

      {adding && (
        <div className="rounded-xl p-4 space-y-3" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: "var(--fg-muted)" }}>Nome</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none" style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg)" }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: "var(--fg-muted)" }}>Gatilho</label>
              <select value={trigger} onChange={(e) => setTrigger(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg)" }}>
                {TRIGGERS.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: "var(--fg-muted)" }}>Ação</label>
              <select value={action} onChange={(e) => setAction(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg)" }}>
                {ACTIONS.map((a) => <option key={a}>{a}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={add} className="px-4 py-1.5 rounded-lg text-sm font-medium" style={{ background: "var(--accent)", color: "#fff" }}>Salvar</button>
            <button onClick={() => setAdding(false)} className="px-4 py-1.5 rounded-lg text-sm font-medium" style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg)" }}>Cancelar</button>
          </div>
        </div>
      )}

      {automations.length === 0 && !adding ? (
        <EmptyState
          icon={Zap}
          title="Nenhuma automação"
          description="Configure automações para agilizar o acompanhamento desta vaga."
          action={
            <button
              onClick={() => setAdding(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              <Plus className="w-4 h-4" /> Nova Automação
            </button>
          }
        />
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          {automations.map((a: any, i: number) => (
            <div
              key={a.id}
              className="flex items-center gap-3 px-4 py-3"
              style={{
                background: i % 2 === 0 ? "var(--bg)" : "var(--bg-card)",
                borderBottom: i < automations.length - 1 ? "1px solid var(--border)" : undefined,
              }}
            >
              <Zap className="w-4 h-4 shrink-0" style={{ color: "var(--accent)" }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ color: "var(--fg)" }}>{a.name}</p>
                <p className="text-xs" style={{ color: "var(--fg-muted)" }}>{a.trigger} → {a.action}</p>
              </div>
              <button
                onClick={() => saveAll(automations.filter((_: any, j: number) => j !== i))}
                className="p-1 hover:opacity-80"
                style={{ color: "#ef4444" }}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
