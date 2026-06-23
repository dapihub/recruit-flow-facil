import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CheckSquare,
  Plus,
  Pencil,
  Trash2,
  Search,
  CheckCircle2,
  Circle,
  LayoutList,
  Kanban,
  Table2,
} from "lucide-react";
import { format } from "date-fns";
import { Header } from "@/components/layout/Header";
import { PageKpis, KpiItem } from "@/components/layout/PageKpis";
import { EmptyState } from "@/components/ui/EmptyState";
import { PriorityBadge, TaskStatusBadge } from "@/components/ui/Badges";
import { TarefaForm } from "@/components/tarefas/TarefaForm";
import {
  useTasks,
  useUpdateTask,
  useDeleteTask,
  type TaskWithJoins,
} from "@/hooks/useTasks";
import { cn } from "@/lib/utils";
import type { TaskStatus } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/tarefas")({
  component: TarefasPage,
});

type ViewMode = "lista" | "tabela" | "kanban";

const KANBAN_COLUMNS: { status: TaskStatus; label: string; color: string }[] = [
  { status: "not_started", label: "Não Iniciada", color: "#6b7280" },
  { status: "in_progress", label: "Em Andamento", color: "#6366f1" },
  { status: "in_review",   label: "Em Revisão",   color: "#f59e0b" },
  { status: "done",        label: "Finalizada",   color: "#10b981" },
];

function TarefasPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "">("");
  const [viewMode, setViewMode] = useState<ViewMode>("lista");
  const [formOpen, setFormOpen] = useState(false);
  const [editTask, setEditTask] = useState<TaskWithJoins | null>(null);
  const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus | undefined>();

  const { data: tasks = [], isLoading } = useTasks({
    status: statusFilter || undefined,
    search: search || undefined,
  });

  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const now = new Date();
  const total = tasks.length;
  const notStarted = tasks.filter((t) => t.status === "not_started").length;
  const inProgress = tasks.filter((t) => t.status === "in_progress").length;
  const inReview = tasks.filter((t) => t.status === "in_review").length;
  const done = tasks.filter((t) => t.status === "done").length;
  const overdue = tasks.filter(
    (t) => t.due_date && new Date(t.due_date) < now && t.status !== "done"
  ).length;

  function openCreate(status?: TaskStatus) {
    setEditTask(null);
    setNewTaskStatus(status);
    setFormOpen(true);
  }

  function openEdit(task: TaskWithJoins) {
    setEditTask(task);
    setNewTaskStatus(undefined);
    setFormOpen(true);
  }

  function toggleDone(task: TaskWithJoins) {
    const isDone = task.status === "done";
    updateTask.mutate({
      id: task.id,
      status: isDone ? "not_started" : "done",
      completed_at: isDone ? null : new Date().toISOString(),
    });
  }

  function handleDelete(id: string) {
    if (confirm("Remover tarefa?")) deleteTask.mutate(id);
  }

  const viewButtons: { mode: ViewMode; icon: React.ElementType; label: string }[] = [
    { mode: "lista",   icon: LayoutList, label: "Lista" },
    { mode: "tabela",  icon: Table2,     label: "Tabela" },
    { mode: "kanban",  icon: Kanban,     label: "Kanban" },
  ];

  return (
    <div className="flex flex-col min-h-full">
      <Header
        title="Tarefas"
        actions={
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div
              className="flex rounded-lg overflow-hidden"
              style={{ border: "1px solid var(--border)" }}
            >
              {viewButtons.map(({ mode, icon: Icon, label }) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  title={label}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors"
                  style={
                    viewMode === mode
                      ? { background: "var(--accent)", color: "#fff" }
                      : { background: "var(--bg-card)", color: "var(--fg-muted)" }
                  }
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => openCreate()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              <Plus className="w-4 h-4" /> Nova Tarefa
            </button>
          </div>
        }
      />

      <PageKpis>
        <KpiItem label="Total" value={String(total)} />
        <KpiItem label="Não Iniciadas" value={String(notStarted)} />
        <KpiItem label="Em Andamento" value={String(inProgress)} accent />
        <KpiItem label="Em Revisão" value={String(inReview)} />
        <KpiItem label="Finalizadas" value={String(done)} />
        <KpiItem label="Atrasadas" value={String(overdue)} />
      </PageKpis>

      {/* Filtros */}
      <div
        className="flex items-center gap-3 px-6 py-3 shrink-0"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="relative flex-1 max-w-xs">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
            style={{ color: "var(--fg-muted)" }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar tarefa..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg text-sm focus:outline-none"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              color: "var(--fg)",
            }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as TaskStatus | "")}
          className="px-3 py-1.5 rounded-lg text-sm focus:outline-none"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            color: "var(--fg)",
          }}
        >
          <option value="">Todos os status</option>
          <option value="not_started">Não Iniciada</option>
          <option value="in_progress">Em Andamento</option>
          <option value="in_review">Em Revisão</option>
          <option value="done">Finalizada</option>
        </select>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex-1 px-6 py-4 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: "var(--border)" }} />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex-1 px-6 py-4">
          <EmptyState
            icon={CheckSquare}
            title={search || statusFilter ? "Nenhuma tarefa encontrada" : "Nenhuma tarefa cadastrada"}
            description={
              search || statusFilter
                ? "Tente ajustar os filtros."
                : "Crie tarefas para acompanhar atividades da operação e vinculá-las a vagas."
            }
            action={
              !search && !statusFilter ? (
                <button
                  onClick={() => openCreate()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium"
                  style={{ background: "var(--accent)", color: "#fff" }}
                >
                  <Plus className="w-4 h-4" /> Nova Tarefa
                </button>
              ) : undefined
            }
          />
        </div>
      ) : viewMode === "lista" ? (
        <div className="flex-1 px-6 py-4">
          <div className="space-y-2 max-w-4xl">
            {tasks.map((task) => (
              <ListaCard
                key={task.id}
                task={task}
                now={now}
                onEdit={openEdit}
                onDelete={handleDelete}
                onToggleDone={toggleDone}
              />
            ))}
          </div>
        </div>
      ) : viewMode === "tabela" ? (
        <div className="flex-1 px-6 py-4 overflow-x-auto">
          <TabelaView
            tasks={tasks}
            now={now}
            onEdit={openEdit}
            onDelete={handleDelete}
            onToggleDone={toggleDone}
          />
        </div>
      ) : (
        <div className="flex-1 px-6 py-4 overflow-x-auto">
          <KanbanView
            tasks={tasks}
            now={now}
            onEdit={openEdit}
            onDelete={handleDelete}
            onToggleDone={toggleDone}
            onAddCard={openCreate}
          />
        </div>
      )}

      <TarefaForm
        key={editTask?.id ?? `new-${newTaskStatus}`}
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditTask(null);
          setNewTaskStatus(undefined);
        }}
        defaultValues={editTask ?? undefined}
      />
    </div>
  );
}

// ─── Lista Card ───────────────────────────────────────────────

function ListaCard({
  task,
  now,
  onEdit,
  onDelete,
  onToggleDone,
}: {
  task: TaskWithJoins;
  now: Date;
  onEdit: (t: TaskWithJoins) => void;
  onDelete: (id: string) => void;
  onToggleDone: (t: TaskWithJoins) => void;
}) {
  const isDone = task.status === "done";
  const isOverdue = task.due_date && new Date(task.due_date) < now && !isDone;

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl group"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
    >
      <button
        onClick={() => onToggleDone(task)}
        className="shrink-0 transition-colors"
        style={{ color: isDone ? "#10b981" : "var(--fg-muted)" }}
      >
        {isDone ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
      </button>

      <div className="flex-1 min-w-0">
        <p
          className={cn("text-sm font-medium", isDone && "line-through opacity-50")}
          style={{ color: "var(--fg)" }}
        >
          {task.title}
        </p>
        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
          {task.job && (
            <Link
              to="/vagas/$vagaId"
              params={{ vagaId: task.job.id }}
              onClick={(e) => e.stopPropagation()}
              className="text-xs hover:underline"
              style={{ color: "var(--accent)" }}
            >
              {task.job.title}
            </Link>
          )}
          {task.assignee && (
            <span className="text-xs" style={{ color: "var(--fg-muted)" }}>
              {task.assignee.name}
            </span>
          )}
          {task.due_date && (
            <span className="text-xs" style={{ color: isOverdue ? "#ef4444" : "var(--fg-muted)" }}>
              {isOverdue ? "⚠ " : ""}
              {format(new Date(task.due_date), "dd/MM/yyyy")}
            </span>
          )}
        </div>
      </div>

      <div className="hidden sm:flex items-center gap-2">
        <PriorityBadge priority={task.priority} />
        <TaskStatusBadge status={task.status} />
      </div>

      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(task)}
          className="p-1.5 rounded-md hover:bg-[var(--border)]"
          title="Editar"
          style={{ color: "var(--fg-muted)" }}
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onDelete(task.id)}
          className="p-1.5 rounded-md hover:bg-red-500/10"
          title="Remover"
          style={{ color: "#ef4444" }}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Tabela View ──────────────────────────────────────────────

