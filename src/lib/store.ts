import { useEffect, useMemo, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";

export type VagaStatus = "Aberta" | "Em processo" | "Fechada" | "Encerrada";

export type PipelineEtapa =
  | "Briefing"
  | "Contrato"
  | "Descritivo publicado"
  | "Candidatos em triagem"
  | "Em Garantia"
  | "Finalizada";

export const PIPELINE_ETAPAS: PipelineEtapa[] = [
  "Briefing",
  "Contrato",
  "Descritivo publicado",
  "Candidatos em triagem",
  "Em Garantia",
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
  prazoGarantia?: number;
  garantiaInicio?: string | null;
  briefing?: Briefing;
  descritivo?: Descritivo;
  contrato?: Contrato;
  createdAt?: string;
  updatedAt?: string;
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

// Demo seed data removido permanentemente para evitar reaparecimento de registros.

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
    prazoGarantia: row.prazo_garantia ?? undefined,
    garantiaInicio: row.garantia_inicio ?? null,
    briefing: row.briefing ?? undefined,
    descritivo: row.descritivo ?? undefined,
    contrato: row.contrato ?? undefined,
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined,
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

// seedDemoData removido — sem reintrodução automática de dados de exemplo.

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

export async function addVaga(vaga: {
  cargo: string;
  empresa: string;
  quantidade?: number;
  receita?: number;
  prazoGarantia?: number;
  area?: string;
  prazo?: string;
  descricao?: string;
  salario?: string;
  regime?: "CLT" | "PJ" | "Híbrido";
}) {
  const prazo = vaga.prazo || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const quantidade = vaga.quantidade ?? 1;

  const payload: any = {
    cargo: vaga.cargo,
    empresa: vaga.empresa,
    area: vaga.area || "Geral",
    prazo,
    descricao: vaga.descricao ?? null,
    salario: vaga.salario ?? null,
    regime: vaga.regime ?? null,
    prazo_garantia: vaga.prazoGarantia ?? 90,
    briefing: { quantidade } as any,
  };

  const { data, error } = await supabase.from("vagas").insert(payload).select().single();
  if (error) throw error;

  const novaVaga = mapVaga(data);
  state.vagas = [novaVaga, ...state.vagas];
  emit();

  // Cria 2 faturas (50% entrada + 50% conclusão) vinculadas à vaga
  if (vaga.receita && vaga.receita > 0) {
    const valorTotal = vaga.receita * quantidade;
    const metade = Math.round((valorTotal / 2) * 100) / 100;
    const hoje = new Date().toISOString().slice(0, 10);
    const sufixo = quantidade > 1 ? ` (${quantidade} vagas)` : "";
    try {
      await addFatura({
        cliente: vaga.empresa,
        servico: `Recrutamento — ${vaga.cargo}${sufixo} — Entrada (50%)`,
        valor: metade,
        vencimento: hoje,
        vagaId: novaVaga.id,
      });
      await addFatura({
        cliente: vaga.empresa,
        servico: `Recrutamento — ${vaga.cargo}${sufixo} — Conclusão (50%)`,
        valor: valorTotal - metade,
        vencimento: prazo,
        vagaId: novaVaga.id,
      });
    } catch (err) {
      console.error("Erro ao criar faturas automáticas:", err);
    }
  }

  return novaVaga;
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
  if (patch.prazoGarantia !== undefined) payload.prazo_garantia = patch.prazoGarantia;
  if (patch.garantiaInicio !== undefined) payload.garantia_inicio = patch.garantiaInicio;
  if (patch.createdAt !== undefined) payload.created_at = patch.createdAt;

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
