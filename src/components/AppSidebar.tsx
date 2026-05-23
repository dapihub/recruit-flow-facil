import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { Briefcase, Users, Wallet, LogOut, Settings } from "lucide-react";
import { useVagas, useCandidatos, useFaturas } from "@/lib/store";
import { DapiLogo } from "@/components/DapiLogo";
import { useAuth } from "@/lib/auth";

const items = [
  { to: "/", label: "Vagas", icon: Briefcase },
  { to: "/candidatos", label: "Candidatos", icon: Users },
  { to: "/financeiro", label: "Financeiro", icon: Wallet },
];

const bottomItems = [
  { to: "/configuracoes", label: "Configurações", icon: Settings },
];

export function AppSidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const vagas = useVagas();
  const candidatos = useCandidatos();
  const faturas = useFaturas();

  const vagasAbertas = vagas.filter((v) => v.status === "Aberta").length;
  const emEntrevista = candidatos.filter((c) => c.status === "Entrevista").length;
  const aReceber = faturas.filter((f) => f.status !== "Pago").reduce((s, f) => s + f.valor, 0);

  return (
    <aside className="w-64 shrink-0 bg-[var(--sidebar-bg)] text-[var(--sidebar-fg)] flex flex-col h-screen sticky top-0 shadow-xl">
      <div className="px-6 py-6 border-b border-white/10">
        <DapiLogo variant="color" className="h-10 w-auto" />
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {items.map(({ to, label, icon: Icon }) => {
          const active = path === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-[var(--sidebar-active)] text-white shadow"
                  : "text-white/75 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
        <div className="pt-2 border-t border-white/10 mt-2">
          {bottomItems.map(({ to, label, icon: Icon }) => {
            const active = path === to;
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-[var(--sidebar-active)] text-white shadow"
                    : "text-white/75 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="p-4 border-t border-white/10 space-y-3">
        <p className="text-xs uppercase tracking-wider text-white/50 font-semibold px-1">Resumo</p>
        <div className="space-y-2">
          <SummaryRow label="Vagas abertas" value={vagasAbertas.toString()} />
          <SummaryRow label="Em entrevista" value={emEntrevista.toString()} />
          <SummaryRow label="A receber" value={`R$ ${(aReceber / 1000).toFixed(1)}k`} />
        </div>
        <p className="text-[10px] text-white/40 leading-snug pt-2 italic">
          Muito mais que consultoria,<br/>um parceiro estratégico.
        </p>
        <div className="pt-3 border-t border-white/10 space-y-2">
          <p className="text-[11px] text-white/60 truncate" title={user?.email ?? ""}>
            {user?.email}
          </p>
          <button
            onClick={async () => { await signOut(); navigate({ to: "/login", replace: true }); }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs text-white/75 hover:bg-white/5 hover:text-white transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Sair
          </button>
        </div>
      </div>
    </aside>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between bg-white/5 rounded-md px-3 py-2">
      <span className="text-xs text-white/70">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}
