import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Search, Briefcase, Star, Users, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select as Select2, SelectContent as SC2, SelectItem as SI2, SelectTrigger as ST2, SelectValue as SV2 } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useCandidatos, useVagas, updateCandidato } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/talentos")({
  head: () => ({ meta: [{ title: "Banco de Talentos — DAPI HUB" }] }),
  component: TalentosPage,
});

const iniciais = (nome: string) => nome.split(" ").filter(Boolean).slice(0, 2).map(n => n[0]).join("").toUpperCase();

function TalentosPage() {
  const candidatos = useCandidatos();
  const vagas = useVagas();
  const [busca, setBusca] = useState("");
  const [filtroMin, setFiltroMin] = useState("0");
  const [reaplicar, setReaplicar] = useState<{ candidatoId: string; nome: string } | null>(null);
  const [vagaEscolhida, setVagaEscolhida] = useState("");

  // Banco = todos reprovados + contratados de vagas antigas
  const banco = useMemo(() =>
    candidatos
      .filter(c => c.status === "Reprovado" || c.status === "Contratado")
      .filter(c => {
        const matchBusca = !busca || c.nome.toLowerCase().includes(busca.toLowerCase()) ||
          c.vaga.toLowerCase().includes(busca.toLowerCase()) ||
          (c.observacoes ?? "").toLowerCase().includes(busca.toLowerCase());
        const matchMin = c.pontuacao >= Number(filtroMin);
        return matchBusca && matchMin;
      })
      .sort((a, b) => b.pontuacao - a.pontuacao),
    [candidatos, busca, filtroMin]);

  const vagasAbertas = vagas.filter(v => v.status === "Aberta" || v.status === "Em processo");
  const totalBanco = candidatos.filter(c => c.status === "Reprovado" || c.status === "Contratado").length;
  const mediaScore = totalBanco > 0 ? candidatos.filter(c => c.status === "Reprovado").reduce((s, c) => s + c.pontuacao, 0) / Math.max(candidatos.filter(c => c.status === "Reprovado").length, 1) : 0;

  return (
    <div>
      <PageHeader title="Banco de Talentos" subtitle="Candidatos disponíveis para reaproveitamento" />
      <div className="p-8 space-y-6">

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-4">
          <div className="relative bg-card rounded-2xl border border-border/60 p-5 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-brand" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total no banco</p>
            <p className="text-2xl font-bold text-brand mt-1">{totalBanco}</p>
          </div>
          <div className="relative bg-card rounded-2xl border border-border/60 p-5 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-warning" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Score médio</p>
            <p className="text-2xl font-bold text-warning mt-1">{mediaScore.toFixed(1)}</p>
          </div>
          <div className="relative bg-card rounded-2xl border border-border/60 p-5 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-success" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Score ≥ 8.0</p>
            <p className="text-2xl font-bold text-success mt-1">{candidatos.filter(c => (c.status === "Reprovado" || c.status === "Contratado") && c.pontuacao >= 8).length}</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar por nome, vaga ou obs..." value={busca} onChange={e => setBusca(e.target.value)} className="pl-9 h-9" />
          </div>
          <Select value={filtroMin} onValueChange={setFiltroMin}>
            <SelectTrigger className="w-[180px] h-9 bg-muted/40 border-border/60"><SelectValue placeholder="Score mínimo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Todos os scores</SelectItem>
              <SelectItem value="6">Score ≥ 6.0</SelectItem>
              <SelectItem value="7">Score ≥ 7.0</SelectItem>
              <SelectItem value="8">Score ≥ 8.0</SelectItem>
              <SelectItem value="9">Score ≥ 9.0</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground ml-auto">{banco.length} candidatos encontrados</span>
        </div>

        {/* Grid de candidatos */}
        {banco.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border/60 py-16 text-center">
            <Users className="w-10 h-10 opacity-20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Nenhum candidato no banco de talentos ainda.</p>
            <p className="text-xs text-muted-foreground mt-1">Candidatos reprovados e contratados aparecem aqui automaticamente.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {banco.map(c => (
              <div key={c.id} className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-brand text-brand-foreground flex items-center justify-center text-sm font-bold shrink-0">{iniciais(c.nome)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{c.nome}</p>
                    <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                  </div>
                  <div className="flex items-center gap-1 bg-muted rounded-lg px-2 py-1">
                    <Star className={`w-3 h-3 ${c.pontuacao >= 8 ? "text-warning fill-warning" : "text-muted-foreground"}`} />
                    <span className={`text-xs font-bold tabular-nums ${c.pontuacao >= 8 ? "text-warning" : "text-muted-foreground"}`}>{c.pontuacao.toFixed(1)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mb-3">
                  <Briefcase className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground truncate">Última vaga: {c.vaga}</span>
                </div>
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-muted-foreground">Score</span>
                    <span className="text-[10px] text-muted-foreground">{c.pontuacao}/10</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full rounded-full ${c.pontuacao >= 8 ? "bg-success" : c.pontuacao >= 6 ? "bg-info" : "bg-muted-foreground/40"}`} style={{ width: `${c.pontuacao * 10}%` }} />
                  </div>
                </div>
                {c.observacoes && <p className="text-xs text-muted-foreground line-clamp-2 mb-3 italic">"{c.observacoes}"</p>}
                <Button size="sm" variant="outline" className="w-full h-8 text-xs gap-1.5 border-brand/30 text-brand hover:bg-brand/5"
                  onClick={() => { setReaplicar({ candidatoId: c.id, nome: c.nome }); setVagaEscolhida(vagasAbertas[0]?.cargo ?? ""); }}>
                  Reaplicar para vaga <ChevronRight className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal reaplicar */}
      <Dialog open={!!reaplicar} onOpenChange={o => !o && setReaplicar(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Reaplicar candidato</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Mover <strong>{reaplicar?.nome}</strong> para qual vaga?</p>
          <div className="space-y-1.5">
            <Label className="text-xs">Vaga de destino</Label>
            <Select value={vagaEscolhida} onValueChange={setVagaEscolhida}>
              <SelectTrigger><SelectValue placeholder="Selecione a vaga" /></SelectTrigger>
              <SelectContent>{vagasAbertas.map(v => <SelectItem key={v.id} value={v.cargo}>{v.cargo} — {v.empresa}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReaplicar(null)}>Cancelar</Button>
            <Button className="bg-brand hover:bg-brand/90 text-brand-foreground" disabled={!vagaEscolhida}
              onClick={async () => {
                if (!reaplicar) return;
                const vaga = vagas.find(v => v.cargo === vagaEscolhida);
                try {
                  await updateCandidato(reaplicar.candidatoId, { status: "Triagem", vaga: vagaEscolhida, vagaId: vaga?.id ?? null });
                  toast.success(`${reaplicar.nome} movido para triagem em ${vagaEscolhida}.`);
                  setReaplicar(null);
                } catch { toast.error("Erro ao reaplicar."); }
              }}>Reaplicar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
