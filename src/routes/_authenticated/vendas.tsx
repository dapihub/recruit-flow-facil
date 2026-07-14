import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ShoppingBag, Plus, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Header } from "@/components/layout/Header";
import { PageKpis, KpiItem } from "@/components/layout/PageKpis";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { useSalesOrders, useCreateSalesOrder, useUpdateSalesOrder, useDeleteSalesOrder, type SalesOrder } from "@/hooks/useOrders";
import { useClients } from "@/hooks/useClients";
import { fmtBRL } from "@/lib/utils";
import { useHideValues } from "@/hooks/useHideValues";

export const Route = createFileRoute("/_authenticated/vendas")({ component: VendasPage });

const STATUS_LABELS = { draft: "Rascunho", confirmed: "Confirmado", invoiced: "Faturado", cancelled: "Cancelado" };
const STATUS_COLORS: Record<string, string> = { draft: "#6b7280", confirmed: "#3b82f6", invoiced: "#10b981", cancelled: "#ef4444" };

function VendasPage() {
  const { data: orders = [], isLoading } = useSalesOrders();
  const del = useDeleteSalesOrder();
  const { hidden } = useHideValues();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SalesOrder | null>(null);

  const kpis = useMemo(() => ({
    total: orders.length,
    invoiced: orders.filter(o => o.status === "invoiced").length,
    totalValue: orders.filter(o => o.status !== "cancelled").reduce((s, o) => s + o.total, 0),
  }), [orders]);

  return (
    <>
      <Header title="Vendas" subtitle="Orçamentos e pedidos de venda"
        actions={
          <button onClick={() => { setEditing(null); setFormOpen(true); }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium"
            style={{ background: "var(--accent)", color: "#fff" }}>
            <Plus className="w-4 h-4" /> Novo Pedido
          </button>
        } />
      <PageKpis>
        <KpiItem label="Pedidos" value={String(kpis.total)} />
        <KpiItem label="Faturados" value={String(kpis.invoiced)} accent />
        <KpiItem label="Total geral" value={fmtBRL(kpis.totalValue, hidden)} />
      </PageKpis>

      <div className="flex-1 overflow-auto p-6">
        {isLoading ? <p className="text-sm" style={{ color: "var(--fg-muted)" }}>Carregando⬦</p> :
         orders.length === 0 ? <EmptyState icon={ShoppingBag} title="Nenhum pedido" description="Crie seu primeiro pedido de venda." /> :
         (
          <div className="rounded-xl overflow-hidden border" style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
            <table className="w-full text-sm">
              <thead style={{ background: "var(--bg)" }}>
                <tr>{["Número", "Cliente", "Data", "Status", "Total", ""].map(h =>
                  <th key={h} className="text-left px-4 py-3 text-xs uppercase font-semibold" style={{ color: "var(--fg-muted)" }}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id} className="border-t hover:bg-[var(--bg)]" style={{ borderColor: "var(--border)" }}>
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--fg)" }}>{o.number}</td>
                    <td className="px-4 py-3" style={{ color: "var(--fg)" }}>{o.client?.name ?? "—"}</td>
                    <td className="px-4 py-3" style={{ color: "var(--fg-muted)" }}>{format(new Date(o.order_date), "dd/MM/yyyy")}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium"
                        style={{ background: `color-mix(in srgb, ${STATUS_COLORS[o.status]} 12%, transparent)`, color: STATUS_COLORS[o.status] }}>
                        {STATUS_LABELS[o.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold" style={{ color: "var(--fg)" }}>{fmtBRL(o.total, hidden)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => { setEditing(o); setFormOpen(true); }} className="p-1.5 rounded hover:bg-[var(--border)]" style={{ color: "var(--fg-muted)" }}><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => confirm(`Remover ${o.number}?`) && del.mutate(o.id)} className="p-1.5 rounded hover:bg-[var(--border)]" style={{ color: "#ef4444" }}><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {formOpen && <SalesOrderForm order={editing} onClose={() => setFormOpen(false)} />}
    </>
  );
}

function SalesOrderForm({ order, onClose }: { order: SalesOrder | null; onClose: () => void }) {
  const create = useCreateSalesOrder();
  const update = useUpdateSalesOrder();
  const { data: clients = [] } = useClients();
  const [form, setForm] = useState({
    client_id: order?.client_id ?? "", status: order?.status ?? "draft",
    order_date: order?.order_date ?? new Date().toISOString().slice(0, 10),
    total: order?.total ?? 0, discount: order?.discount ?? 0, notes: order?.notes ?? "",
  });
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      client_id: form.client_id || null, status: form.status as SalesOrder["status"],
      order_date: form.order_date, total: form.total, discount: form.discount, notes: form.notes || null,
    };
    if (order) await update.mutateAsync({ id: order.id, ...payload });
    else await create.mutateAsync(payload);
    onClose();
  }
  return (
    <Modal open onClose={onClose} title={order ? "Editar Pedido de Venda" : "Novo Pedido de Venda"} size="md"
      footer={<>
        <button onClick={onClose} className="px-3 py-1.5 rounded-lg text-sm" style={{ background: "var(--bg)", color: "var(--fg)" }}>Cancelar</button>
        <button form="pv-form" type="submit" className="px-3 py-1.5 rounded-lg text-sm font-medium" style={{ background: "var(--accent)", color: "#fff" }}>Salvar</button>
      </>}>
      <form id="pv-form" onSubmit={submit} className="space-y-3">
        <F label="Cliente">
          <select value={form.client_id ?? ""} onChange={e => setForm({ ...form, client_id: e.target.value })} className={inp}>
            <option value="">— Selecione —</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </F>
        <div className="grid grid-cols-2 gap-3">
          <F label="Data"><input type="date" value={form.order_date} onChange={e => setForm({ ...form, order_date: e.target.value })} className={inp} /></F>
          <F label="Status">
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as SalesOrder["status"] })} className={inp}>
              <option value="draft">Rascunho</option><option value="confirmed">Confirmado</option><option value="invoiced">Faturado</option><option value="cancelled">Cancelado</option>
            </select>
          </F>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <F label="Desconto"><input type="number" step="0.01" value={form.discount} onChange={e => setForm({ ...form, discount: +e.target.value })} className={inp} /></F>
          <F label="Total"><input type="number" step="0.01" value={form.total} onChange={e => setForm({ ...form, total: +e.target.value })} className={inp} /></F>
        </div>
        <F label="Observações"><textarea rows={2} value={form.notes ?? ""} onChange={e => setForm({ ...form, notes: e.target.value })} className={inp} /></F>
      </form>
    </Modal>
  );
}
const inp = "w-full px-3 py-2 rounded-lg text-sm border bg-[var(--bg)] border-[var(--border)] text-[var(--fg)]";
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="block text-xs mb-1" style={{ color: "var(--fg-muted)" }}>{label}</span>{children}</label>;
}
