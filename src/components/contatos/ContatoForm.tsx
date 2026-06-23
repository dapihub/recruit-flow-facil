import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "@/components/ui/Modal";
import { useCreateContato, useUpdateContato, type Contato } from "@/hooks/useContatos";
import { useClients } from "@/hooks/useClients";

const schema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  client_id: z.string().optional().nullable(),
  role: z.string().optional().nullable(),
  email: z.string().email("Email inválido").optional().nullable().or(z.literal("")),
  phone: z.string().optional().nullable(),
  linkedin: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

type FormData = z.infer<typeof schema>;

interface ContatoFormProps {
  open: boolean;
  onClose: () => void;
  defaultValues?: Partial<Contato>;
  defaultClientId?: string;
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

export function ContatoForm({ open, onClose, defaultValues, defaultClientId }: ContatoFormProps) {
  const isEdit = !!defaultValues?.id;
  const { data: clients = [] } = useClients();
  const createContato = useCreateContato();
  const updateContato = useUpdateContato();

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      client_id: defaultValues?.client_id ?? defaultClientId ?? null,
      role: defaultValues?.role ?? null,
      email: defaultValues?.email ?? null,
      phone: defaultValues?.phone ?? null,
      linkedin: defaultValues?.linkedin ?? null,
      notes: defaultValues?.notes ?? null,
    },
  });

  const onSubmit = async (data: FormData) => {
    const n = (v: unknown) => (v === "" || v === undefined ? null : v);
    const payload = {
      name: data.name,
      client_id: n(data.client_id) as string | null,
      role: n(data.role) as string | null,
      email: n(data.email) as string | null,
      phone: n(data.phone) as string | null,
      linkedin: n(data.linkedin) as string | null,
      notes: n(data.notes) as string | null,
    };
    if (isEdit) {
      await updateContato.mutateAsync({ id: defaultValues!.id!, ...payload });
    } else {
      await createContato.mutateAsync(payload);
    }
    reset();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Editar Contato" : "Novo Contato"}
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
            form="contato-form"
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity"
            style={{ background: "var(--accent)", color: "#fff", opacity: isSubmitting ? 0.7 : 1 }}
          >
            {isSubmitting ? "Salvando..." : isEdit ? "Salvar Alterações" : "Criar Contato"}
          </button>
        </>
      }
    >
      <form id="contato-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <F label="Nome *" error={errors.name?.message}>
            <input
              {...register("name")}
              placeholder="João Silva"
              className={INPUT}
              style={{ ...inputStyle, borderColor: errors.name ? "#ef4444" : "var(--border)" }}
            />
          </F>
          <F label="Cargo / Função">
            <input {...register("role")} placeholder="Gerente de RH" className={INPUT} style={inputStyle} />
          </F>
        </div>

        <F label="Empresa (Cliente)">
          <select {...register("client_id")} className={INPUT} style={inputStyle}>
            <option value="">Sem empresa vinculada</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </F>

        <div className="grid grid-cols-2 gap-4">
          <F label="Email" error={errors.email?.message}>
            <input
              {...register("email")}
              type="email"
              placeholder="joao@empresa.com"
              className={INPUT}
              style={{ ...inputStyle, borderColor: errors.email ? "#ef4444" : "var(--border)" }}
            />
          </F>
          <F label="Telefone">
            <input {...register("phone")} placeholder="(11) 9 0000-0000" className={INPUT} style={inputStyle} />
          </F>
        </div>

        <F label="LinkedIn">
          <input {...register("linkedin")} placeholder="linkedin.com/in/joaosilva" className={INPUT} style={inputStyle} />
        </F>

        <F label="Observações">
          <textarea
            {...register("notes")}
            rows={3}
            placeholder="Notas sobre o contato..."
            className={INPUT + " resize-none"}
            style={inputStyle}
          />
        </F>
      </form>
    </Modal>
  );
}
