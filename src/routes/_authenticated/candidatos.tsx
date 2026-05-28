import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect, useRef } from "react";
import { Plus, Trash2, ChevronRight, ChevronLeft, Search, Briefcase, Phone, Mail, Calendar, MessageSquare, X, Clock } from "lucide-react";
import { PageHeader, MetricCard } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import {
  addCandidato, deleteCandidato, updateCandidato, updateProximaAcao,
  addInteracao, deleteInteracao, loadInteracoesCandidato, useInteracoesCandidato,
  useCandidatos, useVagas,
  type CandidatoStatus, type InteracaoTipo, INTERACAO_TIPOS, type Candidato,
} from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/candidatos")({
  head: () => ({ meta: [{ title: "Candidatos — DAPI HUB" }] }),
  component: CandidatosPage,
});

const COLUNAS: { status: CandidatoStatus; label: string; cor: string; corBadge: string }[] = [
  { status: "Triagem",    label: "Triagem",    cor: "border-t-warning",     corBadge: "bg-warning/20 text-warning-foreground" },
  { status: "Entrevista", label: "Entrevista", cor: "border-t-info",        corBadge: "bg-info/20 text-info" },
  { status: "Contratado", label: "Contratado", cor: "border-t-success",     corBadge: "bg-success/20 text-success" },
  { status: "Reprovado",  label: "Reprovado",  cor: "border-t-destructive", corBadge: "bg-destructive/15 text-destructive" },
];
const ORDEM_STATUS: CandidatoStatus[] = ["Triagem", "Entrevista", "Contratado", "Reprovado"];
const iniciais = (nome: string) => nome.split(" ").filter(Boolean).slice(0, 2).map(n => n[0]).join("").toUpperCase();

