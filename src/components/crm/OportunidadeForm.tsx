import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "@/components/ui/Modal";
import {
  useCreateOpportunity,
  useUpdateOpportunity,
  useCrmStages,
  type CrmOpportunity,
} from "@/hooks/useCrm";
import { useClients } from "@/hooks/useClients";
import { useContatos } from "@/hooks/useContatos";
import { useProfiles } from "@/hooks/useProfiles";

const schema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  stage_id: z.string().min(1, "Etapa é obrigatória"),
  client_id: z.string().optional().nullable(),
  contact_id: z.string().optional().nullable(),
  assignee_id: z.string().optional().nullable(),
  value: z.string().optional().nullable(),
  probability: z.string(),
  expected_close: z.string().optional().nullable(),
  lead_name: z.string().optional().nullable(),
  lead_email: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

type FormData = z.infer<typeof schema>;

interface OportunidadeFormProps {
  open: boolean;
  onClose: () => void;
  defaultValues?: Partial<CrmOpportunity>;
  defaultStageId?: string;
}

const INPUT = "w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40";
const inputStyle = { background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg)" };
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

export function OportunidadeForm({ open, onClose, defaultValues, defaultStageId }: OportunidadeFormProps) {
  const isEdit = !!defaultValues?.id;
  const { data: stages = [] } = useCrmStages();
  const { data: clients = [] } = useClients();
  const { data: contatos = [] } = useContatos();
  const { data: profiles = [] } = useProfiles();
  const createOpp = useCreateOpportunity();
  const updateOpp = useUpdateOpportunity();

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      stage_id: defaultValues?.stage_id ?? defaultStageId ?? stages[0]?.id ?? "",
      client_id: defaultValues?.client_id ?? null,
      contact_id: defaultValues?.contact_id ?? null,
      assignee_id: defaultValues?.assignee_id ?? null,
      value: defaultValues?.value?.toString() ?? null,
      probability: defaultValues?.probability?.toString() ?? "25",
      expected_close: defaultValues?.expected_close?.slice(0, 10) ?? null,
      lead_name: defaultValues?.lead_name ?? null,
      lead_email: defaultValues?.lead_email ?? null,
      notes: defaultValues?.notes ?? null,
    },
  });

  const onSubmit = async (data: FormData) => {
    const n = (v: unknown) => (v === "" || v === undefined ? null : v);
    const payload = {
      title: data.title,
      stage_id: data.stage_id,
      client_id: n(data.client_id) as string | null,
      contact_id: n(data.contact_id) as string | null,
      assignee_id: n(data.assignee_id) as string | null,
      value: data.value ? parseFloat(data.value) : null,
      probability: parseInt(data.probability) || 0,
      expected_close: n(data.expected_close) as string | null,
      lead_name: n(data.lead_name) as string | null,
      lead_email: n(data.lead_email) as string | null,
      notes: n(data.notes) as string | null,
    };
    if (isEdit) {
      await updateOpp.mutateAsync({ id: defaultValues!.id!, ...payload });
    } else {
      await createOpp.mutateAsync(payload);
    }
    reset();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Editar Oportunidade" : "Nova Oportunidade"}
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
            form="opp-form"
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity"
            style={{ background: "var(--accent)", color: "#fff", opacity: isSubmitting ? 0.7 : 1 }}
          >
            {isSubmitting ? "Salvando..." : isEdit ? "Salvar Alterações" : "Criar Oportunidade"}
          </button>
        </>
      }
    >
      <form id="opp-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <F label="Título *" error={errors.title?.message}>
          <input
            {...register("title")}
            placeholder="Ex: Projeto Head de Engenharia — ACME"
            className={INPUT}
            style={{ ...inputStyle, borderColor: errors.title ? "#ef4444" : "var(--border)" }}
          />
        </F>

        <div className="grid grid-cols-2 gap-4">
          <F label="Etapa *" error={errors.stage_id?.message}>
            <select
              {...register("stage_id")}
              className={INPUT}
              style={{ ...inputStyle, borderColor: errors.stage_id ? "#ef4444" : "var(--border)" }}
            >
              <option value="">Selecionar</option>
              {stages.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </F>
          <F label="Responsável">
            <select {...register("assignee_id")} className={INPUT} style={inputStyle}>
              <option value="">Selecionar</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </F>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <F label="Cliente">
            <select {...register("client_id")} className={INPUT} style={inputStyle}>
              <option value="">Sem cliente</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </F>
          <F label="Contato">
            <select {...register("contact_id")} className={INPUT} style={inputStyle}>
              <option value="">Sem contato</option>
              {contatos.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </F>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <F label="Valor Estimado (R$)">
            <input
              {...register("value")}
              type="number"
              min="0"
              step="0.01"
              placeholder="0,00"
              className={INPUT}
              style={inputStyle}
            />
          </F>
          <F label="Probabilidade (%)">
            <input
              {...register("probability")}
              type="number"
              min="0"
              max="100"
              className={INPUT}
              style={inputStyle}
            />
          </F>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <F label="Previsão de Fechamento">
            <input type="date" {...register("expected_close")} className={INPUT} style={inputStyle} />
          </F>
          <F label="Nome do Lead (sem cliente)">
            <input {...register("lead_name")} placeholder="Nome do decisor" className={INPUT} style={inputStyle} />
          </F>
        </div>

        <F label="Observações">
          <textarea
            {...register("notes")}
            rows={3}
            placeholder="Contexto da oportunidade..."
            className={INPUT + " resize-none"}
            style={inputStyle}
          />
        </F>
      </form>
    </Modal>
  );
}
