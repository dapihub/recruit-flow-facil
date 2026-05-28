import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, Briefcase, Users, Wallet, LogOut, Settings, Star, Search } from "lucide-react";
import { useVagas, useCandidatos, useFaturas } from "@/lib/store";
import { DapiLogo } from "@/components/DapiLogo";
import { useAuth } from "@/lib/auth";
import { useState, useEffect } from "react";

const NAV = [
  { to: "/",           label: "Dashboard",        icon: LayoutDashboard },
  { to: "/vagas",      label: "Vagas",             icon: Briefcase },
  { to: "/candidatos", label: "Candidatos",        icon: Users },
  { to: "/talentos",   label: "Banco de Talentos", icon: Star },
  { to: "/financeiro", label: "Financeiro",        icon: Wallet },
];

export function AppSidebar() {
  const path = useRouterState({ select: s => s.location.pathname });
  const nav  = useNavigate();
  const { user, signOut } = useAuth();
  const faturas    = useFaturas();
  const candidatos = useCandidatos();
  const vagas      = useVagas();

  const hoje = new Date().toISOString().slice(0, 10);
  const faturasVencidas = faturas.filter(f => f.status !== "Pago" && f.vencimento < hoje).length;
  const acoesPendentes  = candidatos.filter(c => c.proximaAcaoData && c.proximaAcaoData <= hoje && c.status !== "Contratado" && c.status !== "Reprovado").length;

  const vagasAbertas = vagas.filter(v => v.status === "Aberta").length;
  const aReceber     = faturas.filter(f => f.status !== "Pago").reduce((s, f) => s + f.valor, 0);

  const openSearch = () => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }));
  };

  return (
    <aside className="w-56 shrink-0 flex flex-col h-screen sticky top-0 bg-zinc-900 text-white">

      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <DapiLogo variant="color" className="h-8 w-auto" />
      </div>

      {/* Busca global */}
      <div className="px-3 pt-3">
        <button
          onClick={openSearch}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-md bg-white/5 hover:bg-white/10 transition-colors text-zinc-400 hover:text-white text-[12px]"
        >
          <Search className="w-3.5 h-3.5 shrink-0" />
          <span className="flex-1 text-left">Buscar...</span>
          <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded font-mono">⌘K</span>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {NAV.map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? path === "/" : path.startsWith(to);
          const badge = to === "/financeiro" ? faturasVencidas : to === "/candidatos" ? acoesPendentes : 0;
          return (
            <Link key={to} to={to}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-colors ${
                active ? "bg-white/10 text-white" : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}>
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1 truncate">{label}</span>
              {badge > 0 && (
                <span className="text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full leading-none">{badge}</span>
              )}
            </Link>
          );
        })}

        <div className="pt-2 mt-1 border-t border-white/10">
          <Link to="/configuracoes"
            className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-colors ${
              path === "/configuracoes" ? "bg-white/10 text-white" : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}>
            <Settings className="w-4 h-4" />
            <span>Configurações</span>
          </Link>
        </div>
      </nav>

      {/* Resumo */}
      <div className="px-4 py-3 border-t border-white/10 space-y-2">
        <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-medium">Resumo</p>
        <div className="flex justify-between text-xs">
          <span className="text-zinc-500">Vagas abertas</span>
          <span className="text-white font-medium">{vagasAbertas}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-zinc-500">A receber</span>
          <span className="text-white font-medium">R$ {(aReceber / 1000).toFixed(1)}k</span>
        </div>
      </div>

      {/* User */}
      <div className="px-4 py-3 border-t border-white/10 flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-[10px] font-bold shrink-0">
          {user?.email?.[0]?.toUpperCase() ?? "U"}
        </div>
        <span className="text-[11px] text-zinc-500 truncate flex-1">{user?.email}</span>
        <button onClick={async () => { await signOut(); nav({ to: "/login", replace: true }); }}
          className="text-zinc-600 hover:text-white transition-colors">
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
}
