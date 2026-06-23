import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "@/components/ui/Modal";
import {
  useCreatePayrollEntry,
  useUpdatePayrollEntry,
  type PayrollEntry,
} from "@/hooks/useFinanceiro";

const schema = z.object({
  person_name: z.string().min(1, "Nome é obrigatório"),
  role: z.string().optional().nullable(),
  type: z.enum(["salary", "commission", "bonus", "other"]),
  amount: z.string().min(1, "Valor é obrigatório"),
  reference_month: z.string().min(1, "Competência é obrigatória"),
  payment_date: z.string().optional().nullable(),
  status: z.enum(["pending", "paid"]),
  notes: z.string().optional().nullable(),
});

type FormData = z.infer<typeof schema>;

interface FolhaFormProps {
  open: boolean;
  onClose: () => void;
  defaultValues?: Partial<PayrollEntry>;
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

const TYPE_LABELS = {
  salary: "Salário",
  commission: "Comissão",
  bonus: "Bônus / PLR",
  other: "Outros",
};

export function FolhaForm({ open, onClose, defaultValues }: FolhaFormProps) {
  const isEdit = !!defaultValues?.id;
  const createEntry = useCreatePayrollEntry();
  const updateEntry = useUpdatePayrollEntry();

  const currentMonth = new Date().toISOString().slice(0, 7);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      person_name: defaultValues?.person_name ?? "",
      role: defaultValues?.role ?? null,
      type: defaultValues?.type ?? "salary",
      amount: defaultValues?.amount?.toString() ?? "",
      reference_month: defaultValues?.reference_month
        ? defaultValues.reference_month.slice(0, 7)
        : currentMonth,
      payment_date: defaultValues?.payment_date?.slice(0, 10) ?? null,
      status: defaultValues?.status ?? "pending",
      notes: defaultValues?.notes ?? null,
    },
  });

  const onSubmit = async (data: FormData) => {
    const n = (v: unknown) => (v === "" || v === undefined ? null : v);
    const payload = {
      person_name: data.person_name,
      role: n(data.role) as string | null,
      type: data.type,
      amount: parseFloat(data.amount),
      reference_month: `${data.reference_month}-01`,
      payment_date: n(data.payment_date) as string | null,
      status: data.status,
      notes: n(data.notes) as string | null,
    };

    if (isEdit) {
      await updateEntry.mutateAsync({ id: defaultValues!.id!, ...payload });
    } else {
      await createEntry.mutateAsync(payload);
    }
    reset();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Editar Lançamento de Folha" : "Novo Lançamento de Folha"}
      size="md"
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
            form="folha-form"
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity"
            style={{
              background: "var(--accent)",
              color: "#fff",
              opacity: isSubmitting ? 0.7 : 1,
            }}
          >
            {isSubmitting ? "Salvando..." : isEdit ? "Salvar" : "Lançar"}
          </button>
        </>
      }
    >
      <form
        id="folha-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
      >
        <div className="grid grid-cols-2 gap-4">
          <F label="Nome *" error={errors.person_name?.message}>
            <input
              {...register("person_name")}
              placeholder="Nome da pessoa"
              className={INPUT}
              style={{
                ...inputStyle,
                borderColor: errors.person_name ? "#ef4444" : "var(--border)",
              }}
            />
          </F>
          <F label="Cargo / Função">
            <input
              {...register("role")}
              placeholder="Recrutadora Sênior"
              className={INPUT}
              style={inputStyle}
            />
          </F>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <F label="Tipo">
            <select {...register("type")} className={INPUT} style={inputStyle}>
              {(
                Object.entries(TYPE_LABELS) as [
                  keyof typeof TYPE_LABELS,
                  string
                ][]
              ).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </F>
          <F label="Valor (R$) *" error={errors.amount?.message}>
            <input
              {...register("amount")}
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0,00"
              className={INPUT}
              style={{
                ...inputStyle,
                borderColor: errors.amount ? "#ef4444" : "var(--border)",
              }}
            />
          </F>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <F label="Competência *" error={errors.reference_month?.message}>
            <input
              type="month"
              {...register("reference_month")}
              className={INPUT}
              style={{
                ...inputStyle,
                borderColor: errors.reference_month
                  ? "#ef4444"
                  : "var(--border)",
              }}
            />
          </F>
          <F label="Data de Pagamento">
            <input
              type="date"
              {...register("payment_date")}
              className={INPUT}
              style={inputStyle}
            />
          </F>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <F label="Status">
            <select
              {...register("status")}
              className={INPUT}
              style={inputStyle}
            >
              <option value="pending">Pendente</option>
              <option value="paid">Pago</option>
            </select>
          </F>
        </div>

        <F label="Observações">
          <textarea
            {...register("notes")}
            rows={2}
            placeholder="Informações adicionais..."
            className={INPUT + " resize-none"}
            style={inputStyle}
          />
        </F>
      </form>
    </Modal>
  );
}
