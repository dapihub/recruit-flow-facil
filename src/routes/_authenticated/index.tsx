import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { AlertTriangle, Briefcase, Users, TrendingUp, Clock, ChevronRight } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { useVagas, useCandidatos, useFaturas, useCustos, PIPELINE_ETAPAS, useProximasAcoes, useGarantiasVencendo } from "@/lib/store";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({ meta: [{ title: "Dashboard — DAPI HUB" }] }),
  component: DashboardPage,
});

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const iniciais = (nome: string) => nome.split(" ").filter(Boolean).slice(0, 2).map(n => n[0]).join("").toUpperCase();

function DashboardPage() {
  const vagas = useVagas();
  const candidatos = useCandidatos();
  const faturas = useFaturas();
  const custos = useCustos();
  const proximasAcoes = useProximasAcoes();
  const garantiasVencendo = useGarantiasVencendo();
  const navigate = useNavigate();

  const hoje = new Date();
  const hojeIso = hoje.toISOString().slice(0, 10);
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

  const receitaMes = useMemo(() =>
    faturas.filter(f => f.status === "Pago" && new Date(f.vencimento + "T00:00:00") >= inicioMes).reduce((s, f) => s + f.valor, 0), [faturas]);
  const aReceber = useMemo(() => faturas.filter(f => f.status !== "Pago").reduce((s, f) => s + f.valor, 0), [faturas]);
  const custosMes = useMemo(() =>
    custos.filter(c => new Date(c.data + "T00:00:00") >= inicioMes).reduce((s, c) => s + c.valor, 0), [custos]);
  const margem = receitaMes > 0 ? (receitaMes - custosMes) / receitaMes * 100 : null;

  const faturasVencidas = useMemo(() => faturas.filter(f => f.status !== "Pago" && f.vencimento < hojeIso), [faturas, hojeIso]);
  const valorVencido = faturasVencidas.reduce((s, f) => s + f.valor, 0);
  const vagasAtivas = vagas.filter(v => v.status === "Aberta" || v.status === "Em processo");
  const candidatosRecentes = useMemo(() => [...candidatos].slice(0, 6), [candidatos]);

  const temAlertas = faturasVencidas.length > 0 || proximasAcoes.length > 0 || garantiasVencendo.length > 0;
  const dataFmt = hoje.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="p-8 space-y-8">

      {/* Saudação */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Bom dia 👋</h1>
        <p className="text-muted-foreground text-sm mt-0.5 capitalize">{dataFmt}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Receita do mês" value={brl(receitaMes)} sub="Faturas pagas" />
        <KpiCard label="A receber" value={brl(aReceber)} sub="Em aberto" />
        <KpiCard label="Margem" value={margem !== null ? `${margem.toFixed(1)}%` : "—"} sub={`Custos: ${brl(custosMes)}`} color={margem !== null && margem >= 0 ? "emerald" : "red"} />
        <KpiCard label="Vagas ativas" value={String(vagasAtivas.length)} sub="Abertas / em processo" />
      </div>

      {/* Alertas */}
      {temAlertas && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-sm font-medium text-red-600">Requer atenção</span>
          </div>
          {faturasVencidas.length > 0 && (
            <AlertaRow to="/financeiro" label={`${faturasVencidas.length} fatura${faturasVencidas.length > 1 ? "s" : ""} vencida${faturasVencidas.length > 1 ? "s" : ""} — ${brl(valorVencido)}`} />
          )}
          {proximasAcoes.length > 0 && (
            <AlertaRow to="/candidatos" label={`${proximasAcoes.length} ação${proximasAcoes.length > 1 ? "ões" : ""} pendente${proximasAcoes.length > 1 ? "s" : ""} com candidatos`} />
          )}
          {garantiasVencendo.length > 0 && (
            <AlertaRow to="/vagas" label={`${garantiasVencendo.length} garantia${garantiasVencendo.length > 1 ? "s" : ""} vencendo em 30 dias`} />
          )}
        </div>
      )}

      {/* Duas colunas: Vagas + Candidatos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Vagas ativas */}
        <div>
          <SectionHeader title="Vagas ativas" count={vagasAtivas.length} to="/vagas" />
          <div className="bg-white rounded-lg border border-zinc-200 divide-y divide-zinc-100 overflow-hidden">
            {vagasAtivas.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhuma vaga ativa</p>
            ) : vagasAtivas.slice(0, 5).map(v => (
              <div key={v.id} onClick={() => navigate({ to: "/vagas/$vagaId", params: { vagaId: v.id } })}
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 cursor-pointer transition-colors">
                <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
                  <Briefcase className="w-4 h-4 text-zinc-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{v.cargo}</p>
                  <p className="text-xs text-muted-foreground truncate">{v.empresa}</p>
                </div>
                <EtapaPill etapa={v.etapa} />
              </div>
            ))}
          </div>
        </div>

        {/* Candidatos recentes */}
        <div>
          <SectionHeader title="Candidatos" count={candidatos.length} to="/candidatos" />
          <div className="bg-white rounded-lg border border-zinc-200 divide-y divide-zinc-100 overflow-hidden">
            {candidatosRecentes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum candidato</p>
            ) : candidatosRecentes.map(c => {
              const acaoVencida = c.proximaAcaoData && c.proximaAcaoData <= hojeIso;
              return (
                <div key={c.id} onClick={() => navigate({ to: "/candidatos" })}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 cursor-pointer transition-colors">
                  <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-600 dark:text-zinc-300 shrink-0">
                    {iniciais(c.nome)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{c.nome}</p>
                    <p className="text-xs text-muted-foreground truncate">{c.vaga}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <StatusBadge status={c.status} />
                    {acaoVencida && (
                      <span className="text-[10px] text-red-500 flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" /> pendente
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Pipeline resumido */}
      <div>
        <SectionHeader title="Pipeline" to="/vagas" />
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
          {PIPELINE_ETAPAS.map(etapa => {
            const count = vagas.filter(v => v.etapa === etapa).length;
            return (
              <div key={etapa} onClick={() => navigate({ to: "/vagas" })}
                className="bg-card rounded-xl border border-border/60 p-4 text-center cursor-pointer hover:border-zinc-300 hover:bg-zinc-50 transition-colors">
                <p className="text-2xl font-bold text-foreground">{count}</p>
                <p className="text-[11px] text-muted-foreground mt-1 leading-tight">{etapa}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub, negative }: { label: string; value: string; sub?: string; color?: string; negative?: boolean }) {
  return (
    <div className="bg-white rounded-lg border border-zinc-200 px-5 py-4">
      <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 mb-1">{label}</p>
      <p className={`text-xl font-semibold tabular-nums ${negative ? "text-red-600" : "text-zinc-900"}`}>{value}</p>
      {sub && <p className="text-xs text-zinc-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function AlertaRow({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 hover:text-red-700 transition-colors group">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
      <span className="flex-1">{label}</span>
      <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100" />
    </Link>
  );
}

function SectionHeader({ title, count, to }: { title: string; count?: number; to: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {count !== undefined && <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md">{count}</span>}
      </div>
      <Link to={to} className="text-xs text-zinc-400 hover:text-zinc-700 flex items-center gap-0.5">
        Ver todos <ChevronRight className="w-3 h-3" />
      </Link>
    </div>
  );
}

function EtapaPill({ etapa }: { etapa: string }) {
  return <span className="text-[10px] font-medium px-2 py-0.5 rounded border border-zinc-200 bg-zinc-50 text-zinc-600">{etapa}</span>;
}
