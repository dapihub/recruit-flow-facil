import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "@/components/ui/Modal";
import { useUpsertRating, type ClientRating } from "@/hooks/useRanking";

const CRITERIA = [
  { key: "payment_timeliness", label: "Pontualidade no Pagamento" },
  { key: "briefing_clarity", label: "Clareza de Briefing" },
  { key: "feedback_agility", label: "Agilidade de Feedback" },
  { key: "volume_potential", label: "Volume de Vagas" },
  { key: "referral_potential", label: "Potencial de Indicação" },
] as const;

const schema = z.object({
  payment_timeliness: z.number().min(1).max(10),
  briefing_clarity: z.number().min(1).max(10),
  feedback_agility: z.number().min(1).max(10),
  volume_potential: z.number().min(1).max(10),
  referral_potential: z.number().min(1).max(10),
  notes: z.string().optional().nullable(),
});

type FormData = z.infer<typeof schema>;

interface RatingFormProps {
  open: boolean;
  onClose: () => void;
  clientId: string;
  clientName: string;
  existingRating?: ClientRating;
}

export function RatingForm({
  open,
  onClose,
  clientId,
  clientName,
  existingRating,
}: RatingFormProps) {
  const upsert = useUpsertRating();

  const { control, handleSubmit, watch, formState: { isSubmitting }, reset } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: {
        payment_timeliness: existingRating?.payment_timeliness ?? 5,
        briefing_clarity: existingRating?.briefing_clarity ?? 5,
        feedback_agility: existingRating?.feedback_agility ?? 5,
        volume_potential: existingRating?.volume_potential ?? 5,
        referral_potential: existingRating?.referral_potential ?? 5,
        notes: existingRating?.notes ?? null,
      },
    });

  const values = watch();
  const avg =
    (values.payment_timeliness +
      values.briefing_clarity +
      values.feedback_agility +
      values.volume_potential +
      values.referral_potential) /
    5;

  const onSubmit = async (data: FormData) => {
    const overall_score = parseFloat(avg.toFixed(1));
    await upsert.mutateAsync({
      client_id: clientId,
      ...data,
      overall_score,
      notes: data.notes || null,
      existing_id: existingRating?.id,
    });
    reset();
    onClose();
  };

  const scoreColor = avg >= 8 ? "#10b981" : avg >= 5 ? "#f59e0b" : "#ef4444";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Avaliar — ${clientName}`}
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
            form="rating-form"
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity"
            style={{
              background: "var(--accent)",
              color: "#fff",
              opacity: isSubmitting ? 0.7 : 1,
            }}
          >
            {isSubmitting ? "Salvando..." : "Salvar Avaliação"}
          </button>
        </>
      }
    >
      <form
        id="rating-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5"
      >
        {/* Score preview */}
        <div
          className="flex items-center justify-between p-4 rounded-xl"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <span className="text-sm font-medium" style={{ color: "var(--fg-muted)" }}>
            Score Médio
          </span>
          <span className="text-2xl font-bold" style={{ color: scoreColor }}>
            {avg.toFixed(1)}
            <span className="text-sm font-normal ml-1" style={{ color: "var(--fg-muted)" }}>
              / 10
            </span>
          </span>
        </div>

        {/* Criteria sliders */}
        {CRITERIA.map((criterion) => {
          const value = values[criterion.key];
          return (
            <div key={criterion.key}>
              <div className="flex items-center justify-between mb-2">
                <label
                  className="text-sm font-medium"
                  style={{ color: "var(--fg)" }}
                >
                  {criterion.label}
                </label>
                <span
                  className="text-sm font-bold tabular-nums"
                  style={{ color: value >= 7 ? "#10b981" : value >= 4 ? "#f59e0b" : "#ef4444" }}
                >
                  {value}
                </span>
              </div>
              <Controller
                name={criterion.key}
                control={control}
                render={({ field }) => (
                  <div className="relative">
                    <input
                      type="range"
                      min={1}
                      max={10}
                      step={1}
                      value={field.value}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                      className="w-full h-2 rounded-full appearance-none cursor-pointer"
                      style={{
                        accentColor: "var(--accent)",
                        background: `linear-gradient(to right, var(--accent) ${((field.value - 1) / 9) * 100}%, var(--border) ${((field.value - 1) / 9) * 100}%)`,
                      }}
                    />
                    <div className="flex justify-between mt-0.5">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                        <span
                          key={n}
                          className="text-[10px]"
                          style={{ color: n === field.value ? "var(--accent)" : "var(--fg-muted)" }}
                        >
                          {n}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              />
            </div>
          );
        })}

        {/* Notes */}
        <div>
          <label
            className="text-xs font-medium block mb-1"
            style={{ color: "var(--fg-muted)" }}
          >
            Observações
          </label>
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <textarea
                {...field}
                value={field.value ?? ""}
                rows={2}
                placeholder="Contexto adicional sobre o cliente..."
                className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none"
                style={{
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  color: "var(--fg)",
                }}
              />
            )}
          />
        </div>
      </form>
    </Modal>
  );
}
