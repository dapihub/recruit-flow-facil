import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Package, Plus, Pencil, Trash2, Search, ArrowUpDown, TrendingDown, Download } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { PageKpis, KpiItem } from "@/components/layout/PageKpis";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import {
  useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct,
  useCreateStockMovement, type Product,
} from "@/hooks/useProducts";
import { fmtBRL } from "@/lib/utils";
import { exportCSV } from "@/lib/csv";
import { useHideValues } from "@/hooks/useHideValues";

export const Route = createFileRoute("/_authenticated/produtos")({ component: ProdutosPage });

function ProdutosPage() {
  const { data: products = [], isLoading } = useProducts({ includeInactive: true });
  const del = useDeleteProduct();
  const { hidden } = useHideValues();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [movingProduct, setMovingProduct] = useState<Product | null>(null);

  const filtered = useMemo(() =>
    products.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase())),
  [products, search]);

  const kpis = useMemo(() => ({
    total: products.length,
    lowStock: products.filter(p => p.current_stock <= p.min_stock).length,
    stockValue: products.reduce((s, p) => s + p.current_stock * p.cost_price, 0),
  }), [products]);

  return (
    <>
      <Header title="Produtos & Estoque" subtitle="Gerencie SKUs, saldos e movimentações"
        actions={
          <>
            <button onClick={() => exportCSV("produtos", filtered, [
              { header: "SKU", get: (p) => p.sku },
              { header: "Nome", get: (p) => p.name },
              { header: "Categoria", get: (p) => p.category ?? "" },
              { header: "Unidade", get: (p) => p.unit },
              { header: "Saldo", get: (p) => p.current_stock },
              { header: "Mínimo", get: (p) => p.min_stock },
              { header: "Custo", get: (p) => p.cost_price },
              { header: "Venda", get: (p) => p.sale_price },
              { header: "Ativo", get: (p) => p.is_active ? "Sim" : "Não" },
            ])} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border"
              style={{ background: "var(--bg-card)", borderColor: "var(--border)", color: "var(--fg-muted)" }}>
              <Download className="w-3.5 h-3.5" /> CSV
            </button>
            <button onClick={() => { setEditing(null); setFormOpen(true); }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium"
              style={{ background: "var(--accent)", color: "#fff" }}>
              <Plus className="w-4 h-4" /> Novo Produto
            </button>
          </>
        } />
      <PageKpis>
        <KpiItem label="Produtos ativos" value={String(kpis.total)} />
        <KpiItem label="Abaixo do mínimo" value={String(kpis.lowStock)} danger={kpis.lowStock > 0} />
        <KpiItem label="Valor em estoque" value={fmtBRL(kpis.stockValue, hidden)} accent />
      </PageKpis>

      <div className="flex-1 overflow-auto p-6">
        <div className="mb-4 relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--fg-muted)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome ou SKU⬦"
            className="w-full pl-9 pr-3 py-2 rounded-lg text-sm border"
            style={{ background: "var(--bg-card)", borderColor: "var(--border)", color: "var(--fg)" }} />
        </div>

        {isLoading ? <p className="text-sm" style={{ color: "var(--fg-muted)" }}>Carregando⬦</p> :
         filtered.length === 0 ? <EmptyState icon={Package} title="Nenhum produto" description="Comece cadastrando seu primeiro produto." /> :
         (
          <div className="rounded-xl overflow-hidden border" style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
            <table className="w-full text-sm">
              <thead style={{ background: "var(--bg)" }}>
                <tr>
                  {["SKU", "Nome", "Categoria", "Saldo", "Custo", "Venda", ""].map(h =>
                    <th key={h} className="text-left px-4 py-3 text-xs uppercase font-semibold" style={{ color: "var(--fg-muted)" }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const low = p.current_stock <= p.min_stock;
                  return (
                    <tr key={p.id} className="border-t hover:bg-[var(--bg)]" style={{ borderColor: "var(--border)" }}>
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--fg-muted)" }}>{p.sku}</td>
                      <td className="px-4 py-3" style={{ color: "var(--fg)" }}>{p.name}</td>
                      <td className="px-4 py-3" style={{ color: "var(--fg-muted)" }}>{p.category ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 font-semibold" style={{ color: low ? "#ef4444" : "var(--fg)" }}>
                          {low && <TrendingDown className="w-3.5 h-3.5" />}
                          {p.current_stock} {p.unit}
                        </span>
                      </td>
                      <td className="px-4 py-3" style={{ color: "var(--fg-muted)" }}>{fmtBRL(p.cost_price, hidden)}</td>
                      <td className="px-4 py-3" style={{ color: "var(--fg)" }}>{fmtBRL(p.sale_price, hidden)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button onClick={() => setMovingProduct(p)} title="Movimentar"
                            className="p-1.5 rounded hover:bg-[var(--border)]" style={{ color: "var(--fg-muted)" }}>
                            <ArrowUpDown className="w-4 h-4" />
                          </button>
                          <button onClick={() => { setEditing(p); setFormOpen(true); }}
                            className="p-1.5 rounded hover:bg-[var(--border)]" style={{ color: "var(--fg-muted)" }}>
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => confirm(`Remover ${p.name}?`) && del.mutate(p.id)}
                            className="p-1.5 rounded hover:bg-[var(--border)]" style={{ color: "#ef4444" }}>
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {formOpen && <ProductFormModal product={editing} onClose={() => setFormOpen(false)} />}
      {movingProduct && <StockMovementModal product={movingProduct} onClose={() => setMovingProduct(null)} />}
    </>
  );
}

function ProductFormModal({ product, onClose }: { product: Product | null; onClose: () => void }) {
  const create = useCreateProduct();
  const update = useUpdateProduct();
  const [form, setForm] = useState({
    sku: product?.sku ?? "",
    name: product?.name ?? "",
    description: product?.description ?? "",
    unit: product?.unit ?? "un",
    cost_price: product?.cost_price ?? 0,
    sale_price: product?.sale_price ?? 0,
    min_stock: product?.min_stock ?? 0,
    category: product?.category ?? "",
    is_active: product?.is_active ?? true,
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { ...form, description: form.description || null, category: form.category || null };
    if (product) await update.mutateAsync({ id: product.id, ...payload });
    else await create.mutateAsync(payload);
    onClose();
  }

  return (
    <Modal open onClose={onClose} title={product ? "Editar Produto" : "Novo Produto"} size="md"
      footer={
        <>
          <button onClick={onClose} className="px-3 py-1.5 rounded-lg text-sm" style={{ background: "var(--bg)", color: "var(--fg)" }}>Cancelar</button>
          <button form="prod-form" type="submit" className="px-3 py-1.5 rounded-lg text-sm font-medium" style={{ background: "var(--accent)", color: "#fff" }}>Salvar</button>
        </>
      }>
      <form id="prod-form" onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="SKU *"><input required value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} className={inp} /></Field>
          <Field label="Unidade"><input value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} className={inp} /></Field>
        </div>
        <Field label="Nome *"><input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inp} /></Field>
        <Field label="Descrição"><textarea rows={2} value={form.description ?? ""} onChange={e => setForm({ ...form, description: e.target.value })} className={inp} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Categoria"><input value={form.category ?? ""} onChange={e => setForm({ ...form, category: e.target.value })} className={inp} /></Field>
          <Field label="Estoque mínimo"><input type="number" step="0.001" value={form.min_stock} onChange={e => setForm({ ...form, min_stock: +e.target.value })} className={inp} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Preço de custo"><input type="number" step="0.01" value={form.cost_price} onChange={e => setForm({ ...form, cost_price: +e.target.value })} className={inp} /></Field>
          <Field label="Preço de venda"><input type="number" step="0.01" value={form.sale_price} onChange={e => setForm({ ...form, sale_price: +e.target.value })} className={inp} /></Field>
        </div>
        <label className="flex items-center gap-2 text-sm" style={{ color: "var(--fg)" }}>
          <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} /> Ativo
        </label>
      </form>
    </Modal>
  );
}

function StockMovementModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const create = useCreateStockMovement();
  const [form, setForm] = useState({ type: "in" as "in" | "out" | "adjust", quantity: 0, unit_cost: product.cost_price, reason: "", movement_date: new Date().toISOString().slice(0, 10) });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await create.mutateAsync({
      product_id: product.id, type: form.type, quantity: form.quantity,
      unit_cost: form.unit_cost || null, reason: form.reason || null,
      reference: null, movement_date: form.movement_date,
    });
    onClose();
  }

  return (
    <Modal open onClose={onClose} title={`Movimentar: ${product.name}`} size="sm"
      footer={<>
        <button onClick={onClose} className="px-3 py-1.5 rounded-lg text-sm" style={{ background: "var(--bg)", color: "var(--fg)" }}>Cancelar</button>
        <button form="mov-form" type="submit" className="px-3 py-1.5 rounded-lg text-sm font-medium" style={{ background: "var(--accent)", color: "#fff" }}>Registrar</button>
      </>}>
      <form id="mov-form" onSubmit={submit} className="space-y-3">
        <div className="text-xs" style={{ color: "var(--fg-muted)" }}>Saldo atual: <b style={{ color: "var(--fg)" }}>{product.current_stock} {product.unit}</b></div>
        <Field label="Tipo">
          <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as "in" | "out" | "adjust" })} className={inp}>
            <option value="in">Entrada</option><option value="out">Saída</option><option value="adjust">Ajuste (saldo final)</option>
          </select>
        </Field>
        <Field label="Quantidade *"><input required type="number" step="0.001" value={form.quantity} onChange={e => setForm({ ...form, quantity: +e.target.value })} className={inp} /></Field>
        {form.type !== "adjust" && (
          <Field label="Custo unitário"><input type="number" step="0.01" value={form.unit_cost} onChange={e => setForm({ ...form, unit_cost: +e.target.value })} className={inp} /></Field>
        )}
        <Field label="Data"><input type="date" value={form.movement_date} onChange={e => setForm({ ...form, movement_date: e.target.value })} className={inp} /></Field>
        <Field label="Motivo"><input value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} className={inp} /></Field>
      </form>
    </Modal>
  );
}

const inp = "w-full px-3 py-2 rounded-lg text-sm border bg-[var(--bg)] border-[var(--border)] text-[var(--fg)]";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs mb-1" style={{ color: "var(--fg-muted)" }}>{label}</span>
      {children}
    </label>
  );
}
