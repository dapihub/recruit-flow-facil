import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format, startOfMonth, subMonths, isSameMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Header } from "@/components/layout/Header";
import { PageKpis, KpiItem } from "@/components/layout/PageKpis";
import { TransacaoForm } from "@/components/financeiro/TransacaoForm";
import { FolhaForm } from "@/components/financeiro/FolhaForm";
import { EmptyState } from "@/components/ui/EmptyState";
import { useHideValues } from "@/hooks/useHideValues";
import { fmtBRL, fmtDate } from "@/lib/utils";
import {
  useTransactions,
  useDeleteTransaction,
  usePayroll,
  useDeletePayrollEntry,
  type Transaction,
  type PayrollEntry,
} from "@/hooks/useFinanceiro";

export const Route = createFileRoute("/_authenticated/financeiro")({
  component: FinanceiroPage,
});

const TABS = ["Operações", "Folha", "Custos Previstos", "Análise Gráfica"] as const;
type Tab = (typeof TABS)[number];

function FinanceiroPage() {
  const { hidden } = useHideValues();
  const [activeTab, setActiveTab] = useState<Tab>("Operações");

  const { data: transactions = [], isLoading: txLoading } = useTransactions();
  const { data: payroll = [], isLoading: payLoading } = usePayroll();

  // KPI computation
  const paidIncome = transactions
    .filter((t) => t.type === "income" && t.status === "paid")
    .reduce((s, t) => s + t.amount, 0);
  const paidExpense = transactions
    .filter((t) => t.type === "expense" && t.status === "paid")
    .reduce((s, t) => s + t.amount, 0);
  const pendingIncome = transactions
    .filter((t) => t.type === "income" && t.status === "pending")
    .reduce((s, t) => s + t.amount, 0);
  const pendingExpense = transactions
    .filter((t) => t.type === "expense" && t.status === "pending")
    .reduce((s, t) => s + t.amount, 0);
  const caixa = paidIncome - paidExpense;
  const saldoProjetado = caixa + pendingIncome - pendingExpense;

  return (
    <div className="flex flex-col min-h-full">
      <Header
        title="Financeiro"
        actions={
          activeTab === "Operações" ? (
            <OperacoesActions />
          ) : activeTab === "Folha" ? (
            <FolhaActions />
          ) : null
        }
      />

      <PageKpis>
        <KpiItem label="Caixa Atual" value={fmtBRL(caixa, hidden)} accent={caixa >= 0} />
        <KpiItem label="Receitas Pendentes" value={fmtBRL(pendingIncome, hidden)} />
        <KpiItem label="Despesas Pendentes" value={fmtBRL(pendingExpense, hidden)} />
        <KpiItem label="Saldo Projetado" value={fmtBRL(saldoProjetado, hidden)} />
      </PageKpis>

      {/* Tabs */}
      <div
        className="flex gap-0 px-6 shrink-0"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-4 py-2.5 text-sm font-medium transition-colors -mb-px"
            style={
              activeTab === tab
                ? {
                    borderBottom: "2px solid var(--accent)",
                    color: "var(--accent)",
                  }
                : { color: "var(--fg-muted)" }
            }
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 p-6">
        {activeTab === "Operações" && (
          <OperacoesTab
            transactions={transactions}
            loading={txLoading}
            hidden={hidden}
          />
        )}
        {activeTab === "Folha" && (
          <FolhaTab payroll={payroll} loading={payLoading} hidden={hidden} />
        )}
        {activeTab === "Custos Previstos" && (
          <CustosPrevistosTab transactions={transactions} hidden={hidden} />
        )}
        {activeTab === "Análise Gráfica" && (
          <AnaliseTab transactions={transactions} hidden={hidden} />
        )}
      </div>
    </div>
  );
}

// ─── Tab: Operações ───────────────────────────────────────────

