export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    // Vaga
    "Aberta":      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    "Em processo": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    "Fechada":     "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
    "Encerrada":   "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500",
    // Candidato
    "Triagem":     "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    "Entrevista":  "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    "Contratado":  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    "Reprovado":   "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    // Fatura
    "Pago":        "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    "Pendente":    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    "Atrasado":    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };
  const cls = map[status] ?? "bg-zinc-100 text-zinc-600";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${cls}`}>
      {status}
    </span>
  );
}
