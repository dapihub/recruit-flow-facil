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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addCandidato, useCandidatos, useVagas } from "@/lib/store";

export const Route = createFileRoute("/candidatos")({
  head: () => ({
    meta: [
      { title: "Candidatos — RecruitFlow" },
      { name: "description", content: "Gerencie candidatos e o pipeline de seleção." },
    ],
  }),
  component: CandidatosPage,
});

function iniciais(nome: string) {
  return nome.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

function CandidatosPage() {
  const candidatos = useCandidatos();
  const vagas = useVagas();
  const [open, setOpen] = useState(false);

  const total = candidatos.length;
  const entrevista = candidatos.filter((c) => c.status === "Entrevista").length;
  const contratados = candidatos.filter((c) => c.status === "Contratado").length;
  const taxa = total ? Math.round((contratados / total) * 100) : 0;

  return (
    <div>
      <PageHeader
        title="Candidatos"
        subtitle="Visualize e acompanhe os candidatos em todas as etapas"
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-brand hover:bg-brand/90 text-brand-foreground">
                <Plus className="w-4 h-4 mr-2" /> Novo Candidato
              </Button>
            </DialogTrigger>
            <NovoCandidatoModal vagas={vagas.map((v) => v.cargo)} onClose={() => setOpen(false)} />
          </Dialog>
        }
      />

      <div className="p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard label="Total de candidatos" value={total} accent="brand" />
          <MetricCard label="Em entrevista" value={entrevista} accent="info" />
          <MetricCard label="Contratados" value={contratados} accent="success" />
          <MetricCard label="Taxa de aprovação" value={`${taxa}%`} accent="warning" />
        </div>

        <div className="bg-card rounded-xl border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <Th>Candidato</Th><Th>E-mail</Th><Th>Vaga</Th>
                <Th>Etapa</Th><Th>Próxima ação</Th>
                <Th className="text-center">Pontuação</Th><Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {candidatos.map((c) => (
                <tr key={c.id} className="border-t hover:bg-muted/20">
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-brand text-brand-foreground flex items-center justify-center text-xs font-bold">
                        {iniciais(c.nome)}
                      </div>
                      <span className="font-medium text-foreground">{c.nome}</span>
                    </div>
                  </Td>
                  <Td className="text-muted-foreground">{c.email}</Td>
                  <Td>{c.vaga}</Td>
                  <Td>{c.etapa}</Td>
                  <Td className="text-muted-foreground">{c.proximaAcao}</Td>
                  <Td className="text-center">
                    <span className={`font-bold ${c.pontuacao >= 8 ? "text-success" : c.pontuacao >= 6 ? "text-info" : "text-muted-foreground"}`}>
                      {c.pontuacao.toFixed(1)}
                    </span>
                  </Td>
                  <Td><StatusBadge status={c.status} /></Td>
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

function NovoCandidatoModal({ vagas, onClose }: { vagas: string[]; onClose: () => void }) {
  const [form, setForm] = useState({ nome: "", email: "", telefone: "", vaga: vagas[0] ?? "", linkedin: "", observacoes: "" });
  return (
    <DialogContent className="max-w-lg">
      <DialogHeader><DialogTitle>Novo Candidato</DialogTitle></DialogHeader>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Nome" className="col-span-2"><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></Field>
        <Field label="E-mail"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
        <Field label="Telefone"><Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} /></Field>
        <Field label="Vaga" className="col-span-2">
          <Select value={form.vaga} onValueChange={(v) => setForm({ ...form, vaga: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{vagas.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="LinkedIn" className="col-span-2"><Input value={form.linkedin} onChange={(e) => setForm({ ...form, linkedin: e.target.value })} /></Field>
        <Field label="Observações" className="col-span-2"><Textarea rows={3} value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} /></Field>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button
          className="bg-brand hover:bg-brand/90 text-brand-foreground"
          disabled={!form.nome || !form.email}
          onClick={() => { addCandidato(form); onClose(); }}
        >Adicionar</Button>
      </DialogFooter>
    </DialogContent>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={`space-y-1.5 ${className}`}><Label className="text-xs">{label}</Label>{children}</div>;
}
