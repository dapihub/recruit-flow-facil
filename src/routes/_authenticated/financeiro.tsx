import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Plus, TrendingDown, TrendingUp, Pencil, Trash2, ArrowDownRight, ArrowUpRight,
  AlertTriangle, Wallet, Receipt, Target, Briefcase, Users, Activity, Flame,
  Clock, Award, Zap, Sparkles, Calendar, PieChart as PieIcon, BarChart3,
  Layers, GitBranch,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  addFatura, addCusto, updateFatura, updateCusto, deleteFatura, deleteCusto,
  useFaturas, useCustos, useVagas, useCandidatos,
  CUSTO_CATEGORIAS, type CustoCategoria, type CustoTipo, type CustoStatus,
  type Fatura, type FaturaStatus, type Custo,
} from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/financeiro")({
  head: () => ({
    meta: [
      { title: "Financeiro — DAPI HUB" },
      { name: "description", content: "Painel executivo: financeiro, comercial, operacional e previsibilidade." },
    ],
  }),
  component: FinanceiroPage,
});

const META_LUCRO_ANUAL = 500000;
const INICIO_OPERACAO_OFICIAL = "2026-04-01";
const INICIO_OPERACAO_LABEL = "01/04/2026";

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const brlCompact = (n: number) => {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `R$ ${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `R$ ${(n / 1_000).toFixed(1)}k`;
  return brl(n);
};
const pct = (n: number, d = 0) => `${n.toFixed(d)}%`;

function FinanceiroPage() {
  const faturasAll = useFaturas();
  const custosAll = useCustos();
  const vagasAll = useVagas();
  const candidatos = useCandidatos();

  const [openFatura, setOpenFatura] = useState(false);
  const [openCusto, setOpenCusto] = useState(false);
  const [editFatura, setEditFatura] = useState<Fatura | null>(null);
  const [editCusto, setEditCusto] = useState<Custo | null>(null);
  const [escopo, setEscopo] = useState<"oficial" | "historico">("oficial");
  const [kpiAberto, setKpiAberto] = useState<string | null>(null);

  // ============ Separa oficial × histórico ============
  const isHistorico = escopo === "historico";
  const faturasOficiais = useMemo(() => faturasAll.filter((f) => f.vencimento >= INICIO_OPERACAO_OFICIAL), [faturasAll]);
  const custosOficiais = useMemo(() => custosAll.filter((c) => c.data >= INICIO_OPERACAO_OFICIAL), [custosAll]);
  const vagasOficiais = useMemo(
    () => vagasAll.filter((v) => (v.createdAt ?? v.prazo ?? "") >= INICIO_OPERACAO_OFICIAL),
    [vagasAll],
  );
  const faturasHistorico = useMemo(() => faturasAll.filter((f) => f.vencimento < INICIO_OPERACAO_OFICIAL), [faturasAll]);
  const custosHistorico = useMemo(() => custosAll.filter((c) => c.data < INICIO_OPERACAO_OFICIAL), [custosAll]);
  const vagasHistorico = useMemo(
    () => vagasAll.filter((v) => (v.createdAt ?? v.prazo ?? "") < INICIO_OPERACAO_OFICIAL),
    [vagasAll],
  );

  const faturas = isHistorico ? faturasHistorico : faturasOficiais;
  const custos = isHistorico ? custosHistorico : custosOficiais;
  const vagas = isHistorico ? vagasHistorico : vagasOficiais;

  // ============ Datas de referência ============
  const hoje = new Date();
  const hojeIso = hoje.toISOString().slice(0, 10);
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const inicioMesPassado = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
  const fimMesPassado = new Date(hoje.getFullYear(), hoje.getMonth(), 0, 23, 59, 59);
  const isoDay = (d: string) => new Date(d + "T00:00:00");

  // ============ Financeiro consolidado ============
  const receita = faturas.filter((f) => f.status === "Pago").reduce((s, f) => s + f.valor, 0);
  const aReceber = faturas.filter((f) => f.status !== "Pago").reduce((s, f) => s + f.valor, 0);
  const custoTotal = custos.reduce((s, c) => s + c.valor, 0);
  const custoPago = custos.filter((c) => c.status === "Pago").reduce((s, c) => s + c.valor, 0);
  const custoFixo = custos.filter((c) => c.tipo === "Fixo").reduce((s, c) => s + c.valor, 0);
  const custoVariavel = custos.filter((c) => c.tipo === "Variável").reduce((s, c) => s + c.valor, 0);
  const lucro = receita - custoPago;
  const margem = receita > 0 ? (lucro / receita) * 100 : 0;
  const progresso = Math.max(0, Math.min(100, Math.round((lucro / META_LUCRO_ANUAL) * 100)));

  // ============ KPIs Executivos ============
  const receitaMes = faturas
    .filter((f) => f.status === "Pago" && isoDay(f.vencimento) >= inicioMes)
    .reduce((s, f) => s + f.valor, 0);
  const receitaMesPassado = faturas
    .filter((f) => f.status === "Pago" && isoDay(f.vencimento) >= inicioMesPassado && isoDay(f.vencimento) <= fimMesPassado)
    .reduce((s, f) => s + f.valor, 0);
  const crescimentoMensal = receitaMesPassado > 0
    ? ((receitaMes - receitaMesPassado) / receitaMesPassado) * 100
    : receitaMes > 0 ? 100 : 0;

  const custoMes = custos.filter((c) => isoDay(c.data) >= inicioMes).reduce((s, c) => s + c.valor, 0);
  const custoMesPagoPassado = custos
    .filter((c) => c.status === "Pago" && isoDay(c.data) >= inicioMesPassado && isoDay(c.data) <= fimMesPassado)
    .reduce((s, c) => s + c.valor, 0);
  const lucroMes = receitaMes - custoMes;
  const margemOperacional = receitaMes > 0 ? (lucroMes / receitaMes) * 100 : 0;

  const caixaAtual = receita - custoPago; // entradas pagas - saídas pagas
  // Burn rate = média dos custos pagos dos últimos 3 meses
  const burnRate = useMemo(() => {
    let total = 0;
    for (let i = 1; i <= 3; i++) {
      const ref = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const fim = new Date(hoje.getFullYear(), hoje.getMonth() - i + 1, 0, 23, 59, 59);
      total += custos
        .filter((c) => c.status === "Pago" && isoDay(c.data) >= ref && isoDay(c.data) <= fim)
        .reduce((s, c) => s + c.valor, 0);
    }
    return total / 3;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [custos]);
  const runway = burnRate > 0 ? caixaAtual / burnRate : 0; // em meses
  const receitaPrevista = faturas
    .filter((f) => f.status !== "Pago" && f.vencimento >= hojeIso)
    .reduce((s, f) => s + f.valor, 0);

  // ============ Faturas vencidas ============
  const faturasVencidas = faturas.filter((f) => f.status !== "Pago" && f.vencimento < hojeIso);
  const valorVencido = faturasVencidas.reduce((s, f) => s + f.valor, 0);

  // ============ KPIs Comerciais ============
  // Propostas enviadas = vagas com briefing/contrato emitido (briefing existe)
  // Contratos fechados = vagas com etapa "Finalizada" ou status "Fechada"
  const propostasEnviadas = vagas.length;
  const contratosFechados = vagas.filter((v) => v.status === "Fechada" || v.etapa === "Finalizada").length;
  const conversao = propostasEnviadas > 0 ? (contratosFechados / propostasEnviadas) * 100 : 0;
  const faturasPagas = faturas.filter((f) => f.status === "Pago");
  const ticketMedio = faturasPagas.length > 0 ? receita / faturasPagas.length : 0;

  const receitaPorCliente = useMemo(() => {
    const map = new Map<string, number>();
    faturas.filter((f) => f.status === "Pago").forEach((f) => {
      map.set(f.cliente, (map.get(f.cliente) ?? 0) + f.valor);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [faturas]);
  const clientesAtivos = receitaPorCliente.length;
  const ticketPorCliente = clientesAtivos > 0 ? receita / clientesAtivos : 0;

  // Receita por origem (proxy: área da vaga vinculada à fatura)
  const receitaPorOrigem = useMemo(() => {
    const map = new Map<string, number>();
    faturas.filter((f) => f.status === "Pago").forEach((f) => {
      const v = vagas.find((vg) => vg.id === f.vagaId);
      const origem = v?.area ?? "Direto";
      map.set(origem, (map.get(origem) ?? 0) + f.valor);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [faturas, vagas]);

  // ============ KPIs Operacionais ============
  const vagasAbertas = vagas.filter((v) => v.status === "Aberta" || v.status === "Em processo").length;
  const vagasFechadas = vagas.filter((v) => v.status === "Fechada").length;
  const vagasEncerradas = vagas.filter((v) => v.status === "Encerrada").length;
  const candidatosAndamento = candidatos.filter((c) => c.status === "Triagem" || c.status === "Entrevista").length;
  const candidatosTotal = candidatos.length;
  const contratados = candidatos.filter((c) => c.status === "Contratado").length;
  const taxaAprovacao = candidatosTotal > 0 ? (contratados / candidatosTotal) * 100 : 0;
  const vagasEmGarantia = vagas.filter((v) => v.etapa === "Em Garantia").length;
  const taxaReposicao = vagasFechadas > 0 ? (vagasEmGarantia / vagasFechadas) * 100 : 0;

  // SLA médio = dias entre createdAt e prazo das vagas fechadas
  const slaMedio = useMemo(() => {
    const fechadas = vagas.filter((v) => v.status === "Fechada" && v.createdAt && v.prazo);
    if (fechadas.length === 0) return 0;
    const total = fechadas.reduce((s, v) => {
      const inicio = new Date(v.createdAt!).getTime();
      const fim = new Date(v.prazo).getTime();
      return s + Math.max(0, (fim - inicio) / (1000 * 60 * 60 * 24));
    }, 0);
    return Math.round(total / fechadas.length);
  }, [vagas]);

  // ============ Séries temporais ============
  const serieMensal = useMemo(() => {
    const meses: { mes: string; receita: number; custo: number; lucro: number; cresc: number; caixa: number; forecast: number }[] = [];
    let caixaAcum = 0;
    for (let i = 11; i >= 0; i--) {
      const ref = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const fim = new Date(hoje.getFullYear(), hoje.getMonth() - i + 1, 0, 23, 59, 59);
      const r = faturas
        .filter((f) => f.status === "Pago" && isoDay(f.vencimento) >= ref && isoDay(f.vencimento) <= fim)
        .reduce((s, f) => s + f.valor, 0);
      const c = custos
        .filter((c) => c.status === "Pago" && isoDay(c.data) >= ref && isoDay(c.data) <= fim)
        .reduce((s, c) => s + c.valor, 0);
      caixaAcum += r - c;
      const prev = meses[meses.length - 1];
      const cresc = prev && prev.receita > 0 ? ((r - prev.receita) / prev.receita) * 100 : 0;
      meses.push({
        mes: ref.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
        receita: r, custo: c, lucro: r - c, cresc, caixa: caixaAcum, forecast: 0,
      });
    }
    // Forecast: próximos 3 meses baseados em faturas pendentes futuras
    for (let i = 1; i <= 3; i++) {
      const ref = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1);
      const fim = new Date(hoje.getFullYear(), hoje.getMonth() + i + 1, 0, 23, 59, 59);
      const prev = faturas
        .filter((f) => f.status !== "Pago" && isoDay(f.vencimento) >= ref && isoDay(f.vencimento) <= fim)
        .reduce((s, f) => s + f.valor, 0);
      meses.push({
        mes: ref.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
        receita: 0, custo: 0, lucro: 0, cresc: 0, caixa: caixaAcum, forecast: prev,
      });
    }
    return meses;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faturas, custos]);

  const serie6m = serieMensal.slice(-9, -3); // últimos 6 meses fechados
  const serieForecast = serieMensal.slice(-9); // 6 meses + 3 forecast

  // ============ Pipeline financeiro (faturas por status) ============
  const pipelineFinanceiro = useMemo(() => {
    return [
      { etapa: "Pendente", valor: faturas.filter((f) => f.status === "Pendente").reduce((s, f) => s + f.valor, 0), cor: "var(--info)" },
      { etapa: "Atrasado", valor: faturas.filter((f) => f.status === "Atrasado" || (f.status !== "Pago" && f.vencimento < hojeIso)).reduce((s, f) => s + f.valor, 0), cor: "var(--destructive)" },
      { etapa: "Pago", valor: faturas.filter((f) => f.status === "Pago").reduce((s, f) => s + f.valor, 0), cor: "var(--success)" },
    ];
  }, [faturas, hojeIso]);

  const statusFaturas = useMemo(() => {
    const pagas = faturas.filter((f) => f.status === "Pago").length;
    const pendentes = faturas.filter((f) => f.status === "Pendente" && f.vencimento >= hojeIso).length;
    const atrasadas = faturas.filter((f) => f.status !== "Pago" && f.vencimento < hojeIso).length;
    return [
      { name: "Pagas", value: pagas, color: "var(--success)" },
      { name: "Pendentes", value: pendentes, color: "var(--info)" },
      { name: "Atrasadas", value: atrasadas, color: "var(--destructive)" },
    ].filter((s) => s.value > 0);
  }, [faturas, hojeIso]);

  const porCategoria = useMemo(() => {
    const map = new Map<CustoCategoria, number>();
    custos.forEach((c) => map.set(c.categoria, (map.get(c.categoria) ?? 0) + c.valor));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [custos]);

  // ============ Insights automáticos ============
  const insights = useMemo(() => {
    const out: { tipo: "positivo" | "alerta" | "info"; icon: any; titulo: string; descricao: string }[] = [];
    if (receitaMesPassado > 0) {
      if (crescimentoMensal >= 10) out.push({ tipo: "positivo", icon: TrendingUp, titulo: `Crescimento de ${crescimentoMensal.toFixed(0)}% no mês`, descricao: `Receita saltou de ${brlCompact(receitaMesPassado)} para ${brlCompact(receitaMes)}.` });
      else if (crescimentoMensal <= -10) out.push({ tipo: "alerta", icon: TrendingDown, titulo: `Queda de ${Math.abs(crescimentoMensal).toFixed(0)}% na receita`, descricao: `Receita do mês caiu vs. ${brlCompact(receitaMesPassado)} do mês anterior.` });
    }
    if (custoMesPagoPassado > 0) {
      const variacaoCusto = ((custoMes - custoMesPagoPassado) / custoMesPagoPassado) * 100;
      if (variacaoCusto >= 20) out.push({ tipo: "alerta", icon: Flame, titulo: `Custos subiram ${variacaoCusto.toFixed(0)}%`, descricao: `Custos do mês (${brlCompact(custoMes)}) bem acima do mês anterior.` });
    }
    if (faturasVencidas.length > 0) out.push({ tipo: "alerta", icon: AlertTriangle, titulo: `${faturasVencidas.length} ${faturasVencidas.length === 1 ? "fatura vencida" : "faturas vencidas"}`, descricao: `${brlCompact(valorVencido)} em atraso. Acione cobrança.` });
    if (runway > 0 && runway < 3 && burnRate > 0) out.push({ tipo: "alerta", icon: Clock, titulo: `Runway curto: ${runway.toFixed(1)} meses`, descricao: `Caixa cobre ~${runway.toFixed(1)} meses ao ritmo atual de queima.` });
    else if (runway >= 12) out.push({ tipo: "positivo", icon: Award, titulo: `Runway saudável: ${runway.toFixed(0)}+ meses`, descricao: "Caixa estável em relação ao burn rate." });
    if (receitaPorCliente[0]) out.push({ tipo: "info", icon: Sparkles, titulo: `Cliente mais rentável: ${receitaPorCliente[0][0]}`, descricao: `${brlCompact(receitaPorCliente[0][1])} de receita acumulada.` });
    if (conversao > 0 && propostasEnviadas >= 3) {
      if (conversao >= 50) out.push({ tipo: "positivo", icon: Zap, titulo: `Conversão alta: ${conversao.toFixed(0)}%`, descricao: `${contratosFechados} de ${propostasEnviadas} vagas convertidas.` });
      else if (conversao < 20) out.push({ tipo: "alerta", icon: Activity, titulo: `Conversão baixa: ${conversao.toFixed(0)}%`, descricao: "Revisar pipeline comercial." });
    }
    return out.slice(0, 6);
  }, [crescimentoMensal, receitaMes, receitaMesPassado, custoMes, custoMesPagoPassado, faturasVencidas.length, valorVencido, runway, burnRate, receitaPorCliente, conversao, propostasEnviadas, contratosFechados]);

  const handleDeleteFatura = async (id: string) => {
    try { await deleteFatura(id); toast.success("Fatura excluída"); }
    catch (e: any) { toast.error(e?.message ?? "Erro ao excluir fatura"); }
  };
  const handleDeleteCusto = async (id: string) => {
    try { await deleteCusto(id); toast.success("Custo excluído"); }
    catch (e: any) { toast.error(e?.message ?? "Erro ao excluir custo"); }
  };

  return (
    <div>
      <PageHeader
        title="Financeiro"
        subtitle="Painel executivo: financeiro · comercial · operacional · previsibilidade"
        action={
          <div className="flex gap-2">
            <Dialog open={openCusto} onOpenChange={setOpenCusto}>
              <DialogTrigger asChild>
                <Button variant="outline"><Plus className="w-4 h-4 mr-2" /> Novo Custo</Button>
              </DialogTrigger>
              <NovoCustoModal onClose={() => setOpenCusto(false)} />
            </Dialog>
            <Dialog open={openFatura} onOpenChange={setOpenFatura}>
              <DialogTrigger asChild>
                <Button className="bg-brand hover:bg-brand/90 text-brand-foreground"><Plus className="w-4 h-4 mr-2" /> Nova Fatura</Button>
              </DialogTrigger>
              <NovaFaturaModal onClose={() => setOpenFatura(false)} />
            </Dialog>
          </div>
        }
      />

      <div className="p-6 lg:p-8 space-y-5">
        {/* Escopo da operação */}
        <div className={`rounded-2xl border p-3.5 flex flex-wrap items-center justify-between gap-3 ${isHistorico ? "bg-warning/5 border-warning/30" : "bg-card"}`}>
          <div className="flex items-center gap-3">
            <span className={`p-2 rounded-lg ${isHistorico ? "bg-warning/15 text-warning" : "bg-brand/10 text-brand"}`}>
              <Calendar className="w-4 h-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground leading-tight">
                {isHistorico ? "Histórico anterior à operação oficial" : "Operação oficial"}
              </p>
              <p className="text-xs text-muted-foreground">
                {isHistorico
                  ? `Registros anteriores a ${INICIO_OPERACAO_LABEL}. Fora dos KPIs gerenciais.`
                  : `KPIs e gráficos consideram apenas registros a partir de ${INICIO_OPERACAO_LABEL}.`}
              </p>
            </div>
          </div>
          <div className="inline-flex rounded-lg border bg-muted/40 p-1 text-xs font-medium">
            <button type="button" onClick={() => setEscopo("oficial")}
              className={`px-3 py-1.5 rounded-md transition ${!isHistorico ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              Operação oficial
              <span className="ml-1.5 text-muted-foreground">({faturasOficiais.length + custosOficiais.length})</span>
            </button>
            <button type="button" onClick={() => setEscopo("historico")}
              className={`px-3 py-1.5 rounded-md transition ${isHistorico ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              Histórico anterior
              <span className="ml-1.5 text-muted-foreground">({faturasHistorico.length + custosHistorico.length})</span>
            </button>
          </div>
        </div>

        {/* ===== KPIs EXECUTIVOS ===== */}
        <Section icon={<BarChart3 className="w-3.5 h-3.5" />} label="Executivo" sub="Visão financeira do negócio">
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
            <MiniKpi onClick={() => setKpiAberto("receitaMes")} label="Receita do mês" value={brlCompact(receitaMes)} accent="success" trend={crescimentoMensal} icon={<Wallet className="w-3.5 h-3.5" />} />
            <MiniKpi onClick={() => setKpiAberto("lucro")} label="Lucro líquido" value={brlCompact(lucro)} accent={lucro >= 0 ? "brand" : "destructive"} icon={<TrendingUp className="w-3.5 h-3.5" />} hint={`Margem ${margem.toFixed(0)}%`} />
            <MiniKpi onClick={() => setKpiAberto("margem")} label="Margem op." value={pct(margemOperacional, 1)} accent={margemOperacional >= 20 ? "success" : margemOperacional >= 0 ? "info" : "destructive"} icon={<Activity className="w-3.5 h-3.5" />} hint="Mês corrente" />
            <MiniKpi onClick={() => setKpiAberto("caixa")} label="Caixa atual" value={brlCompact(caixaAtual)} accent="brand" icon={<Layers className="w-3.5 h-3.5" />} hint="Entradas − saídas pagas" />
            <MiniKpi onClick={() => setKpiAberto("burn")} label="Burn rate" value={brlCompact(burnRate)} accent="warning" icon={<Flame className="w-3.5 h-3.5" />} hint="Média 3M" />
            <MiniKpi onClick={() => setKpiAberto("runway")} label="Runway" value={burnRate > 0 ? `${runway.toFixed(1)} m` : "∞"} accent={runway >= 6 || burnRate === 0 ? "success" : runway >= 3 ? "warning" : "destructive"} icon={<Clock className="w-3.5 h-3.5" />} hint="Ao ritmo atual" />
            <MiniKpi onClick={() => setKpiAberto("prevista")} label="Receita prevista" value={brlCompact(receitaPrevista)} accent="info" icon={<Sparkles className="w-3.5 h-3.5" />} hint="Pendente futura" />
            <MiniKpi onClick={() => setKpiAberto("crescimento")} label="Crescimento M/M" value={pct(crescimentoMensal, 1)} accent={crescimentoMensal >= 0 ? "success" : "destructive"} icon={crescimentoMensal >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />} hint={`vs ${brlCompact(receitaMesPassado)}`} />
          </div>
        </Section>

        {/* ===== COMERCIAL + OPERACIONAL ===== */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <Section icon={<Briefcase className="w-3.5 h-3.5" />} label="Comercial" sub="Funil, conversão e clientes">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <MiniKpi onClick={() => setKpiAberto("propostas")} label="Propostas" value={String(propostasEnviadas)} accent="info" icon={<Receipt className="w-3.5 h-3.5" />} hint="Vagas criadas" />
              <MiniKpi onClick={() => setKpiAberto("contratos")} label="Contratos fechados" value={String(contratosFechados)} accent="success" icon={<Award className="w-3.5 h-3.5" />} />
              <MiniKpi onClick={() => setKpiAberto("conversao")} label="Conversão" value={pct(conversao, 0)} accent={conversao >= 30 ? "success" : "warning"} icon={<Zap className="w-3.5 h-3.5" />} />
              <MiniKpi onClick={() => setKpiAberto("ticket")} label="Ticket médio" value={brlCompact(ticketMedio)} accent="brand" icon={<Wallet className="w-3.5 h-3.5" />} hint={`${faturasPagas.length} faturas`} />
              <MiniKpi onClick={() => setKpiAberto("porCliente")} label="Por cliente" value={brlCompact(ticketPorCliente)} accent="info" icon={<Users className="w-3.5 h-3.5" />} hint={`${clientesAtivos} ativos`} />
              <MiniKpi onClick={() => setKpiAberto("aReceber")} label="A receber" value={brlCompact(aReceber)} accent="warning" icon={<Clock className="w-3.5 h-3.5" />} />
            </div>
          </Section>

          <Section icon={<Activity className="w-3.5 h-3.5" />} label="Operacional" sub="Vagas, SLA e candidatos">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <MiniKpi onClick={() => setKpiAberto("vagasAbertas")} label="Vagas abertas" value={String(vagasAbertas)} accent="info" icon={<Briefcase className="w-3.5 h-3.5" />} />
              <MiniKpi onClick={() => setKpiAberto("vagasFechadas")} label="Vagas fechadas" value={String(vagasFechadas)} accent="success" icon={<Award className="w-3.5 h-3.5" />} hint={`${vagasEncerradas} encerradas`} />
              <MiniKpi onClick={() => setKpiAberto("sla")} label="SLA médio" value={`${slaMedio} d`} accent="brand" icon={<Clock className="w-3.5 h-3.5" />} hint="Briefing → entrega" />
              <MiniKpi onClick={() => setKpiAberto("aprovacao")} label="Aprovação" value={pct(taxaAprovacao, 0)} accent={taxaAprovacao >= 25 ? "success" : "warning"} icon={<TrendingUp className="w-3.5 h-3.5" />} hint={`${contratados}/${candidatosTotal}`} />
              <MiniKpi onClick={() => setKpiAberto("reposicao")} label="Reposição" value={pct(taxaReposicao, 0)} accent={taxaReposicao <= 10 ? "success" : "warning"} icon={<GitBranch className="w-3.5 h-3.5" />} hint={`${vagasEmGarantia} em garantia`} />
              <MiniKpi onClick={() => setKpiAberto("emAndamento")} label="Em andamento" value={String(candidatosAndamento)} accent="info" icon={<Users className="w-3.5 h-3.5" />} hint="Candidatos ativos" />
            </div>
          </Section>
        </div>

        {/* ===== INSIGHTS AUTOMÁTICOS ===== */}
        {insights.length > 0 && (
          <Section icon={<Sparkles className="w-3.5 h-3.5" />} label="Insights" sub="Sinais automáticos do período">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {insights.map((ins, i) => {
                const Icon = ins.icon;
                const palette = {
                  positivo: "bg-success/5 border-success/20 text-success",
                  alerta: "bg-destructive/5 border-destructive/20 text-destructive",
                  info: "bg-brand/5 border-brand/20 text-brand",
                }[ins.tipo];
                return (
                  <div key={i} className={`rounded-xl border p-3.5 flex gap-3 ${palette}`}>
                    <span className="shrink-0 mt-0.5"><Icon className="w-4 h-4" /></span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground leading-tight">{ins.titulo}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{ins.descricao}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        {/* ===== META ANUAL (compacta) ===== */}
        <div className="bg-card rounded-2xl border p-4 flex items-center gap-5">
          <div className="flex items-center gap-2 shrink-0">
            <span className="p-2 rounded-lg bg-brand/10 text-brand"><Target className="w-4 h-4" /></span>
            <div>
              <p className="text-sm font-semibold text-foreground leading-tight">Meta anual de lucro</p>
              <p className="text-xs text-muted-foreground">{brl(lucro)} de {brl(META_LUCRO_ANUAL)}</p>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="h-2.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-brand to-info transition-all" style={{ width: `${progresso}%` }} />
            </div>
          </div>
          <span className="text-2xl font-bold text-brand tabular-nums shrink-0">{progresso}%</span>
        </div>

        {/* ===== TABS: CHARTS / DRE / RECEITAS / CUSTOS ===== */}
        <Tabs defaultValue="visao" className="space-y-4">
          <TabsList>
            <TabsTrigger value="visao">Visão executiva</TabsTrigger>
            <TabsTrigger value="forecast">Forecast</TabsTrigger>
            <TabsTrigger value="dre">DRE</TabsTrigger>
            <TabsTrigger value="receitas">Receitas</TabsTrigger>
            <TabsTrigger value="custos">Custos</TabsTrigger>
          </TabsList>

          {/* VISÃO */}
          <TabsContent value="visao" className="space-y-4">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              {/* Fluxo de caixa */}
              <Panel title="Fluxo de caixa" sub="Saldo acumulado · 6 meses" className="xl:col-span-2">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={serie6m} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gradCaixa" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="mes" tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" />
                      <YAxis tickFormatter={(v) => brlCompact(v)} tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" width={50} />
                      <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} formatter={(v: number) => brl(v)} />
                      <Area type="monotone" dataKey="caixa" name="Caixa acumulado" stroke="var(--brand)" strokeWidth={2.5} fill="url(#gradCaixa)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Panel>

              {/* Status faturas */}
              <Panel title="Pipeline financeiro" sub="Valor em cada estágio">
                {pipelineFinanceiro.every((p) => p.valor === 0) ? (
                  <p className="text-sm text-muted-foreground">Sem faturas.</p>
                ) : (
                  <div className="space-y-3">
                    {pipelineFinanceiro.map((p) => {
                      const total = pipelineFinanceiro.reduce((s, x) => s + x.valor, 0);
                      const pct = total > 0 ? (p.valor / total) * 100 : 0;
                      return (
                        <div key={p.etapa}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-medium text-foreground">{p.etapa}</span>
                            <span className="text-muted-foreground">{brlCompact(p.valor)} · {pct.toFixed(0)}%</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full transition-all" style={{ width: `${pct}%`, background: p.cor }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {statusFaturas.length > 0 && (
                  <div className="h-40 mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={statusFaturas} dataKey="value" nameKey="name" innerRadius={35} outerRadius={60} paddingAngle={2}>
                          {statusFaturas.map((s) => <Cell key={s.name} fill={s.color} />)}
                        </Pie>
                        <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Panel>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              {/* Receita vs custo */}
              <Panel title="Receita vs Custo" sub="Últimos 6 meses" className="xl:col-span-2">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={serie6m} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="mes" tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" />
                      <YAxis tickFormatter={(v) => brlCompact(v)} tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" width={50} />
                      <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} formatter={(v: number) => brl(v)} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="receita" name="Receita" fill="var(--success)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="custo" name="Custo" fill="var(--warning)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="lucro" name="Lucro" fill="var(--brand)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Panel>

              {/* Crescimento mensal % */}
              <Panel title="Crescimento M/M" sub="Variação % da receita">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={serie6m} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="mes" tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" />
                      <YAxis tickFormatter={(v) => `${v.toFixed(0)}%`} tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" width={40} />
                      <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} formatter={(v: number) => `${v.toFixed(1)}%`} />
                      <Bar dataKey="cresc" name="Crescimento" radius={[4, 4, 0, 0]}>
                        {serie6m.map((d, i) => <Cell key={i} fill={d.cresc >= 0 ? "var(--success)" : "var(--destructive)"} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Panel>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {/* Top clientes */}
              <Panel title="Receita por cliente" sub="Top 5 acumulado">
                {receitaPorCliente.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum cliente com receita.</p>
                ) : (
                  <div className="space-y-3">
                    {receitaPorCliente.slice(0, 5).map(([cliente, val], i) => {
                      const max = receitaPorCliente[0][1];
                      const pct = max > 0 ? Math.round((val / max) * 100) : 0;
                      return (
                        <div key={cliente}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-foreground/80 truncate"><span className="text-muted-foreground mr-1.5">#{i + 1}</span>{cliente}</span>
                            <span className="font-semibold text-foreground tabular-nums">{brlCompact(val)}</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-brand to-info" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Panel>

              {/* Receita por origem */}
              <Panel title="Receita por origem" sub="Distribuição por área da vaga">
                {receitaPorOrigem.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem dados de origem.</p>
                ) : (
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={receitaPorOrigem} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}>
                          {receitaPorOrigem.map((_, i) => <Cell key={i} fill={`oklch(${0.65 - i * 0.05} 0.15 ${(i * 60) % 360})`} />)}
                        </Pie>
                        <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} formatter={(v: number) => brl(v)} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Panel>
            </div>
          </TabsContent>

          {/* FORECAST */}
          <TabsContent value="forecast" className="space-y-4">
            <Panel title="Forecast de receita" sub="6 meses fechados + 3 meses projetados (faturas pendentes)">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={serieForecast} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="mes" tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" />
                    <YAxis tickFormatter={(v) => brlCompact(v)} tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" width={50} />
                    <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} formatter={(v: number) => brl(v)} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="receita" name="Receita realizada" stroke="var(--success)" strokeWidth={2.5} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="forecast" name="Forecast" stroke="var(--brand)" strokeWidth={2.5} strokeDasharray="6 4" dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="lucro" name="Lucro" stroke="var(--info)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Panel>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <MiniKpi label="Forecast próx. mês" value={brlCompact(serieForecast[6]?.forecast ?? 0)} accent="brand" icon={<Sparkles className="w-3.5 h-3.5" />} />
              <MiniKpi label="Forecast 90 dias" value={brlCompact((serieForecast[6]?.forecast ?? 0) + (serieForecast[7]?.forecast ?? 0) + (serieForecast[8]?.forecast ?? 0))} accent="info" icon={<Calendar className="w-3.5 h-3.5" />} />
              <MiniKpi label="Receita prevista total" value={brlCompact(receitaPrevista)} accent="success" icon={<TrendingUp className="w-3.5 h-3.5" />} hint="Pendente futura" />
            </div>
          </TabsContent>

          {/* DRE */}
          <TabsContent value="dre" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Panel title="DRE oficial" sub={`Período: a partir de ${INICIO_OPERACAO_LABEL}`}>
                <DreLine label="(+) Receita bruta paga" value={receita} positive />
                <DreLine label="(−) Custos variáveis" value={-custoVariavel} />
                <DreLine label="(−) Custos fixos" value={-custoFixo} />
                <div className="border-t my-2" />
                <DreLine label="(=) Lucro líquido" value={lucro} bold positive={lucro >= 0} />
                <DreLine label="Margem líquida" value={null} extra={`${margem.toFixed(1)}%`} muted />
                <div className="border-t my-2" />
                <DreLine label="A receber (em aberto)" value={aReceber} muted />
                <DreLine label="Custos pendentes" value={custoTotal - custoPago} muted />
              </Panel>

              <Panel title="Custos por categoria">
                <div className="space-y-3">
                  {porCategoria.length === 0 && <p className="text-sm text-muted-foreground">Nenhum custo registrado.</p>}
                  {porCategoria.map(([cat, val]) => {
                    const pct = custoTotal > 0 ? Math.round((val / custoTotal) * 100) : 0;
                    return (
                      <div key={cat}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-foreground/80">{cat}</span>
                          <span className="font-semibold text-foreground">{brl(val)} <span className="text-muted-foreground font-normal">· {pct}%</span></span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-brand" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Panel>
            </div>
          </TabsContent>

          {/* RECEITAS */}
          <TabsContent value="receitas">
            <div className="bg-card rounded-2xl border overflow-x-auto shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-muted-foreground">
                  <tr>
                    <Th>Nº</Th><Th>Cliente</Th><Th>Serviço</Th>
                    <Th>Data de pagamento</Th><Th className="text-right">Valor</Th><Th>Status</Th><Th />
                  </tr>
                </thead>
                <tbody>
                  {faturas.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Nenhuma fatura no escopo selecionado.</td></tr>
                  )}
                  {[...faturas].sort((a, b) => (b.vencimento ?? "").localeCompare(a.vencimento ?? "")).map((f, i) => (
                    <tr key={f.id} className={`border-t transition-colors ${i % 2 ? "bg-muted/10" : ""} hover:bg-brand/5`}>
                      <Td className="font-mono text-xs">{f.numero}</Td>
                      <Td className="font-medium text-foreground">{f.cliente}</Td>
                      <Td>{f.servico}</Td>
                      <Td>{new Date(f.vencimento).toLocaleDateString("pt-BR")}</Td>
                      <Td className="text-right font-semibold text-success">
                        <span className="inline-flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" />{brl(f.valor)}</span>
                      </Td>
                      <Td>
                        <div className="flex items-center gap-2">
                          <Checkbox checked={f.status === "Pago"} onCheckedChange={async (checked) => {
                            try { await updateFatura(f.id, { status: checked ? "Pago" : "Pendente" }); toast.success(checked ? "Marcada como paga" : "Marcada como pendente"); }
                            catch (e: any) { toast.error(e?.message ?? "Erro ao atualizar"); }
                          }} />
                          <StatusBadge status={f.status} />
                        </div>
                      </Td>
                      <Td className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditFatura(f)}><Pencil className="w-3.5 h-3.5" /></Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir fatura?</AlertDialogTitle>
                                <AlertDialogDescription>A fatura {f.numero} será removida permanentemente.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteFatura(f.id)}>Excluir</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* CUSTOS */}
          <TabsContent value="custos">
            <div className="bg-card rounded-2xl border overflow-x-auto shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-muted-foreground">
                  <tr>
                    <Th>Descrição</Th><Th>Categoria</Th><Th>Tipo</Th>
                    <Th>Data</Th><Th className="text-right">Valor</Th><Th>Status</Th><Th />
                  </tr>
                </thead>
                <tbody>
                  {custos.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Nenhum custo no escopo selecionado.</td></tr>
                  )}
                  {[...custos].sort((a, b) => (b.data ?? "").localeCompare(a.data ?? "")).map((c, i) => (
                    <tr key={c.id} className={`border-t transition-colors ${i % 2 ? "bg-muted/10" : ""} hover:bg-brand/5`}>
                      <Td className="font-medium text-foreground">
                        {c.descricao}
                        {c.fornecedor && <div className="text-xs text-muted-foreground">{c.fornecedor}</div>}
                      </Td>
                      <Td>{c.categoria}</Td>
                      <Td>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${c.tipo === "Fixo" ? "bg-info/10 text-info border-info/30" : "bg-warning/10 text-warning-foreground border-warning/30"}`}>{c.tipo}</span>
                      </Td>
                      <Td>{new Date(c.data).toLocaleDateString("pt-BR")}</Td>
                      <Td className="text-right font-semibold text-destructive">
                        <span className="inline-flex items-center gap-1"><TrendingDown className="w-3.5 h-3.5" />{brl(c.valor)}</span>
                      </Td>
                      <Td>
                        <div className="flex items-center gap-2">
                          <Checkbox checked={c.status === "Pago"} onCheckedChange={async (checked) => {
                            try { await updateCusto(c.id, { status: checked ? "Pago" : "Pendente" }); toast.success(checked ? "Marcado como pago" : "Marcado como pendente"); }
                            catch (e: any) { toast.error(e?.message ?? "Erro ao atualizar"); }
                          }} />
                          <StatusBadge status={c.status} />
                        </div>
                      </Td>
                      <Td className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditCusto(c)}><Pencil className="w-3.5 h-3.5" /></Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir custo?</AlertDialogTitle>
                                <AlertDialogDescription>"{c.descricao}" será removido permanentemente.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteCusto(c.id)}>Excluir</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!editFatura} onOpenChange={(o) => !o && setEditFatura(null)}>
        {editFatura && <EditFaturaModal fatura={editFatura} onClose={() => setEditFatura(null)} />}
      </Dialog>
      <Dialog open={!!editCusto} onOpenChange={(o) => !o && setEditCusto(null)}>
        {editCusto && <EditCustoModal custo={editCusto} onClose={() => setEditCusto(null)} />}
      </Dialog>
    </div>
  );
}

