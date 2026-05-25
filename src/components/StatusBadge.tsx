export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    "Aberta":      "bg-zinc-100 text-zinc-700 border-zinc-200",
    "Em processo": "bg-zinc-100 text-zinc-700 border-zinc-200",
    "Fechada":     "bg-zinc-100 text-zinc-500 border-zinc-200",
    "Encerrada":   "bg-zinc-50  text-zinc-400 border-zinc-100",
    "Triagem":     "bg-zinc-100 text-zinc-700 border-zinc-200",
    "Entrevista":  "bg-zinc-100 text-zinc-700 border-zinc-200",
    "Contratado":  "bg-zinc-100 text-zinc-700 border-zinc-200",
    "Reprovado":   "bg-zinc-50  text-zinc-400 border-zinc-100",
    "Pago":        "bg-zinc-100 text-zinc-700 border-zinc-200",
    "Pendente":    "bg-zinc-100 text-zinc-600 border-zinc-200",
    "Atrasado":    "bg-red-50   text-red-600  border-red-200",
  };
  const cls = map[status] ?? "bg-zinc-100 text-zinc-600 border-zinc-200";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[11px] font-medium ${cls}`}>
      {status}
    </span>
  );
}