function TabelaView({
  tasks,
  now,
  onEdit,
  onDelete,
  onToggleDone,
}: {
  tasks: TaskWithJoins[];
  now: Date;
  onEdit: (t: TaskWithJoins) => void;
  onDelete: (id: string) => void;
  onToggleDone: (t: TaskWithJoins) => void;
}) {
  return (
    <table className="w-full min-w-[700px] text-sm">
      <thead>
        <tr style={{ borderBottom: "1px solid var(--border)" }}>
          {["Título", "Status", "Prioridade", "Responsável", "Vaga", "Prazo", ""].map((h) => (
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
        {tasks.map((task, i) => {
          const isDone = task.status === "done";
          const isOverdue = task.due_date && new Date(task.due_date) < now && !isDone;
          return (
            <tr
              key={task.id}
              className="group transition-colors"
              style={{
                background: i % 2 === 0 ? "var(--bg)" : "var(--bg-card)",
                borderBottom: "1px solid var(--border)",
              }}
            >
              {/* Título */}
              <td className="py-2.5 px-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onToggleDone(task)}
                    className="shrink-0"
                    style={{ color: isDone ? "#10b981" : "var(--fg-muted)" }}
                  >
                    {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => onEdit(task)}
                    className={cn("text-left hover:underline", isDone && "line-through opacity-50")}
                    style={{ color: "var(--fg)" }}
                  >
                    {task.title}
                  </button>
                </div>
              </td>
              {/* Status */}
              <td className="py-2.5 px-3">
                <TaskStatusBadge status={task.status} />
              </td>
              {/* Prioridade */}
              <td className="py-2.5 px-3">
                <PriorityBadge priority={task.priority} />
              </td>
              {/* Responsável */}
              <td className="py-2.5 px-3 text-xs" style={{ color: "var(--fg-muted)" }}>
                {task.assignee?.name ?? "—"}
              </td>
              {/* Vaga */}
              <td className="py-2.5 px-3">
                {task.job ? (
                  <Link
                    to="/vagas/$vagaId"
                    params={{ vagaId: task.job.id }}
                    className="text-xs hover:underline truncate max-w-[120px] block"
                    style={{ color: "var(--accent)" }}
                  >
                    {task.job.title}
                  </Link>
                ) : (
                  <span className="text-xs" style={{ color: "var(--fg-muted)" }}>—</span>
                )}
              </td>
              {/* Prazo */}
              <td className="py-2.5 px-3 text-xs" style={{ color: isOverdue ? "#ef4444" : "var(--fg-muted)" }}>
                {task.due_date ? (
                  <>
                    {isOverdue && "⚠ "}
                    {format(new Date(task.due_date), "dd/MM/yyyy")}
                  </>
                ) : "—"}
              </td>
              {/* Ações */}
              <td className="py-2.5 px-3">
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onEdit(task)}
                    className="p-1.5 rounded hover:bg-[var(--border)]"
                    title="Editar"
                    style={{ color: "var(--fg-muted)" }}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDelete(task.id)}
                    className="p-1.5 rounded hover:bg-red-500/10"
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
      </tbody>
    </table>
  );
}

// ─── Kanban View ──────────────────────────────────────────────

function KanbanView({
  tasks,
  now,
  onEdit,
  onDelete,
  onToggleDone,
  onAddCard,
}: {
  tasks: TaskWithJoins[];
  now: Date;
  onEdit: (t: TaskWithJoins) => void;
  onDelete: (id: string) => void;
  onToggleDone: (t: TaskWithJoins) => void;
  onAddCard: (status: TaskStatus) => void;
}) {
  return (
    <div className="flex gap-4 min-w-max pb-4" style={{ minHeight: 400 }}>
      {KANBAN_COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.status);
        return (
          <div key={col.status} className="min-w-[260px] w-[272px] shrink-0 flex flex-col">
            {/* Column header */}
            <div className="flex items-center gap-2 mb-3 px-1">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: col.color }} />
              <span className="text-sm font-semibold flex-1" style={{ color: "var(--fg)" }}>
                {col.label}
              </span>
              <span
                className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                style={{ background: "var(--border)", color: "var(--fg-muted)" }}
              >
                {colTasks.length}
              </span>
            </div>

            {/* Cards */}
            <div
              className="flex-1 rounded-xl p-2 space-y-2"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderTop: `3px solid ${col.color}`,
                minHeight: 120,
              }}
            >
              {colTasks.map((task) => (
                <KanbanCard
                  key={task.id}
                  task={task}
                  now={now}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onToggleDone={onToggleDone}
                />
              ))}
              {colTasks.length === 0 && (
                <div className="flex items-center justify-center py-6 rounded-lg">
                  <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
                    Nenhuma tarefa
                  </p>
                </div>
              )}
            </div>

            {/* Add button */}
            <button
              onClick={() => onAddCard(col.status)}
              className="mt-2 w-full flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-medium transition-opacity hover:opacity-80"
              style={{ color: "var(--fg-muted)", border: "1px dashed var(--border)" }}
            >
              <Plus className="w-3.5 h-3.5" /> Adicionar
            </button>
          </div>
        );
      })}
    </div>
  );
}