// ============ UI Helpers ============
function Section({ icon, label, sub, children }: { icon: React.ReactNode; label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-baseline gap-2 mb-2.5">
        <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-foreground font-bold">
          <span className="text-brand">{icon}</span>{label}
        </span>
        {sub && <span className="text-xs text-muted-foreground">· {sub}</span>}
      </div>
      {children}
    </div>
  );
}

function Panel({ title, sub, children, className = "" }: { title: string; sub?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-card rounded-2xl border p-5 shadow-sm ${className}`}>
      <div className="mb-4">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
      {children}
    </div>
  );
}

function MiniKpi({
  label, value, hint, trend, icon, accent = "brand", onClick,
}: {
  label: string; value: string; hint?: string; trend?: number; icon?: React.ReactNode;
  accent?: "brand" | "success" | "warning" | "info" | "destructive" | "muted";
  onClick?: () => void;
}) {
  const bar: Record<string, string> = {
    brand: "bg-brand", success: "bg-success", warning: "bg-warning",
    info: "bg-info", destructive: "bg-destructive", muted: "bg-muted-foreground/40",
  };
  const iconColor: Record<string, string> = {
    brand: "text-brand bg-brand/10", success: "text-success bg-success/10",
    warning: "text-warning bg-warning/10", info: "text-info bg-info/10",
    destructive: "text-destructive bg-destructive/10", muted: "text-muted-foreground bg-muted",
  };
  const trendPositive = (trend ?? 0) >= 0;
  const clickable = typeof onClick === "function";
  return (
    <div
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={clickable ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick?.(); } } : undefined}
      className={`bg-card rounded-xl border p-3.5 relative overflow-hidden shadow-sm transition-all ${clickable ? "cursor-pointer hover:shadow-md hover:-translate-y-0.5 hover:border-foreground/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand" : "hover:shadow-md"}`}
    >
      <div className={`absolute left-0 right-0 top-0 h-0.5 ${bar[accent]}`} />
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold truncate">{label}</p>
        {icon && <span className={`p-1 rounded-md ${iconColor[accent]}`}>{icon}</span>}
      </div>
      <p className="text-lg font-bold text-foreground tabular-nums leading-tight">{value}</p>
      <div className="flex items-center gap-1.5 mt-1 min-h-[14px]">
        {typeof trend === "number" && Number.isFinite(trend) && (
          <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold ${trendPositive ? "text-success" : "text-destructive"}`}>
            {trendPositive ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
            {Math.abs(trend).toFixed(0)}%
          </span>
        )}
        {hint && <p className="text-[10px] text-muted-foreground truncate">{hint}</p>}
      </div>
    </div>
  );
}

