import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "@/components/ui/Modal";
import { useCreateJob, useUpdateJob, type JobRow } from "@/hooks/useJobs";
import { useClients } from "@/hooks/useClients";
import { useProfiles } from "@/hooks/useProfiles";

const schema = z.object({
  title: z.string().min(1, "Cargo é obrigatório"),
  client_id: z.string().optional().nullable(),
  recruiter_id: z.string().optional().nullable(),
  status: z.enum(["open", "screening", "interviewing", "proposal", "closed", "cancelled", "paused"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  contract_type: z
    .enum(["clt", "pj", "internship", "temporary", "freelance"])
    .optional()
    .nullable(),
  work_model: z.enum(["onsite", "hybrid", "remote"]).optional().nullable(),
  seniority: z
    .enum(["intern", "junior", "mid", "senior", "specialist", "lead"])
    .optional()
    .nullable(),
  headcount: z.coerce.number().int().min(1),
  salary_min: z.coerce.number().positive().optional().nullable(),
  salary_max: z.coerce.number().positive().optional().nullable(),
  fee_model: z
    .enum(["salary_pct", "fixed", "fixed_plus_success"])
    .optional()
    .nullable(),
  fee_value: z.coerce.number().positive().optional().nullable(),
  deadline: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  required_skills: z.string().optional().nullable(),
});

type FormData = z.infer<typeof schema>;

interface VagaFormProps {
  open: boolean;
  onClose: () => void;
  defaultValues?: Partial<JobRow>;
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

function F({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={LABEL} style={labelStyle}>{label}</label>
      {children}
      {error && <p className="text-xs mt-1 text-red-500">{error}</p>}
    </div>
  );
}

export function VagaForm({ open, onClose, defaultValues }: VagaFormProps) {
  const isEdit = !!defaultValues?.id;
  const { data: clients = [] } = useClients();
  const { data: profiles = [] } = useProfiles();
  const createJob = useCreateJob();
  const updateJob = useUpdateJob();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      client_id: defaultValues?.client_id ?? null,
      recruiter_id: defaultValues?.recruiter_id ?? null,
      status: defaultValues?.status ?? "open",
      priority: defaultValues?.priority ?? "medium",
      contract_type: defaultValues?.contract_type ?? null,
      work_model: defaultValues?.work_model ?? null,
      seniority: defaultValues?.seniority ?? null,
      headcount: defaultValues?.headcount ?? 1,
      salary_min: defaultValues?.salary_min ?? undefined,
      salary_max: defaultValues?.salary_max ?? undefined,
      fee_model: defaultValues?.fee_model ?? null,
      fee_value: defaultValues?.fee_value ?? undefined,
      deadline: defaultValues?.deadline?.slice(0, 10) ?? null,
      description: defaultValues?.description ?? null,
      required_skills: defaultValues?.required_skills ?? null,
    },
  });

  const onSubmit = async (data: FormData) => {
    const nullable = (v: unknown) => (v === "" || v === undefined ? null : v);
    const payload = {
      title: data.title,
      client_id: nullable(data.client_id) as string | null,
      recruiter_id: nullable(data.recruiter_id) as string | null,
      status: data.status,
      priority: data.priority,
      contract_type: nullable(data.contract_type) as string | null,
      work_model: nullable(data.work_model) as string | null,
      seniority: nullable(data.seniority) as string | null,
      headcount: data.headcount,
      salary_min: nullable(data.salary_min) as number | null,
      salary_max: nullable(data.salary_max) as number | null,
      fee_model: nullable(data.fee_model) as string | null,
      fee_value: nullable(data.fee_value) as number | null,
      deadline: nullable(data.deadline) as string | null,
      description: nullable(data.description) as string | null,
      required_skills: nullable(data.required_skills) as string | null,
    };

    if (isEdit) {
      await updateJob.mutateAsync({ id: defaultValues!.id!, ...payload });
    } else {
      await createJob.mutateAsync(payload);
    }
    reset();
    onClose();
  };

  const SELECT = INPUT;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Editar Vaga" : "Nova Vaga"}
      size="lg"
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
            form="vaga-form"
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
              : "Criar Vaga"}
          </button>
        </>
      }
    >
      <form id="vaga-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Cargo */}
        <F label="Cargo *" error={errors.title?.message}>
          <input
            {...register("title")}
            placeholder="ex: Gerente de Marketing Senior"
            className={INPUT}
            style={{
              ...inputStyle,
              borderColor: errors.title ? "#ef4444" : "var(--border)",
            }}
          />
        </F>

        {/* Cliente + Recrutador */}
        <div className="grid grid-cols-2 gap-4">
          <F label="Cliente">
            <select {...register("client_id")} className={SELECT} style={inputStyle}>
              <option value="">Selecionar cliente</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </F>
          <F label="Recrutador responsável">
            <select {...register("recruiter_id")} className={SELECT} style={inputStyle}>
              <option value="">Selecionar recrutador</option>
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
            <select {...register("status")} className={SELECT} style={inputStyle}>
              <option value="open">Aberta</option>
              <option value="screening">Triagem</option>
              <option value="interviewing">Entrevistas</option>
              <option value="proposal">Proposta</option>
              <option value="closed">Fechada</option>
              <option value="cancelled">Cancelada</option>
              <option value="paused">Pausada</option>
            </select>
          </F>
          <F label="Prioridade">
            <select {...register("priority")} className={SELECT} style={inputStyle}>
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
              <option value="urgent">Urgente</option>
            </select>
          </F>
        </div>

        {/* Contrato + Modelo + Senioridade */}
        <div className="grid grid-cols-3 gap-4">
          <F label="Tipo de Contrato">
            <select {...register("contract_type")} className={SELECT} style={inputStyle}>
              <option value="">Selecionar</option>
              <option value="clt">CLT</option>
              <option value="pj">PJ</option>
              <option value="internship">Estágio</option>
              <option value="temporary">Temporário</option>
              <option value="freelance">Freelance</option>
            </select>
          </F>
          <F label="Modelo de Trabalho">
            <select {...register("work_model")} className={SELECT} style={inputStyle}>
              <option value="">Selecionar</option>
              <option value="onsite">Presencial</option>
              <option value="hybrid">Híbrido</option>
              <option value="remote">Remoto</option>
            </select>
          </F>
          <F label="Senioridade">
            <select {...register("seniority")} className={SELECT} style={inputStyle}>
              <option value="">Selecionar</option>
              <option value="intern">Estágio</option>
              <option value="junior">Júnior</option>
              <option value="mid">Pleno</option>
              <option value="senior">Sênior</option>
              <option value="specialist">Especialista</option>
              <option value="lead">Lead</option>
            </select>
          </F>
        </div>

        {/* Headcount + Prazo */}
        <div className="grid grid-cols-2 gap-4">
          <F label="Headcount" error={errors.headcount?.message}>
            <input
              type="number"
              min={1}
              {...register("headcount")}
              className={INPUT}
              style={inputStyle}
            />
          </F>
          <F label="Prazo">
            <input
              type="date"
              {...register("deadline")}
              className={INPUT}
              style={inputStyle}
            />
          </F>
        </div>

        {/* Faixa Salarial */}
        <div className="grid grid-cols-2 gap-4">
          <F label="Salário Mínimo (R$)">
            <input
              type="number"
              min={0}
              step={100}
              placeholder="0,00"
              {...register("salary_min")}
              className={INPUT}
              style={inputStyle}
            />
          </F>
          <F label="Salário Máximo (R$)">
            <input
              type="number"
              min={0}
              step={100}
              placeholder="0,00"
              {...register("salary_max")}
              className={INPUT}
              style={inputStyle}
            />
          </F>
        </div>

        {/* Fee */}
        <div className="grid grid-cols-2 gap-4">
          <F label="Modelo de Fee">
            <select {...register("fee_model")} className={SELECT} style={inputStyle}>
              <option value="">Selecionar</option>
              <option value="salary_pct">% do Salário</option>
              <option value="fixed">Fee Fixo</option>
              <option value="fixed_plus_success">Fixo + Sucesso</option>
            </select>
          </F>
          <F label="Valor do Fee">
            <input
              type="number"
              min={0}
              step={0.01}
              placeholder="0,00"
              {...register("fee_value")}
              className={INPUT}
              style={inputStyle}
            />
          </F>
        </div>

        {/* Descrição */}
        <F label="Descrição / Briefing">
          <textarea
            {...register("description")}
            rows={4}
            placeholder="Descreva o contexto e detalhes da vaga..."
            className={INPUT + " resize-none"}
            style={inputStyle}
          />
        </F>

        {/* Skills */}
        <F label="Habilidades Necessárias">
          <textarea
            {...register("required_skills")}
            rows={2}
            placeholder="ex: React, TypeScript, Node.js — uma por linha ou separadas por vírgula"
            className={INPUT + " resize-none"}
            style={inputStyle}
          />
        </F>
      </form>
    </Modal>
  );
}
