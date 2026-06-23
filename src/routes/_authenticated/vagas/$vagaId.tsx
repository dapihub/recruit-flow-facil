import { useState } from "react";
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
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Header } from "@/components/layout/Header";
import { JobStatusBadge, PriorityBadge, TaskStatusBadge } from "@/components/ui/Badges";
import { EmptyState } from "@/components/ui/EmptyState";
import { VagaForm } from "@/components/vagas/VagaForm";
import { TarefaForm } from "@/components/tarefas/TarefaForm";
import { useJob } from "@/hooks/useJobs";
import { useJobTasks, useUpdateTask, useDeleteTask } from "@/hooks/useTasks";
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
  { id: "financial", label: "Financeiro" },
  { id: "meetings", label: "Reuniões" },
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
        <div className="flex gap-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-4 py-2 text-sm font-medium transition-colors -mb-px"
              style={
                activeTab === tab.id
                  ? {
                      borderBottom: "2px solid var(--accent)",
                      color: "var(--accent)",
                    }
                  : { color: "var(--fg-muted)" }
              }
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {activeTab === "overview" && (
          <OverviewTab job={job} hidden={hidden} />
        )}
        {activeTab === "tasks" && (
          <TasksTab
            vagaId={vagaId}
            onNewTask={() => {
              setEditTask(null);
              setTaskFormOpen(true);
            }}
            onEditTask={(t) => {
              setEditTask(t);
              setTaskFormOpen(true);
            }}
          />
        )}
        {activeTab === "financial" && (
          <FinanceiroVagaTab job={job} hidden={hidden} />
        )}
        {activeTab === "meetings" && (
          <ReunioesVagaTab job={job} />
        )}
        {activeTab === "activities" && (
          <AtividadesVagaTab job={job} />
        )}
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
                        background: t.type === "income" ? "#10b98122" : "#ef444422",
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
                        background: (TX_STATUS_COLORS[t.status] ?? "#6b7280") + "22",
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
                style={{ background: "var(--accent)22", color: "var(--accent)" }}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium" style={{ color: "var(--fg)" }}>{m.title}</span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: MEETING_STATUS_COLORS[m.status] + "22", color: MEETING_STATUS_COLORS[m.status] }}
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

// ─── Coming Soon ─────────────────────────────────────────────

function ComingSoonTab({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.FC<{ className?: string; style?: React.CSSProperties }>;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Icon
        className="w-10 h-10 mb-4 opacity-20"
        style={{ color: "var(--fg-muted)" }}
      />
      <h3
        className="text-base font-semibold mb-2"
        style={{ color: "var(--fg)" }}
      >
        {title}
      </h3>
      <p className="text-sm max-w-xs" style={{ color: "var(--fg-muted)" }}>
        {desc}
      </p>
    </div>
  );
}
