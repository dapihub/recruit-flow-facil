import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, TrendingDown, TrendingUp, Pencil } from "lucide-react";
import { PageHeader, MetricCard } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  addFatura,
  addCusto,
  updateFatura,
  updateCusto,
  useFaturas,
  useCustos,
  CUSTO_CATEGORIAS,
  type CustoCategoria,
  type CustoTipo,
} from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/financeiro")({
  head: () => ({
    meta: [
      { title: "Financeiro — DAPI HUB" },
      { name: "description", content: "Acompanhe receitas, custos, lucro e metas financeiras da operação." },
    ],
  }),
  component: FinanceiroPage,
});

const META_LUCRO_ANUAL = 500000;

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function FinanceiroPage() {
  const faturas = useFaturas();
  const custos = useCustos();
  const [openFatura, setOpenFatura] = useState(false);
  const [openCusto, setOpenCusto] = useState(false);

  const receita = faturas.filter((f) => f.status === "Pago").reduce((s, f) => s + f.valor, 0);
  const aReceber = faturas.filter((f) => f.status !== "Pago").reduce((s, f) => s + f.valor, 0);

  const custoTotal = custos.reduce((s, c) => s + c.valor, 0);
  const custoPago = custos.filter((c) => c.status === "Pago").reduce((s, c) => s + c.valor, 0);
  const custoFixo = custos.filter((c) => c.tipo === "Fixo").reduce((s, c) => s + c.valor, 0);
  const custoVariavel = custos.filter((c) => c.tipo === "Variável").reduce((s, c) => s + c.valor, 0);

  const lucro = receita - custoPago;
  const margem = receita > 0 ? Math.round((lucro / receita) * 100) : 0;
  const progresso = Math.max(0, Math.min(100, Math.round((lucro / META_LUCRO_ANUAL) * 100)));

  const porCategoria = useMemo(() => {
    const map = new Map<CustoCategoria, number>();
    custos.forEach((c) => map.set(c.categoria, (map.get(c.categoria) ?? 0) + c.valor));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [custos]);

  return (
    <div>
      <PageHeader
        title="Financeiro"
        subtitle="Receitas, custos, lucro e metas da operação"
        action={
          <div className="flex gap-2">
            <Dialog open={openCusto} onOpenChange={setOpenCusto}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="w-4 h-4 mr-2" /> Novo Custo
                </Button>
              </DialogTrigger>
              <NovoCustoModal onClose={() => setOpenCusto(false)} />
            </Dialog>
            <Dialog open={openFatura} onOpenChange={setOpenFatura}>
              <DialogTrigger asChild>
                <Button className="bg-brand hover:bg-brand/90 text-brand-foreground">
                  <Plus className="w-4 h-4 mr-2" /> Nova Fatura
                </Button>
              </DialogTrigger>
              <NovaFaturaModal onClose={() => setOpenFatura(false)} />
            </Dialog>
          </div>
        }
      />

      <div className="p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard label="Receita (paga)" value={brl(receita)} accent="success" />
          <MetricCard label="Custos" value={brl(custoTotal)} accent="warning" />
          <MetricCard label="Lucro líquido" value={brl(lucro)} accent={lucro >= 0 ? "brand" : "warning"} />
          <MetricCard label="Margem líquida" value={`${margem}%`} accent="info" />
        </div>

        <div className="bg-card rounded-xl border p-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Meta anual de lucro</p>
              <p className="text-xs text-muted-foreground">{brl(lucro)} de {brl(META_LUCRO_ANUAL)}</p>
            </div>
            <span className="text-2xl font-bold text-brand">{progresso}%</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-brand to-info transition-all" style={{ width: `${progresso}%` }} />
          </div>
        </div>

        <Tabs defaultValue="dre" className="space-y-4">
          <TabsList>
            <TabsTrigger value="dre">DRE</TabsTrigger>
            <TabsTrigger value="receitas">Receitas</TabsTrigger>
            <TabsTrigger value="custos">Custos</TabsTrigger>
          </TabsList>

          <TabsContent value="dre" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-card rounded-xl border p-6">
                <p className="text-sm font-semibold text-foreground mb-4">Demonstrativo do período</p>
                <DreLine label="(+) Receita bruta paga" value={receita} positive />
                <DreLine label="(−) Custos pagos" value={-custoPago} />
                <div className="border-t my-2" />
                <DreLine label="(=) Lucro líquido" value={lucro} bold positive={lucro >= 0} />
                <DreLine label="Margem líquida" value={null} extra={`${margem}%`} muted />
                <div className="border-t my-2" />
                <DreLine label="Custos fixos" value={custoFixo} muted />
                <DreLine label="Custos variáveis" value={custoVariavel} muted />
                <DreLine label="A receber (em aberto)" value={aReceber} muted />
              </div>

              <div className="bg-card rounded-xl border p-6">
                <p className="text-sm font-semibold text-foreground mb-4">Custos por categoria</p>
                <div className="space-y-3">
                  {porCategoria.length === 0 && (
                    <p className="text-sm text-muted-foreground">Nenhum custo registrado.</p>
                  )}
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
              </div>
            </div>
          </TabsContent>

          <TabsContent value="receitas">
            <div className="bg-card rounded-xl border overflow-x-auto shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-muted-foreground">
                  <tr>
                    <Th>Nº</Th><Th>Cliente</Th><Th>Serviço</Th>
                    <Th>Vencimento</Th><Th className="text-right">Valor</Th><Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {faturas.map((f, i) => (
                    <tr
                      key={f.id}
                      className={`border-t transition-colors cursor-pointer ${i % 2 ? "bg-muted/10" : ""} hover:bg-brand/5 hover:shadow-[inset_3px_0_0_0_var(--brand)]`}
                    >
                      <Td className="font-mono text-xs">{f.numero}</Td>
                      <Td className="font-medium text-foreground">{f.cliente}</Td>
                      <Td>{f.servico}</Td>
                      <Td>{new Date(f.vencimento).toLocaleDateString("pt-BR")}</Td>
                      <Td className="text-right font-semibold text-success">
                        <span className="inline-flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" />{brl(f.valor)}</span>
                      </Td>
                      <Td><StatusBadge status={f.status} /></Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="custos">
            <div className="bg-card rounded-xl border overflow-x-auto shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-muted-foreground">
                  <tr>
                    <Th>Descrição</Th><Th>Categoria</Th><Th>Tipo</Th>
                    <Th>Data</Th><Th className="text-right">Valor</Th><Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {custos.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Nenhum custo registrado.</td></tr>
                  )}
                  {custos.map((c, i) => (
                    <tr
                      key={c.id}
                      className={`border-t transition-colors ${i % 2 ? "bg-muted/10" : ""} hover:bg-brand/5`}
                    >
                      <Td className="font-medium text-foreground">
                        {c.descricao}
                        {c.fornecedor && <div className="text-xs text-muted-foreground">{c.fornecedor}</div>}
                      </Td>
                      <Td>{c.categoria}</Td>
                      <Td>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${c.tipo === "Fixo" ? "bg-info/10 text-info border-info/30" : "bg-warning/10 text-warning-foreground border-warning/30"}`}>
                          {c.tipo}
                        </span>
                      </Td>
                      <Td>{new Date(c.data).toLocaleDateString("pt-BR")}</Td>
                      <Td className="text-right font-semibold text-destructive">
                        <span className="inline-flex items-center gap-1"><TrendingDown className="w-3.5 h-3.5" />{brl(c.valor)}</span>
                      </Td>
                      <Td><StatusBadge status={c.status} /></Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
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
  return (
    <DialogContent className="max-w-lg">
      <DialogHeader><DialogTitle>Nova Fatura</DialogTitle></DialogHeader>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Cliente" className="col-span-2"><Input value={form.cliente} onChange={(e) => setForm({ ...form, cliente: e.target.value })} /></Field>
        <Field label="Vaga / Serviço" className="col-span-2"><Input value={form.servico} onChange={(e) => setForm({ ...form, servico: e.target.value })} /></Field>
        <Field label="Valor (R$)"><Input type="number" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} /></Field>
        <Field label="Vencimento"><Input type="date" value={form.vencimento} onChange={(e) => setForm({ ...form, vencimento: e.target.value })} /></Field>
        <Field label="Observações" className="col-span-2"><Textarea rows={3} value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} /></Field>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button
          className="bg-brand hover:bg-brand/90 text-brand-foreground"
          disabled={!form.cliente || !form.valor}
          onClick={() => { addFatura({ cliente: form.cliente, servico: form.servico, valor: Number(form.valor), vencimento: form.vencimento, observacoes: form.observacoes }); onClose(); }}
        >Criar fatura</Button>
      </DialogFooter>
    </DialogContent>
  );
}

function NovoCustoModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState<{
    descricao: string; categoria: CustoCategoria; tipo: CustoTipo; valor: string; data: string; status: "Pago" | "Pendente" | "Atrasado"; fornecedor: string; observacoes: string;
  }>({
    descricao: "", categoria: "Operacional", tipo: "Variável", valor: "", data: new Date().toISOString().slice(0, 10), status: "Pendente", fornecedor: "", observacoes: "",
  });
  return (
    <DialogContent className="max-w-lg">
      <DialogHeader><DialogTitle>Novo Custo</DialogTitle></DialogHeader>
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
        <Field label="Fornecedor" className="col-span-2"><Input value={form.fornecedor} onChange={(e) => setForm({ ...form, fornecedor: e.target.value })} /></Field>
        <Field label="Status">
          <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as "Pago" | "Pendente" | "Atrasado" })}>
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
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button
          className="bg-brand hover:bg-brand/90 text-brand-foreground"
          disabled={!form.descricao || !form.valor}
          onClick={() => {
            addCusto({
              descricao: form.descricao,
              categoria: form.categoria,
              tipo: form.tipo,
              valor: Number(form.valor),
              data: form.data,
              status: form.status,
              fornecedor: form.fornecedor || undefined,
              observacoes: form.observacoes || undefined,
            });
            onClose();
          }}
        >Registrar custo</Button>
      </DialogFooter>
    </DialogContent>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={`space-y-1.5 ${className}`}><Label className="text-xs">{label}</Label>{children}</div>;
}
