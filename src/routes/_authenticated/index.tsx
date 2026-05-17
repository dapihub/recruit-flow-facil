import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, ChevronRight, Trash2, Pencil } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { addVaga, deleteVaga, updateVaga, useVagas, useFaturas, VagaStatus, Vaga } from "@/lib/store";
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
  const faturas = useFaturas();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");

  const statusOrder: Record<string, number> = { "Aberta": 0, "Em processo": 1, "Fechada": 2, "Encerrada": 3 };
  const filtradas = vagas
    .filter((v) => filtroStatus === "todos" || v.status === filtroStatus)
    .slice()
    .sort((a, b) => {
      const sa = statusOrder[a.status] ?? 99;
      const sb = statusOrder[b.status] ?? 99;
      if (sa !== sb) return sa - sb;
      return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
    });

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
              <Button className="bg-brand hover:bg-brand/90 text-brand-foreground rounded-xl px-5 shadow-sm">
                <Plus className="w-4 h-4 mr-2" /> Nova Vaga
              </Button>
            </DialogTrigger>
            <NovaVagaModal onClose={() => setOpen(false)} />
          </Dialog>
        }
      />

      <div className="p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Kpi label="Vagas abertas" value={abertas} hint="Recebendo candidaturas" color="success" />
          <Kpi label="Em processo" value={emProcesso} hint="Entrevistas em andamento" color="info" />
          <Kpi label="Total de candidatos" value={totalCand} hint="Em todas as vagas" color="brand" />
          <Kpi label="Taxa de preenchimento" value={`${taxa}%`} hint="Vagas fechadas / total" color="warning" />
        </div>

        <div className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden">
          <div className="flex flex-wrap items-center gap-3 px-6 py-4 border-b border-border/60">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Filtros</span>
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="w-[180px] h-9 rounded-lg bg-muted/40 border-border/60"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                {STATUS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <span className="ml-auto text-xs font-medium text-muted-foreground">{filtradas.length} vagas encontradas</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-muted/30 text-left">
                  <Th>Cargo</Th><Th>Empresa</Th>
                  <Th className="text-right">Valor</Th>
                  <Th>Etapa</Th>
                  <Th>Início</Th><Th>Status</Th><Th className="w-24"></Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filtradas.map((v) => (
                  <tr
                    key={v.id}
                    onClick={() => navigate({ to: "/vagas/$vagaId", params: { vagaId: v.id } })}
                    className="group cursor-pointer transition-colors hover:bg-muted/30"
                  >
                    <Td className="font-semibold text-foreground group-hover:text-brand transition-colors">{v.cargo}</Td>
                    <Td className="text-muted-foreground">{v.empresa}</Td>
                    <Td className="text-right font-semibold tabular-nums text-foreground">{(() => {
                      const total = faturas.filter((f) => f.vagaId === v.id).reduce((s, f) => s + (f.valor ?? 0), 0);
                      return total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
                    })()}</Td>
                    <Td><EtapaBadge etapa={v.etapa} /></Td>
                    <Td className="text-muted-foreground">{v.createdAt ? new Date(v.createdAt).toLocaleDateString("pt-BR") : "—"}</Td>
                    <Td><StatusBadge status={v.status} /></Td>
                    <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                        <EditarVagaButton vaga={v} />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
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
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    await deleteVaga(v.id);
                                    toast.success("Vaga excluída com sucesso.");
                                  } catch (err: any) {
                                    console.error("deleteVaga failed", err);
                                    toast.error(err?.message ?? "Não foi possível excluir a vaga.");
                                  }
                                }}
                              >Excluir</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
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
  return <th className={`text-left font-bold px-4 py-3 text-[10px] uppercase tracking-widest text-muted-foreground ${className}`}>{children}</th>;
}
function Td({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-4 text-foreground/80 ${className}`}>{children}</td>;
}

const KPI_BAR: Record<string, string> = {
  brand: "bg-brand",
  success: "bg-success",
  warning: "bg-warning",
  info: "bg-info",
};

function Kpi({ label, value, hint, color }: { label: string; value: string | number; hint?: string; color: "brand" | "success" | "warning" | "info" }) {
  return (
    <div className="relative bg-card rounded-2xl border border-border/60 p-6 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-1 opacity-20 ${KPI_BAR[color]}`} />
      <div className={`absolute top-0 left-0 h-1 w-12 ${KPI_BAR[color]}`} />
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="text-3xl font-bold mt-2 text-foreground tabular-nums">{value}</p>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}