function DreLine({ label, value, positive, bold, muted, extra }: { label: string; value: number | null; positive?: boolean; bold?: boolean; muted?: boolean; extra?: string }) {
  return (
    <div className={`flex justify-between py-1.5 text-sm ${bold ? "font-bold text-base" : ""} ${muted ? "text-muted-foreground" : "text-foreground"}`}>
      <span>{label}</span>
      <span className={positive === undefined ? "" : positive ? "text-success" : "text-destructive"}>
        {extra ?? (value !== null ? brl(value) : "—")}
      </span>
    </div>
  );
}

function Th({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return <th className={`text-left font-semibold px-4 py-3 text-xs uppercase tracking-wider ${className}`}>{children}</th>;
}
function Td({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 text-foreground/80 ${className}`}>{children}</td>;
}

function NovaFaturaModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ cliente: "", servico: "", valor: "", vencimento: "", observacoes: "" });
  const [saving, setSaving] = useState(false);
  return (
    <DialogContent className="max-w-lg">
      <DialogHeader><DialogTitle>Nova Fatura</DialogTitle></DialogHeader>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Cliente" className="col-span-2"><Input value={form.cliente} onChange={(e) => setForm({ ...form, cliente: e.target.value })} /></Field>
        <Field label="Vaga / Serviço" className="col-span-2"><Input value={form.servico} onChange={(e) => setForm({ ...form, servico: e.target.value })} /></Field>
        <Field label="Valor (R$)"><Input type="number" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} /></Field>
        <Field label="Data de pagamento"><Input type="date" value={form.vencimento} onChange={(e) => setForm({ ...form, vencimento: e.target.value })} /></Field>
        <Field label="Observações" className="col-span-2"><Textarea rows={3} value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} /></Field>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button
          className="bg-brand hover:bg-brand/90 text-brand-foreground"
          disabled={!form.cliente || !form.valor || saving}
          onClick={async () => {
            setSaving(true);
            try {
              await addFatura({ cliente: form.cliente, servico: form.servico, valor: Number(form.valor), vencimento: form.vencimento, observacoes: form.observacoes });
              toast.success("Fatura criada");
              onClose();
            } catch (e: any) {
              toast.error(e?.message ?? "Erro ao criar fatura");
            } finally {
              setSaving(false);
            }
          }}
        >Criar fatura</Button>
      </DialogFooter>
    </DialogContent>
  );
}

function EditFaturaModal({ fatura, onClose }: { fatura: Fatura; onClose: () => void }) {
  const [form, setForm] = useState({
    cliente: fatura.cliente,
    servico: fatura.servico,
    valor: String(fatura.valor),
    vencimento: fatura.vencimento,
    status: fatura.status,
    observacoes: fatura.observacoes ?? "",
  });
  const [saving, setSaving] = useState(false);
  return (
    <DialogContent className="max-w-lg">
      <DialogHeader><DialogTitle>Editar Fatura {fatura.numero}</DialogTitle></DialogHeader>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Cliente" className="col-span-2"><Input value={form.cliente} onChange={(e) => setForm({ ...form, cliente: e.target.value })} /></Field>
        <Field label="Vaga / Serviço" className="col-span-2"><Input value={form.servico} onChange={(e) => setForm({ ...form, servico: e.target.value })} /></Field>
        <Field label="Valor (R$)"><Input type="number" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} /></Field>
        <Field label="Data de pagamento"><Input type="date" value={form.vencimento} onChange={(e) => setForm({ ...form, vencimento: e.target.value })} /></Field>
        <Field label="Status" className="col-span-2">
          <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as FaturaStatus })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Pago">Pago</SelectItem>
              <SelectItem value="Pendente">Pendente</SelectItem>
              <SelectItem value="Atrasado">Atrasado</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Observações" className="col-span-2"><Textarea rows={3} value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} /></Field>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button
          className="bg-brand hover:bg-brand/90 text-brand-foreground"
          disabled={!form.cliente || !form.valor || saving}
          onClick={async () => {
            setSaving(true);
            try {
              await updateFatura(fatura.id, {
                cliente: form.cliente,
                servico: form.servico,
                valor: Number(form.valor),
                vencimento: form.vencimento,
                status: form.status,
                observacoes: form.observacoes,
              });
              toast.success("Fatura atualizada");
              onClose();
            } catch (e: any) {
              toast.error(e?.message ?? "Erro ao atualizar fatura");
            } finally {
              setSaving(false);
            }
          }}
        >Salvar alterações</Button>
      </DialogFooter>
    </DialogContent>
  );
}

const ANUNCIO_RE = /^\[Anúncios\] Candidaturas: (\d+) \| Visualizações: (\d+)\s*\n?/;
function parseAnuncio(obs: string): { candidaturas: string; visualizacoes: string; resto: string } {
  const m = obs?.match(ANUNCIO_RE);
  if (!m) return { candidaturas: "", visualizacoes: "", resto: obs ?? "" };
  return { candidaturas: m[1], visualizacoes: m[2], resto: obs.replace(ANUNCIO_RE, "") };
}
function buildObservacoes(form: CustoForm): string {
  const base = form.observacoes ?? "";
  if (form.categoria !== "Anúncios") return base;
  const c = form.candidaturas || "0";
  const v = form.visualizacoes || "0";
  return `[Anúncios] Candidaturas: ${c} | Visualizações: ${v}\n${base}`;
}

function NovoCustoModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState<CustoForm>({
    descricao: "", categoria: "Operacional", tipo: "Variável", valor: "", data: new Date().toISOString().slice(0, 10), status: "Pendente", fornecedor: "", observacoes: "", candidaturas: "", visualizacoes: "",
  });
  const [saving, setSaving] = useState(false);
  return (
    <DialogContent className="max-w-lg">
      <DialogHeader><DialogTitle>Novo Custo</DialogTitle></DialogHeader>
      <CustoFields form={form} setForm={setForm} />
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button
          className="bg-brand hover:bg-brand/90 text-brand-foreground"
          disabled={!form.descricao || !form.valor || saving}
          onClick={async () => {
            setSaving(true);
            try {
              await addCusto({
                descricao: form.descricao,
                categoria: form.categoria,
                tipo: form.tipo,
                valor: Number(form.valor),
                data: form.data,
                status: form.status,
                fornecedor: form.fornecedor || undefined,
                observacoes: buildObservacoes(form) || undefined,
              });
              toast.success("Custo registrado");
              onClose();
            } catch (e: any) {
              toast.error(e?.message ?? "Erro ao registrar custo");
            } finally {
              setSaving(false);
            }
          }}
        >Registrar custo</Button>
      </DialogFooter>
    </DialogContent>
  );
}

function EditCustoModal({ custo, onClose }: { custo: Custo; onClose: () => void }) {
  const parsed = parseAnuncio(custo.observacoes ?? "");
  const [form, setForm] = useState<CustoForm>({
    descricao: custo.descricao,
    categoria: custo.categoria,
    tipo: custo.tipo,
    valor: String(custo.valor),
    data: custo.data,
    status: custo.status,
    fornecedor: custo.fornecedor ?? "",
    observacoes: parsed.resto,
    candidaturas: parsed.candidaturas,
    visualizacoes: parsed.visualizacoes,
  });
  const [saving, setSaving] = useState(false);
  return (
    <DialogContent className="max-w-lg">
      <DialogHeader><DialogTitle>Editar Custo</DialogTitle></DialogHeader>
      <CustoFields form={form} setForm={setForm} />
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button
          className="bg-brand hover:bg-brand/90 text-brand-foreground"
          disabled={!form.descricao || !form.valor || saving}
          onClick={async () => {
            setSaving(true);
            try {
              await updateCusto(custo.id, {
                descricao: form.descricao,
                categoria: form.categoria,
                tipo: form.tipo,
                valor: Number(form.valor),
                data: form.data,
                status: form.status,
                fornecedor: form.fornecedor || undefined,
                observacoes: buildObservacoes(form) || undefined,
              });
              toast.success("Custo atualizado");
              onClose();
            } catch (e: any) {
              toast.error(e?.message ?? "Erro ao atualizar custo");
            } finally {
              setSaving(false);
            }
          }}
        >Salvar alterações</Button>
      </DialogFooter>
    </DialogContent>
  );
}

type CustoForm = {
  descricao: string; categoria: CustoCategoria; tipo: CustoTipo; valor: string; data: string; status: CustoStatus; fornecedor: string; observacoes: string; candidaturas?: string; visualizacoes?: string;
};

function CustoFields({ form, setForm }: { form: CustoForm; setForm: (f: CustoForm) => void }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Field label="Descrição" className="col-span-2">
        <Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
      </Field>
      <Field label="Categoria">
        <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v as CustoCategoria })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {CUSTO_CATEGORIAS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Tipo">
        <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v as CustoTipo })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Fixo">Fixo</SelectItem>
            <SelectItem value="Variável">Variável</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <Field label="Valor (R$)"><Input type="number" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} /></Field>
      <Field label="Data"><Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} /></Field>
      {form.categoria === "Anúncios" && (
        <>
          <Field label="Candidaturas"><Input type="number" min="0" value={form.candidaturas ?? ""} onChange={(e) => setForm({ ...form, candidaturas: e.target.value })} /></Field>
          <Field label="Visualizações"><Input type="number" min="0" value={form.visualizacoes ?? ""} onChange={(e) => setForm({ ...form, visualizacoes: e.target.value })} /></Field>
        </>
      )}
      <Field label="Fornecedor" className="col-span-2"><Input value={form.fornecedor} onChange={(e) => setForm({ ...form, fornecedor: e.target.value })} /></Field>
      <Field label="Status">
        <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as CustoStatus })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Pago">Pago</SelectItem>
            <SelectItem value="Pendente">Pendente</SelectItem>
            <SelectItem value="Atrasado">Atrasado</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <Field label="Observações" className="col-span-2"><Textarea rows={2} value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} /></Field>
    </div>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={`space-y-1.5 ${className}`}><Label className="text-xs">{label}</Label>{children}</div>;
}
