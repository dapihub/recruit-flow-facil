import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { AlertTriangle, TrendingUp, Briefcase, Users, Wallet, ChevronRight, Clock, Phone, Shield } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
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
    faturas.filter(f => f.status === "Pago" && new Date(f.vencimento + "T00:00:00") >= inicioMes).reduce((s, f) => s + f.valor, 0),
    [faturas]);
  const aReceber = useMemo(() => faturas.filter(f => f.status !== "Pago").reduce((s, f) => s + f.valor, 0), [faturas]);
  const custosMes = useMemo(() =>
    custos.filter(c => new Date(c.data + "T00:00:00") >= inicioMes).reduce((s, c) => s + c.valor, 0),
    [custos]);
  const margem = receitaMes > 0 ? (receitaMes - custosMes) / receitaMes * 100 : null;
  const vagasAtivas = vagas.filter(v => v.status === "Aberta" || v.status === "Em processo").length;

  const faturasVencidas = useMemo(() => faturas.filter(f => f.status !== "Pago" && f.vencimento < hojeIso), [faturas, hojeIso]);
  const valorVencido = faturasVencidas.reduce((s, f) => s + f.valor, 0);
  const candidatosTriagem = candidatos.filter(c => c.status === "Triagem");
  const vagasSemContrato = vagas.filter(v => v.etapa === "Briefing" && v.status === "Aberta");

  const temAlertas = faturasVencidas.length > 0 || candidatosTriagem.length > 0 || vagasSemContrato.length > 0 || proximasAcoes.length > 0 || garantiasVencendo.length > 0;

  const vagasPorEtapa = useMemo(() => PIPELINE_ETAPAS.map(etapa => ({ etapa, vagas: vagas.filter(v => v.etapa === etapa) })), [vagas]);
  const candidatosRecentes = useMemo(() => [...candidatos].slice(0, 5), [candidatos]);
  const dataFormatada = hoje.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div>
      <PageHeader title="Dashboard" subtitle={dataFormatada} />
      <div className="p-8 space-y-8">

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Receita do mês" value={brl(receitaMes)} hint="Faturas pagas no mês" color="success" icon={<TrendingUp className="w-4 h-4" />} />
          <KpiCard label="A receber" value={brl(aReceber)} hint="Faturas em aberto" color="info" icon={<Wallet className="w-4 h-4" />} />
          <KpiCard label="Margem do mês" value={margem !== null ? `${margem.toFixed(1)}%` : "—"} hint={margem !== null ? `Custos: ${brl(custosMes)}` : "Sem receita"} color={margem !== null && margem >= 0 ? "brand" : "destructive"} icon={<TrendingUp className="w-4 h-4" />} />
          <KpiCard label="Vagas ativas" value={vagasAtivas} hint="Abertas ou em processo" color="warning" icon={<Briefcase className="w-4 h-4" />} />
        </div>

        {/* Alertas */}
        {temAlertas && (
          <div className="bg-destructive/8 border border-destructive/20 rounded-2xl p-5 space-y-2.5">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <span className="text-sm font-semibold text-destructive">Atenção necessária</span>
            </div>
            {faturasVencidas.length > 0 && <AlertRow to="/financeiro" icon="💳" label={`${faturasVencidas.length} fatura${faturasVencidas.length > 1 ? "s" : ""} vencida${faturasVencidas.length > 1 ? "s" : ""} — ${brl(valorVencido)} em atraso`} />}
            {proximasAcoes.length > 0 && <AlertRow to="/candidatos" icon="📞" label={`${proximasAcoes.length} ação${proximasAcoes.length > 1 ? "ões" : ""} pendente${proximasAcoes.length > 1 ? "s" : ""} com candidato${proximasAcoes.length > 1 ? "s" : ""}`} />}
            {garantiasVencendo.length > 0 && <AlertRow to="/vagas" icon="🛡" label={`${garantiasVencendo.length} garantia${garantiasVencendo.length > 1 ? "s" : ""} vencendo nos próximos 30 dias`} />}
            {candidatosTriagem.length > 0 && <AlertRow to="/candidatos" icon="👤" label={`${candidatosTriagem.length} candidato${candidatosTriagem.length > 1 ? "s" : ""} aguardando triagem`} />}
            {vagasSemContrato.length > 0 && <AlertRow to="/vagas" icon="📋" label={`${vagasSemContrato.length} vaga${vagasSemContrato.length > 1 ? "s" : ""} abertas ainda no briefing`} />}
          </div>
        )}

        {/* Próximas ações do dia */}
        {proximasAcoes.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> Ações pendentes</h2>
              <Link to="/candidatos" className="text-xs text-brand hover:underline flex items-center gap-1">Ver todos <ChevronRight className="w-3 h-3" /></Link>
            </div>
            <div className="bg-card rounded-2xl border border-border/60 divide-y divide-border/50 overflow-hidden shadow-sm">
              {proximasAcoes.slice(0, 4).map(c => (
                <div key={c.id} onClick={() => navigate({ to: "/candidatos" })}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 cursor-pointer transition-colors">
                  <div className="w-8 h-8 rounded-full bg-warning/20 text-warning flex items-center justify-center text-xs font-bold shrink-0">{iniciais(c.nome)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{c.nome}</p>
                    <p className="text-xs text-muted-foreground truncate">{c.proximaAcao}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-destructive">{c.proximaAcaoData ? new Date(c.proximaAcaoData + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) : ""}</p>
                    <StatusBadge status={c.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Garantias vencendo */}
        {garantiasVencendo.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2"><Shield className="w-3.5 h-3.5" /> Garantias vencendo</h2>
            </div>
            <div className="bg-card rounded-2xl border border-warning/30 divide-y divide-border/50 overflow-hidden shadow-sm">
              {garantiasVencendo.map(v => {
                const venc = new Date(new Date(v.garantiaInicio!).getTime() + (v.prazoGarantia! * 86400000));
                return (
                  <div key={v.id} onClick={() => navigate({ to: "/vagas/$vagaId", params: { vagaId: v.id } })}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 cursor-pointer transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{v.cargo}</p>
                      <p className="text-xs text-muted-foreground truncate">{v.empresa}</p>
                    </div>
                    <p className="text-xs font-medium text-warning">Vence {venc.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pipeline de vagas */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Pipeline de vagas</h2>
            <Link to="/vagas" className="text-xs text-brand hover:underline flex items-center gap-1">Ver todas <ChevronRight className="w-3 h-3" /></Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            {vagasPorEtapa.map(({ etapa, vagas: vagasEtapa }) => (
              <div key={etapa} className="bg-card rounded-2xl border border-border/60 p-4 min-h-[120px]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground leading-tight">{etapa}</span>
                  <span className="text-lg font-bold text-foreground tabular-nums">{vagasEtapa.length}</span>
                </div>
                <div className="space-y-1.5">
                  {vagasEtapa.slice(0, 3).map(v => (
                    <button key={v.id} onClick={() => navigate({ to: "/vagas/$vagaId", params: { vagaId: v.id } })}
                      className="w-full text-left text-[11px] bg-muted/50 hover:bg-brand/10 hover:text-brand rounded-md px-2 py-1.5 transition-colors leading-tight">
                      <div className="font-medium truncate">{v.cargo}</div>
                      <div className="text-muted-foreground truncate">{v.empresa}</div>
                    </button>
                  ))}
                  {vagasEtapa.length > 3 && <p className="text-[10px] text-muted-foreground text-center pt-1">+{vagasEtapa.length - 3} mais</p>}
                  {vagasEtapa.length === 0 && <p className="text-[11px] text-muted-foreground/50 text-center pt-2">Vazio</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Candidatos recentes */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Candidatos recentes</h2>
            <Link to="/candidatos" className="text-xs text-brand hover:underline flex items-center gap-1">Ver todos <ChevronRight className="w-3 h-3" /></Link>
          </div>
          <div className="bg-card rounded-2xl border border-border/60 overflow-hidden shadow-sm">
            {candidatosRecentes.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                <Users className="w-8 h-8 opacity-30" />
                <span>Nenhum candidato cadastrado ainda</span>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {candidatosRecentes.map(c => (
                  <div key={c.id} onClick={() => navigate({ to: "/candidatos" })}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 cursor-pointer transition-colors">
                    <div className="w-9 h-9 rounded-full bg-brand text-brand-foreground flex items-center justify-center text-xs font-bold shrink-0">{iniciais(c.nome)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{c.nome}</p>
                      <p className="text-xs text-muted-foreground truncate flex items-center gap-1.5"><Briefcase className="w-3 h-3" /> {c.vaga}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <StatusBadge status={c.status} />
                      {c.proximaAcaoData && (
                        <span className={`text-[10px] font-medium ${c.proximaAcaoData <= hojeIso ? "text-destructive" : "text-muted-foreground"}`}>
                          {c.proximaAcao ? `📅 ${new Date(c.proximaAcaoData + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}` : ""}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Atalhos */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <QuickLink to="/vagas" icon={<Briefcase className="w-5 h-5" />} label="Gerenciar vagas" count={vagas.length} />
          <QuickLink to="/candidatos" icon={<Users className="w-5 h-5" />} label="Ver candidatos" count={candidatos.length} />
          <QuickLink to="/financeiro" icon={<Wallet className="w-5 h-5" />} label="Financeiro" count={faturas.length} />
          <QuickLink to="/configuracoes" icon={<Clock className="w-5 h-5" />} label="Configurações" />
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, hint, color, icon }: { label: string; value: string | number; hint?: string; color: "success" | "info" | "brand" | "warning" | "destructive"; icon?: React.ReactNode }) {
  const bar: Record<string, string> = { brand: "bg-brand", success: "bg-success", warning: "bg-warning", info: "bg-info", destructive: "bg-destructive" };
  const text: Record<string, string> = { brand: "text-brand", success: "text-success", warning: "text-warning", info: "text-info", destructive: "text-destructive" };
  return (
    <div className="relative bg-card rounded-2xl border border-border/60 p-5 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${bar[color]}`} />
      <div className="flex items-start justify-between mb-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
        <span className={`${text[color]} opacity-60`}>{icon}</span>
      </div>
      <p className={`text-2xl font-bold tabular-nums ${text[color]}`}>{value}</p>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}

function AlertRow({ to, label, icon }: { to: string; label: string; icon?: string }) {
  return (
    <Link to={to} className="flex items-center gap-3 text-sm text-destructive/90 hover:text-destructive transition-colors group">
      {icon && <span className="text-base">{icon}</span>}
      <span className="flex-1">{label}</span>
      <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  );
}

function QuickLink({ to, icon, label, count }: { to: string; icon: React.ReactNode; label: string; count?: number }) {
  return (
    <Link to={to} className="flex items-center gap-3 bg-card border border-border/60 rounded-xl px-4 py-3 hover:border-brand/40 hover:bg-brand/5 transition-colors group">
      <span className="text-muted-foreground group-hover:text-brand transition-colors">{icon}</span>
      <span className="text-sm font-medium group-hover:text-brand transition-colors flex-1">{label}</span>
      {count !== undefined && <span className="text-xs text-muted-foreground tabular-nums">{count}</span>}
    </Link>
  );
}
