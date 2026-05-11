import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, ChevronRight } from "lucide-react";
import { PageHeader, MetricCard } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addVaga, useVagas, VagaStatus } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Vagas — DAPI HUB" },
      { name: "description", content: "Gerencie todas as vagas em aberto e seu pipeline de recrutamento." },
    ],
  }),
  component: VagasPage,
});

const STATUS: VagaStatus[] = ["Aberta", "Em processo", "Fechada", "Encerrada"];

function VagasPage() {
  const vagas = useVagas();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [filtroArea, setFiltroArea] = useState<string>("todos");

  const areas = useMemo(() => Array.from(new Set(vagas.map((v) => v.area))), [vagas]);

  const filtradas = vagas.filter(
    (v) =>
      (filtroStatus === "todos" || v.status === filtroStatus) &&
      (filtroArea === "todos" || v.area === filtroArea),
  );

  const abertas = vagas.filter((v) => v.status === "Aberta").length;
  const emProcesso = vagas.filter((v) => v.status === "Em processo").length;
  const totalCand = vagas.reduce((s, v) => s + v.candidatos, 0);
  const fechadas = vagas.filter((v) => v.status === "Fechada").length;
  const taxa = vagas.length ? Math.round((fechadas / vagas.length) * 100) : 0;

  return (
    <div>
      <PageHeader
        title="Vagas"
        subtitle="Acompanhe e gerencie todas as posições em aberto"
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-brand hover:bg-brand/90 text-brand-foreground">
                <Plus className="w-4 h-4 mr-2" /> Nova Vaga
              </Button>
            </DialogTrigger>
            <NovaVagaModal onClose={() => setOpen(false)} />
          </Dialog>
        }
      />

      <div className="p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard label="Vagas abertas" value={abertas} accent="success" hint="Recebendo candidaturas" />
          <MetricCard label="Em processo" value={emProcesso} accent="info" hint="Entrevistas em andamento" />
          <MetricCard label="Total de candidatos" value={totalCand} accent="brand" hint="Em todas as vagas" />
          <MetricCard label="Taxa de preenchimento" value={`${taxa}%`} accent="warning" hint="Vagas fechadas / total" />
        </div>

        <div className="bg-card rounded-xl border shadow-sm">
          <div className="flex flex-wrap items-center gap-3 p-4 border-b">
            <span className="text-sm font-medium text-muted-foreground">Filtros:</span>
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                {STATUS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filtroArea} onValueChange={setFiltroArea}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Área" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas as áreas</SelectItem>
                {areas.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
            <span className="ml-auto text-sm text-muted-foreground">{filtradas.length} vagas</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  <Th>Cargo</Th><Th>Empresa</Th><Th>Área</Th>
                  <Th className="text-center">Candidatos</Th>
                  <Th>Etapa</Th>
                  <Th>Prazo</Th><Th>Status</Th><Th className="w-12"></Th>
                </tr>
              </thead>
              <tbody>
                {filtradas.map((v, i) => (
                  <tr
                    key={v.id}
                    onClick={() => navigate({ to: "/vagas/$vagaId", params: { vagaId: v.id } })}
                    className={`border-t transition-colors cursor-pointer ${i % 2 ? "bg-muted/10" : ""} hover:bg-brand/5 hover:shadow-[inset_3px_0_0_0_var(--brand)]`}
                  >
                    <Td className="font-medium text-foreground">{v.cargo}</Td>
                    <Td>{v.empresa}</Td>
                    <Td>{v.area}</Td>
                    <Td className="text-center font-semibold">{v.candidatos}</Td>
                    <Td><span className="text-xs px-2 py-1 rounded-full bg-brand/10 text-brand font-medium">{v.etapa}</span></Td>
                    <Td>{new Date(v.prazo).toLocaleDateString("pt-BR")}</Td>
                    <Td><StatusBadge status={v.status} /></Td>
                    <Td><ChevronRight className="w-4 h-4 text-muted-foreground" /></Td>
                  </tr>
                ))}
                {filtradas.length === 0 && (
                  <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">Nenhuma vaga encontrada</td></tr>
                )}
              </tbody>
            </table>
          </div>
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

function NovaVagaModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ cargo: "", empresa: "", area: "", descricao: "", prazo: "", salario: "", regime: "CLT" as "CLT" | "PJ" | "Híbrido" });
  return (
    <DialogContent className="max-w-lg">
      <DialogHeader><DialogTitle>Nova Vaga</DialogTitle></DialogHeader>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Cargo" className="col-span-2"><Input value={form.cargo} onChange={(e) => setForm({ ...form, cargo: e.target.value })} /></Field>
        <Field label="Empresa"><Input value={form.empresa} onChange={(e) => setForm({ ...form, empresa: e.target.value })} /></Field>
        <Field label="Área"><Input value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} /></Field>
        <Field label="Prazo"><Input type="date" value={form.prazo} onChange={(e) => setForm({ ...form, prazo: e.target.value })} /></Field>
        <Field label="Salário"><Input placeholder="R$ 0,00" value={form.salario} onChange={(e) => setForm({ ...form, salario: e.target.value })} /></Field>
        <Field label="Regime" className="col-span-2">
          <Select value={form.regime} onValueChange={(v) => setForm({ ...form, regime: v as never })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="CLT">CLT</SelectItem>
              <SelectItem value="PJ">PJ</SelectItem>
              <SelectItem value="Híbrido">Híbrido</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Descrição" className="col-span-2"><Textarea rows={3} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} /></Field>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button
          className="bg-brand hover:bg-brand/90 text-brand-foreground"
          disabled={!form.cargo || !form.empresa}
          onClick={() => { addVaga(form); onClose(); }}
        >Criar vaga</Button>
      </DialogFooter>
    </DialogContent>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={`space-y-1.5 ${className}`}><Label className="text-xs">{label}</Label>{children}</div>;
}