function exportTxCSV(rows: Transaction[]) {
  const header = ["Data", "Descrição", "Tipo", "Categoria", "Cliente", "Valor (R$)", "Status"];
  const lines = rows.map((t) =>
    [
      t.date,
      t.description,
      t.type === "income" ? "Receita" : "Despesa",
      t.category?.name ?? "",
      t.client?.name ?? "",
      t.amount,
      t.status,
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",")
  );
  const csv = [header.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "financeiro.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function OperacoesActions() {
  const [despesaOpen, setDespesaOpen] = useState(false);
  const [receitaOpen, setReceitaOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setDespesaOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium"
        style={{ border: "1px solid #ef4444", color: "#ef4444", background: "transparent" }}
      >
        <Plus className="w-4 h-4" /> Despesa
      </button>
      <button
        onClick={() => setReceitaOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium"
        style={{ background: "#10b981", color: "#fff" }}
      >
        <Plus className="w-4 h-4" /> Receita
      </button>
      <TransacaoForm
        key="new-expense"
        open={despesaOpen}
        onClose={() => setDespesaOpen(false)}
        defaultType="expense"
      />
      <TransacaoForm
        key="new-income"
        open={receitaOpen}
        onClose={() => setReceitaOpen(false)}
        defaultType="income"
      />
    </>
  );
}

function OperacoesTab({
  transactions,
  loading,
  hidden,
}: {
  transactions: Transaction[];
  loading: boolean;
  hidden: boolean;
}) {
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">(
    "all"
  );
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const deleteTx = useDeleteTransaction();

  const filtered = transactions.filter((t) =>
    typeFilter === "all" ? true : t.type === typeFilter
  );

  if (loading) return <TableSkeleton />;

  return (
    <>
      {/* Filter */}
      <div className="flex items-center gap-2 mb-4">
        {(
          [
            ["all", "Todos"],
            ["income", "Receitas"],
            ["expense", "Despesas"],
          ] as const
        ).map(([v, l]) => (
          <button
            key={v}
            onClick={() => setTypeFilter(v)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={
              typeFilter === v
                ? { background: "var(--accent)", color: "#fff" }
                : {
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    color: "var(--fg-muted)",
                  }
            }
          >
            {l}
          </button>
        ))}
        <button
          onClick={() => exportTxCSV(filtered)}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{ border: "1px solid var(--border)", color: "var(--fg-muted)", background: "var(--bg-card)" }}
          title="Exportar CSV"
        >
          <Download className="w-3.5 h-3.5" /> Exportar
        </button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={DollarSign}
          title="Nenhuma movimentação"
          description="Registre receitas e despesas para acompanhar o financeiro."
        />
      ) : (
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: "1px solid var(--border)" }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr
                style={{
                  background: "var(--bg-card)",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                {["Data", "Descrição", "Categoria", "Cliente", "Status", "Valor", ""].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-medium"
                      style={{ color: "var(--fg-muted)" }}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((tx, i) => (
                <tr
                  key={tx.id}
                  style={{
                    background: i % 2 === 0 ? "var(--bg)" : "var(--bg-card)",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <td
                    className="px-4 py-3 text-xs whitespace-nowrap"
                    style={{ color: "var(--fg-muted)" }}
                  >
                    {fmtDate(tx.date)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-1.5 h-4 rounded-full shrink-0"
                        style={{
                          background:
                            tx.type === "income" ? "#10b981" : "#ef4444",
                        }}
                      />
                      <span
                        className="font-medium"
                        style={{ color: "var(--fg)" }}
                      >
                        {tx.description}
                      </span>
                    </div>
                  </td>
                  <td
                    className="px-4 py-3 text-xs"
                    style={{ color: "var(--fg-muted)" }}
                  >
                    {tx.category ? (
                      <span
                        className="px-2 py-0.5 rounded-full"
                        style={{
                          background: tx.category.color + "22",
                          color: tx.category.color,
                        }}
                      >
                        {tx.category.name}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td
                    className="px-4 py-3 text-xs"
                    style={{ color: "var(--fg-muted)" }}
                  >
                    {tx.client?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={tx.status} />
                  </td>
                  <td
                    className="px-4 py-3 text-sm font-semibold whitespace-nowrap"
                    style={{
                      color: tx.type === "income" ? "#10b981" : "#ef4444",
                    }}
                  >
                    {tx.type === "expense" ? "- " : ""}
                    {fmtBRL(tx.amount, hidden)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => setEditTx(tx)}
                        className="p-1.5 rounded-lg hover:opacity-80"
                        style={{ color: "var(--fg-muted)" }}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (!confirm("Remover este lançamento?")) return;
                          deleteTx.mutate(tx.id);
                        }}
                        className="p-1.5 rounded-lg hover:opacity-80"
                        style={{ color: "#ef4444" }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editTx && (
        <TransacaoForm
          key={editTx.id}
          open
          onClose={() => setEditTx(null)}
          defaultValues={editTx}
        />
      )}
    </>
  );
}

// ─── Tab: Folha ───────────────────────────────────────────────

function FolhaActions() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium"
        style={{ background: "var(--accent)", color: "#fff" }}
      >
        <Plus className="w-4 h-4" /> Novo Lançamento
      </button>
      <FolhaForm open={open} onClose={() => setOpen(false)} />
    </>
  );
}

const PAYROLL_LABELS = {
  salary: "Salário",
  commission: "Comissão",
  bonus: "Bônus",
  other: "Outros",
};

function FolhaTab({
  payroll,
  loading,
  hidden,
}: {
  payroll: PayrollEntry[];
  loading: boolean;
  hidden: boolean;
}) {
  const [monthFilter, setMonthFilter] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [editEntry, setEditEntry] = useState<PayrollEntry | null>(null);
  const deleteEntry = useDeletePayrollEntry();

  const filtered = payroll.filter(
    (p) => p.reference_month.slice(0, 7) === monthFilter
  );
  const totalPaid = filtered
    .filter((p) => p.status === "paid")
    .reduce((s, p) => s + p.amount, 0);
  const totalPending = filtered
    .filter((p) => p.status === "pending")
    .reduce((s, p) => s + p.amount, 0);

  if (loading) return <TableSkeleton />;

  return (
    <>
      <div className="flex items-center gap-4 mb-4">
        <input
          type="month"
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          className="px-3 py-1.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            color: "var(--fg)",
          }}
        />
        {filtered.length > 0 && (
          <div className="flex items-center gap-4 text-sm">
            <span style={{ color: "var(--fg-muted)" }}>
              Pago:{" "}
              <strong style={{ color: "#10b981" }}>
                {fmtBRL(totalPaid, hidden)}
              </strong>
            </span>
            <span style={{ color: "var(--fg-muted)" }}>
              Pendente:{" "}
              <strong style={{ color: "#f59e0b" }}>
                {fmtBRL(totalPending, hidden)}
              </strong>
            </span>
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="Nenhum lançamento neste mês"
          description="Registre salários, comissões e outros pagamentos da equipe."
        />
      ) : (
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: "1px solid var(--border)" }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr
                style={{
                  background: "var(--bg-card)",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                {["Pessoa", "Cargo", "Tipo", "Valor", "Pgto.", "Status", ""].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-medium"
                      style={{ color: "var(--fg-muted)" }}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry, i) => (
                <tr
                  key={entry.id}
                  style={{
                    background: i % 2 === 0 ? "var(--bg)" : "var(--bg-card)",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <td className="px-4 py-3">
                    <span className="font-medium" style={{ color: "var(--fg)" }}>
                      {entry.person_name}
                    </span>
                  </td>
                  <td
                    className="px-4 py-3 text-xs"
                    style={{ color: "var(--fg-muted)" }}
                  >
                    {entry.role ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: "var(--border)",
                        color: "var(--fg-muted)",
                      }}
                    >
                      {PAYROLL_LABELS[entry.type]}
                    </span>
                  </td>
                  <td
                    className="px-4 py-3 font-semibold"
                    style={{ color: "var(--fg)" }}
                  >
                    {fmtBRL(entry.amount, hidden)}
                  </td>
                  <td
                    className="px-4 py-3 text-xs"
                    style={{ color: "var(--fg-muted)" }}
                  >
                    {entry.payment_date ? fmtDate(entry.payment_date) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={
                        entry.status === "paid"
                          ? { background: "#10b98122", color: "#10b981" }
                          : { background: "#f59e0b22", color: "#f59e0b" }
                      }
                    >
                      {entry.status === "paid" ? "Pago" : "Pendente"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => setEditEntry(entry)}
                        className="p-1.5 rounded-lg hover:opacity-80"
                        style={{ color: "var(--fg-muted)" }}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (!confirm("Remover este lançamento?")) return;
                          deleteEntry.mutate(entry.id);
                        }}
                        className="p-1.5 rounded-lg hover:opacity-80"
                        style={{ color: "#ef4444" }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editEntry && (
        <FolhaForm
          key={editEntry.id}
          open
          onClose={() => setEditEntry(null)}
          defaultValues={editEntry}
        />
      )}
    </>
  );
}

// ─── Tab: Custos Previstos ────────────────────────────────────

function CustosPrevistosTab({
  transactions,
  hidden,
}: {
  transactions: Transaction[];
  hidden: boolean;
}) {
  const now = new Date();
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const deleteTx = useDeleteTransaction();

  const planned = transactions.filter(
    (t) =>
      t.type === "expense" &&
      (t.status === "pending" || t.status === "overdue") &&
      (t.due_date ? new Date(t.due_date) >= now : true)
  );

  const total = planned.reduce((s, t) => s + t.amount, 0);

  return (
    <>
      {planned.length > 0 && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm" style={{ color: "var(--fg-muted)" }}>
            Total previsto:
          </span>
          <span className="text-sm font-bold" style={{ color: "#ef4444" }}>
            {fmtBRL(total, hidden)}
          </span>
        </div>
      )}

      {planned.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="Sem custos previstos"
          description="Despesas pendentes com data de vencimento futura aparecem aqui."
        />
      ) : (
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: "1px solid var(--border)" }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr
                style={{
                  background: "var(--bg-card)",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                {["Vencimento", "Descrição", "Categoria", "Valor", ""].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-medium"
                      style={{ color: "var(--fg-muted)" }}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {planned.map((tx, i) => (
                <tr
                  key={tx.id}
                  style={{
                    background: i % 2 === 0 ? "var(--bg)" : "var(--bg-card)",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <td
                    className="px-4 py-3 text-xs whitespace-nowrap"
                    style={{ color: "var(--fg-muted)" }}
                  >
                    {tx.due_date ? fmtDate(tx.due_date) : "—"}
                  </td>
                  <td className="px-4 py-3 font-medium" style={{ color: "var(--fg)" }}>
                    {tx.description}
                  </td>
                  <td
                    className="px-4 py-3 text-xs"
                    style={{ color: "var(--fg-muted)" }}
                  >
                    {tx.category?.name ?? "—"}
                  </td>
                  <td
                    className="px-4 py-3 font-semibold"
                    style={{ color: "#ef4444" }}
                  >
                    {fmtBRL(tx.amount, hidden)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => setEditTx(tx)}
                        className="p-1.5 rounded-lg hover:opacity-80"
                        style={{ color: "var(--fg-muted)" }}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (!confirm("Remover?")) return;
                          deleteTx.mutate(tx.id);
                        }}
                        className="p-1.5 rounded-lg hover:opacity-80"
                        style={{ color: "#ef4444" }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editTx && (
        <TransacaoForm
          key={editTx.id}
          open
          onClose={() => setEditTx(null)}
          defaultValues={editTx}
        />
      )}
    </>
  );
}

// ─── Tab: Análise Gráfica ─────────────────────────────────────

function AnaliseTab({
  transactions,
  hidden,
}: {
  transactions: Transaction[];
  hidden: boolean;
}) {
  const chartData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const month = startOfMonth(subMonths(now, 5 - i));
      const paid = transactions.filter(
        (t) => t.status === "paid" && isSameMonth(new Date(t.date), month)
      );
      const receitas = paid
        .filter((t) => t.type === "income")
        .reduce((s, t) => s + t.amount, 0);
      const despesas = paid
        .filter((t) => t.type === "expense")
        .reduce((s, t) => s + t.amount, 0);
      return {
        month: format(month, "MMM/yy", { locale: ptBR }),
        Receitas: receitas,
        Despesas: despesas,
        Resultado: receitas - despesas,
      };
    });
  }, [transactions]);

  const totalReceitas = chartData.reduce((s, d) => s + d.Receitas, 0);
  const totalDespesas = chartData.reduce((s, d) => s + d.Despesas, 0);
  const totalResultado = totalReceitas - totalDespesas;
  const margem = totalReceitas > 0 ? (totalResultado / totalReceitas) * 100 : 0;

  const fmtYAxis = (v: number) =>
    v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toString();

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: { name: string; value: number; color: string }[];
    label?: string;
  }) => {
    if (!active || !payload?.length) return null;
    return (
      <div
        className="rounded-xl p-3 text-sm shadow-lg space-y-1"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
        }}
      >
        <p className="font-semibold mb-2" style={{ color: "var(--fg)" }}>
          {label}
        </p>
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.color }}>
            {p.name}: {fmtBRL(p.value, hidden)}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Receitas (6m)", value: totalReceitas, color: "#10b981", icon: TrendingUp },
          { label: "Despesas (6m)", value: totalDespesas, color: "#ef4444", icon: TrendingDown },
          { label: "Resultado (6m)", value: totalResultado, color: totalResultado >= 0 ? "#10b981" : "#ef4444", icon: DollarSign },
          { label: "Margem", value: null, icon: CheckCircle2, color: margem >= 20 ? "#10b981" : margem >= 0 ? "#f59e0b" : "#ef4444", label2: `${margem.toFixed(1)}%` },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-xl p-4"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <kpi.icon className="w-4 h-4" style={{ color: kpi.color }} />
              <span className="text-xs" style={{ color: "var(--fg-muted)" }}>
                {kpi.label}
              </span>
            </div>
            <p className="text-lg font-bold" style={{ color: kpi.color }}>
              {kpi.label2 ?? fmtBRL(kpi.value!, hidden)}
            </p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div
        className="rounded-xl p-6"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          filter: hidden ? "blur(8px) grayscale(1)" : undefined,
        }}
      >
        <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--fg)" }}>
          Receitas vs Despesas — últimos 6 meses
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} barGap={4} barCategoryGap="30%">
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border)"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: "var(--fg-muted)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={fmtYAxis}
              tick={{ fontSize: 11, fill: "var(--fg-muted)" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 16, color: "var(--fg-muted)" }}
            />
            <Bar dataKey="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
            <Bar
              dataKey="Resultado"
              fill="#6366f1"
              radius={[4, 4, 0, 0]}
              opacity={0.7}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────

function StatusBadge({ status }: { status: Transaction["status"] }) {
  const styles: Record<
    string,
    { bg: string; color: string; label: string }
  > = {
    paid: { bg: "#10b98122", color: "#10b981", label: "Pago" },
    pending: { bg: "#f59e0b22", color: "#f59e0b", label: "Pendente" },
    overdue: { bg: "#ef444422", color: "#ef4444", label: "Vencido" },
    cancelled: { bg: "#6b728022", color: "#6b7280", label: "Cancelado" },
  };
  const s = styles[status] ?? styles.pending;
  return (
    <span
      className="text-xs px-2 py-0.5 rounded-full font-medium"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  );
}

function TableSkeleton() {
  return (
    <div
      className="rounded-xl overflow-hidden animate-pulse"
      style={{ border: "1px solid var(--border)" }}
    >
      <div
        className="h-10"
        style={{
          background: "var(--bg-card)",
          borderBottom: "1px solid var(--border)",
        }}
      />
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex gap-4 px-4 py-3"
          style={{
            background: i % 2 === 0 ? "var(--bg)" : "var(--bg-card)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          {[1, 3, 2, 1, 1, 1].map((w, j) => (
            <div
              key={j}
              className={`h-4 rounded flex-${w}`}
              style={{ background: "var(--border)" }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
