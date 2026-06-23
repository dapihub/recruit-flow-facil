import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "@/components/ui/Modal";
import {
  useCreateMeeting,
  useUpdateMeeting,
  type Meeting,
} from "@/hooks/useMeetings";
import { useClients } from "@/hooks/useClients";

const schema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  type: z.enum(["call", "video_call", "in_person", "other"]),
  client_id: z.string().optional().nullable(),
  scheduled_at: z.string().min(1, "Data/hora é obrigatória"),
  duration_min: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  video_link: z.string().optional().nullable(),
  agenda: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.enum(["scheduled", "completed", "cancelled", "rescheduled"]),
});

type FormData = z.infer<typeof schema>;

interface ReuniaoFormProps {
  open: boolean;
  onClose: () => void;
  defaultValues?: Partial<Meeting>;
  defaultScheduledAt?: string;
}

const AGENDA_TEMPLATES: Record<string, string> = {
  briefing: "1. Cargo e senioridade\n2. Perfil técnico desejado\n3. Perfil comportamental\n4. Faixa salarial\n5. Benefícios\n6. Prazo para fechamento",
  devolutiva: "1. Perfil apresentado\n2. Pontos fortes\n3. Pontos de atenção\n4. Alinhamento com a vaga\n5. Próximos passos",
  feedback: "1. Candidato selecionado\n2. Motivo da escolha\n3. Feedback sobre o processo\n4. Sugestões para próximas seleções",
  alinhamento: "1. Status das vagas em aberto\n2. Novas demandas\n3. Feedback sobre candidatos\n4. Próximas etapas comerciais",
};

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

function toDatetimeLocal(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ReuniaoForm({
  open,
  onClose,
  defaultValues,
  defaultScheduledAt,
}: ReuniaoFormProps) {
  const isEdit = !!defaultValues?.id;
  const { data: clients = [] } = useClients();
  const createMeeting = useCreateMeeting();
  const updateMeeting = useUpdateMeeting();

  const defaultDatetime = defaultValues?.scheduled_at
    ? toDatetimeLocal(defaultValues.scheduled_at)
    : defaultScheduledAt
    ? toDatetimeLocal(defaultScheduledAt)
    : (() => {
        const now = new Date();
        now.setMinutes(0, 0, 0);
        now.setHours(now.getHours() + 1);
        return toDatetimeLocal(now.toISOString());
      })();

  const [templateType, setTemplateType] = useState("");

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      type: defaultValues?.type ?? "video_call",
      client_id: defaultValues?.client_id ?? null,
      scheduled_at: defaultDatetime,
      duration_min: defaultValues?.duration_min?.toString() ?? "60",
      location: defaultValues?.location ?? null,
      video_link: defaultValues?.video_link ?? null,
      agenda: defaultValues?.agenda ?? null,
      notes: defaultValues?.notes ?? null,
      status: defaultValues?.status ?? "scheduled",
    },
  });

  const type = useWatch({ control, name: "type" });

  const onSubmit = async (data: FormData) => {
    const n = (v: unknown) => (v === "" || v === undefined ? null : v);
    const scheduled = new Date(data.scheduled_at).toISOString();
    const payload = {
      title: data.title,
      type: data.type,
      client_id: n(data.client_id) as string | null,
      scheduled_at: scheduled,
      duration_min: data.duration_min ? parseInt(data.duration_min) : null,
      location: n(data.location) as string | null,
      video_link: n(data.video_link) as string | null,
      agenda: n(data.agenda) as string | null,
      notes: n(data.notes) as string | null,
      status: data.status,
    };

    if (isEdit) {
      await updateMeeting.mutateAsync({ id: defaultValues!.id!, ...payload });
    } else {
      await createMeeting.mutateAsync(payload);
    }
    reset();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Editar Reunião" : "Nova Reunião"}
      size="lg"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium hover:opacity-80"
            style={{ border: "1px solid var(--border)", color: "var(--fg)" }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="reuniao-form"
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
              : "Criar Reunião"}
          </button>
        </>
      }
    >
      <form
        id="reuniao-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
      >
        <F label="Título *" error={errors.title?.message}>
          <input
            {...register("title")}
            placeholder="Ex: Briefing — Vaga de Head de Produto"
            className={INPUT}
            style={{
              ...inputStyle,
              borderColor: errors.title ? "#ef4444" : "var(--border)",
            }}
          />
        </F>

        <div className="grid grid-cols-2 gap-4">
          <F label="Tipo">
            <select {...register("type")} className={INPUT} style={inputStyle}>
              <option value="call">Ligação</option>
              <option value="video_call">Videoconferência</option>
              <option value="in_person">Presencial</option>
              <option value="other">Outro</option>
            </select>
          </F>
          <F label="Cliente">
            <select
              {...register("client_id")}
              className={INPUT}
              style={inputStyle}
            >
              <option value="">Sem cliente</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </F>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <F label="Data / Hora *" error={errors.scheduled_at?.message}>
            <input
              type="datetime-local"
              {...register("scheduled_at")}
              className={INPUT}
              style={{
                ...inputStyle,
                borderColor: errors.scheduled_at ? "#ef4444" : "var(--border)",
              }}
            />
          </F>
          <F label="Duração (min)">
            <input
              type="number"
              min="1"
              {...register("duration_min")}
              placeholder="60"
              className={INPUT}
              style={inputStyle}
            />
          </F>
        </div>

        {type === "in_person" && (
          <F label="Local">
            <input
              {...register("location")}
              placeholder="Endereço ou sala"
              className={INPUT}
              style={inputStyle}
            />
          </F>
        )}

        {(type === "video_call" || type === "call") && (
          <F label={type === "video_call" ? "Link da Reunião" : "Número / Ramal"}>
            <input
              {...register("video_link")}
              placeholder={
                type === "video_call"
                  ? "https://meet.google.com/..."
                  : "+55 11 9 0000-0000"
              }
              className={INPUT}
              style={inputStyle}
            />
          </F>
        )}

        <div className="grid grid-cols-2 gap-4">
          <F label="Status">
            <select
              {...register("status")}
              className={INPUT}
              style={inputStyle}
            >
              <option value="scheduled">Agendada</option>
              <option value="completed">Realizada</option>
              <option value="cancelled">Cancelada</option>
              <option value="rescheduled">Reagendada</option>
            </select>
          </F>
        </div>

        <F label="Tipo de reunião (pré-preenche pauta)">
          <select
            value={templateType}
            onChange={(e) => {
              const v = e.target.value;
              setTemplateType(v);
              if (v && AGENDA_TEMPLATES[v]) setValue("agenda", AGENDA_TEMPLATES[v]);
            }}
            className={INPUT}
            style={inputStyle}
          >
            <option value="">Selecione para sugerir pauta...</option>
            <option value="briefing">Briefing de vaga</option>
            <option value="devolutiva">Devolutiva de candidato</option>
            <option value="feedback">Feedback pós-processo</option>
            <option value="alinhamento">Alinhamento comercial</option>
            <option value="outro">Outro</option>
          </select>
        </F>

        <F label="Pauta / Agenda">
          <textarea
            {...register("agenda")}
            rows={3}
            placeholder="Tópicos a serem discutidos..."
            className={INPUT + " resize-none"}
            style={inputStyle}
          />
        </F>

        <F label="Ata / Notas (pós-reunião)">
          <textarea
            {...register("notes")}
            rows={3}
            placeholder="Resumo, decisões, próximos passos..."
            className={INPUT + " resize-none"}
            style={inputStyle}
          />
        </F>
      </form>
    </Modal>
  );
}
