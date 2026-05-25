import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard, Briefcase, Users, Wallet,
  LogOut, Settings, Star, ChevronRight
} from "lucide-react";
import { useVagas, useCandidatos, useFaturas } from "@/lib/store";
import { DapiLogo } from "@/components/DapiLogo";
import { useAuth } from "@/lib/auth";

const NAV = [
  { to: "/",           label: "Dashboard",        icon: LayoutDashboard },
  { to: "/vagas",      label: "Vagas",             icon: Briefcase },
  { to: "/candidatos", label: "Candidatos",        icon: Users },
  { to: "/talentos",   label: "Banco de Talentos", icon: Star },
  { to: "/financeiro", label: "Financeiro",        icon: Wallet },
];

export function AppSidebar() {
  const path   = useRouterState({ select: s => s.location.pathname });
  const nav    = useNavigate();
  const { user, signOut } = useAuth();
  const vagas      = useVagas();
  const candidatos = useCandidatos();
  const faturas    = useFaturas();

  const hoje = new Date().toISOString().slice(0, 10);
  const faturasVencidas   = faturas.filter(f => f.status !== "Pago" && f.vencimento < hoje).length;
  const acoesVencidas     = candidatos.filter(c => c.proximaAcaoData && c.proximaAcaoData <= hoje && c.status !== "Contratado" && c.status !== "Reprovado").length;
  const triagem           = candidatos.filter(c => c.status === "Triagem").length;
  const vagasAbertas      = vagas.filter(v => v.status === "Aberta").length;
  const aReceber          = faturas.filter(f => f.status !== "Pago").reduce((s, f) => s + f.valor, 0);
  const temAlerta         = faturasVencidas > 0 || acoesVencidas > 0;

  const brl = (n: number) => `R$ ${(n/1000).toFixed(1)}k`;

  return (
    <aside className="w-60 shrink-0 flex flex-col h-screen sticky top-0 bg-zinc-950 text-white">

      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/8">
        <DapiLogo variant="color" className="h-8 w-auto" />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? path === "/" : path.startsWith(to);
          const badgeCount =
            to === "/financeiro" ? faturasVencidas :
            to === "/candidatos" ? (triagem + acoesVencidas) : 0;
          const showDot = to === "/" && temAlerta;

          return (
            <Link key={to} to={to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
                active
                  ? "bg-orange-500 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-white/6"
              }`}>
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1 truncate">{label}</span>
              {showDot && <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />}
              {badgeCount > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none ${
                  to === "/financeiro" ? "bg-red-500/90 text-white" : "bg-amber-500/90 text-white"
                }`}>{badgeCount}</span>
              )}
            </Link>
          );
        })}

        <div className="pt-3 mt-2 border-t border-white/8">
          <Link to="/configuracoes"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
              path === "/configuracoes" ? "bg-orange-500 text-white" : "text-zinc-400 hover:text-white hover:bg-white/6"
            }`}>
            <Settings className="w-4 h-4" />
            <span>Configurações</span>
          </Link>
        </div>
      </nav>

      {/* Resumo */}
      <div className="px-3 pb-3 space-y-1.5">
        <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-semibold px-1 mb-2">Resumo</p>
        <SummaryRow label="Vagas abertas"  value={String(vagasAbertas)} />
        <SummaryRow label="Em triagem"     value={String(triagem)} />
        <SummaryRow label="A receber"      value={brl(aReceber)} highlight={aReceber > 0} />
      </div>

      {/* User */}
      <div className="px-3 pb-4 pt-2 border-t border-white/8">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center text-[11px] font-bold shrink-0">
            {user?.email?.[0]?.toUpperCase() ?? "U"}
          </div>
          <span className="text-[11px] text-zinc-400 truncate flex-1">{user?.email}</span>
          <button onClick={async () => { await signOut(); nav({ to: "/login", replace: true }); }}
            className="text-zinc-600 hover:text-white transition-colors p-1">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}

function SummaryRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between px-2 py-1.5 rounded-md bg-white/4">
      <span className="text-[11px] text-zinc-500">{label}</span>
      <span className={`text-[13px] font-bold ${highlight ? "text-green-400" : "text-white"}`}>{value}</span>
    </div>
  );
}