const ETAPA_COLORS: Record<string, string> = {
  "Briefing": "bg-info/15 text-info",
  "Candidatos em triagem": "bg-brand/15 text-brand",
  "Em Garantia": "bg-warning/20 text-warning-foreground",
  "Finalizada": "bg-muted text-muted-foreground",
};

function EtapaBadge({ etapa }: { etapa: string }) {
  const cls = ETAPA_COLORS[etapa] ?? "bg-muted text-muted-foreground";
  return <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-tight ${cls}`}>{etapa}</span>;
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

function EditarVagaButton({ vaga }: { vaga: Vaga }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    cargo: vaga.cargo,
    empresa: vaga.empresa,
    quantidade: String(vaga.briefing?.quantidade ?? 1),
    prazoGarantia: String(vaga.prazoGarantia ?? 90),
    createdAt: vaga.createdAt ? vaga.createdAt.slice(0, 10) : "",
    prazo: vaga.prazo ? vaga.prazo.slice(0, 10) : "",
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) {
          setForm({
            cargo: vaga.cargo,
            empresa: vaga.empresa,
            quantidade: String(vaga.briefing?.quantidade ?? 1),
            prazoGarantia: String(vaga.prazoGarantia ?? 90),
            createdAt: vaga.createdAt ? vaga.createdAt.slice(0, 10) : "",
            prazo: vaga.prazo ? vaga.prazo.slice(0, 10) : "",
          });
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-brand">
          <Pencil className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Editar Vaga</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Cargo" className="col-span-2"><Input value={form.cargo} onChange={(e) => setForm({ ...form, cargo: e.target.value })} /></Field>
          <Field label="Empresa" className="col-span-2"><Input value={form.empresa} onChange={(e) => setForm({ ...form, empresa: e.target.value })} /></Field>
          <Field label="Quantidade"><Input type="number" min="1" value={form.quantidade} onChange={(e) => setForm({ ...form, quantidade: e.target.value })} /></Field>
          <Field label="Prazo de garantia (dias)"><Input type="number" min="0" value={form.prazoGarantia} onChange={(e) => setForm({ ...form, prazoGarantia: e.target.value })} /></Field>
          <Field label="Início"><Input type="date" value={form.createdAt} onChange={(e) => setForm({ ...form, createdAt: e.target.value })} /></Field>
          <Field label="Finalizada em"><Input type="date" value={form.prazo} onChange={(e) => setForm({ ...form, prazo: e.target.value })} /></Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button
            className="bg-brand hover:bg-brand/90 text-brand-foreground"
            disabled={!form.cargo || !form.empresa}
            onClick={async () => {
              try {
                const novaQtd = Number(form.quantidade) || 1;
                const briefingAtualizado = { ...(vaga.briefing ?? {} as any), quantidade: novaQtd };
                await updateVaga(vaga.id, {
                  cargo: form.cargo,
                  empresa: form.empresa,
                  prazoGarantia: Number(form.prazoGarantia) || 90,
                  briefing: briefingAtualizado,
                  createdAt: form.createdAt ? new Date(form.createdAt + "T12:00:00").toISOString() : vaga.createdAt,
                  prazo: form.prazo || vaga.prazo,
                });
                toast.success("Vaga atualizada.");
                setOpen(false);
              } catch {
                toast.error("Não foi possível atualizar a vaga.");
              }
            }}
          >Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
