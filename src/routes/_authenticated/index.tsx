import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, ChevronRight, Trash2, Pencil } from "lucide-react";
import { PageHeader, MetricCard } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { addVaga, deleteVaga, useVagas, VagaStatus } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/")({
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

  const filtradas = vagas.filter(
    (v) => filtroStatus === "todos" || v.status === filtroStatus,
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
            <span className="ml-auto text-sm text-muted-foreground">{filtradas.length} vagas</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  <Th>Cargo</Th><Th>Empresa</Th>
                  <Th className="text-center">Candidatos</Th>
                  <Th>Etapa</Th>
                  <Th>Início</Th><Th>Status</Th><Th className="w-12"></Th>
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
                    <Td className="text-center font-semibold">{v.candidatos}</Td>
                    <Td><span className="text-xs px-2 py-1 rounded-full bg-brand/10 text-brand font-medium">{v.etapa}</span></Td>
                    <Td>{v.createdAt ? new Date(v.createdAt).toLocaleDateString("pt-BR") : "—"}</Td>
                    <Td><StatusBadge status={v.status} /></Td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir vaga?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser desfeita. A vaga "{v.cargo}" será removida permanentemente.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={async () => {
                                try {
                                  await deleteVaga(v.id);
                                  toast.success("Vaga excluída com sucesso.");
                                } catch {
                                  toast.error("Não foi possível excluir a vaga.");
                                }
                              }}
                            >Excluir</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </td>
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
  const [form, setForm] = useState({ cargo: "", empresa: "", quantidade: "1", receita: "", prazoGarantia: "90" });
  return (
    <DialogContent className="max-w-lg">
      <DialogHeader><DialogTitle>Nova Vaga</DialogTitle></DialogHeader>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Cargo" className="col-span-2"><Input value={form.cargo} onChange={(e) => setForm({ ...form, cargo: e.target.value })} /></Field>
        <Field label="Empresa" className="col-span-2"><Input value={form.empresa} onChange={(e) => setForm({ ...form, empresa: e.target.value })} /></Field>
        <Field label="Quantidade"><Input type="number" min="1" value={form.quantidade} onChange={(e) => setForm({ ...form, quantidade: e.target.value })} /></Field>
        <Field label="Receita por vaga (R$)"><Input type="number" min="0" step="0.01" placeholder="0,00" value={form.receita} onChange={(e) => setForm({ ...form, receita: e.target.value })} /></Field>
        <Field label="Prazo de garantia (dias)" className="col-span-2"><Input type="number" min="0" value={form.prazoGarantia} onChange={(e) => setForm({ ...form, prazoGarantia: e.target.value })} /></Field>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button
          className="bg-brand hover:bg-brand/90 text-brand-foreground"
          disabled={!form.cargo || !form.empresa}
          onClick={async () => {
            try {
              await addVaga({
                cargo: form.cargo,
                empresa: form.empresa,
                quantidade: Number(form.quantidade) || 1,
                receita: Number(form.receita) || 0,
                prazoGarantia: Number(form.prazoGarantia) || 90,
              });
              toast.success("Vaga criada e receita lançada no financeiro.");
              onClose();
            } catch {
              toast.error("Não foi possível salvar a vaga.");
            }
          }}
        >Criar vaga</Button>
      </DialogFooter>
    </DialogContent>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={`space-y-1.5 ${className}`}><Label className="text-xs">{label}</Label>{children}</div>;
}
