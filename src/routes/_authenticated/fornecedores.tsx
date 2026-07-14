import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Truck, Plus, Pencil, Trash2, Search, Mail, Phone, Download } from "lucide-react";
import { exportCSV } from "@/lib/csv";
import { Header } from "@/components/layout/Header";
import { PageKpis, KpiItem } from "@/components/layout/PageKpis";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { useSuppliers, useCreateSupplier, useUpdateSupplier, useDeleteSupplier, type Supplier } from "@/hooks/useSuppliers";

export const Route = createFileRoute("/_authenticated/fornecedores")({ component: FornecedoresPage });

function FornecedoresPage() {
  const { data: items = [], isLoading } = useSuppliers();
  const del = useDeleteSupplier();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);

  const filtered = useMemo(() => items.filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase())), [items, search]);

  return (
    <>
      <Header title="Fornecedores" subtitle="Cadastro e gestão de fornecedores"
        actions={
          <button onClick={() => { setEditing(null); setFormOpen(true); }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium"
            style={{ background: "var(--accent)", color: "#fff" }}>
            <Plus className="w-4 h-4" /> Novo Fornecedor
          </button>
        } />
      <PageKpis>
        <KpiItem label="Total" value={String(items.length)} />
        <KpiItem label="Ativos" value={String(items.filter(s => s.is_active).length)} accent />
      </PageKpis>

      <div className="flex-1 overflow-auto p-6">
        <div className="mb-4 relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--fg-muted)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar⬦"
            className="w-full pl-9 pr-3 py-2 rounded-lg text-sm border"
            style={{ background: "var(--bg-card)", borderColor: "var(--border)", color: "var(--fg)" }} />
        </div>

        {isLoading ? <p className="text-sm" style={{ color: "var(--fg-muted)" }}>Carregando⬦</p> :
         filtered.length === 0 ? <EmptyState icon={Truck} title="Nenhum fornecedor" description="Cadastre seu primeiro fornecedor." /> :
         (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(s => (
              <div key={s.id} className="rounded-xl p-4 border" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold" style={{ color: "var(--fg)" }}>{s.name}</p>
                    {s.document && <p className="text-xs" style={{ color: "var(--fg-muted)" }}>{s.document}</p>}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditing(s); setFormOpen(true); }} className="p-1.5 rounded hover:bg-[var(--border)]" style={{ color: "var(--fg-muted)" }}><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => confirm(`Remover ${s.name}?`) && del.mutate(s.id)} className="p-1.5 rounded hover:bg-[var(--border)]" style={{ color: "#ef4444" }}><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <div className="space-y-1 text-xs" style={{ color: "var(--fg-muted)" }}>
                  {s.contact_name && <p>👤 {s.contact_name}</p>}
                  {s.email && <p className="flex items-center gap-1.5"><Mail className="w-3 h-3" /> {s.email}</p>}
                  {s.phone && <p className="flex items-center gap-1.5"><Phone className="w-3 h-3" /> {s.phone}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {formOpen && <SupplierForm supplier={editing} onClose={() => setFormOpen(false)} />}
    </>
  );
}

function SupplierForm({ supplier, onClose }: { supplier: Supplier | null; onClose: () => void }) {
  const create = useCreateSupplier();
  const update = useUpdateSupplier();
  const [form, setForm] = useState({
    name: supplier?.name ?? "", document: supplier?.document ?? "",
    contact_name: supplier?.contact_name ?? "", email: supplier?.email ?? "",
    phone: supplier?.phone ?? "", address: supplier?.address ?? "",
    notes: supplier?.notes ?? "", is_active: supplier?.is_active ?? true,
  });
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const payload = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v === "" ? null : v])) as Parameters<typeof create.mutateAsync>[0];
    payload.name = form.name; payload.is_active = form.is_active;
    if (supplier) await update.mutateAsync({ id: supplier.id, ...payload });
    else await create.mutateAsync(payload);
    onClose();
  }
  return (
    <Modal open onClose={onClose} title={supplier ? "Editar Fornecedor" : "Novo Fornecedor"} size="md"
      footer={<>
        <button onClick={onClose} className="px-3 py-1.5 rounded-lg text-sm" style={{ background: "var(--bg)", color: "var(--fg)" }}>Cancelar</button>
        <button form="sup-form" type="submit" className="px-3 py-1.5 rounded-lg text-sm font-medium" style={{ background: "var(--accent)", color: "#fff" }}>Salvar</button>
      </>}>
      <form id="sup-form" onSubmit={submit} className="space-y-3">
        <F label="Nome *"><input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inp} /></F>
        <div className="grid grid-cols-2 gap-3">
          <F label="Documento"><input value={form.document ?? ""} onChange={e => setForm({ ...form, document: e.target.value })} className={inp} /></F>
          <F label="Contato"><input value={form.contact_name ?? ""} onChange={e => setForm({ ...form, contact_name: e.target.value })} className={inp} /></F>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <F label="E-mail"><input type="email" value={form.email ?? ""} onChange={e => setForm({ ...form, email: e.target.value })} className={inp} /></F>
          <F label="Telefone"><input value={form.phone ?? ""} onChange={e => setForm({ ...form, phone: e.target.value })} className={inp} /></F>
        </div>
        <F label="Endereço"><input value={form.address ?? ""} onChange={e => setForm({ ...form, address: e.target.value })} className={inp} /></F>
        <F label="Observações"><textarea rows={2} value={form.notes ?? ""} onChange={e => setForm({ ...form, notes: e.target.value })} className={inp} /></F>
      </form>
    </Modal>
  );
}
const inp = "w-full px-3 py-2 rounded-lg text-sm border bg-[var(--bg)] border-[var(--border)] text-[var(--fg)]";
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="block text-xs mb-1" style={{ color: "var(--fg-muted)" }}>{label}</span>{children}</label>;
}
