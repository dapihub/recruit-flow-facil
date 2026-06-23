import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "@/components/ui/Modal";
import { useCreateTask, useUpdateTask, type TaskRow } from "@/hooks/useTasks";
import { useProfiles } from "@/hooks/useProfiles";
import { useJobs } from "@/hooks/useJobs";

const schema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  job_id: z.string().optional().nullable(),
  assignee_id: z.string().optional().nullable(),
  status: z.enum(["not_started", "in_progress", "in_review", "done"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  due_date: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

type FormData = z.infer<typeof schema>;

interface TarefaFormProps {
  open: boolean;
  onClose: () => void;
  defaultValues?: Partial<TaskRow>;
  defaultJobId?: string;
}

const INPUT =
  "w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40";
const inputStyle = {
  background: "var(--bg)",
  border: "1px solid var(--border)",
  color: "var(--fg)",
};
const LABEL = "text-xs font-medium block mb-1";
const labelStyle = { color: "var(--fg-muted)" };

function F({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={LABEL} style={labelStyle}>
        {label}
      </label>
      {children}
      {error && <p className="text-xs mt-1 text-red-500">{error}</p>}
    </div>
  );
}

export function TarefaForm({
  open,
  onClose,
  defaultValues,
  defaultJobId,
}: TarefaFormProps) {
  const isEdit = !!defaultValues?.id;
  const { data: profiles = [] } = useProfiles();
  const { data: jobs = [] } = useJobs();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      job_id: defaultValues?.job_id ?? defaultJobId ?? null,
      assignee_id: defaultValues?.assignee_id ?? null,
      status: defaultValues?.status ?? "not_started",
      priority: defaultValues?.priority ?? "medium",
      due_date: defaultValues?.due_date?.slice(0, 10) ?? null,
      description: defaultValues?.description ?? null,
    },
  });

  const onSubmit = async (data: FormData) => {
    const nullable = (v: unknown) =>
      v === "" || v === undefined ? null : v;
    const payload = {
      title: data.title,
      job_id: nullable(data.job_id) as string | null,
      assignee_id: nullable(data.assignee_id) as string | null,
      status: data.status,
      priority: data.priority,
      due_date: nullable(data.due_date) as string | null,
      description: nullable(data.description) as string | null,
    };

    if (isEdit) {
      await updateTask.mutateAsync({ id: defaultValues!.id!, ...payload });
    } else {
      await createTask.mutateAsync(payload);
    }
    reset();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Editar Tarefa" : "Nova Tarefa"}
      size="md"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-80"
            style={{ border: "1px solid var(--border)", color: "var(--fg)" }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="tarefa-form"
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity"
            style={{
              background: "var(--accent)",
              color: "#fff",
              opacity: isSubmitting ? 0.7 : 1,
            }}
          >
            {isSubmitting
              ? "Salvando..."
              : isEdit
              ? "Salvar Alterações"
              : "Criar Tarefa"}
          </button>
        </>
      }
    >
      <form
        id="tarefa-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
      >
        {/* Título */}
        <F label="Título *" error={errors.title?.message}>
          <input
            {...register("title")}
            placeholder="Descreva a tarefa..."
            className={INPUT}
            style={{
              ...inputStyle,
              borderColor: errors.title ? "#ef4444" : "var(--border)",
            }}
          />
        </F>

        {/* Vaga + Responsável */}
        <div className="grid grid-cols-2 gap-4">
          <F label="Vaga (opcional)">
            <select
              {...register("job_id")}
              className={INPUT}
              style={inputStyle}
            >
              <option value="">Sem vaga</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title}
                </option>
              ))}
            </select>
          </F>
          <F label="Responsável">
            <select
              {...register("assignee_id")}
              className={INPUT}
              style={inputStyle}
            >
              <option value="">Selecionar</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </F>
        </div>

        {/* Status + Prioridade */}
        <div className="grid grid-cols-2 gap-4">
          <F label="Status">
            <select
              {...register("status")}
              className={INPUT}
              style={inputStyle}
            >
              <option value="not_started">Não Iniciada</option>
              <option value="in_progress">Em Andamento</option>
              <option value="in_review">Em Revisão</option>
              <option value="done">Finalizada</option>
            </select>
          </F>
          <F label="Prioridade">
            <select
              {...register("priority")}
              className={INPUT}
              style={inputStyle}
            >
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
              <option value="urgent">Urgente</option>
            </select>
          </F>
        </div>

        {/* Prazo */}
        <F label="Prazo">
          <input
            type="date"
            {...register("due_date")}
            className={INPUT}
            style={inputStyle}
          />
        </F>

        {/* Descrição */}
        <F label="Descrição">
          <textarea
            {...register("description")}
            rows={3}
            placeholder="Detalhe o que precisa ser feito..."
            className={INPUT + " resize-none"}
            style={inputStyle}
          />
        </F>
      </form>
    </Modal>
  );
}