function CandidatosPage() {
  const candidatos = useCandidatos();
  const vagas = useVagas();
  const [open, setOpen] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtroVaga, setFiltroVaga] = useState("todas");
  const [candidatoAtivo, setCandidatoAtivo] = useState<Candidato | null>(null);

  // Drag & drop state
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<CandidatoStatus | null>(null);

  const hoje = new Date().toISOString().slice(0, 10);
  const total = candidatos.length;
  const entrevista = candidatos.filter(c => c.status === "Entrevista").length;
  const contratados = candidatos.filter(c => c.status === "Contratado").length;
  const taxa = total ? Math.round((contratados / total) * 100) : 0;

  const vagasUnicas = useMemo(() => Array.from(new Set(candidatos.map(c => c.vaga).filter(Boolean))).sort(), [candidatos]);

  const filtrados = useMemo(() =>
    candidatos.filter(c => {
      const matchBusca = !busca || c.nome.toLowerCase().includes(busca.toLowerCase()) || c.vaga.toLowerCase().includes(busca.toLowerCase());
      const matchVaga = filtroVaga === "todas" || c.vaga === filtroVaga;
      return matchBusca && matchVaga;
    }), [candidatos, busca, filtroVaga]);

  const handleDragStart = (e: React.DragEvent, candidatoId: string) => {
    setDraggingId(candidatoId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", candidatoId);
  };

  const handleDragOver = (e: React.DragEvent, status: CandidatoStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverCol(status);
  };

  const handleDrop = async (e: React.DragEvent, novoStatus: CandidatoStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    const candidato = candidatos.find(c => c.id === id);
    if (!candidato || candidato.status === novoStatus) {
      setDraggingId(null);
      setDragOverCol(null);
      return;
    }
    try {
      await updateCandidato(id, { status: novoStatus });
      toast.success(`${candidato.nome} movido para ${novoStatus}`);
    } catch {
      toast.error("Erro ao mover candidato.");
    }
    setDraggingId(null);
    setDragOverCol(null);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverCol(null);
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <PageHeader title="Candidatos" subtitle="Pipeline de seleção"
          action={
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="bg-brand hover:bg-brand/90 text-brand-foreground"><Plus className="w-4 h-4 mr-2" /> Novo Candidato</Button>
              </DialogTrigger>
              <NovoCandidatoModal vagas={vagas.map(v => v.cargo)} onClose={() => setOpen(false)} />
            </Dialog>
          }
        />

        <div className="p-6 space-y-4 flex-1 overflow-y-auto">
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard label="Total" value={total} accent="brand" />
            <MetricCard label="Em entrevista" value={entrevista} accent="info" />
            <MetricCard label="Contratados" value={contratados} accent="success" />
            <MetricCard label="Taxa aprovação" value={`${taxa}%`} accent="warning" />
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar..." value={busca} onChange={e => setBusca(e.target.value)} className="pl-9 h-9" />
            </div>
            <Select value={filtroVaga} onValueChange={setFiltroVaga}>
              <SelectTrigger className="w-[200px] h-9 bg-muted/40 border-border/60"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as vagas</SelectItem>
                {vagasUnicas.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
            {(busca || filtroVaga !== "todas") && (
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => { setBusca(""); setFiltroVaga("todas"); }}>Limpar</Button>
            )}
            <span className="ml-auto text-xs text-muted-foreground hidden sm:block">
              💡 Arraste os cards para mover entre etapas
            </span>
          </div>

          {/* Kanban com drag & drop */}
          <div className="flex gap-4 overflow-x-auto pb-4">
            {COLUNAS.map(({ status, label, cor, corBadge }) => {
              const cards = filtrados.filter(c => c.status === status);
              const isDropTarget = dragOverCol === status && draggingId !== null;
              const draggingCandidato = candidatos.find(c => c.id === draggingId);
              const isDifferentCol = draggingCandidato?.status !== status;

              return (
                <div
                  key={status}
                  onDragOver={e => handleDragOver(e, status)}
                  onDrop={e => handleDrop(e, status)}
                  onDragLeave={() => setDragOverCol(null)}
                  className={`flex-shrink-0 w-[280px] bg-card rounded-2xl border border-border/60 border-t-2 ${cor} shadow-sm flex flex-col transition-all duration-150 ${
                    isDropTarget && isDifferentCol ? "ring-2 ring-brand/40 bg-brand/5 scale-[1.01]" : ""
                  }`}
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
                    <span className="text-sm font-semibold">{label}</span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${corBadge}`}>{cards.length}</span>
                  </div>

                  {/* Drop zone hint */}
                  {isDropTarget && isDifferentCol && (
                    <div className="mx-3 mt-3 rounded-xl border-2 border-dashed border-brand/40 bg-brand/5 py-4 text-center">
                      <p className="text-xs text-brand font-medium">Soltar aqui → {label}</p>
                    </div>
                  )}

                  <div className="flex-1 p-3 space-y-2.5 overflow-y-auto max-h-[calc(100vh-420px)]">
                    {cards.length === 0 && !isDropTarget && <p className="text-xs text-muted-foreground text-center py-8">Nenhum candidato</p>}
                    {cards.map(c => {
                      const idx = ORDEM_STATUS.indexOf(c.status);
                      const acaoVencida = c.proximaAcaoData && c.proximaAcaoData <= hoje;
                      const isDragging = draggingId === c.id;
                      return (
                        <div
                          key={c.id}
                          draggable
                          onDragStart={e => handleDragStart(e, c.id)}
                          onDragEnd={handleDragEnd}
                          className={`bg-background rounded-xl border p-3.5 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing select-none ${
                            isDragging ? "opacity-40 scale-95" : ""
                          } ${acaoVencida ? "border-destructive/40" : "border-border/60"}`}
                          onClick={() => !isDragging && setCandidatoAtivo(c)}
                        >
                          <div className="flex items-start gap-3 mb-2.5">
                            <div className="w-8 h-8 rounded-full bg-brand text-brand-foreground flex items-center justify-center text-xs font-bold shrink-0">{iniciais(c.nome)}</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate">{c.nome}</p>
                              <p className="text-[11px] text-muted-foreground truncate">{c.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 mb-2.5">
                            <Briefcase className="w-3 h-3 text-muted-foreground shrink-0" />
                            <span className="text-[11px] text-muted-foreground truncate">{c.vaga}</span>
                          </div>
                          {/* Pontuação */}
                          <div className="flex items-center gap-2 mb-2.5">
                            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                              <div className={`h-full rounded-full ${c.pontuacao >= 8 ? "bg-success" : c.pontuacao >= 6 ? "bg-info" : "bg-muted-foreground/30"}`} style={{ width: `${c.pontuacao * 10}%` }} />
                            </div>
                            <span className={`text-[11px] font-bold tabular-nums ${c.pontuacao >= 8 ? "text-success" : c.pontuacao >= 6 ? "text-info" : "text-muted-foreground"}`}>{c.pontuacao.toFixed(1)}</span>
                          </div>
                          {/* Próxima ação */}
                          {c.proximaAcao && (
                            <div className={`flex items-center gap-1.5 mb-2.5 text-[11px] rounded-md px-2 py-1 ${acaoVencida ? "bg-destructive/10 text-destructive" : "bg-muted/50 text-muted-foreground"}`}>
                              <Clock className="w-3 h-3 shrink-0" />
                              <span className="truncate">{c.proximaAcao}</span>
                              {c.proximaAcaoData && <span className="ml-auto shrink-0 font-medium">{new Date(c.proximaAcaoData + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</span>}
                            </div>
                          )}
                          {/* Ações */}
                          <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                            <Button variant="outline" size="sm" className="h-7 px-2 text-[11px] flex-1 gap-1" disabled={idx === 0}
                              onClick={async e => { e.stopPropagation(); try { await updateCandidato(c.id, { status: ORDEM_STATUS[idx - 1] }); toast.success("Recuado."); } catch { toast.error("Erro."); } }}>
                              <ChevronLeft className="w-3 h-3" /> Recuar
                            </Button>
                            <Button variant="outline" size="sm" className="h-7 px-2 text-[11px] flex-1 gap-1 border-brand/30 text-brand hover:bg-brand/5" disabled={idx === ORDEM_STATUS.length - 1}
                              onClick={async e => { e.stopPropagation(); try { await updateCandidato(c.id, { status: ORDEM_STATUS[idx + 1] }); toast.success("Avançado."); } catch { toast.error("Erro."); } }}>
                              Avançar <ChevronRight className="w-3 h-3" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0" onClick={e => e.stopPropagation()}>
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir candidato?</AlertDialogTitle><AlertDialogDescription>{c.nome} será removido permanentemente.</AlertDialogDescription></AlertDialogHeader>
                                <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={async () => { try { await deleteCandidato(c.id); toast.success("Excluído."); } catch { toast.error("Erro."); } }}>Excluir</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Painel lateral do candidato */}
      {candidatoAtivo && (
        <CandidatoSidePanel candidato={candidatoAtivo} onClose={() => setCandidatoAtivo(null)}
          onUpdate={c => setCandidatoAtivo(c)} hoje={hoje} />
      )}

      {/* Modal novo candidato */}
      <Dialog open={false}><NovoCandidatoModal vagas={[]} onClose={() => {}} /></Dialog>
    </div>
  );
}

function CandidatoSidePanel({ candidato, onClose, onUpdate, hoje }: { candidato: Candidato; onClose: () => void; onUpdate: (c: Candidato) => void; hoje: string }) {
  const interacoes = useInteracoesCandidato(candidato.id);
  const [novaInteracao, setNovaInteracao] = useState({ tipo: "Ligação" as InteracaoTipo, descricao: "", data: hoje });
  const [novaAcao, setNovaAcao] = useState({ acao: candidato.proximaAcao ?? "", data: candidato.proximaAcaoData ?? "" });
  const [salvandoAcao, setSalvandoAcao] = useState(false);

  useEffect(() => { loadInteracoesCandidato(candidato.id); }, [candidato.id]);
  useEffect(() => {
    setNovaAcao({ acao: candidato.proximaAcao ?? "", data: candidato.proximaAcaoData ?? "" });
  }, [candidato.id, candidato.proximaAcao, candidato.proximaAcaoData]);

  const tipoIcon: Record<InteracaoTipo, React.ReactNode> = {
    "Ligação": <Phone className="w-3.5 h-3.5" />,
    "E-mail": <Mail className="w-3.5 h-3.5" />,
    "Entrevista": <Calendar className="w-3.5 h-3.5" />,
    "Reunião": <Calendar className="w-3.5 h-3.5" />,
    "Nota": <MessageSquare className="w-3.5 h-3.5" />,
    "Outro": <MessageSquare className="w-3.5 h-3.5" />,
  };

  return (
    <div className="w-[380px] shrink-0 border-l border-border/60 bg-card flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-brand text-brand-foreground flex items-center justify-center text-xs font-bold">
            {iniciais(candidato.nome)}
          </div>
          <div>
            <p className="text-sm font-semibold">{candidato.nome}</p>
            <p className="text-xs text-muted-foreground">{candidato.vaga}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}><X className="w-4 h-4" /></Button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Próxima ação */}
        <div className="bg-muted/40 rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Próxima ação</p>
          <Input placeholder="Ex: Ligar para confirmar entrevista" value={novaAcao.acao} onChange={e => setNovaAcao(a => ({ ...a, acao: e.target.value }))} className="h-9 text-sm" />
          <div className="flex gap-2">
            <Input type="date" value={novaAcao.data} onChange={e => setNovaAcao(a => ({ ...a, data: e.target.value }))} className="h-9 flex-1 text-sm" />
            <Button size="sm" className="h-9 bg-brand hover:bg-brand/90 text-brand-foreground" disabled={salvandoAcao}
              onClick={async () => {
                setSalvandoAcao(true);
                try {
                  await updateProximaAcao(candidato.id, novaAcao.acao, novaAcao.data || null);
                  onUpdate({ ...candidato, proximaAcao: novaAcao.acao, proximaAcaoData: novaAcao.data || null });
                  toast.success("Ação salva.");
                } catch { toast.error("Erro ao salvar."); }
                finally { setSalvandoAcao(false); }
              }}>Salvar</Button>
          </div>
        </div>

        {/* Registrar interação */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Registrar interação</p>
          <div className="flex gap-2">
            <Select value={novaInteracao.tipo} onValueChange={v => setNovaInteracao(i => ({ ...i, tipo: v as InteracaoTipo }))}>
              <SelectTrigger className="h-9 w-[130px]"><SelectValue /></SelectTrigger>
              <SelectContent>{INTERACAO_TIPOS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
            <Input type="date" value={novaInteracao.data} onChange={e => setNovaInteracao(i => ({ ...i, data: e.target.value }))} className="h-9 flex-1" />
          </div>
          <Textarea placeholder="Descreva o que foi conversado..." rows={2} value={novaInteracao.descricao} onChange={e => setNovaInteracao(i => ({ ...i, descricao: e.target.value }))} className="text-sm resize-none" />
          <Button size="sm" variant="outline" className="w-full h-9 text-sm" disabled={!novaInteracao.descricao}
            onClick={async () => {
              try {
                await addInteracao({ candidatoId: candidato.id, tipo: novaInteracao.tipo, data: novaInteracao.data, descricao: novaInteracao.descricao });
                setNovaInteracao(i => ({ ...i, descricao: "" }));
                toast.success("Interação registrada.");
              } catch { toast.error("Erro ao registrar."); }
            }}>+ Registrar</Button>
        </div>

        {/* Timeline */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Histórico ({interacoes.length})</p>
          {interacoes.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Nenhuma interação registrada</p>}
          {interacoes.map(i => (
            <div key={i.id} className="flex gap-3 group">
              <div className="flex flex-col items-center">
                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0">{tipoIcon[i.tipo]}</div>
                <div className="w-px flex-1 bg-border/40 mt-1" />
              </div>
              <div className="flex-1 pb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-foreground">{i.tipo}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground">{new Date(i.data + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "2-digit" })}</span>
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                      onClick={async () => { try { await deleteInteracao(i.id); toast.success("Removido."); } catch { toast.error("Erro."); } }}>
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{i.descricao}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function NovoCandidatoModal({ vagas, onClose }: { vagas: string[]; onClose: () => void }) {
  const [form, setForm] = useState({ nome: "", email: "", telefone: "", vaga: vagas[0] ?? "", linkedin: "", observacoes: "" });
  return (
    <DialogContent className="max-w-lg">
      <DialogHeader><DialogTitle>Novo Candidato</DialogTitle></DialogHeader>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1.5"><Label className="text-xs">Nome</Label><Input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} /></div>
        <div className="space-y-1.5"><Label className="text-xs">E-mail</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
        <div className="space-y-1.5"><Label className="text-xs">Telefone</Label><Input value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} /></div>
        <div className="col-span-2 space-y-1.5"><Label className="text-xs">Vaga</Label>
          <Select value={form.vaga} onValueChange={v => setForm({ ...form, vaga: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{vagas.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="col-span-2 space-y-1.5"><Label className="text-xs">LinkedIn</Label><Input value={form.linkedin} onChange={e => setForm({ ...form, linkedin: e.target.value })} /></div>
        <div className="col-span-2 space-y-1.5"><Label className="text-xs">Observações</Label><Textarea rows={2} value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} /></div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button className="bg-brand hover:bg-brand/90 text-brand-foreground" disabled={!form.nome || !form.email}
          onClick={async () => {
            try { await addCandidato(form); toast.success("Candidato adicionado."); onClose(); }
            catch { toast.error("Erro ao salvar."); }
          }}>Adicionar</Button>
      </DialogFooter>
    </DialogContent>
  );
}
