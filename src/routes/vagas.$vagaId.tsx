import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Copy, FileDown, FileText, Briefcase, FileSignature, Check } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Briefing,
  Contrato,
  Descritivo,
  PIPELINE_ETAPAS,
  PipelineEtapa,
  updateVaga,
  useVaga,
} from "@/lib/store";

export const Route = createFileRoute("/vagas/$vagaId")({
  head: () => ({
    meta: [{ title: "Detalhes da Vaga — RecruitFlow" }],
  }),
  component: VagaDetailPage,
});

function VagaDetailPage() {
  const { vagaId } = Route.useParams();
  const vaga = useVaga(vagaId);
  const navigate = useNavigate();

  if (!vaga) {
    return (
      <div>
        <PageHeader title="Vaga não encontrada" />
        <div className="p-8">
          <Link to="/" className="text-brand hover:underline inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Voltar para vagas
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={vaga.cargo}
        subtitle={`${vaga.empresa} · ${vaga.area}`}
        action={
          <div className="flex items-center gap-3">
            <StatusBadge status={vaga.status} />
            <Button variant="outline" onClick={() => navigate({ to: "/" })}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
            </Button>
          </div>
        }
      />

      <div className="p-8 space-y-6">
        <PipelineProgress
          etapaAtual={vaga.etapa}
          onChange={(etapa) => updateVaga(vaga.id, { etapa })}
        />

        <Tabs defaultValue="briefing" className="w-full">
          <TabsList className="bg-card border h-auto p-1">
            <TabsTrigger value="briefing" className="data-[state=active]:bg-brand data-[state=active]:text-brand-foreground gap-2">
              <FileText className="w-4 h-4" /> Briefing
            </TabsTrigger>
            <TabsTrigger value="descritivo" className="data-[state=active]:bg-brand data-[state=active]:text-brand-foreground gap-2">
              <Briefcase className="w-4 h-4" /> Descritivo
            </TabsTrigger>
            <TabsTrigger value="contrato" className="data-[state=active]:bg-brand data-[state=active]:text-brand-foreground gap-2">
              <FileSignature className="w-4 h-4" /> Contrato
            </TabsTrigger>
          </TabsList>

          <TabsContent value="briefing" className="mt-4">
            <BriefingTab vagaId={vaga.id} initial={vaga.briefing} empresa={vaga.empresa} cargo={vaga.cargo} />
          </TabsContent>
          <TabsContent value="descritivo" className="mt-4">
            <DescritivoTab vagaId={vaga.id} initial={vaga.descritivo} briefing={vaga.briefing} cargo={vaga.cargo} empresa={vaga.empresa} />
          </TabsContent>
          <TabsContent value="contrato" className="mt-4">
            <ContratoTab vagaId={vaga.id} initial={vaga.contrato} empresa={vaga.empresa} cargo={vaga.cargo} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function PipelineProgress({
  etapaAtual,
  onChange,
}: {
  etapaAtual: PipelineEtapa;
  onChange: (e: PipelineEtapa) => void;
}) {
  const idx = PIPELINE_ETAPAS.indexOf(etapaAtual);
  return (
    <div className="bg-card rounded-xl border shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Pipeline</p>
          <p className="text-sm text-foreground/80 mt-0.5">Etapa atual: <span className="font-semibold text-brand">{etapaAtual}</span></p>
        </div>
      </div>
      <div className="flex items-center">
        {PIPELINE_ETAPAS.map((e, i) => {
          const done = i < idx;
          const current = i === idx;
          return (
            <div key={e} className="flex items-center flex-1 last:flex-none">
              <button
                onClick={() => onChange(e)}
                className="flex flex-col items-center gap-2 group"
                title={`Marcar como ${e}`}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                    done
                      ? "bg-success text-success-foreground border-success"
                      : current
                      ? "bg-brand text-brand-foreground border-brand shadow-lg ring-4 ring-brand/20"
                      : "bg-muted text-muted-foreground border-border group-hover:border-brand/50"
                  }`}
                >
                  {done ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                <span className={`text-[11px] text-center max-w-[110px] leading-tight ${current ? "text-brand font-semibold" : "text-muted-foreground"}`}>
                  {e}
                </span>
              </button>
              {i < PIPELINE_ETAPAS.length - 1 && (
                <div className={`flex-1 h-1 mx-2 -mt-7 rounded-full ${i < idx ? "bg-success" : "bg-muted"}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- BRIEFING ---------------- */
const emptyBriefing = (empresa = "", cargo = ""): Briefing => ({
  cliente: empresa,
  contatoResponsavel: "",
  cargo,
  quantidade: 1,
  motivo: "Substituição",
  formacao: "",
  experienciaMinima: "",
  habilidadesTecnicas: "",
  softSkills: "",
  diferenciais: "",
  faixaSalarial: "",
  beneficios: "",
  modeloTrabalho: "Híbrido",
  localizacao: "",
  prazo: "",
  observacoes: "",
});

function BriefingTab({ vagaId, initial, empresa, cargo }: { vagaId: string; initial?: Briefing; empresa: string; cargo: string }) {
  const [b, setB] = useState<Briefing>(initial ?? emptyBriefing(empresa, cargo));
  const [saved, setSaved] = useState(false);

  const save = () => {
    updateVaga(vagaId, { briefing: b });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const set = <K extends keyof Briefing>(k: K, v: Briefing[K]) => setB({ ...b, [k]: v });

  return (
    <div className="bg-card rounded-xl border shadow-sm p-6 space-y-5">
      <SectionTitle title="Briefing da vaga" desc="Informações coletadas com o cliente na abertura da vaga." />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Nome do cliente"><Input value={b.cliente} onChange={(e) => set("cliente", e.target.value)} /></Field>
        <Field label="Contato responsável"><Input value={b.contatoResponsavel} onChange={(e) => set("contatoResponsavel", e.target.value)} placeholder="Nome / e-mail / telefone" /></Field>
        <Field label="Cargo"><Input value={b.cargo} onChange={(e) => set("cargo", e.target.value)} /></Field>
        <Field label="Quantidade de vagas"><Input type="number" min={1} value={b.quantidade} onChange={(e) => set("quantidade", Number(e.target.value))} /></Field>
        <Field label="Motivo da abertura">
          <Select value={b.motivo} onValueChange={(v) => set("motivo", v as Briefing["motivo"])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Substituição">Substituição</SelectItem>
              <SelectItem value="Expansão">Expansão</SelectItem>
              <SelectItem value="Novo projeto">Novo projeto</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Prazo esperado"><Input type="date" value={b.prazo} onChange={(e) => set("prazo", e.target.value)} /></Field>
        <Field label="Formação desejada"><Input value={b.formacao} onChange={(e) => set("formacao", e.target.value)} placeholder="Ex: Superior em Engenharia" /></Field>
        <Field label="Experiência mínima"><Input value={b.experienciaMinima} onChange={(e) => set("experienciaMinima", e.target.value)} placeholder="Ex: 3 anos" /></Field>
        <Field label="Habilidades técnicas" className="md:col-span-2"><Textarea rows={2} value={b.habilidadesTecnicas} onChange={(e) => set("habilidadesTecnicas", e.target.value)} /></Field>
        <Field label="Soft skills" className="md:col-span-2"><Textarea rows={2} value={b.softSkills} onChange={(e) => set("softSkills", e.target.value)} /></Field>
        <Field label="Diferenciais valorizados" className="md:col-span-2"><Textarea rows={2} value={b.diferenciais} onChange={(e) => set("diferenciais", e.target.value)} /></Field>
        <Field label="Faixa salarial"><Input value={b.faixaSalarial} onChange={(e) => set("faixaSalarial", e.target.value)} placeholder="Ex: R$ 8.000 a R$ 12.000" /></Field>
        <Field label="Benefícios"><Input value={b.beneficios} onChange={(e) => set("beneficios", e.target.value)} placeholder="VR, VT, plano de saúde..." /></Field>
        <Field label="Modelo de trabalho">
          <Select value={b.modeloTrabalho} onValueChange={(v) => set("modeloTrabalho", v as Briefing["modeloTrabalho"])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Presencial">Presencial</SelectItem>
              <SelectItem value="Híbrido">Híbrido</SelectItem>
              <SelectItem value="Remoto">Remoto</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Localização"><Input value={b.localizacao} onChange={(e) => set("localizacao", e.target.value)} placeholder="Cidade / estado" /></Field>
        <Field label="Observações e contexto da empresa" className="md:col-span-2"><Textarea rows={3} value={b.observacoes} onChange={(e) => set("observacoes", e.target.value)} /></Field>
      </div>
      <div className="flex justify-end gap-3">
        {saved && <span className="text-sm text-success self-center">Briefing salvo ✓</span>}
        <Button className="bg-brand hover:bg-brand/90 text-brand-foreground" onClick={save}>Salvar briefing</Button>
      </div>
    </div>
  );
}

/* ---------------- DESCRITIVO ---------------- */
const buildDescritivoFromBriefing = (b: Briefing | undefined, cargo: string, empresa: string): Descritivo => ({
  titulo: b?.cargo || cargo,
  sobreEmpresa: b?.observacoes || `${empresa} é uma empresa em crescimento, focada em entregar resultados de excelência aos seus clientes.`,
  responsabilidades: "Atuar nas atividades relacionadas à área\nColaborar com equipes multidisciplinares\nGarantir a entrega dos resultados esperados",
  requisitosObrigatorios: [b?.formacao, b?.experienciaMinima, b?.habilidadesTecnicas].filter(Boolean).join("\n"),
  requisitosDesejaveis: b?.diferenciais || "",
  oferece: [b?.faixaSalarial && `Salário: ${b.faixaSalarial}`, b?.beneficios && `Benefícios: ${b.beneficios}`, b?.modeloTrabalho && `Modelo: ${b.modeloTrabalho}${b.localizacao ? ` (${b.localizacao})` : ""}`].filter(Boolean).join("\n"),
  comoCandidatar: "Envie seu currículo para recrutamento@recruitflow.com.br com o assunto: " + (b?.cargo || cargo),
});

function DescritivoTab({ vagaId, initial, briefing, cargo, empresa }: { vagaId: string; initial?: Descritivo; briefing?: Briefing; cargo: string; empresa: string }) {
  const [d, setD] = useState<Descritivo>(initial ?? buildDescritivoFromBriefing(briefing, cargo, empresa));
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = <K extends keyof Descritivo>(k: K, v: Descritivo[K]) => setD({ ...d, [k]: v });

  const generate = () => setD(buildDescritivoFromBriefing(briefing, cargo, empresa));

  const save = () => {
    updateVaga(vagaId, { descritivo: d });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const asText = () =>
    `${d.titulo}\n\nSOBRE A EMPRESA\n${d.sobreEmpresa}\n\nRESPONSABILIDADES\n${listify(d.responsabilidades)}\n\nREQUISITOS OBRIGATÓRIOS\n${listify(d.requisitosObrigatorios)}\n\nREQUISITOS DESEJÁVEIS\n${listify(d.requisitosDesejaveis)}\n\nO QUE OFERECEMOS\n${listify(d.oferece)}\n\nCOMO SE CANDIDATAR\n${d.comoCandidatar}`;

  const copy = async () => {
    await navigator.clipboard.writeText(asText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportPDF = () => {
    const html = `<!doctype html><html><head><meta charset="utf-8"/><title>${escapeHtml(d.titulo)}</title>
      <style>body{font-family:Arial,sans-serif;max-width:780px;margin:40px auto;padding:0 24px;color:#222;line-height:1.55}
      h1{color:#185FA5;border-bottom:3px solid #185FA5;padding-bottom:8px}h2{color:#185FA5;margin-top:28px;font-size:16px;text-transform:uppercase;letter-spacing:.5px}
      ul{padding-left:20px}p{white-space:pre-wrap}</style></head><body>
      <h1>${escapeHtml(d.titulo)}</h1>
      <h2>Sobre a empresa</h2><p>${escapeHtml(d.sobreEmpresa)}</p>
      <h2>Responsabilidades e atribuições</h2><ul>${toLi(d.responsabilidades)}</ul>
      <h2>Requisitos obrigatórios</h2><ul>${toLi(d.requisitosObrigatorios)}</ul>
      <h2>Requisitos desejáveis</h2><ul>${toLi(d.requisitosDesejaveis)}</ul>
      <h2>O que a empresa oferece</h2><ul>${toLi(d.oferece)}</ul>
      <h2>Como se candidatar</h2><p>${escapeHtml(d.comoCandidatar)}</p>
      <script>window.onload=()=>window.print()</script></body></html>`;
    openPrintWindow(html);
  };

  return (
    <div className="bg-card rounded-xl border shadow-sm p-6 space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <SectionTitle title="Descritivo da vaga" desc="Documento formatado para divulgação em portais, LinkedIn e e-mail." />
        <Button variant="outline" onClick={generate}>Gerar a partir do briefing</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Editor */}
        <div className="space-y-4">
          <Field label="Título da vaga"><Input value={d.titulo} onChange={(e) => set("titulo", e.target.value)} /></Field>
          <Field label="Sobre a empresa"><Textarea rows={3} value={d.sobreEmpresa} onChange={(e) => set("sobreEmpresa", e.target.value)} /></Field>
          <Field label="Responsabilidades (uma por linha)"><Textarea rows={4} value={d.responsabilidades} onChange={(e) => set("responsabilidades", e.target.value)} /></Field>
          <Field label="Requisitos obrigatórios"><Textarea rows={3} value={d.requisitosObrigatorios} onChange={(e) => set("requisitosObrigatorios", e.target.value)} /></Field>
          <Field label="Requisitos desejáveis"><Textarea rows={3} value={d.requisitosDesejaveis} onChange={(e) => set("requisitosDesejaveis", e.target.value)} /></Field>
          <Field label="O que oferecemos"><Textarea rows={3} value={d.oferece} onChange={(e) => set("oferece", e.target.value)} /></Field>
          <Field label="Como se candidatar"><Textarea rows={2} value={d.comoCandidatar} onChange={(e) => set("comoCandidatar", e.target.value)} /></Field>
        </div>
        {/* Preview */}
        <div className="bg-muted/30 rounded-lg border p-6 text-sm leading-relaxed">
          <h3 className="text-xl font-bold text-brand border-b-2 border-brand pb-2 mb-3">{d.titulo || "Título"}</h3>
          <PreviewBlock title="Sobre a empresa">{d.sobreEmpresa}</PreviewBlock>
          <PreviewList title="Responsabilidades" text={d.responsabilidades} />
          <PreviewList title="Requisitos obrigatórios" text={d.requisitosObrigatorios} />
          <PreviewList title="Requisitos desejáveis" text={d.requisitosDesejaveis} />
          <PreviewList title="O que oferecemos" text={d.oferece} />
          <PreviewBlock title="Como se candidatar">{d.comoCandidatar}</PreviewBlock>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3">
        {saved && <span className="text-sm text-success">Descritivo salvo ✓</span>}
        <Button variant="outline" onClick={copy}>
          <Copy className="w-4 h-4 mr-2" /> {copied ? "Copiado!" : "Copiar texto"}
        </Button>
        <Button variant="outline" onClick={exportPDF}>
          <FileDown className="w-4 h-4 mr-2" /> Exportar PDF
        </Button>
        <Button className="bg-brand hover:bg-brand/90 text-brand-foreground" onClick={save}>Salvar descritivo</Button>
      </div>
    </div>
  );
}

/* ---------------- CONTRATO ---------------- */
const emptyContrato = (empresa = "", cargo = ""): Contrato => ({
  contratanteRazao: empresa,
  contratanteCnpj: "",
  contratanteEndereco: "",
  contratanteRepresentante: "",
  contratadaRazao: "RecruitFlow Recrutamento e Seleção Ltda.",
  contratadaCnpj: "00.000.000/0001-00",
  contratadaRepresentante: "",
  objeto: `Recrutamento e seleção para a posição de ${cargo}`,
  modeloCobranca: "Percentual sobre salário",
  valor: "",
  condicoesPagamento: "50% na assinatura do contrato e 50% na contratação do candidato.",
  prazoGarantia: "90 dias — em caso de desligamento, será realizada nova busca sem custo adicional.",
  clausulas:
    "Confidencialidade: as partes se comprometem a manter sigilo das informações trocadas.\nExclusividade: durante o prazo do contrato, o cliente não poderá contratar terceiros para a mesma posição.\nRescisão: qualquer parte poderá rescindir mediante aviso prévio de 30 dias.",
  dataAssinatura: new Date().toISOString().slice(0, 10),
  localAssinatura: "",
});

function ContratoTab({ vagaId, initial, empresa, cargo }: { vagaId: string; initial?: Contrato; empresa: string; cargo: string }) {
  const [c, setC] = useState<Contrato>(initial ?? emptyContrato(empresa, cargo));
  const [generated, setGenerated] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = <K extends keyof Contrato>(k: K, v: Contrato[K]) => setC({ ...c, [k]: v });

  const save = () => {
    updateVaga(vagaId, { contrato: c });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const generate = () => {
    setGenerated(true);
    save();
  };

  const exportPDF = () => {
    const html = `<!doctype html><html><head><meta charset="utf-8"/><title>Contrato - ${escapeHtml(cargo)}</title>
      <style>body{font-family:Georgia,serif;max-width:780px;margin:40px auto;padding:0 32px;color:#222;line-height:1.7;text-align:justify}
      h1{text-align:center;color:#185FA5;font-size:18px;text-transform:uppercase;letter-spacing:1px}
      h2{color:#185FA5;font-size:14px;margin-top:24px;border-bottom:1px solid #ddd;padding-bottom:4px;text-transform:uppercase}
      .sig{margin-top:60px;display:flex;justify-content:space-between;gap:40px}
      .sig div{flex:1;text-align:center;border-top:1px solid #222;padding-top:6px;font-size:13px}
      p{white-space:pre-wrap;margin:8px 0}</style></head><body>
      <h1>Contrato de Prestação de Serviços de Recrutamento e Seleção</h1>
      <h2>Contratante</h2>
      <p><b>${escapeHtml(c.contratanteRazao)}</b> — CNPJ: ${escapeHtml(c.contratanteCnpj)}<br/>Endereço: ${escapeHtml(c.contratanteEndereco)}<br/>Representado por: ${escapeHtml(c.contratanteRepresentante)}</p>
      <h2>Contratada</h2>
      <p><b>${escapeHtml(c.contratadaRazao)}</b> — CNPJ: ${escapeHtml(c.contratadaCnpj)}<br/>Representada por: ${escapeHtml(c.contratadaRepresentante)}</p>
      <h2>Cláusula 1ª — Objeto</h2><p>${escapeHtml(c.objeto)}</p>
      <h2>Cláusula 2ª — Honorários</h2>
      <p>Modelo de cobrança: <b>${escapeHtml(c.modeloCobranca)}</b><br/>Valor acordado: <b>${escapeHtml(c.valor)}</b><br/>Condições: ${escapeHtml(c.condicoesPagamento)}</p>
      <h2>Cláusula 3ª — Garantia</h2><p>${escapeHtml(c.prazoGarantia)}</p>
      <h2>Cláusula 4ª — Cláusulas gerais</h2><p>${escapeHtml(c.clausulas)}</p>
      <h2>Cláusula 5ª — Foro</h2><p>Fica eleito o foro da comarca de ${escapeHtml(c.localAssinatura)} para dirimir quaisquer questões oriundas deste contrato.</p>
      <p style="margin-top:32px">${escapeHtml(c.localAssinatura)}, ${formatDateBR(c.dataAssinatura)}.</p>
      <div class="sig"><div>Contratante</div><div>Contratada</div></div>
      <script>window.onload=()=>window.print()</script></body></html>`;
    openPrintWindow(html);
  };

  return (
    <div className="bg-card rounded-xl border shadow-sm p-6 space-y-5">
      <SectionTitle title="Contrato de prestação de serviços" desc="Contrato entre a empresa de R&S e o cliente." />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <fieldset className="border rounded-lg p-4 space-y-3">
          <legend className="px-2 text-xs font-semibold uppercase text-brand">Contratante (cliente)</legend>
          <Field label="Razão social"><Input value={c.contratanteRazao} onChange={(e) => set("contratanteRazao", e.target.value)} /></Field>
          <Field label="CNPJ"><Input value={c.contratanteCnpj} onChange={(e) => set("contratanteCnpj", e.target.value)} /></Field>
          <Field label="Endereço"><Input value={c.contratanteEndereco} onChange={(e) => set("contratanteEndereco", e.target.value)} /></Field>
          <Field label="Representante"><Input value={c.contratanteRepresentante} onChange={(e) => set("contratanteRepresentante", e.target.value)} /></Field>
        </fieldset>
        <fieldset className="border rounded-lg p-4 space-y-3">
          <legend className="px-2 text-xs font-semibold uppercase text-brand">Contratada (R&S)</legend>
          <Field label="Razão social"><Input value={c.contratadaRazao} onChange={(e) => set("contratadaRazao", e.target.value)} /></Field>
          <Field label="CNPJ"><Input value={c.contratadaCnpj} onChange={(e) => set("contratadaCnpj", e.target.value)} /></Field>
          <Field label="Representante"><Input value={c.contratadaRepresentante} onChange={(e) => set("contratadaRepresentante", e.target.value)} /></Field>
        </fieldset>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Objeto do contrato" className="md:col-span-2"><Textarea rows={2} value={c.objeto} onChange={(e) => set("objeto", e.target.value)} /></Field>
        <Field label="Modelo de cobrança">
          <Select value={c.modeloCobranca} onValueChange={(v) => set("modeloCobranca", v as Contrato["modeloCobranca"])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Percentual sobre salário">Percentual sobre salário contratado</SelectItem>
              <SelectItem value="Valor fixo por vaga">Valor fixo por vaga</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Valor acordado"><Input value={c.valor} onChange={(e) => set("valor", e.target.value)} placeholder="Ex: 18% ou R$ 12.000" /></Field>
        <Field label="Condições de pagamento" className="md:col-span-2"><Textarea rows={2} value={c.condicoesPagamento} onChange={(e) => set("condicoesPagamento", e.target.value)} /></Field>
        <Field label="Prazo de garantia" className="md:col-span-2"><Textarea rows={2} value={c.prazoGarantia} onChange={(e) => set("prazoGarantia", e.target.value)} /></Field>
        <Field label="Cláusulas (confidencialidade, exclusividade, rescisão)" className="md:col-span-2"><Textarea rows={4} value={c.clausulas} onChange={(e) => set("clausulas", e.target.value)} /></Field>
        <Field label="Data de assinatura"><Input type="date" value={c.dataAssinatura} onChange={(e) => set("dataAssinatura", e.target.value)} /></Field>
        <Field label="Local de assinatura"><Input value={c.localAssinatura} onChange={(e) => set("localAssinatura", e.target.value)} placeholder="Cidade / UF" /></Field>
      </div>

      {generated && (
        <div className="bg-muted/30 border rounded-lg p-6 text-sm leading-relaxed">
          <h3 className="text-center font-bold text-brand uppercase tracking-wide mb-4">Contrato de Prestação de Serviços de Recrutamento e Seleção</h3>
          <p><b>Contratante:</b> {c.contratanteRazao} — CNPJ {c.contratanteCnpj}, com sede em {c.contratanteEndereco}, representado por {c.contratanteRepresentante}.</p>
          <p className="mt-2"><b>Contratada:</b> {c.contratadaRazao} — CNPJ {c.contratadaCnpj}, representada por {c.contratadaRepresentante}.</p>
          <p className="mt-3"><b>Objeto:</b> {c.objeto}</p>
          <p className="mt-2"><b>Honorários:</b> {c.modeloCobranca} — {c.valor}. {c.condicoesPagamento}</p>
          <p className="mt-2"><b>Garantia:</b> {c.prazoGarantia}</p>
          <p className="mt-2 whitespace-pre-wrap"><b>Cláusulas gerais:</b> {c.clausulas}</p>
          <p className="mt-4">{c.localAssinatura}, {formatDateBR(c.dataAssinatura)}.</p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-end gap-3">
        {saved && <span className="text-sm text-success">Contrato salvo ✓</span>}
        <Button variant="outline" onClick={generate}>Gerar contrato</Button>
        <Button variant="outline" onClick={exportPDF}>
          <FileDown className="w-4 h-4 mr-2" /> Exportar PDF
        </Button>
        <Button className="bg-brand hover:bg-brand/90 text-brand-foreground" onClick={save}>Salvar contrato</Button>
      </div>
    </div>
  );
}

/* ---------------- helpers ---------------- */
function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={`space-y-1.5 ${className}`}><Label className="text-xs">{label}</Label>{children}</div>;
}

function SectionTitle({ title, desc }: { title: string; desc: string }) {
  return (
    <div>
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

function PreviewBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-3">
      <h4 className="text-xs uppercase font-bold text-brand tracking-wider mb-1">{title}</h4>
      <p className="whitespace-pre-wrap text-foreground/85">{children || <span className="text-muted-foreground italic">—</span>}</p>
    </div>
  );
}
function PreviewList({ title, text }: { title: string; text: string }) {
  const items = text.split("\n").map((s) => s.trim()).filter(Boolean);
  return (
    <div className="mt-3">
      <h4 className="text-xs uppercase font-bold text-brand tracking-wider mb-1">{title}</h4>
      {items.length ? (
        <ul className="list-disc pl-5 space-y-0.5 text-foreground/85">{items.map((it, i) => <li key={i}>{it}</li>)}</ul>
      ) : (
        <p className="text-muted-foreground italic text-sm">—</p>
      )}
    </div>
  );
}

function listify(text: string) {
  return text.split("\n").map((s) => s.trim()).filter(Boolean).map((s) => `• ${s}`).join("\n");
}
function toLi(text: string) {
  return text.split("\n").map((s) => s.trim()).filter(Boolean).map((s) => `<li>${escapeHtml(s)}</li>`).join("") || "<li>—</li>";
}
function escapeHtml(s: string) {
  return (s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
function formatDateBR(d: string) {
  if (!d) return "____ de __________ de ____";
  try { return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }); } catch { return d; }
}
function openPrintWindow(html: string) {
  const w = window.open("", "_blank", "width=900,height=1100");
  if (!w) return alert("Permita pop-ups para exportar o PDF.");
  w.document.write(html);
  w.document.close();
}
