import { useNavigate } from "@tanstack/react-router";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { useConfiguracoes } from "@/lib/store";

export function ConfigIncompleta() {
  const config = useConfiguracoes();
  const navigate = useNavigate();

  const faltando: string[] = [];
  if (!config.cnpj) faltando.push("CNPJ");
  if (!config.razaoSocial) faltando.push("Razão Social");
  if (!config.chavePix) faltando.push("Chave PIX");

  if (faltando.length === 0) return null;

  return (
    <button
      onClick={() => navigate({ to: "/configuracoes" })}
      className="w-full flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900 px-4 py-3 text-left hover:bg-amber-100 dark:hover:bg-amber-950/50 transition-colors"
    >
      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
      <span className="flex-1 text-sm text-amber-800 dark:text-amber-200">
        <span className="font-medium">Configuração incompleta — </span>
        {faltando.join(", ")} não preenchido{faltando.length > 1 ? "s" : ""}. Clique para configurar.
      </span>
      <ChevronRight className="w-4 h-4 text-amber-400 shrink-0" />
    </button>
  );
}
