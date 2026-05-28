import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Circle, X, ChevronRight, Rocket } from "lucide-react";
import { useConfiguracoes, useVagas, useCandidatos } from "@/lib/store";

const STORAGE_KEY = "dapi_onboarding_dismissed";

type Step = {
  id: string;
  label: string;
  desc: string;
  to: string;
  check: () => boolean;
};

export function OnboardingChecklist() {
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) === "1"; } catch { return false; }
  });

  const config = useConfiguracoes();
  const vagas = useVagas();
  const candidatos = useCandidatos();
  const navigate = useNavigate();

  const steps: Step[] = [
    {
      id: "config",
      label: "Configure sua empresa",
      desc: "Preencha CNPJ, razão social e dados de pagamento.",
      to: "/configuracoes",
      check: () => !!(config.cnpj && config.razaoSocial),
    },
    {
      id: "vaga",
      label: "Crie sua primeira vaga",
      desc: "Cadastre um cargo que sua empresa está buscando preencher.",
      to: "/vagas",
      check: () => vagas.length > 0,
    },
    {
      id: "candidato",
      label: "Adicione um candidato",
      desc: "Insira o primeiro candidato no pipeline de seleção.",
      to: "/candidatos",
      check: () => candidatos.length > 0,
    },
  ];

  const done = steps.filter(s => s.check()).length;
  const allDone = done === steps.length;

  useEffect(() => {
    if (allDone) {
      const timer = setTimeout(() => {
        localStorage.setItem(STORAGE_KEY, "1");
        setDismissed(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [allDone]);

  if (dismissed) return null;

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setDismissed(true);
  };

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-900 p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
            <Rocket className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
              {allDone ? "Tudo pronto! 🎉" : "Primeiros passos"}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              {allDone
                ? "Seu sistema está configurado. Fechando em instantes..."
                : `${done} de ${steps.length} concluídos`}
            </p>
          </div>
        </div>
        <button
          onClick={dismiss}
          className="text-blue-400 hover:text-blue-600 transition-colors"
          aria-label="Fechar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-blue-200 dark:bg-blue-900 mb-4 overflow-hidden">
        <div
          className="h-full rounded-full bg-blue-600 transition-all duration-500"
          style={{ width: `${(done / steps.length) * 100}%` }}
        />
      </div>

      <div className="space-y-2.5">
        {steps.map(step => {
          const checked = step.check();
          return (
            <button
              key={step.id}
              onClick={() => !checked && navigate({ to: step.to as any })}
              disabled={checked}
              className={`w-full flex items-center gap-3 text-left rounded-lg px-3 py-2.5 transition-colors ${
                checked
                  ? "opacity-60 cursor-default"
                  : "hover:bg-blue-100 dark:hover:bg-blue-900/40 cursor-pointer"
              }`}
            >
              {checked
                ? <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                : <Circle className="w-5 h-5 text-blue-300 shrink-0" />
              }
              <span className="flex-1 min-w-0">
                <span className={`block text-sm font-medium ${checked ? "line-through text-blue-400" : "text-blue-900 dark:text-blue-100"}`}>
                  {step.label}
                </span>
                {!checked && (
                  <span className="block text-xs text-blue-500 dark:text-blue-400">{step.desc}</span>
                )}
              </span>
              {!checked && <ChevronRight className="w-4 h-4 text-blue-400 shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
