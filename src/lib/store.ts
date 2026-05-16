import { useEffect, useMemo, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";

export type VagaStatus = "Aberta" | "Em processo" | "Fechada" | "Encerrada";

export type PipelineEtapa =
  | "Briefing"
  | "Contrato"
  | "Descritivo publicado"
  | "Candidatos em triagem"
  | "Finalizada";

export const PIPELINE_ETAPAS: PipelineEtapa[] = [
  "Briefing",
  "Contrato",
  "Descritivo publicado",
  "Candidatos em triagem",
  "Finalizada",
];

export type Briefing = {
  cliente: string;
  contatoResponsavel: string;
  cargo: string;
  quantidade: number;
  motivo: "Substituição" | "Expansão" | "Novo projeto";
  formacao: string;
  experienciaMinima: string;
  habilidadesTecnicas: string;
  softSkills: string;
  diferenciais: string;
  faixaSalarial: string;
  beneficios: string;
  modeloTrabalho: "Presencial" | "Híbrido" | "Remoto";
  localizacao: string;
  prazo: string;
  observacoes: string;
};

export type Descritivo = {
  titulo: string;
  sobreEmpresa: string;
  responsabilidades: string;
  requisitosObrigatorios: string;
  requisitosDesejaveis: string;
  oferece: string;
  comoCandidatar: string;
};

export type Contrato = {
  contratanteRazao: string;
  contratanteCnpj: string;
  contratanteEndereco: string;
  contratanteRepresentante: string;
  contratadaRazao: string;
  contratadaCnpj: string;
  contratadaEndereco: string;
  contratadaTelefone: string;
  contratadaEmail: string;
  contratadaRepresentante: string;
  cargo: string;
  prazoExecucao: string;
  valorTotal: string;
  valorTotalExtenso: string;
  parcela1: string;
  parcela2: string;
  diaPagamento: string;
  chavePix: string;
  prazoGarantia: string;
  maxReposicoes: string;
  prazoEscolha: string;
  foro: string;
  dataAssinatura: string;
  localAssinatura: string;
  observacoes: string;
};

export type Vaga = {
  id: string;
  cargo: string;
  empresa: string;
  area: string;
  candidatos: number;
  prazo: string;
  status: VagaStatus;
  descricao?: string;
  salario?: string;
  regime?: "CLT" | "PJ" | "Híbrido";
  etapa: PipelineEtapa;
  briefing?: Briefing;
  descritivo?: Descritivo;
  contrato?: Contrato;
};

export type CandidatoStatus = "Triagem" | "Entrevista" | "Contratado" | "Reprovado";
export type Candidato = {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  vaga: string;
  vagaId?: string | null;
  etapa: string;
  proximaAcao: string;
  pontuacao: number;
  status: CandidatoStatus;
  linkedin?: string;
  observacoes?: string;
};

export type FaturaStatus = "Pago" | "Pendente" | "Atrasado";
export type Fatura = {
  id: string;
  numero: string;
  cliente: string;
  servico: string;
  vencimento: string;
  valor: number;
  status: FaturaStatus;
  vagaId?: string | null;
  observacoes?: string;
};

export type CustoCategoria =
  | "Pessoal"
  | "Software"
  | "Marketing"
  | "Anúncios"
  | "Infraestrutura"
  | "Impostos"
  | "Operacional"
  | "Outros";

export const CUSTO_CATEGORIAS: CustoCategoria[] = [
  "Pessoal",
  "Software",
  "Marketing",
  "Anúncios",
  "Infraestrutura",
  "Impostos",
  "Operacional",
  "Outros",
];

export type CustoTipo = "Fixo" | "Variável";
export type CustoStatus = "Pago" | "Pendente" | "Atrasado";

export type Custo = {
  id: string;
  descricao: string;
  categoria: CustoCategoria;
  tipo: CustoTipo;
  valor: number;
  data: string;
  status: CustoStatus;
  fornecedor?: string;
  vagaId?: string;
  observacoes?: string;
};

type StoreState = {
  vagas: Vaga[];
  candidatos: Candidato[];
  faturas: Fatura[];
  custos: Custo[];
  loading: boolean;
  loadedUserId: string | null;
};

const state: StoreState = {
  vagas: [],
  candidatos: [],
  faturas: [],
  custos: [],
  loading: false,
  loadedUserId: null,
};

const INITIAL_VAGAS: Omit<Vaga, "id">[] = [
  { cargo: "Desenvolvedor Full Stack Sênior", empresa: "TechNova", area: "Tecnologia", candidatos: 24, prazo: "2026-06-15", status: "Aberta", salario: "R$ 15.000", regime: "CLT", etapa: "Candidatos em triagem" },
  { cargo: "Analista de Marketing Digital", empresa: "BrandUp", area: "Marketing", candidatos: 18, prazo: "2026-05-30", status: "Em processo", salario: "R$ 7.500", regime: "Híbrido", etapa: "Descritivo publicado" },
  { cargo: "Gerente Comercial", empresa: "Vendaz", area: "Comercial", candidatos: 12, prazo: "2026-06-01", status: "Em processo", salario: "R$ 12.000", regime: "CLT", etapa: "Contrato" },
  { cargo: "Designer UX/UI", empresa: "Pixel Lab", area: "Design", candidatos: 31, prazo: "2026-05-20", status: "Fechada", salario: "R$ 9.000", regime: "PJ", etapa: "Finalizada" },
  { cargo: "Analista Financeiro Pleno", empresa: "FinCore", area: "Financeiro", candidatos: 15, prazo: "2026-06-10", status: "Aberta", salario: "R$ 8.500", regime: "CLT", etapa: "Briefing" },
  { cargo: "Recrutador Tech", empresa: "TalentHub", area: "RH", candidatos: 9, prazo: "2026-04-15", status: "Encerrada", salario: "R$ 6.000", regime: "CLT", etapa: "Finalizada" },
];

const INITIAL_CANDIDATOS = [
  { nome: "Ana Carolina Silva", email: "ana.silva@email.com", vaga: "Desenvolvedor Full Stack Sênior", etapa: "Entrevista técnica", proximaAcao: "Teste prático", pontuacao: 8.7, status: "Entrevista" as CandidatoStatus },
  { nome: "Bruno Henrique Costa", email: "bruno.costa@email.com", vaga: "Analista de Marketing Digital", etapa: "Triagem inicial", proximaAcao: "Análise CV", pontuacao: 7.2, status: "Triagem" as CandidatoStatus },
  { nome: "Camila Oliveira", email: "camila.o@email.com", vaga: "Designer UX/UI", etapa: "Proposta enviada", proximaAcao: "Aguardar resposta", pontuacao: 9.4, status: "Contratado" as CandidatoStatus },
  { nome: "Diego Martins", email: "diego.m@email.com", vaga: "Gerente Comercial", etapa: "Entrevista RH", proximaAcao: "Entrevista gestor", pontuacao: 8.1, status: "Entrevista" as CandidatoStatus },
  { nome: "Eduarda Ramos", email: "edu.ramos@email.com", vaga: "Analista Financeiro Pleno", etapa: "Triagem inicial", proximaAcao: "Ligação inicial", pontuacao: 6.8, status: "Triagem" as CandidatoStatus },
  { nome: "Felipe Andrade", email: "felipe.a@email.com", vaga: "Desenvolvedor Full Stack Sênior", etapa: "Reprovado", proximaAcao: "—", pontuacao: 4.5, status: "Reprovado" as CandidatoStatus },
  { nome: "Giovanna Lopes", email: "gi.lopes@email.com", vaga: "Recrutador Tech", etapa: "Contratada", proximaAcao: "Onboarding", pontuacao: 9.1, status: "Contratado" as CandidatoStatus },
];

const INITIAL_FATURAS: Omit<Fatura, "id">[] = [
  { numero: "RF-2026-001", cliente: "TechNova", servico: "Recrutamento Dev Sênior", vencimento: "2026-05-20", valor: 18000, status: "Pago" },
  { numero: "RF-2026-002", cliente: "Pixel Lab", servico: "Recrutamento Designer UX", vencimento: "2026-05-25", valor: 9500, status: "Pago" },
  { numero: "RF-2026-003", cliente: "Vendaz", servico: "Headhunting Gerente Comercial", vencimento: "2026-05-15", valor: 22000, status: "Pendente" },
  { numero: "RF-2026-004", cliente: "BrandUp", servico: "Recrutamento Marketing", vencimento: "2026-04-30", valor: 8800, status: "Atrasado" },
  { numero: "RF-2026-005", cliente: "FinCore", servico: "Recrutamento Analista Financeiro", vencimento: "2026-06-05", valor: 11000, status: "Pendente" },
  { numero: "RF-2026-006", cliente: "TalentHub", servico: "Recrutamento Recrutador Tech", vencimento: "2026-04-10", valor: 7200, status: "Pago" },
];

const INITIAL_CUSTOS: Omit<Custo, "id">[] = [
  { descricao: "Salários time interno", categoria: "Pessoal", tipo: "Fixo", valor: 24000, data: "2026-05-05", status: "Pago", fornecedor: "Folha DAPI" },
  { descricao: "Assinatura LinkedIn Recruiter", categoria: "Software", tipo: "Fixo", valor: 3200, data: "2026-05-03", status: "Pago", fornecedor: "LinkedIn" },
  { descricao: "Anúncios Meta Ads — vaga TechNova", categoria: "Anúncios", tipo: "Variável", valor: 1800, data: "2026-05-08", status: "Pago", fornecedor: "Meta" },
  { descricao: "Aluguel sala comercial", categoria: "Infraestrutura", tipo: "Fixo", valor: 4500, data: "2026-05-10", status: "Pendente", fornecedor: "Imobiliária Centro" },
  { descricao: "Simples Nacional — DAS", categoria: "Impostos", tipo: "Variável", valor: 5200, data: "2026-05-20", status: "Pendente", fornecedor: "Receita Federal" },
  { descricao: "Campanha branding", categoria: "Marketing", tipo: "Variável", valor: 2700, data: "2026-04-28", status: "Atrasado", fornecedor: "Agência Norte" },
];

const listeners = new Set<() => void>();
let authListenerReady = false;
let pendingLoad: Promise<void> | null = null;

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

const emit = () => listeners.forEach((listener) => listener());

function clearState() {
  state.vagas = [];
  state.candidatos = [];
  state.faturas = [];
  state.custos = [];
  state.loading = false;
  state.loadedUserId = null;
  emit();
}

function mapVaga(row: any): Vaga {
  return {
    id: row.id,
    cargo: row.cargo,
    empresa: row.empresa,
    area: row.area,
    candidatos: Number(row.candidatos ?? 0),
    prazo: row.prazo,
    status: row.status,
    descricao: row.descricao ?? undefined,
    salario: row.salario ?? undefined,
    regime: row.regime ?? undefined,
    etapa: row.etapa,
    briefing: row.briefing ?? undefined,
    descritivo: row.descritivo ?? undefined,
    contrato: row.contrato ?? undefined,
  };
}

function mapCandidato(row: any): Candidato {
  return {
    id: row.id,
    nome: row.nome,
    email: row.email,
    telefone: row.telefone ?? undefined,
    vaga: row.vaga_nome,
    vagaId: row.vaga_id ?? null,
    etapa: row.etapa,
    proximaAcao: row.proxima_acao,
    pontuacao: Number(row.pontuacao ?? 0),
    status: row.status,
    linkedin: row.linkedin ?? undefined,
    observacoes: row.observacoes ?? undefined,
  };
}

function mapFatura(row: any): Fatura {
  return {
    id: row.id,
    numero: row.numero,
    cliente: row.cliente,
    servico: row.servico,
    vencimento: row.vencimento,
    valor: Number(row.valor ?? 0),
    status: row.status,
    vagaId: row.vaga_id ?? null,
    observacoes: row.observacoes ?? undefined,
  };
}

function mapCusto(row: any): Custo {
  return {
    id: row.id,
    descricao: row.descricao,
    categoria: row.categoria,
    tipo: row.tipo,
    valor: Number(row.valor ?? 0),
    data: row.data,
    status: row.status,
    fornecedor: row.fornecedor ?? undefined,
    vagaId: row.vaga_id ?? undefined,
    observacoes: row.observacoes ?? undefined,
  };
}

function ensureAuthListener() {
  if (authListenerReady || typeof window === "undefined") return;
  authListenerReady = true;

  supabase.auth.onAuthStateChange((_event, session) => {
    const userId = session?.user?.id ?? null;
    if (!userId) {
      clearState();
      return;
    }

    state.loadedUserId = null;
    void loadAll();
  });
}

async function seedDemoData() {
  const { data: vagasData, error: vagasError } = await supabase.from("vagas").insert(INITIAL_VAGAS).select("id, cargo");
  if (vagasError) throw vagasError;

  const vagaByCargo = new Map((vagasData ?? []).map((vaga) => [vaga.cargo, vaga.id]));

  const candidatosPayload = INITIAL_CANDIDATOS.map((candidato) => ({
    nome: candidato.nome,
    email: candidato.email,
    vaga_id: vagaByCargo.get(candidato.vaga) ?? null,
    vaga_nome: candidato.vaga,
    etapa: candidato.etapa,
    proxima_acao: candidato.proximaAcao,
    pontuacao: candidato.pontuacao,
    status: candidato.status,
  }));

  const custosPayload = INITIAL_CUSTOS.map(({ vagaId, ...custo }) => ({
    ...custo,
    vaga_id: vagaId ? vagaByCargo.get(vagaId) ?? null : null,
  }));

  const [{ error: candidatosError }, { error: faturasError }, { error: custosError }] = await Promise.all([
    supabase.from("candidatos").insert(candidatosPayload),
    supabase.from("faturas").insert(INITIAL_FATURAS.map(({ numero, vagaId, ...fatura }) => ({ ...fatura, vaga_id: null }))),
    supabase.from("custos").insert(custosPayload),
  ]);

  if (candidatosError) throw candidatosError;
  if (faturasError) throw faturasError;
  if (custosError) throw custosError;
}

async function loadAll(force = false): Promise<void> {
  if (typeof window === "undefined") return;

  ensureAuthListener();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const userId = session?.user?.id ?? null;

  if (!userId) {
    clearState();
    return;
  }

  if (!force && state.loadedUserId === userId) return;
  if (pendingLoad) return pendingLoad;

  state.loading = true;
  emit();

  pendingLoad = Promise.all([
    supabase.from("vagas").select("*").order("created_at", { ascending: false }),
    supabase.from("candidatos").select("*").order("created_at", { ascending: false }),
    supabase.from("faturas").select("*").order("created_at", { ascending: false }),
    supabase.from("custos").select("*").order("created_at", { ascending: false }),
  ])
    .then(([vagasRes, candidatosRes, faturasRes, custosRes]) => {
      if (vagasRes.error) throw vagasRes.error;
      if (candidatosRes.error) throw candidatosRes.error;
      if (faturasRes.error) throw faturasRes.error;
      if (custosRes.error) throw custosRes.error;

      if (
        (vagasRes.data?.length ?? 0) === 0 &&
        (candidatosRes.data?.length ?? 0) === 0 &&
        (faturasRes.data?.length ?? 0) === 0 &&
        (custosRes.data?.length ?? 0) === 0
      ) {
        return seedDemoData().then(async () => {
          const [seededVagas, seededCandidatos, seededFaturas, seededCustos] = await Promise.all([
            supabase.from("vagas").select("*").order("created_at", { ascending: false }),
            supabase.from("candidatos").select("*").order("created_at", { ascending: false }),
            supabase.from("faturas").select("*").order("created_at", { ascending: false }),
            supabase.from("custos").select("*").order("created_at", { ascending: false }),
          ]);

          if (seededVagas.error) throw seededVagas.error;
          if (seededCandidatos.error) throw seededCandidatos.error;
          if (seededFaturas.error) throw seededFaturas.error;
          if (seededCustos.error) throw seededCustos.error;

          state.vagas = (seededVagas.data ?? []).map(mapVaga);
          state.candidatos = (seededCandidatos.data ?? []).map(mapCandidato);
          state.faturas = (seededFaturas.data ?? []).map(mapFatura);
          state.custos = (seededCustos.data ?? []).map(mapCusto);
          state.loadedUserId = userId;
        });
      }

      state.vagas = (vagasRes.data ?? []).map(mapVaga);
      state.candidatos = (candidatosRes.data ?? []).map(mapCandidato);
      state.faturas = (faturasRes.data ?? []).map(mapFatura);
      state.custos = (custosRes.data ?? []).map(mapCusto);
      state.loadedUserId = userId;
    })
    .catch((error) => {
      console.error("Erro ao carregar dados do backend:", error);
    })
    .finally(() => {
      state.loading = false;
      pendingLoad = null;
      emit();
    });

  return pendingLoad;
}

function useStoreValue<T>(selector: () => T) {
  const snapshot = useSyncExternalStore(subscribe, selector, selector);

  useEffect(() => {
    void loadAll();
  }, []);

  return snapshot;
}

export const useVagas = () => useStoreValue(() => state.vagas);
export const useCandidatos = () => useStoreValue(() => state.candidatos);
export const useFaturas = () => useStoreValue(() => state.faturas);
export const useCustos = () => useStoreValue(() => state.custos);

export function useVaga(id: string) {
  const vagas = useVagas();
  return useMemo(() => vagas.find((vaga) => vaga.id === id), [vagas, id]);
}

export async function deleteVaga(id: string) {
  const previousVagas = state.vagas;
  state.vagas = state.vagas.filter((vaga) => vaga.id !== id);
  state.candidatos = state.candidatos.map((candidato) =>
    candidato.vagaId === id ? { ...candidato, vagaId: null } : candidato,
  );
  emit();

  const { error } = await supabase.from("vagas").delete().eq("id", id);
  if (error) {
    state.vagas = previousVagas;
    await loadAll(true);
    throw error;
  }
}

export async function deleteCandidato(id: string) {
  const previousCandidatos = state.candidatos;
  state.candidatos = state.candidatos.filter((candidato) => candidato.id !== id);
  emit();

  const { error } = await supabase.from("candidatos").delete().eq("id", id);
  if (error) {
    state.candidatos = previousCandidatos;
    emit();
    throw error;
  }

  await loadAll(true);
}

export async function deleteFatura(id: string) {
  const previousFaturas = state.faturas;
  state.faturas = state.faturas.filter((fatura) => fatura.id !== id);
  emit();

  const { error } = await supabase.from("faturas").delete().eq("id", id);
  if (error) {
    state.faturas = previousFaturas;
    emit();
    throw error;
  }
}

export async function deleteCusto(id: string) {
  const previousCustos = state.custos;
  state.custos = state.custos.filter((custo) => custo.id !== id);
  emit();

  const { error } = await supabase.from("custos").delete().eq("id", id);
  if (error) {
    state.custos = previousCustos;
    emit();
    throw error;
  }
}

export async function addCusto(custo: Omit<Custo, "id">) {
  const payload = {
    descricao: custo.descricao,
    categoria: custo.categoria,
    tipo: custo.tipo,
    valor: custo.valor,
    data: custo.data,
    status: custo.status,
    fornecedor: custo.fornecedor ?? null,
    vaga_id: custo.vagaId ?? null,
    observacoes: custo.observacoes ?? null,
  };

  const { data, error } = await supabase.from("custos").insert(payload).select().single();
  if (error) throw error;

  state.custos = [mapCusto(data), ...state.custos];
  emit();
}

export async function addVaga(vaga: Omit<Vaga, "id" | "candidatos" | "status" | "etapa">) {
  const payload = {
    cargo: vaga.cargo,
    empresa: vaga.empresa,
    area: vaga.area,
    prazo: vaga.prazo,
    descricao: vaga.descricao ?? null,
    salario: vaga.salario ?? null,
    regime: vaga.regime ?? null,
  };

  const { data, error } = await supabase.from("vagas").insert(payload).select().single();
  if (error) throw error;

  state.vagas = [mapVaga(data), ...state.vagas];
  emit();
}

export async function updateVaga(id: string, patch: Partial<Vaga>) {
  const payload: any = {};

  if (patch.cargo !== undefined) payload.cargo = patch.cargo;
  if (patch.empresa !== undefined) payload.empresa = patch.empresa;
  if (patch.area !== undefined) payload.area = patch.area;
  if (patch.candidatos !== undefined) payload.candidatos = patch.candidatos;
  if (patch.prazo !== undefined) payload.prazo = patch.prazo;
  if (patch.status !== undefined) payload.status = patch.status;
  if (patch.descricao !== undefined) payload.descricao = patch.descricao;
  if (patch.salario !== undefined) payload.salario = patch.salario;
  if (patch.regime !== undefined) payload.regime = patch.regime;
  if (patch.etapa !== undefined) payload.etapa = patch.etapa;
  if (patch.briefing !== undefined) payload.briefing = patch.briefing;
  if (patch.descritivo !== undefined) payload.descritivo = patch.descritivo;
  if (patch.contrato !== undefined) payload.contrato = patch.contrato;

  const { data, error } = await supabase.from("vagas").update(payload).eq("id", id).select().single();
  if (error) throw error;

  state.vagas = state.vagas.map((vaga) => (vaga.id === id ? mapVaga(data) : vaga));
  emit();
}

export function getVaga(id: string): Vaga | undefined {
  return state.vagas.find((vaga) => vaga.id === id);
}

export async function addCandidato(candidato: Omit<Candidato, "id" | "etapa" | "proximaAcao" | "pontuacao" | "status">) {
  const vaga = state.vagas.find((item) => item.cargo === candidato.vaga);

  const payload = {
    nome: candidato.nome,
    email: candidato.email,
    telefone: candidato.telefone ?? null,
    vaga_id: vaga?.id ?? null,
    vaga_nome: candidato.vaga,
    linkedin: candidato.linkedin ?? null,
    observacoes: candidato.observacoes ?? null,
  };

  const { data, error } = await supabase.from("candidatos").insert(payload).select().single();
  if (error) throw error;

  state.candidatos = [mapCandidato(data), ...state.candidatos];
  emit();
  await loadAll(true);
}

export async function addFatura(fatura: Omit<Fatura, "id" | "numero" | "status">) {
  const payload = {
    cliente: fatura.cliente,
    servico: fatura.servico,
    valor: fatura.valor,
    vencimento: fatura.vencimento,
    vaga_id: fatura.vagaId ?? null,
    observacoes: fatura.observacoes ?? null,
  };

  const { data, error } = await supabase.from("faturas").insert(payload).select().single();
  if (error) throw error;

  state.faturas = [mapFatura(data), ...state.faturas];
  emit();
}

export async function updateFatura(id: string, patch: Partial<Fatura>) {
  const payload: any = {};
  if (patch.cliente !== undefined) payload.cliente = patch.cliente;
  if (patch.servico !== undefined) payload.servico = patch.servico;
  if (patch.vencimento !== undefined) payload.vencimento = patch.vencimento;
  if (patch.valor !== undefined) payload.valor = patch.valor;
  if (patch.status !== undefined) payload.status = patch.status;
  if (patch.vagaId !== undefined) payload.vaga_id = patch.vagaId;
  if (patch.observacoes !== undefined) payload.observacoes = patch.observacoes;

  const { data, error } = await supabase.from("faturas").update(payload).eq("id", id).select().single();
  if (error) throw error;

  state.faturas = state.faturas.map((fatura) => (fatura.id === id ? mapFatura(data) : fatura));
  emit();
}

export async function updateCusto(id: string, patch: Partial<Custo>) {
  const payload: any = {};
  if (patch.descricao !== undefined) payload.descricao = patch.descricao;
  if (patch.categoria !== undefined) payload.categoria = patch.categoria;
  if (patch.tipo !== undefined) payload.tipo = patch.tipo;
  if (patch.valor !== undefined) payload.valor = patch.valor;
  if (patch.data !== undefined) payload.data = patch.data;
  if (patch.status !== undefined) payload.status = patch.status;
  if (patch.fornecedor !== undefined) payload.fornecedor = patch.fornecedor;
  if (patch.vagaId !== undefined) payload.vaga_id = patch.vagaId;
  if (patch.observacoes !== undefined) payload.observacoes = patch.observacoes;

  const { data, error } = await supabase.from("custos").update(payload).eq("id", id).select().single();
  if (error) throw error;

  state.custos = state.custos.map((custo) => (custo.id === id ? mapCusto(data) : custo));
  emit();
}

export async function refreshStore() {
  await loadAll(true);
}
