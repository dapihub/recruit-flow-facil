import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "@/components/ui/Modal";
import {
  useCreateTransaction,
  useUpdateTransaction,
  useCategories,
  type Transaction,
} from "@/hooks/useFinanceiro";
import { useClients } from "@/hooks/useClients";

const schema = z.object({
  type: z.enum(["income", "expense"]),
  description: z.string().min(1, "Descrição é obrigatória"),
  amount: z.string().min(1, "Valor é obrigatório"),
  date: z.string().min(1, "Data é obrigatória"),
  due_date: z.string().optional().nullable(),
  category_id: z.string().optional().nullable(),
  client_id: z.string().optional().nullable(),
  status: z.enum(["pending", "paid", "overdue", "cancelled"]),
  notes: z.string().optional().nullable(),
});

type FormData = z.infer<typeof schema>;

interface TransacaoFormProps {
  open: boolean;
  onClose: () => void;
  defaultValues?: Partial<Transaction>;
  defaultType?: "income" | "expense";
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

export function TransacaoForm({
  open,
  onClose,
  defaultValues,
  defaultType = "income",
}: TransacaoFormProps) {
  const isEdit = !!defaultValues?.id;
  const { data: categories = [] } = useCategories();
  const { data: clients = [] } = useClients();
  const createTx = useCreateTransaction();
  const updateTx = useUpdateTransaction();

  const today = new Date().toISOString().slice(0, 10);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: defaultValues?.type ?? defaultType,
      description: defaultValues?.description ?? "",
      amount: defaultValues?.amount?.toString() ?? "",
      date: defaultValues?.date?.slice(0, 10) ?? today,
      due_date: defaultValues?.due_date?.slice(0, 10) ?? null,
      category_id: defaultValues?.category_id ?? null,
      client_id: defaultValues?.client_id ?? null,
      status: defaultValues?.status ?? "paid",
      notes: defaultValues?.notes ?? null,
    },
  });

  const type = useWatch({ control, name: "type" });
  const filteredCategories = categories.filter((c) => c.type === type);

  const onSubmit = async (data: FormData) => {
    const n = (v: unknown) => (v === "" || v === undefined ? null : v);
    const payload = {
      type: data.type,
      description: data.description,
      amount: parseFloat(data.amount),
      date: data.date,
      due_date: n(data.due_date) as string | null,
      category_id: n(data.category_id) as string | null,
      client_id: data.type === "income" ? (n(data.client_id) as string | null) : null,
      status: data.status,
      notes: n(data.notes) as string | null,
    };

    if (isEdit) {
      await updateTx.mutateAsync({ id: defaultValues!.id!, ...payload });
    } else {
      await createTx.mutateAsync(payload);
    }
    reset();
    onClose();
  };

  const typeColor = type === "income" ? "#10b981" : "#ef4444";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Editar Lançamento" : "Novo Lançamento"}
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
            form="transacao-form"
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity"
            style={{
              background: typeColor,
              color: "#fff",
              opacity: isSubmitting ? 0.7 : 1,
            }}
          >
            {isSubmitting
              ? "Salvando..."
              : isEdit
              ? "Salvar Alterações"
              : type === "income"
              ? "Lançar Receita"
              : "Lançar Despesa"}
          </button>
        </>
      }
    >
      <form
        id="transacao-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
      >
        {/* Type toggle */}
        {!isEdit && (
          <div
            className="flex rounded-xl overflow-hidden p-1 gap-1"
            style={{ background: "var(--border)" }}
          >
            {(["income", "expense"] as const).map((t) => (
              <label
                key={t}
                className="flex-1 flex items-center justify-center py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors"
                style={
                  type === t
                    ? {
                        background: t === "income" ? "#10b981" : "#ef4444",
                        color: "#fff",
                      }
                    : { color: "var(--fg-muted)" }
                }
              >
                <input
                  type="radio"
                  value={t}
                  {...register("type")}
                  className="sr-only"
                />
                {t === "income" ? "Receita" : "Despesa"}
              </label>
            ))}
          </div>
        )}

        <F label="Descrição *" error={errors.description?.message}>
          <input
            {...register("description")}
            placeholder={
              type === "income"
                ? "Ex: Fee de Recrutamento — ACME"
                : "Ex: Aluguel do escritório"
            }
            className={INPUT}
            style={{
              ...inputStyle,
              borderColor: errors.description ? "#ef4444" : "var(--border)",
            }}
          />
        </F>

        <div className="grid grid-cols-2 gap-4">
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
          <F label="Status">
            <select {...register("status")} className={INPUT} style={inputStyle}>
              <option value="paid">Pago / Recebido</option>
              <option value="pending">Pendente</option>
              <option value="overdue">Vencido</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </F>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <F label="Data *" error={errors.date?.message}>
            <input
              type="date"
              {...register("date")}
              className={INPUT}
              style={{
                ...inputStyle,
                borderColor: errors.date ? "#ef4444" : "var(--border)",
              }}
            />
          </F>
          <F label="Vencimento">
            <input
              type="date"
              {...register("due_date")}
              className={INPUT}
              style={inputStyle}
            />
          </F>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <F label="Categoria">
            <select
              {...register("category_id")}
              className={INPUT}
              style={inputStyle}
            >
              <option value="">Sem categoria</option>
              {filteredCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </F>
          {type === "income" && (
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
          )}
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
