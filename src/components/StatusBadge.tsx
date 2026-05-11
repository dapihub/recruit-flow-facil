import { cn } from "@/lib/utils";

const map: Record<string, string> = {
  Aberta: "bg-success/15 text-success border-success/30",
  "Em processo": "bg-info/15 text-info border-info/30",
  Fechada: "bg-warning/20 text-warning-foreground border-warning/40",
  Encerrada: "bg-neutral/20 text-muted-foreground border-neutral/30",
  Triagem: "bg-warning/20 text-warning-foreground border-warning/40",
  Entrevista: "bg-info/15 text-info border-info/30",
  Contratado: "bg-success/15 text-success border-success/30",
  Reprovado: "bg-destructive/15 text-destructive border-destructive/30",
  Pago: "bg-success/15 text-success border-success/30",
  Pendente: "bg-warning/20 text-warning-foreground border-warning/40",
  Atrasado: "bg-destructive/15 text-destructive border-destructive/30",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border",
        map[status] ?? "bg-muted text-muted-foreground border-border"
      )}
    >
      {status}
    </span>
  );
}