function KanbanCard({
  task,
  now,
  onEdit,
  onDelete,
  onToggleDone,
}: {
  task: TaskWithJoins;
  now: Date;
  onEdit: (t: TaskWithJoins) => void;
  onDelete: (id: string) => void;
  onToggleDone: (t: TaskWithJoins) => void;
}) {
  const isDone = task.status === "done";
  const isOverdue = task.due_date && new Date(task.due_date) < now && !isDone;

  return (
    <div
      className="rounded-xl p-3 cursor-pointer select-none group/card transition-shadow hover:shadow-md"
      style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
      onClick={() => onEdit(task)}
    >
      <div className="flex items-start gap-2 mb-2">
        <button
          onClick={(e) => { e.stopPropagation(); onToggleDone(task); }}
          className="shrink-0 mt-0.5"
          style={{ color: isDone ? "#10b981" : "var(--fg-muted)" }}
        >
          {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
        </button>
        <p
          className={cn("text-sm font-medium leading-snug flex-1", isDone && "line-through opacity-50")}
          style={{ color: "var(--fg)" }}
        >
          {task.title}
        </p>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap mt-1">
        <PriorityBadge priority={task.priority} />
        {task.due_date && (
          <span className="text-xs" style={{ color: isOverdue ? "#ef4444" : "var(--fg-muted)" }}>
            {isOverdue ? "⚠ " : ""}{format(new Date(task.due_date), "dd/MM")}
          </span>
        )}
      </div>

      {(task.assignee || task.job) && (
        <div className="flex items-center justify-between mt-2 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
          <span className="text-xs truncate" style={{ color: "var(--fg-muted)" }}>
            {task.assignee?.name ?? ""}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
            className="p-1 rounded opacity-0 group-hover/card:opacity-100 transition-opacity hover:bg-red-500/10"
            title="Remover"
            style={{ color: "#ef4444" }}
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}
