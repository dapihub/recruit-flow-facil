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
    meta: [{ title: "Detalhes da Vaga — DAPI HUB" }],
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
  contratadaRazao: "66.475.894 ANA CAROLINA DE CAMPOS",
  contratadaCnpj: "66.475.894/0001-84",
  contratadaEndereco: "Rua Figueiredo Magalhães, nº 249, Copacabana, Rio de Janeiro/RJ, CEP 22.031-011",
  contratadaTelefone: "(48) 98870-0560",
  contratadaEmail: "ana@dapihub.com.br",
  contratadaRepresentante: "Ana Carolina de Campos",
  cargo,
  prazoExecucao: "20 (vinte) dias corridos",
  valorTotal: "R$ 4.000,00",
  valorTotalExtenso: "quatro mil reais",
  parcela1: "R$ 2.000,00 (cinquenta por cento) no ato da assinatura deste contrato",
  parcela2: "R$ 2.000,00 (cinquenta por cento) na entrega do serviço",
  diaPagamento: "1ª quinta-feira da semana subsequente à emissão da respectiva nota fiscal",
  chavePix: "66.475.894/0001-84",
  prazoGarantia: "90 (noventa) dias corridos",
  maxReposicoes: "3 (três) reposições",
  prazoEscolha: "30 (trinta) dias",
  foro: "Comarca da Capital do Rio de Janeiro/RJ",
  dataAssinatura: new Date().toISOString().slice(0, 10),
  localAssinatura: "Rio de Janeiro/RJ",
  observacoes: "",
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
    const html = `<!doctype html><html><head><meta charset="utf-8"/><title>Contrato — ${escapeHtml(c.cargo)}</title>
      <style>
        @page { margin: 28mm 22mm; }
        body{font-family:Arial,Helvetica,sans-serif;max-width:780px;margin:0 auto;padding:0 8px;color:#1f2937;line-height:1.65;text-align:justify;font-size:12pt}
        h1{text-align:center;color:#185FA5;font-size:15pt;text-transform:uppercase;letter-spacing:.5px;margin-bottom:24px}
        h2{color:#185FA5;font-size:11pt;margin-top:20px;text-transform:uppercase;letter-spacing:.5px}
        p{margin:6px 0}
        .party{margin:8px 0 14px}
        ul{margin:6px 0 6px 0;padding-left:22px}
        .sig{margin-top:60px;display:flex;justify-content:space-between;gap:40px}
        .sig div{flex:1;text-align:center;border-top:1px solid #222;padding-top:6px;font-size:11pt}
        .sig b{display:block;margin-bottom:2px}
      </style></head><body>
      <h1>Contrato de Prestação de Serviços de Recrutamento e Seleção</h1>

      <h2>Contratante</h2>
      <p class="party"><b>${escapeHtml(c.contratanteRazao)}</b>, inscrita no CNPJ sob o nº ${escapeHtml(c.contratanteCnpj)}, com sede em ${escapeHtml(c.contratanteEndereco)}, neste ato representada por ${escapeHtml(c.contratanteRepresentante)}, doravante denominada &ldquo;CONTRATANTE&rdquo;.</p>

      <h2>Contratada</h2>
      <p class="party"><b>${escapeHtml(c.contratadaRazao)}</b>, inscrita no CNPJ sob o nº ${escapeHtml(c.contratadaCnpj)}, com sede na ${escapeHtml(c.contratadaEndereco)}, telefone ${escapeHtml(c.contratadaTelefone)}, e-mail ${escapeHtml(c.contratadaEmail)}, doravante denominada &ldquo;CONTRATADA&rdquo;.</p>

      <p>As partes acima identificadas resolvem celebrar o presente <b>Contrato de Prestação de Serviços de Recrutamento e Seleção</b>, que se regerá pelas cláusulas e condições seguintes:</p>

      <h2>Cláusula 1 — Objeto do Contrato</h2>
      <p>1.1 O presente contrato tem por objeto a prestação de <b>serviços de Recrutamento e Seleção</b> pela CONTRATADA, com o propósito de identificar, avaliar e indicar candidatos qualificados para a vaga de <b>${escapeHtml(c.cargo)}</b>, conforme perfil previamente definido em conjunto com a CONTRATANTE.</p>
      <p>1.2 O processo será conduzido de forma consultiva, utilizando metodologia própria da CONTRATADA, incluindo triagem curricular, entrevistas comportamentais, avaliação técnica e análise de aderência cultural.</p>
      <p>1.3 A entrega será considerada concluída com a apresentação dos candidatos finalistas e recomendação de contratação, cabendo à CONTRATANTE a decisão final.</p>

      <h2>Cláusula 2 — Prazo de Execução</h2>
      <p>2.1 O prazo estimado para a entrega final é de até <b>${escapeHtml(c.prazoExecucao)}</b>, contados a partir da confirmação do pagamento inicial e do alinhamento do perfil da vaga.</p>

      <h2>Cláusula 3 — Valor e Condições de Pagamento</h2>
      <p>3.1 Pela execução dos serviços descritos neste contrato, a CONTRATANTE pagará à CONTRATADA o valor total de <b>${escapeHtml(c.valorTotal)}</b> (${escapeHtml(c.valorTotalExtenso)}).</p>
      <p>3.2 O pagamento será efetuado em duas parcelas, da seguinte forma:</p>
      <ul>
        <li>${escapeHtml(c.parcela1)};</li>
        <li>${escapeHtml(c.parcela2)}.</li>
      </ul>
      <p>3.3 O pagamento se dará na <b>${escapeHtml(c.diaPagamento)}</b>.</p>
      <p>3.4 Caso essa data coincida com feriado nacional, o pagamento ocorrerá no <b>próximo dia útil</b>.</p>
      <p>3.5 O pagamento deverá ser realizado via <b>PIX</b> no CNPJ da CONTRATADA: <b>${escapeHtml(c.chavePix)}</b>.</p>
      <p>3.6 A Nota Fiscal será emitida pelo CNPJ da CONTRATADA após a entrega total de cada parcela, caso assim deseje a CONTRATANTE.</p>

      <h2>Cláusula 4 — Garantia</h2>
      <p>4.1 A CONTRATADA concede à CONTRATANTE uma <b>garantia de ${escapeHtml(c.prazoGarantia)}</b>, contados a partir da data de contratação do(a) profissional indicado(a).</p>
      <p>4.2 Caso o(a) profissional venha a ser desligado(a), por iniciativa própria ou da CONTRATANTE, dentro desse período, a CONTRATADA compromete-se a realizar <b>novo processo seletivo sem custos adicionais</b>.</p>
      <p>4.3 A garantia não cobre alterações de escopo, perfil, remuneração, jornada, atribuições ou requisitos da vaga que não tenham sido acordados no início do processo.</p>
      <p>4.4 A garantia não cobre desligamentos que não estejam relacionados à performance ou aderência cultural, sendo limitada a até <b>${escapeHtml(c.maxReposicoes)}</b>.</p>
      <p>4.5 As pessoas envolvidas nas entrevistas e decisões deverão ser as mesmas que participaram do alinhamento inicial, não sendo permitida a inclusão de novos avaliadores sem comunicação prévia à CONTRATADA.</p>
      <p>4.6 A CONTRATANTE terá o prazo máximo de <b>${escapeHtml(c.prazoEscolha)}</b> para a escolha do candidato, contados a partir do envio das opções apresentadas.</p>

      <h2>Cláusula 5 — Disposições Gerais</h2>
      <p>5.1 Este contrato não gera vínculo empregatício, societário ou de subordinação entre as partes, nem entre a CONTRATADA e os candidatos apresentados.</p>
      <p>5.2 A CONTRATADA compromete-se a manter sigilo absoluto sobre todas as informações e dados estratégicos da CONTRATANTE.</p>
      <p>5.3 Fica eleito o foro da <b>${escapeHtml(c.foro)}</b> para dirimir quaisquer controvérsias oriundas deste contrato, com renúncia a qualquer outro, por mais privilegiado que seja.</p>
      ${c.observacoes ? `<h2>Observações</h2><p>${escapeHtml(c.observacoes).replace(/\n/g, "<br/>")}</p>` : ""}

      <p style="margin-top:32px">${escapeHtml(c.localAssinatura)}, ${formatDateBR(c.dataAssinatura)}.</p>

      <div class="sig">
        <div><b>CONTRATANTE</b>${escapeHtml(c.contratanteRazao)}<br/>CNPJ: ${escapeHtml(c.contratanteCnpj)}</div>
        <div><b>CONTRATADA</b>${escapeHtml(c.contratadaRazao)}<br/>CNPJ: ${escapeHtml(c.contratadaCnpj)}</div>
      </div>
      <script>window.onload=()=>window.print()</script></body></html>`;
    openPrintWindow(html);
  };

  return (
    <div className="bg-card rounded-xl border shadow-sm p-6 space-y-5">
      <SectionTitle title="Contrato de prestação de serviços" desc="Modelo padrão — Recrutamento e Seleção. Preencha os campos e gere o documento." />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <fieldset className="border rounded-lg p-4 space-y-3">
          <legend className="px-2 text-xs font-semibold uppercase text-brand">Contratante (cliente)</legend>
          <Field label="Razão social"><Input value={c.contratanteRazao} onChange={(e) => set("contratanteRazao", e.target.value)} /></Field>
          <Field label="CNPJ"><Input value={c.contratanteCnpj} onChange={(e) => set("contratanteCnpj", e.target.value)} placeholder="00.000.000/0000-00" /></Field>
          <Field label="Endereço completo"><Input value={c.contratanteEndereco} onChange={(e) => set("contratanteEndereco", e.target.value)} placeholder="Rua, nº, bairro, cidade/UF, CEP" /></Field>
          <Field label="Representante"><Input value={c.contratanteRepresentante} onChange={(e) => set("contratanteRepresentante", e.target.value)} /></Field>
        </fieldset>
        <fieldset className="border rounded-lg p-4 space-y-3">
          <legend className="px-2 text-xs font-semibold uppercase text-brand">Contratada (R&S)</legend>
          <Field label="Razão social"><Input value={c.contratadaRazao} onChange={(e) => set("contratadaRazao", e.target.value)} /></Field>
          <Field label="CNPJ"><Input value={c.contratadaCnpj} onChange={(e) => set("contratadaCnpj", e.target.value)} /></Field>
          <Field label="Endereço completo"><Input value={c.contratadaEndereco} onChange={(e) => set("contratadaEndereco", e.target.value)} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Telefone"><Input value={c.contratadaTelefone} onChange={(e) => set("contratadaTelefone", e.target.value)} /></Field>
            <Field label="E-mail"><Input value={c.contratadaEmail} onChange={(e) => set("contratadaEmail", e.target.value)} /></Field>
          </div>
          <Field label="Representante"><Input value={c.contratadaRepresentante} onChange={(e) => set("contratadaRepresentante", e.target.value)} /></Field>
        </fieldset>
      </div>

      <fieldset className="border rounded-lg p-4 space-y-3">
        <legend className="px-2 text-xs font-semibold uppercase text-brand">Cláusula 1 — Objeto</legend>
        <Field label="Cargo / vaga"><Input value={c.cargo} onChange={(e) => set("cargo", e.target.value)} /></Field>
      </fieldset>

      <fieldset className="border rounded-lg p-4 space-y-3">
        <legend className="px-2 text-xs font-semibold uppercase text-brand">Cláusula 2 — Prazo de execução</legend>
        <Field label="Prazo estimado de entrega"><Input value={c.prazoExecucao} onChange={(e) => set("prazoExecucao", e.target.value)} placeholder="Ex: 20 (vinte) dias corridos" /></Field>
      </fieldset>

      <fieldset className="border rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <legend className="px-2 text-xs font-semibold uppercase text-brand">Cláusula 3 — Valor e pagamento</legend>
        <Field label="Valor total"><Input value={c.valorTotal} onChange={(e) => set("valorTotal", e.target.value)} placeholder="Ex: R$ 4.000,00" /></Field>
        <Field label="Valor por extenso"><Input value={c.valorTotalExtenso} onChange={(e) => set("valorTotalExtenso", e.target.value)} placeholder="Ex: quatro mil reais" /></Field>
        <Field label="Parcela 1" className="md:col-span-2"><Input value={c.parcela1} onChange={(e) => set("parcela1", e.target.value)} /></Field>
        <Field label="Parcela 2" className="md:col-span-2"><Input value={c.parcela2} onChange={(e) => set("parcela2", e.target.value)} /></Field>
        <Field label="Dia do pagamento" className="md:col-span-2"><Input value={c.diaPagamento} onChange={(e) => set("diaPagamento", e.target.value)} /></Field>
        <Field label="Chave PIX (CNPJ)" className="md:col-span-2"><Input value={c.chavePix} onChange={(e) => set("chavePix", e.target.value)} /></Field>
      </fieldset>

      <fieldset className="border rounded-lg p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <legend className="px-2 text-xs font-semibold uppercase text-brand">Cláusula 4 — Garantia</legend>
        <Field label="Prazo de garantia"><Input value={c.prazoGarantia} onChange={(e) => set("prazoGarantia", e.target.value)} placeholder="Ex: 90 dias corridos" /></Field>
        <Field label="Limite de reposições"><Input value={c.maxReposicoes} onChange={(e) => set("maxReposicoes", e.target.value)} placeholder="Ex: 3 (três)" /></Field>
        <Field label="Prazo p/ escolha do candidato"><Input value={c.prazoEscolha} onChange={(e) => set("prazoEscolha", e.target.value)} placeholder="Ex: 30 dias" /></Field>
      </fieldset>

      <fieldset className="border rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <legend className="px-2 text-xs font-semibold uppercase text-brand">Cláusula 5 — Disposições gerais</legend>
        <Field label="Foro" className="md:col-span-2"><Input value={c.foro} onChange={(e) => set("foro", e.target.value)} placeholder="Ex: Comarca da Capital do Rio de Janeiro/RJ" /></Field>
        <Field label="Data de assinatura"><Input type="date" value={c.dataAssinatura} onChange={(e) => set("dataAssinatura", e.target.value)} /></Field>
        <Field label="Local de assinatura"><Input value={c.localAssinatura} onChange={(e) => set("localAssinatura", e.target.value)} placeholder="Cidade/UF" /></Field>
        <Field label="Observações adicionais (opcional)" className="md:col-span-2"><Textarea rows={2} value={c.observacoes} onChange={(e) => set("observacoes", e.target.value)} /></Field>
      </fieldset>

      {generated && (
        <div className="bg-muted/30 border rounded-lg p-6 text-sm leading-relaxed space-y-2">
          <h3 className="text-center font-bold text-brand uppercase tracking-wide mb-4">Contrato de Prestação de Serviços de Recrutamento e Seleção</h3>
          <p><b>CONTRATANTE:</b> {c.contratanteRazao} — CNPJ {c.contratanteCnpj}, com sede em {c.contratanteEndereco}, representada por {c.contratanteRepresentante}.</p>
          <p><b>CONTRATADA:</b> {c.contratadaRazao} — CNPJ {c.contratadaCnpj}, sediada em {c.contratadaEndereco}, telefone {c.contratadaTelefone}, e-mail {c.contratadaEmail}.</p>
          <p><b>Cláusula 1 — Objeto:</b> serviços de R&S para a vaga de <b>{c.cargo}</b>.</p>
          <p><b>Cláusula 2 — Prazo:</b> até {c.prazoExecucao} a partir do pagamento inicial.</p>
          <p><b>Cláusula 3 — Valor:</b> {c.valorTotal} ({c.valorTotalExtenso}), em duas parcelas: {c.parcela1}; {c.parcela2}. Pagamento via PIX ({c.chavePix}) na {c.diaPagamento}.</p>
          <p><b>Cláusula 4 — Garantia:</b> {c.prazoGarantia}, limitada a {c.maxReposicoes}. Prazo de escolha do candidato: {c.prazoEscolha}.</p>
          <p><b>Cláusula 5 — Foro:</b> {c.foro}.</p>
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
