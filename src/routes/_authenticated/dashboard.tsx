import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  TrendingUp, TrendingDown, Briefcase, CheckSquare,
  Calendar, DollarSign, Clock, ArrowRight, Plus, Target,
  Users, Package, ShoppingBag, ShoppingCart,
} from "lucide-react";
import { format, subMonths, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import { Header } from "@/components/layout/Header";
import { useHideValues } from "@/hooks/useHideValues";
import { useAuth } from "@/lib/auth";
import { fmtBRL } from "@/lib/utils";
import { useJobs } from "@/hooks/useJobs";
import { useTasks } from "@/hooks/useTasks";
import { useMeetings } from "@/hooks/useMeetings";
import { useCrmOpportunities, useCrmStages } from "@/hooks/useCrm";
import { useTransactions } from "@/hooks/useFinanceiro";
import { useProducts } from "@/hooks/useProducts";
import { usePurchaseOrders, useSalesOrders } from "@/hooks/useOrders";
import { JobStatusBadge } from "@/components/ui/Badges";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { hidden } = useHideValues();
  const { profile, user } = useAuth();

  const rawName = profile?.name || (user?.user_metadata?.name as string | undefined) || "";
  const firstName = rawName.split(" ")[0] || "você";
  const today = format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  const todayCapitalized = today.charAt(0).toUpperCase() + today.slice(1);

  const { data: allJobs = [], isLoading: jobsLoading } = useJobs();
  const { data: myTasks = [], isLoading: tasksLoading } = useTasks(
    profile?.id ? { assignee_id: profile.id } : undefined
  );
  const { data: allMeetings = [], isLoading: meetingsLoading } = useMeetings();
  const { data: opportunities = [], isLoading: crmLoading } = useCrmOpportunities();
  const { data: stages = [] } = useCrmStages();
  const { data: transactions = [] } = useTransactions();

  const { data: products = [] } = useProducts({ includeInactive: false });
  const { data: purchaseOrders = [] } = usePurchaseOrders();
  const { data: salesOrders = [] } = useSalesOrders();

  const lowStockProducts = products.filter((p) => p.current_stock <= p.min_stock).slice(0, 5);
  const openPurchases = purchaseOrders.filter((o) => o.status === "draft" || o.status === "sent");
  const openSales = salesOrders.filter((o) => o.status === "draft" || o.status === "confirmed");
  const salesThisMonthValue = salesOrders
    .filter((o) => {
      const d = new Date(o.order_date);
      return o.status !== "cancelled" && d.getMonth() === new Date().getMonth() && d.getFullYear() === new Date().getFullYear();
    })
    .reduce((s, o) => s + o.total, 0);

  const openJobs = allJobs.filter((j) =>
    ["open", "screening", "interviewing", "proposal"].includes(j.status)
  );
  const pendingTasks = myTasks.filter((t) => t.status !== "done").slice(0, 5);

  const now = new Date();
  const upcomingMeetings = allMeetings
    .filter((m) => m.status === "scheduled" && new Date(m.scheduled_at) >= now)
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
    .slice(0, 3);

  const openOpportunities = opportunities.filter((o) => {
    const stage = stages.find((s) => s.id === o.stage_id);
    return !stage?.is_final;
  });
  const topOpportunities = openOpportunities.slice(0, 4);
  const forecast = openOpportunities.reduce(
    (sum, o) => sum + ((o.value ?? 0) * (o.probability / 100)),
    0
  );
  const pipelineTotal = openOpportunities.reduce((s, o) => s + (o.value ?? 0), 0);

  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const closedThisMonth = allJobs.filter((j) => {
    const d = new Date(j.updated_at);
    return j.status === "closed" && d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });

  const paidIncome = transactions
    .filter((t) => t.type === "income" && t.status === "paid")
    .reduce((s, t) => s + t.amount, 0);
  const paidExpense = transactions
    .filter((t) => t.type === "expense" && t.status === "paid")
    .reduce((s, t) => s + t.amount, 0);
  const pendingIncome = transactions
    .filter((t) => t.type === "income" && (t.status === "pending" || t.status === "overdue"))
    .reduce((s, t) => s + t.amount, 0);
  const pendingExpense = transactions
    .filter((t) => t.type === "expense" && (t.status === "pending" || t.status === "overdue"))
    .reduce((s, t) => s + t.amount, 0);
  const caixaAtual = paidIncome - paidExpense;
  const saldoProjetado = caixaAtual + pendingIncome - pendingExpense;

  // Last 6 months cash flow chart data
  const monthlyData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(startOfMonth(now), 5 - i);
      const m = date.getMonth();
      const y = date.getFullYear();
      const receitas = transactions
        .filter((t) => {
          const d = new Date(t.date ?? t.created_at);
          return t.type === "income" && t.status === "paid" && d.getMonth() === m && d.getFullYear() === y;
        })
        .reduce((s, t) => s + t.amount, 0);
      const despesas = transactions
        .filter((t) => {
          const d = new Date(t.date ?? t.created_at);
          return t.type === "expense" && t.status === "paid" && d.getMonth() === m && d.getFullYear() === y;
        })
        .reduce((s, t) => s + t.amount, 0);
      return {
        mes: format(date, "MMM", { locale: ptBR }),
        Receitas: receitas,
        Despesas: despesas,
      };
    });
  }, [transactions]);

  // Last 5 paid transactions
  const lastPaid = useMemo(
    () =>
      [...transactions]
        .filter((t) => t.status === "paid")
        .sort((a, b) => new Date(b.date ?? b.created_at).getTime() - new Date(a.date ?? a.created_at).getTime())
        .slice(0, 5),
    [transactions]
  );

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Dashboard" subtitle="Visão geral do negócio" />

      <div className="flex-1 p-6 space-y-6">
        {/* Hero / Welcome */}
        <div
          className="relative overflow-hidden rounded-2xl px-6 py-5 flex items-center justify-between"
          style={{
            background: "var(--gradient-hero)",
            border: "1px solid color-mix(in srgb, var(--accent) 24%, var(--border))",
            boxShadow: "var(--shadow-elegant)",
          }}
        >
          <div
            className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-40 blur-3xl pointer-events-none"
            style={{ background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)" }}
          />
          <div className="relative">
            <span className="section-title">Painel executivo</span>
            <p className="font-display text-3xl mt-1" style={{ color: "var(--fg)" }}>
              Olá, {firstName}
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--fg-muted)" }}>
              {todayCapitalized}
            </p>
          </div>
          <div
            className="relative w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold text-white shrink-0"
            style={{
              background: "linear-gradient(135deg, #4f46e5 0%, #1e1e5a 100%)",
              boxShadow: "0 10px 30px -10px rgba(79,70,229,.55)",
            }}
          >
            {firstName.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* KPI band */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Caixa Atual" value={fmtBRL(caixaAtual, hidden)} subtitle="Receitas − despesas pagas" icon={<DollarSign className="w-4 h-4" />} trend="neutral" />
          <KpiCard label="A Receber" value={fmtBRL(pendingIncome, hidden)} subtitle="Receitas pendentes" icon={<TrendingUp className="w-4 h-4" />} trend="up" />
          <KpiCard label="A Pagar" value={fmtBRL(pendingExpense, hidden)} subtitle="Despesas pendentes" icon={<TrendingDown className="w-4 h-4" />} trend="down" />
          <KpiCard label="Saldo Projetado" value={fmtBRL(saldoProjetado, hidden)} subtitle="Após liquidações" icon={<TrendingUp className="w-4 h-4" />} trend="neutral" />
        </div>

        {/* ─── Bento: Finance + CRM + Shortcuts ─── */}
        <div className="bento">
          {/* Fluxo de caixa — hero chart */}
          <div className="b-8 surface surface-hover p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="section-title">Fluxo de caixa</span>
                <p className="font-display text-lg mt-0.5" style={{ color: "var(--fg)" }}>Últimos 6 meses</p>
              </div>
              <Link to="/financeiro" className="text-xs hover:underline" style={{ color: "var(--accent)" }}>
                Ver financeiro →
              </Link>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={monthlyData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "var(--fg-muted)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "var(--fg-muted)" }} axisLine={false} tickLine={false} tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toString())} width={40} />
                <Tooltip formatter={(value: number) => fmtBRL(value, hidden)} contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12, color: "var(--fg)" }} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} formatter={(v) => <span style={{ color: "var(--fg-muted)" }}>{v}</span>} />
                <Line type="monotone" dataKey="Receitas" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3, fill: "#10b981" }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="Despesas" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 3, fill: "#ef4444" }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Pipeline CRM highlight */}
          <div className="b-4 surface surface-hover p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "color-mix(in srgb, var(--accent) 12%, transparent)", color: "var(--accent)" }}>
                  <Target className="w-4 h-4" />
                </div>
                <span className="section-title">Pipeline CRM</span>
              </div>
              <p className="font-display text-3xl" style={{ color: "var(--fg)" }}>{fmtBRL(pipelineTotal, hidden)}</p>
              <p className="text-xs mt-1" style={{ color: "var(--fg-muted)" }}>
                {openOpportunities.length} {openOpportunities.length === 1 ? "oportunidade" : "oportunidades"} · forecast {fmtBRL(forecast, hidden)}
              </p>
            </div>
            <Link to="/crm" className="mt-4 inline-flex items-center gap-1 text-xs font-medium" style={{ color: "var(--accent)" }}>
              Abrir funil <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Últimas operações */}
          <div className="b-4 surface p-0 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
              <span className="section-title">Últimas operações</span>
              <Link to="/financeiro" className="text-xs hover:underline" style={{ color: "var(--accent)" }}>Ver</Link>
            </div>
            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              {lastPaid.length === 0 ? (
                <p className="px-4 py-8 text-xs text-center" style={{ color: "var(--fg-muted)" }}>Nenhuma operação paga</p>
              ) : (
                lastPaid.map((t) => (
                  <div key={t.id} className="flex items-center justify-between px-5 py-2.5">
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="text-xs font-medium truncate" style={{ color: "var(--fg)" }}>{t.description}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: "var(--fg-muted)" }}>{format(new Date(t.date ?? t.created_at), "dd/MM/yyyy")}</p>
                    </div>
                    <span className="text-xs font-semibold shrink-0" style={{ color: t.type === "income" ? "#10b981" : "#ef4444" }}>
                      {t.type === "income" ? "+" : "-"}{fmtBRL(t.amount, hidden)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Vagas fechadas */}
          <div className="b-3 surface surface-hover p-5 flex items-center gap-4">

            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "color-mix(in srgb, var(--accent) 12%, transparent)", color: "var(--accent)" }}>
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="section-title">Fechadas no mês</span>
              <p className="font-display text-2xl mt-0.5" style={{ color: "var(--fg)" }}>{closedThisMonth.length}</p>
            </div>
          </div>

          {/* Atalhos rápidos */}
          <div className="b-9 surface p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="section-title">Atalhos rápidos</span>
              <span className="text-[10px]" style={{ color: "var(--fg-muted)" }}>Ações frequentes</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              {[
                { label: "Nova vaga",   to: "/vagas",      icon: Briefcase,    color: "#6366f1" },
                { label: "Nova tarefa", to: "/tarefas",    icon: CheckSquare,  color: "#f59e0b" },
                { label: "Nova receita",to: "/financeiro", icon: DollarSign,   color: "#10b981" },
                { label: "Novo cliente",to: "/clientes",   icon: Users,        color: "#3b82f6" },
                { label: "Novo produto",to: "/produtos",   icon: Package,      color: "#8b5cf6" },
                { label: "Nova venda",  to: "/vendas",     icon: ShoppingBag,  color: "#06b6d4" },
              ].map((a) => (
                <Link key={a.to} to={a.to}
                  className="group flex items-center gap-2 text-xs px-3 py-2.5 rounded-xl transition-all duration-150 hover:-translate-y-0.5"
                  style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg)" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = a.color + "66"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}
                >
                  <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: a.color + "1a", color: a.color }}>
                    <a.icon className="w-3.5 h-3.5" />
                  </span>
                  <span className="truncate">{a.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Bento: Operação diária ─── */}
        <div>
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <span className="section-title">Operação diária</span>
              <p className="font-display text-xl mt-0.5" style={{ color: "var(--fg)" }}>Fluxo de trabalho</p>
            </div>
          </div>
          <div className="bento">
            <div className="b-4">
              <Widget title="Vagas Abertas" count={openJobs.length} icon={<Briefcase className="w-4 h-4" />} linkTo="/vagas">
                {jobsLoading ? <WidgetSkeleton /> : openJobs.length === 0 ? (
                  <EmptyWidget message="Nenhuma vaga em aberto" action="Criar vaga" linkTo="/vagas" />
                ) : (
                  <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
                    {openJobs.slice(0, 5).map((job) => (
                      <li key={job.id} className="flex items-center justify-between py-2">
                        <div className="min-w-0 flex-1 pr-2">
                          <p className="text-sm font-medium truncate" style={{ color: "var(--fg)" }}>{job.title}</p>
                          {job.client && <p className="text-xs truncate" style={{ color: "var(--fg-muted)" }}>{job.client.name}</p>}
                        </div>
                        <JobStatusBadge status={job.status} />
                      </li>
                    ))}
                  </ul>
                )}
              </Widget>
            </div>

            <div className="b-4">
              <Widget title="Minhas Tarefas" count={pendingTasks.length} icon={<CheckSquare className="w-4 h-4" />} linkTo="/tarefas">
                {tasksLoading ? <WidgetSkeleton /> : pendingTasks.length === 0 ? (
                  <EmptyWidget message="Nenhuma tarefa pendente" action="Criar tarefa" linkTo="/tarefas" />
                ) : (
                  <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
                    {pendingTasks.map((task) => (
                      <li key={task.id} className="flex items-center justify-between py-2">
                        <p className="text-sm truncate flex-1 pr-2" style={{ color: "var(--fg)" }}>{task.title}</p>
                        {task.due_date && <span className="text-xs shrink-0" style={{ color: "var(--fg-muted)" }}>{format(new Date(task.due_date), "dd/MM")}</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </Widget>
            </div>

            <div className="b-4">
              <Widget title="Próximas Reuniões" count={upcomingMeetings.length} icon={<Calendar className="w-4 h-4" />} linkTo="/reunioes">
                {meetingsLoading ? <WidgetSkeleton /> : upcomingMeetings.length === 0 ? (
                  <EmptyWidget message="Nenhuma reunião agendada" action="Agendar reunião" linkTo="/reunioes" />
                ) : (
                  <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
                    {upcomingMeetings.map((m) => (
                      <li key={m.id} className="flex items-center justify-between py-2">
                        <p className="text-sm truncate flex-1 pr-2" style={{ color: "var(--fg)" }}>{m.title}</p>
                        <span className="text-xs shrink-0" style={{ color: "var(--fg-muted)" }}>{format(new Date(m.scheduled_at), "dd/MM HH:mm")}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Widget>
            </div>

            <div className="b-8">
              <Widget title="Funil de Vendas (CRM)" icon={<TrendingUp className="w-4 h-4" />} linkTo="/crm">
                {crmLoading ? <WidgetSkeleton /> : topOpportunities.length === 0 ? (
                  <EmptyWidget message="Sem oportunidades no funil" action="Adicionar oportunidade" linkTo="/crm" />
                ) : (
                  <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
                    {topOpportunities.map((opp) => {
                      const stage = stages.find((s) => s.id === opp.stage_id);
                      return (
                        <li key={opp.id} className="flex items-center justify-between py-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                            {stage && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: stage.color }} />}
                            <p className="text-sm truncate" style={{ color: "var(--fg)" }}>{opp.title}</p>
                          </div>
                          <span className="text-sm font-medium shrink-0" style={{ color: "var(--fg-muted)" }}>{fmtBRL(opp.value ?? 0, hidden)}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Widget>
            </div>

            <div className="b-4 surface surface-hover p-5 flex flex-col justify-center">
              <span className="section-title">Vendas do mês</span>
              <p className="font-display text-3xl mt-1" style={{ color: "var(--fg)" }}>{fmtBRL(salesThisMonthValue, hidden)}</p>
              <p className="text-xs mt-1" style={{ color: "var(--fg-muted)" }}>Não canceladas</p>
              <Link to="/vendas" className="mt-4 inline-flex items-center gap-1 text-xs font-medium" style={{ color: "var(--accent)" }}>
                Ver pedidos <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* ─── Bento: ERP Suprimentos & Vendas ─── */}
        <div>
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <span className="section-title">ERP · Suprimentos e vendas</span>
              <p className="font-display text-xl mt-0.5" style={{ color: "var(--fg)" }}>Operação comercial</p>
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <KpiCard label="Produtos ativos" value={String(products.length)} subtitle={`${lowStockProducts.length} abaixo do mínimo`} icon={<Package className="w-4 h-4" />} trend={lowStockProducts.length > 0 ? "down" : "neutral"} />
            <KpiCard label="Pedidos de compra" value={String(openPurchases.length)} subtitle="Em aberto" icon={<ShoppingCart className="w-4 h-4" />} trend="neutral" />
            <KpiCard label="Pedidos de venda" value={String(openSales.length)} subtitle="Em aberto" icon={<ShoppingBag className="w-4 h-4" />} trend="up" />
            <KpiCard label="Vendas do mês" value={fmtBRL(salesThisMonthValue, hidden)} subtitle="Não canceladas" icon={<TrendingUp className="w-4 h-4" />} trend="up" />
          </div>

          <div className="bento">
            <div className="b-4">
              <Widget title="Estoque Crítico" count={lowStockProducts.length} icon={<Package className="w-4 h-4" />} linkTo="/produtos">
                {lowStockProducts.length === 0 ? (
                  <EmptyWidget message="Nenhum produto abaixo do mínimo" action="Ver produtos" linkTo="/produtos" />
                ) : (
                  <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
                    {lowStockProducts.map((p) => (
                      <li key={p.id} className="flex items-center justify-between py-2">
                        <div className="min-w-0 flex-1 pr-2">
                          <p className="text-sm font-medium truncate" style={{ color: "var(--fg)" }}>{p.name}</p>
                          <p className="text-[10px] font-mono" style={{ color: "var(--fg-muted)" }}>{p.sku}</p>
                        </div>
                        <span className="text-xs font-semibold shrink-0" style={{ color: "#ef4444" }}>
                          {p.current_stock} / {p.min_stock} {p.unit}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Widget>
            </div>

            <div className="b-4">
              <Widget title="Compras em Aberto" count={openPurchases.length} icon={<ShoppingCart className="w-4 h-4" />} linkTo="/compras">
                {openPurchases.length === 0 ? (
                  <EmptyWidget message="Nenhum pedido em aberto" action="Novo pedido" linkTo="/compras" />
                ) : (
                  <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
                    {openPurchases.slice(0, 5).map((o) => (
                      <li key={o.id} className="flex items-center justify-between py-2">
                        <div className="min-w-0 flex-1 pr-2">
                          <p className="text-xs font-mono" style={{ color: "var(--fg-muted)" }}>{o.number}</p>
                          <p className="text-sm truncate" style={{ color: "var(--fg)" }}>{o.supplier?.name ?? "—"}</p>
                        </div>
                        <span className="text-xs font-semibold shrink-0" style={{ color: "var(--fg)" }}>{fmtBRL(o.total, hidden)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Widget>
            </div>

            <div className="b-4">
              <Widget title="Vendas em Aberto" count={openSales.length} icon={<ShoppingBag className="w-4 h-4" />} linkTo="/vendas">
                {openSales.length === 0 ? (
                  <EmptyWidget message="Nenhum pedido em aberto" action="Novo pedido" linkTo="/vendas" />
                ) : (
                  <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
                    {openSales.slice(0, 5).map((o) => (
                      <li key={o.id} className="flex items-center justify-between py-2">
                        <div className="min-w-0 flex-1 pr-2">
                          <p className="text-xs font-mono" style={{ color: "var(--fg-muted)" }}>{o.number}</p>
                          <p className="text-sm truncate" style={{ color: "var(--fg)" }}>{o.client?.name ?? "—"}</p>
                        </div>
                        <span className="text-xs font-semibold shrink-0" style={{ color: "var(--fg)" }}>{fmtBRL(o.total, hidden)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Widget>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, subtitle, icon, trend }: {
  label: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  trend: "up" | "down" | "neutral";
}) {
  const trendColor = trend === "up" ? "#10b981" : trend === "down" ? "#ef4444" : "var(--accent-2)";
  return (
    <div className="surface surface-hover p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="section-title">{label}</span>
        <span className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `color-mix(in srgb, ${trendColor} 12%, transparent)`, color: trendColor }}>{icon}</span>
      </div>
      <p className="font-display text-2xl" style={{ color: "var(--fg)" }}>{value}</p>
      {subtitle && (
        <p className="text-[11px] mt-1" style={{ color: "var(--fg-muted)" }}>{subtitle}</p>
      )}
    </div>
  );
}

function Widget({ title, count, icon, linkTo, children }: {
  title: string; count?: number; icon: React.ReactNode;
  linkTo: string; children: React.ReactNode;
}) {
  return (
    <div className="surface overflow-hidden h-full">
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-2">
          <span style={{ color: "var(--accent)" }}>{icon}</span>
          <p className="text-sm font-medium" style={{ color: "var(--fg)" }}>{title}</p>
          {count !== undefined && (
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
              style={{ background: "color-mix(in srgb, var(--accent) 10%, transparent)", color: "var(--accent)" }}
            >
              {count}
            </span>
          )}
        </div>
        <Link to={linkTo} className="flex items-center gap-1 text-xs hover:underline" style={{ color: "var(--accent)" }}>
          Ver <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="px-4 pb-2">{children}</div>
    </div>
  );
}

function EmptyWidget({ message, action, linkTo }: { message: string; action: string; linkTo: string }) {
  return (
    <div className="text-center py-4">
      <p className="text-sm mb-3" style={{ color: "var(--fg-muted)" }}>{message}</p>
      <Link
        to={linkTo}
        className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition-colors"
        style={{ background: "var(--accent)", color: "#fff" }}
      >
        <Plus className="w-3 h-3" /> {action}
      </Link>
    </div>
  );
}

function WidgetSkeleton() {
  return (
    <div className="space-y-2 py-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-9 rounded animate-pulse" style={{ background: "var(--border)" }} />
      ))}
    </div>
  );
}
