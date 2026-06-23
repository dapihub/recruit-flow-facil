import { createFileRoute, Link } from "@tanstack/react-router";
import {
  TrendingUp, TrendingDown, Briefcase, CheckSquare,
  Calendar, DollarSign, Clock, ArrowRight, Plus,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Header } from "@/components/layout/Header";
import { useHideValues } from "@/hooks/useHideValues";
import { useAuth } from "@/lib/auth";
import { fmtBRL } from "@/lib/utils";
import { useJobs } from "@/hooks/useJobs";
import { useTasks } from "@/hooks/useTasks";
import { useMeetings } from "@/hooks/useMeetings";
import { useCrmOpportunities, useCrmStages } from "@/hooks/useCrm";
import { useTransactions } from "@/hooks/useFinanceiro";
import { JobStatusBadge } from "@/components/ui/Badges";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { hidden } = useHideValues();
  const { profile } = useAuth();

  const firstName = profile?.name?.split(" ")[0] ?? "você";
  const today = format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  const todayCapitalized = today.charAt(0).toUpperCase() + today.slice(1);

  // Data hooks
  const { data: allJobs = [], isLoading: jobsLoading } = useJobs();
  const { data: myTasks = [], isLoading: tasksLoading } = useTasks(
    profile?.id ? { assignee_id: profile.id } : undefined
  );
  const { data: allMeetings = [], isLoading: meetingsLoading } = useMeetings();
  const { data: opportunities = [], isLoading: crmLoading } = useCrmOpportunities();
  const { data: stages = [] } = useCrmStages();
  const { data: transactions = [] } = useTransactions();

  // Derived data
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

  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const closedThisMonth = allJobs.filter((j) => {
    const d = new Date(j.updated_at);
    return j.status === "closed" && d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });

  // Financial KPIs
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

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Dashboard" subtitle="Visão geral do negócio" />

      <div className="flex-1 p-6 space-y-6">
        {/* Welcome banner */}
        <div
          className="rounded-xl px-5 py-4 flex items-center justify-between"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <div>
            <p className="text-base font-semibold" style={{ color: "var(--fg)" }}>
              Olá, {firstName}! 👋
            </p>
            <p className="text-sm mt-0.5" style={{ color: "var(--fg-muted)" }}>
              {todayCapitalized}
            </p>
          </div>
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
            style={{ background: "var(--accent)22", color: "var(--accent)" }}
          >
            {firstName.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Caixa Atual"
            value={fmtBRL(caixaAtual, hidden)}
            subtitle="Receitas pagas − despesas pagas"
            icon={<DollarSign className="w-4 h-4" />}
            trend="neutral"
          />
          <KpiCard
            label="Receitas Pendentes"
            value={fmtBRL(pendingIncome, hidden)}
            subtitle="A receber no período"
            icon={<TrendingUp className="w-4 h-4" />}
            trend="up"
          />
          <KpiCard
            label="Despesas Pendentes"
            value={fmtBRL(pendingExpense, hidden)}
            subtitle="A pagar no período"
            icon={<TrendingDown className="w-4 h-4" />}
            trend="down"
          />
          <KpiCard
            label="Saldo Projetado"
            value={fmtBRL(saldoProjetado, hidden)}
            subtitle="Após pendentes liquidarem"
            icon={<TrendingUp className="w-4 h-4" />}
            trend="neutral"
          />
        </div>

        {/* Main widgets grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Widget
            title="Vagas Abertas"
            count={openJobs.length}
            icon={<Briefcase className="w-4 h-4" />}
            linkTo="/vagas"
          >
            {jobsLoading ? (
              <WidgetSkeleton />
            ) : openJobs.length === 0 ? (
              <EmptyWidget message="Nenhuma vaga em aberto" action="Criar vaga" linkTo="/vagas" />
            ) : (
              <ul>
                {openJobs.slice(0, 5).map((job) => (
                  <li
                    key={job.id}
                    className="flex items-center justify-between py-2"
                    style={{ borderBottom: "1px solid var(--border)" }}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="text-sm font-medium truncate" style={{ color: "var(--fg)" }}>
                        {job.title}
                      </p>
                      {job.client && (
                        <p className="text-xs truncate" style={{ color: "var(--fg-muted)" }}>
                          {job.client.name}
                        </p>
                      )}
                    </div>
                    <JobStatusBadge status={job.status} />
                  </li>
                ))}
              </ul>
            )}
          </Widget>

          <Widget
            title="Minhas Tarefas"
            count={pendingTasks.length}
            icon={<CheckSquare className="w-4 h-4" />}
            linkTo="/tarefas"
          >
            {tasksLoading ? (
              <WidgetSkeleton />
            ) : pendingTasks.length === 0 ? (
              <EmptyWidget message="Nenhuma tarefa pendente" action="Criar tarefa" linkTo="/tarefas" />
            ) : (
              <ul>
                {pendingTasks.map((task) => (
                  <li
                    key={task.id}
                    className="flex items-center justify-between py-2"
                    style={{ borderBottom: "1px solid var(--border)" }}
                  >
                    <p className="text-sm truncate flex-1 pr-2" style={{ color: "var(--fg)" }}>
                      {task.title}
                    </p>
                    {task.due_date && (
                      <span className="text-xs shrink-0" style={{ color: "var(--fg-muted)" }}>
                        {format(new Date(task.due_date), "dd/MM")}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Widget>

          <Widget
            title="Próximas Reuniões"
            count={upcomingMeetings.length}
            icon={<Calendar className="w-4 h-4" />}
            linkTo="/reunioes"
          >
            {meetingsLoading ? (
              <WidgetSkeleton />
            ) : upcomingMeetings.length === 0 ? (
              <EmptyWidget message="Nenhuma reunião agendada" action="Agendar reunião" linkTo="/reunioes" />
            ) : (
              <ul>
                {upcomingMeetings.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center justify-between py-2"
                    style={{ borderBottom: "1px solid var(--border)" }}
                  >
                    <p className="text-sm truncate flex-1 pr-2" style={{ color: "var(--fg)" }}>
                      {m.title}
                    </p>
                    <span className="text-xs shrink-0" style={{ color: "var(--fg-muted)" }}>
                      {format(new Date(m.scheduled_at), "dd/MM HH:mm")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Widget>
        </div>

        {/* Bottom widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Widget title="Funil de Vendas (CRM)" icon={<TrendingUp className="w-4 h-4" />} linkTo="/crm">
            {crmLoading ? (
              <WidgetSkeleton />
            ) : topOpportunities.length === 0 ? (
              <EmptyWidget message="Sem oportunidades no funil" action="Adicionar oportunidade" linkTo="/crm" />
            ) : (
              <>
                <ul>
                  {topOpportunities.map((opp) => {
                    const stage = stages.find((s) => s.id === opp.stage_id);
                    return (
                      <li
                        key={opp.id}
                        className="flex items-center justify-between py-2"
                        style={{ borderBottom: "1px solid var(--border)" }}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                          {stage && (
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ background: stage.color }}
                            />
                          )}
                          <p className="text-sm truncate" style={{ color: "var(--fg)" }}>
                            {opp.title}
                          </p>
                        </div>
                        <span className="text-sm font-medium shrink-0" style={{ color: "var(--fg-muted)" }}>
                          {fmtBRL(opp.value ?? 0, hidden)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <div
                  className="flex items-center justify-between pt-2 mt-1"
                  style={{ borderTop: "1px solid var(--border)" }}
                >
                  <span className="text-xs" style={{ color: "var(--fg-muted)" }}>
                    Forecast total
                  </span>
                  <span className="text-sm font-semibold" style={{ color: "var(--accent)" }}>
                    {fmtBRL(forecast, hidden)}
                  </span>
                </div>
              </>
            )}
          </Widget>

          <div className="space-y-4">
            <div
              className="rounded-xl p-4 flex items-center gap-4"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "var(--accent)18", color: "var(--accent)" }}>
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs" style={{ color: "var(--fg-muted)" }}>Vagas fechadas este mês</p>
                <p className="text-2xl font-bold" style={{ color: "var(--fg)" }}>{closedThisMonth.length}</p>
              </div>
            </div>

            <div
              className="rounded-xl p-4"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
            >
              <p className="text-xs font-semibold mb-3 uppercase tracking-wide" style={{ color: "var(--fg-muted)" }}>
                Atalhos rápidos
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Nova vaga", to: "/vagas" },
                  { label: "Nova tarefa", to: "/tarefas" },
                  { label: "Nova receita", to: "/financeiro" },
                  { label: "Novo cliente", to: "/clientes" },
                ].map((a) => (
                  <Link
                    key={a.to}
                    to={a.to}
                    className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg transition-colors"
                    style={{
                      background: "var(--bg)",
                      border: "1px solid var(--border)",
                      color: "var(--fg-muted)",
                    }}
                  >
                    <Plus className="w-3 h-3" />
                    {a.label}
                  </Link>
                ))}
              </div>
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
  const trendColor = trend === "up" ? "var(--success)" : trend === "down" ? "var(--destructive)" : "var(--accent)";
  return (
    <div
      className="rounded-xl p-4"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs" style={{ color: "var(--fg-muted)" }}>{label}</p>
        <span style={{ color: trendColor }}>{icon}</span>
      </div>
      <p className="text-xl font-bold" style={{ color: "var(--fg)" }}>{value}</p>
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
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
    >
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
              style={{ background: "var(--bg)", color: "var(--fg-muted)" }}
            >
              {count}
            </span>
          )}
        </div>
        <Link to={linkTo} className="flex items-center gap-1 text-xs hover:underline" style={{ color: "var(--accent)" }}>
          Ver tudo <ArrowRight className="w-3 h-3" />
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
