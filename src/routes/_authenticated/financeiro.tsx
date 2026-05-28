import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Trash2, Pencil, AlertTriangle, TrendingUp, TrendingDown, Calendar, ChevronDown } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  addFatura, addCusto, updateFatura, updateCusto, deleteFatura, deleteCusto,
  useFaturas, useCustos, useVagas,
  CUSTO_CATEGORIAS, type CustoCategoria, type CustoTipo, type CustoStatus,
  type Fatura, type FaturaStatus, type Custo,
} from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/financeiro")({
  head: () => ({ meta: [{ title: "Financeiro — DAPI HUB" }] }),
  component: FinanceiroPage,
});

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function FinanceiroPage() {
  const faturas = useFaturas();
  const custos = useCustos();
  const vagas = useVagas();

  const [openFatura, setOpenFatura] = useState(false);
  const [openCusto, setOpenCusto] = useState(false);
  const [editFatura, setEditFatura] = useState<Fatura | null>(null);
  const [editCusto, setEditCusto] = useState<Custo | null>(null);

  const hoje = new Date();
  const hojeIso = hoje.toISOString().slice(0, 10);
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

  // KPIs
  const receitaMes = useMemo(() =>
    faturas.filter(f => f.status === "Pago" && new Date(f.vencimento + "T00:00:00") >= inicioMes).reduce((s, f) => s + f.valor, 0),
    [faturas]);
  const aReceber = useMemo(() => faturas.filter(f => f.status !== "Pago").reduce((s, f) => s + f.valor, 0), [faturas]);
  const custosMes = useMemo(() =>
    custos.filter(c => new Date(c.data + "T00:00:00") >= inicioMes).reduce((s, c) => s + c.valor, 0),
    [custos]);
  const lucroMes = receitaMes - custosMes;
  const margem = receitaMes > 0 ? (lucroMes / receitaMes * 100) : 0;

  const faturasVencidas = useMemo(() => faturas.filter(f => f.status !== "Pago" && f.vencimento < hojeIso), [faturas, hojeIso]);
  const valorVencido = faturasVencidas.reduce((s, f) => s + f.valor, 0);

  // Sorted faturas and custos
  const faturasSorted = useMemo(() => [...faturas].sort((a, b) => b.vencimento.localeCompare(a.vencimento)), [faturas]);
  const custosSorted = useMemo(() => [...custos].sort((a, b) => b.data.localeCompare(a.data)), [custos]);

  return (
    <div>
      <PageHeader
        title="Financeiro"
        subtitle={hoje.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
        action={
          <div className="flex gap-2">
            <Dialog open={openCusto} onOpenChange={setOpenCusto}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5"><Plus className="w-3.5 h-3.5" /> Custo</Button>
              </DialogTrigger>
              <CustoModal onClose={() => setOpenCusto(false)} vagas={vagas} />
            </Dialog>
            <Dialog open={openFatura} onOpenChange={setOpenFatura}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white gap-1.5"><Plus className="w-3.5 h-3.5" /> Fatura</Button>
              </DialogTrigger>
              <FaturaModal onClose={() => setOpenFatura(false)} vagas={vagas} />
            </Dialog>
          </div>
        }
      />

      <div className="p-8 space-y-6">

        {/* Alerta vencidas */}
        {faturasVencidas.length > 0 && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-5 py-4 dark:bg-red-950/20 dark:border-red-900/30">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                {faturasVencidas.length} fatura{faturasVencidas.length > 1 ? "s" : ""} vencida{faturasVencidas.length > 1 ? "s" : ""}
              </p>
              <p className="text-xs text-red-600/80 dark:text-red-400/70">{brl(valorVencido)} em atraso</p>
            </div>
          </div>
        )}

        {/* 4 KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Kpi label="Receita do mês" value={brl(receitaMes)} color="emerald" icon={<TrendingUp className="w-4 h-4" />} />
          <Kpi label="A receber" value={brl(aReceber)} color="blue" icon={<Calendar className="w-4 h-4" />} />
          <Kpi label="Lucro do mês" value={brl(lucroMes)} color={lucroMes >= 0 ? "emerald" : "red"} icon={lucroMes >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />} hint={`Margem ${margem.toFixed(1)}%`} />
          <Kpi label="Custos do mês" value={brl(custosMes)} color="amber" icon={<TrendingDown className="w-4 h-4" />} />
        </div>

        {/* Tabelas */}
        <Tabs defaultValue="faturas">
          <TabsList className="bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="faturas" className="rounded-lg text-sm">Faturas ({faturas.length})</TabsTrigger>
            <TabsTrigger value="custos" className="rounded-lg text-sm">Custos ({custos.length})</TabsTrigger>
          </TabsList>

          {/* FATURAS */}
          <TabsContent value="faturas" className="mt-4">
            <div className="bg-card rounded-2xl border border-border/60 overflow-hidden">
              {faturasSorted.length === 0 ? (
                <EmptyState text="Nenhuma fatura cadastrada" />
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/30">
                      <Th>Cliente</Th>
                      <Th>Serviço</Th>
                      <Th className="text-right">Valor</Th>
                      <Th>Vencimento</Th>
                      <Th>Status</Th>
                      <Th className="w-20" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {faturasSorted.map(f => {
                      const vencida = f.status !== "Pago" && f.vencimento < hojeIso;
                      return (
                        <tr key={f.id} className={`group hover:bg-muted/20 transition-colors ${vencida ? "bg-red-50/50 dark:bg-red-950/10" : ""}`}>
                          <Td className="font-medium">{f.cliente}</Td>
                          <Td className="text-muted-foreground max-w-[200px] truncate">{f.servico}</Td>
                          <Td className="text-right font-semibold tabular-nums">{brl(f.valor)}</Td>
                          <Td className={vencida ? "text-red-600 font-medium" : "text-muted-foreground"}>
                            {new Date(f.vencimento + "T12:00:00").toLocaleDateString("pt-BR")}
                          </Td>
                          <Td><StatusBadge status={f.status} /></Td>
                          <Td>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditFatura(f)}>
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader><AlertDialogTitle>Excluir fatura?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={async () => { try { await deleteFatura(f.id); toast.success("Excluída."); } catch { toast.error("Erro."); } }}>Excluir</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </Td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </TabsContent>

          {/* CUSTOS */}
          <TabsContent value="custos" className="mt-4">
            <div className="bg-card rounded-2xl border border-border/60 overflow-hidden">
              {custosSorted.length === 0 ? (
                <EmptyState text="Nenhum custo cadastrado" />
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/30">
                      <Th>Descrição</Th>
                      <Th>Categoria</Th>
                      <Th>Tipo</Th>
                      <Th className="text-right">Valor</Th>
                      <Th>Data</Th>
                      <Th>Status</Th>
                      <Th className="w-20" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {custosSorted.map(c => (
                      <tr key={c.id} className="group hover:bg-muted/20 transition-colors">
                        <Td className="font-medium">{c.descricao}</Td>
                        <Td><span className="text-[11px] bg-muted px-2 py-0.5 rounded-md font-medium">{c.categoria}</span></Td>
                        <Td className="text-muted-foreground text-xs">{c.tipo}</Td>
                        <Td className="text-right font-semibold tabular-nums text-red-600">{brl(c.valor)}</Td>
                        <Td className="text-muted-foreground">{new Date(c.data + "T12:00:00").toLocaleDateString("pt-BR")}</Td>
                        <Td><StatusBadge status={c.status} /></Td>
                        <Td>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditCusto(c)}>
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader><AlertDialogTitle>Excluir custo?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={async () => { try { await deleteCusto(c.id); toast.success("Excluído."); } catch { toast.error("Erro."); } }}>Excluir</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modais de edição */}
      {editFatura && (
        <Dialog open={!!editFatura} onOpenChange={o => !o && setEditFatura(null)}>
          <FaturaModal fatura={editFatura} vagas={vagas} onClose={() => setEditFatura(null)} />
        </Dialog>
      )}
      {editCusto && (
        <Dialog open={!!editCusto} onOpenChange={o => !o && setEditCusto(null)}>
          <CustoModal custo={editCusto} vagas={vagas} onClose={() => setEditCusto(null)} />
        </Dialog>
      )}
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────
function Kpi({ label, value, hint, color, icon }: { label: string; value: string; hint?: string; color: string; icon?: React.ReactNode }) {
  const colors: Record<string, string> = {
    emerald: "text-emerald-600 dark:text-emerald-400",
    blue: "text-blue-600 dark:text-blue-400",
    amber: "text-amber-600 dark:text-amber-400",
    red: "text-red-600 dark:text-red-400",
  };
  const bars: Record<string, string> = {
    emerald: "bg-emerald-500", blue: "bg-blue-500", amber: "bg-amber-500", red: "bg-red-500",
  };
  return (
    <div className="relative bg-card rounded-xl border border-border/60 px-5 py-4 overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${bars[color]}`} />
      <div className="flex items-start justify-between mb-1">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <span className={`${colors[color]} opacity-50`}>{icon}</span>
      </div>
      <p className={`text-2xl font-bold tabular-nums ${colors[color]}`}>{value}</p>
      {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
    </div>
  );
}

function Th({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return <th className={`text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3 ${className}`}>{children}</th>;
}
function Td({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3.5 ${className}`}>{children}</td>;
}
function EmptyState({ text }: { text: string }) {
  return <div className="py-12 text-center text-sm text-muted-foreground">{text}</div>;
}
function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={`space-y-1.5 ${className}`}><Label className="text-xs font-medium">{label}</Label>{children}</div>;
}

// ── Modais ────────────────────────────────────────────────────────────
const STATUS_FATURA: FaturaStatus[] = ["Pendente", "Pago", "Atrasado"];

function FaturaModal({ fatura, vagas, onClose }: { fatura?: Fatura; vagas: any[]; onClose: () => void }) {
  const [form, setForm] = useState({
    cliente: fatura?.cliente ?? "",
    servico: fatura?.servico ?? "",
    valor: fatura ? String(fatura.valor) : "",
    vencimento: fatura?.vencimento ?? new Date().toISOString().slice(0, 10),
    status: fatura?.status ?? "Pendente" as FaturaStatus,
    vagaId: fatura?.vagaId ?? "",
    observacoes: fatura?.observacoes ?? "",
  });
  const editing = !!fatura;
  return (
    <DialogContent className="max-w-lg">
      <DialogHeader><DialogTitle>{editing ? "Editar Fatura" : "Nova Fatura"}</DialogTitle></DialogHeader>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Cliente" className="col-span-2"><Input value={form.cliente} onChange={e => setForm({ ...form, cliente: e.target.value })} /></Field>
        <Field label="Serviço" className="col-span-2"><Input value={form.servico} onChange={e => setForm({ ...form, servico: e.target.value })} /></Field>
        <Field label="Valor (R$)"><Input type="number" step="0.01" value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} /></Field>
        <Field label="Vencimento"><Input type="date" value={form.vencimento} onChange={e => setForm({ ...form, vencimento: e.target.value })} /></Field>
        <Field label="Status">
          <Select value={form.status} onValueChange={v => setForm({ ...form, status: v as FaturaStatus })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{STATUS_FATURA.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Vaga (opcional)">
          <Select value={form.vagaId ?? ""} onValueChange={v => setForm({ ...form, vagaId: v })}>
            <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">Nenhuma</SelectItem>
              {vagas.map(v => <SelectItem key={v.id} value={v.id}>{v.cargo} — {v.empresa}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Observações" className="col-span-2"><Textarea rows={2} value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} /></Field>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button className="bg-orange-500 hover:bg-orange-600 text-white" disabled={!form.cliente || !form.valor}
          onClick={async () => {
            try {
              const data = { cliente: form.cliente, servico: form.servico, valor: Number(form.valor), vencimento: form.vencimento, status: form.status, vagaId: form.vagaId || null, observacoes: form.observacoes };
              if (editing) { await updateFatura(fatura!.id, data); toast.success("Fatura atualizada."); }
              else { await addFatura(data); toast.success("Fatura criada."); }
              onClose();
            } catch { toast.error("Erro ao salvar."); }
          }}>{editing ? "Salvar" : "Criar"}</Button>
      </DialogFooter>
    </DialogContent>
  );
}

const STATUS_CUSTO: CustoStatus[] = ["Pendente", "Pago", "Atrasado"];
const TIPOS_CUSTO: CustoTipo[] = ["Fixo", "Variável"];

function CustoModal({ custo, vagas, onClose }: { custo?: Custo; vagas: any[]; onClose: () => void }) {
  const [form, setForm] = useState({
    descricao: custo?.descricao ?? "",
    categoria: custo?.categoria ?? "Operacional" as CustoCategoria,
    tipo: custo?.tipo ?? "Variável" as CustoTipo,
    valor: custo ? String(custo.valor) : "",
    data: custo?.data ?? new Date().toISOString().slice(0, 10),
    status: custo?.status ?? "Pendente" as CustoStatus,
    fornecedor: custo?.fornecedor ?? "",
    vagaId: custo?.vagaId ?? "",
    observacoes: custo?.observacoes ?? "",
  });
  const editing = !!custo;
  return (
    <DialogContent className="max-w-lg">
      <DialogHeader><DialogTitle>{editing ? "Editar Custo" : "Novo Custo"}</DialogTitle></DialogHeader>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Descrição" className="col-span-2"><Input value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} /></Field>
        <Field label="Categoria">
          <Select value={form.categoria} onValueChange={v => setForm({ ...form, categoria: v as CustoCategoria })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{CUSTO_CATEGORIAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Tipo">
          <Select value={form.tipo} onValueChange={v => setForm({ ...form, tipo: v as CustoTipo })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{TIPOS_CUSTO.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Valor (R$)"><Input type="number" step="0.01" value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} /></Field>
        <Field label="Data"><Input type="date" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} /></Field>
        <Field label="Status">
          <Select value={form.status} onValueChange={v => setForm({ ...form, status: v as CustoStatus })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{STATUS_CUSTO.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Fornecedor"><Input value={form.fornecedor} onChange={e => setForm({ ...form, fornecedor: e.target.value })} /></Field>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button className="bg-orange-500 hover:bg-orange-600 text-white" disabled={!form.descricao || !form.valor}
          onClick={async () => {
            try {
              const data = { descricao: form.descricao, categoria: form.categoria, tipo: form.tipo, valor: Number(form.valor), data: form.data, status: form.status, fornecedor: form.fornecedor, vagaId: form.vagaId || undefined, observacoes: form.observacoes };
              if (editing) { await updateCusto(custo!.id, data); toast.success("Custo atualizado."); }
              else { await addCusto(data); toast.success("Custo criado."); }
              onClose();
            } catch { toast.error("Erro ao salvar."); }
          }}>{editing ? "Salvar" : "Criar"}</Button>
      </DialogFooter>
    </DialogContent>
  );
}
