import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "@/components/ui/Modal";
import { useCreateClient, useUpdateClient, type Client } from "@/hooks/useClients";

const schema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  person_type: z.enum(["pf", "pj"]),
  cnpj: z.string().optional().nullable(),
  email: z.string().email("Email inválido").optional().nullable().or(z.literal("")),
  phone: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

type FormData = z.infer<typeof schema>;

interface ClienteFormProps {
  open: boolean;
  onClose: () => void;
  defaultValues?: Partial<Client>;
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

export function ClienteForm({ open, onClose, defaultValues }: ClienteFormProps) {
  const isEdit = !!defaultValues?.id;
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      person_type: defaultValues?.person_type ?? "pj",
      cnpj: defaultValues?.cnpj ?? null,
      email: defaultValues?.email ?? null,
      phone: defaultValues?.phone ?? null,
      website: defaultValues?.website ?? null,
      city: defaultValues?.city ?? null,
      state: defaultValues?.state ?? null,
      notes: defaultValues?.notes ?? null,
    },
  });

  const onSubmit = async (data: FormData) => {
    const n = (v: unknown) => (v === "" || v === undefined ? null : v);
    const payload = {
      name: data.name,
      person_type: data.person_type,
      cnpj: n(data.cnpj) as string | null,
      email: n(data.email) as string | null,
      phone: n(data.phone) as string | null,
      website: n(data.website) as string | null,
      city: n(data.city) as string | null,
      state: n(data.state) as string | null,
      notes: n(data.notes) as string | null,
    };
    if (isEdit) {
      await updateClient.mutateAsync({ id: defaultValues!.id!, ...payload });
    } else {
      await createClient.mutateAsync(payload);
    }
    reset();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Editar Cliente" : "Novo Cliente"}
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
            form="cliente-form"
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity"
            style={{ background: "var(--accent)", color: "#fff", opacity: isSubmitting ? 0.7 : 1 }}
          >
            {isSubmitting ? "Salvando..." : isEdit ? "Salvar Alterações" : "Criar Cliente"}
          </button>
        </>
      }
    >
      <form id="cliente-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <F label="Nome / Razão Social *" error={errors.name?.message}>
              <input
                {...register("name")}
                placeholder="Ex: Empresa Ltda"
                className={INPUT}
                style={{ ...inputStyle, borderColor: errors.name ? "#ef4444" : "var(--border)" }}
              />
            </F>
          </div>
          <F label="Tipo">
            <select {...register("person_type")} className={INPUT} style={inputStyle}>
              <option value="pj">PJ</option>
              <option value="pf">PF</option>
            </select>
          </F>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <F label="CNPJ / CPF">
            <input {...register("cnpj")} placeholder="00.000.000/0001-00" className={INPUT} style={inputStyle} />
          </F>
          <F label="Email" error={errors.email?.message}>
            <input {...register("email")} type="email" placeholder="contato@empresa.com" className={INPUT} style={{ ...inputStyle, borderColor: errors.email ? "#ef4444" : "var(--border)" }} />
          </F>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <F label="Telefone">
            <input {...register("phone")} placeholder="(11) 9 0000-0000" className={INPUT} style={inputStyle} />
          </F>
          <F label="Site">
            <input {...register("website")} placeholder="https://empresa.com.br" className={INPUT} style={inputStyle} />
          </F>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <F label="Cidade">
              <input {...register("city")} placeholder="São Paulo" className={INPUT} style={inputStyle} />
            </F>
          </div>
          <F label="Estado">
            <input {...register("state")} placeholder="SP" maxLength={2} className={INPUT} style={inputStyle} />
          </F>
        </div>

        <F label="Observações">
          <textarea
            {...register("notes")}
            rows={3}
            placeholder="Informações adicionais sobre o cliente..."
            className={INPUT + " resize-none"}
            style={inputStyle}
          />
        </F>
      </form>
    </Modal>
  );
}
