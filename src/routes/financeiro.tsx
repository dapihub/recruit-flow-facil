import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader, MetricCard } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { addFatura, useFaturas } from "@/lib/store";

export const Route = createFileRoute("/financeiro")({
  head: () => ({
    meta: [
      { title: "Financeiro — RecruitFlow" },
      { name: "description", content: "Acompanhe receitas, faturas e metas financeiras da operação." },
    ],
  }),
  component: FinanceiroPage,
});

const META_ANUAL = 800000;

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function FinanceiroPage() {
  const faturas = useFaturas();
  const [open, setOpen] = useState(false);

  const receita = faturas.filter((f) => f.status === "Pago").reduce((s, f) => s + f.valor, 0);
  const aReceber = faturas.filter((f) => f.status !== "Pago").reduce((s, f) => s + f.valor, 0);
  const pagas = faturas.filter((f) => f.status === "Pago").length;
  const ticket = pagas ? receita / pagas : 0;
  const progresso = Math.min(100, Math.round((receita / META_ANUAL) * 100));

  return (
    <div>
      <PageHeader
        title="Financeiro"
        subtitle="Receitas, faturas e metas da operação"
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-brand hover:bg-brand/90 text-brand-foreground">
                <Plus className="w-4 h-4 mr-2" /> Nova Fatura
              </Button>
            </DialogTrigger>
            <NovaFaturaModal onClose={() => setOpen(false)} />
          </Dialog>
        }
      />

      <div className="p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard label="Receita do mês" value={brl(receita)} accent="success" />
          <MetricCard label="A receber" value={brl(aReceber)} accent="warning" />
          <MetricCard label="Contratações faturadas" value={pagas} accent="brand" />
          <MetricCard label="Ticket médio" value={brl(ticket)} accent="info" />
        </div>

        <div className="bg-card rounded-xl border p-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Meta anual</p>
              <p className="text-xs text-muted-foreground">{brl(receita)} de {brl(META_ANUAL)}</p>
            </div>
            <span className="text-2xl font-bold text-brand">{progresso}%</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-brand to-info transition-all" style={{ width: `${progresso}%` }} />
          </div>
        </div>

        <div className="bg-card rounded-xl border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <Th>Nº</Th><Th>Cliente</Th><Th>Serviço</Th>
                <Th>Vencimento</Th><Th className="text-right">Valor</Th><Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {faturas.map((f) => (
                <tr key={f.id} className="border-t hover:bg-muted/20">
                  <Td className="font-mono text-xs">{f.numero}</Td>
                  <Td className="font-medium text-foreground">{f.cliente}</Td>
                  <Td>{f.servico}</Td>
                  <Td>{new Date(f.vencimento).toLocaleDateString("pt-BR")}</Td>
                  <Td className="text-right font-semibold">{brl(f.valor)}</Td>
                  <Td><StatusBadge status={f.status} /></Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
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

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={`space-y-1.5 ${className}`}><Label className="text-xs">{label}</Label>{children}</div>;
}
