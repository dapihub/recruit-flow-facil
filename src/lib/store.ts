import { useSyncExternalStore } from "react";

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
  contratadaRepresentante: string;
  objeto: string;
  modeloCobranca: "Percentual sobre salário" | "Valor fixo por vaga";
  valor: string;
  condicoesPagamento: string;
  prazoGarantia: string;
  clausulas: string;
  dataAssinatura: string;
  localAssinatura: string;
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
  observacoes?: string;
};

let vagas: Vaga[] = [
  { id: "1", cargo: "Desenvolvedor Full Stack Sênior", empresa: "TechNova", area: "Tecnologia", candidatos: 24, prazo: "2026-06-15", status: "Aberta", salario: "R$ 15.000", regime: "CLT" },
  { id: "2", cargo: "Analista de Marketing Digital", empresa: "BrandUp", area: "Marketing", candidatos: 18, prazo: "2026-05-30", status: "Em processo", salario: "R$ 7.500", regime: "Híbrido" },
  { id: "3", cargo: "Gerente Comercial", empresa: "Vendaz", area: "Comercial", candidatos: 12, prazo: "2026-06-01", status: "Em processo", salario: "R$ 12.000", regime: "CLT" },
  { id: "4", cargo: "Designer UX/UI", empresa: "Pixel Lab", area: "Design", candidatos: 31, prazo: "2026-05-20", status: "Fechada", salario: "R$ 9.000", regime: "PJ" },
  { id: "5", cargo: "Analista Financeiro Pleno", empresa: "FinCore", area: "Financeiro", candidatos: 15, prazo: "2026-06-10", status: "Aberta", salario: "R$ 8.500", regime: "CLT" },
  { id: "6", cargo: "Recrutador Tech", empresa: "TalentHub", area: "RH", candidatos: 9, prazo: "2026-04-15", status: "Encerrada", salario: "R$ 6.000", regime: "CLT" },
];

let candidatos: Candidato[] = [
  { id: "1", nome: "Ana Carolina Silva", email: "ana.silva@email.com", vaga: "Desenvolvedor Full Stack Sênior", etapa: "Entrevista técnica", proximaAcao: "Teste prático", pontuacao: 8.7, status: "Entrevista" },
  { id: "2", nome: "Bruno Henrique Costa", email: "bruno.costa@email.com", vaga: "Analista de Marketing Digital", etapa: "Triagem inicial", proximaAcao: "Análise CV", pontuacao: 7.2, status: "Triagem" },
  { id: "3", nome: "Camila Oliveira", email: "camila.o@email.com", vaga: "Designer UX/UI", etapa: "Proposta enviada", proximaAcao: "Aguardar resposta", pontuacao: 9.4, status: "Contratado" },
  { id: "4", nome: "Diego Martins", email: "diego.m@email.com", vaga: "Gerente Comercial", etapa: "Entrevista RH", proximaAcao: "Entrevista gestor", pontuacao: 8.1, status: "Entrevista" },
  { id: "5", nome: "Eduarda Ramos", email: "edu.ramos@email.com", vaga: "Analista Financeiro Pleno", etapa: "Triagem inicial", proximaAcao: "Ligação inicial", pontuacao: 6.8, status: "Triagem" },
  { id: "6", nome: "Felipe Andrade", email: "felipe.a@email.com", vaga: "Desenvolvedor Full Stack Sênior", etapa: "Reprovado", proximaAcao: "—", pontuacao: 4.5, status: "Reprovado" },
  { id: "7", nome: "Giovanna Lopes", email: "gi.lopes@email.com", vaga: "Recrutador Tech", etapa: "Contratada", proximaAcao: "Onboarding", pontuacao: 9.1, status: "Contratado" },
];

let faturas: Fatura[] = [
  { id: "1", numero: "RF-2026-001", cliente: "TechNova", servico: "Recrutamento Dev Sênior", vencimento: "2026-05-20", valor: 18000, status: "Pago" },
  { id: "2", numero: "RF-2026-002", cliente: "Pixel Lab", servico: "Recrutamento Designer UX", vencimento: "2026-05-25", valor: 9500, status: "Pago" },
  { id: "3", numero: "RF-2026-003", cliente: "Vendaz", servico: "Headhunting Gerente Comercial", vencimento: "2026-05-15", valor: 22000, status: "Pendente" },
  { id: "4", numero: "RF-2026-004", cliente: "BrandUp", servico: "Recrutamento Marketing", vencimento: "2026-04-30", valor: 8800, status: "Atrasado" },
  { id: "5", numero: "RF-2026-005", cliente: "FinCore", servico: "Recrutamento Analista Financeiro", vencimento: "2026-06-05", valor: 11000, status: "Pendente" },
  { id: "6", numero: "RF-2026-006", cliente: "TalentHub", servico: "Recrutamento Recrutador Tech", vencimento: "2026-04-10", valor: 7200, status: "Pago" },
];

const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => { listeners.add(cb); return () => listeners.delete(cb); };
const emit = () => listeners.forEach(l => l());

export const useVagas = () => useSyncExternalStore(subscribe, () => vagas, () => vagas);
export const useCandidatos = () => useSyncExternalStore(subscribe, () => candidatos, () => candidatos);
export const useFaturas = () => useSyncExternalStore(subscribe, () => faturas, () => faturas);

export function addVaga(v: Omit<Vaga, "id" | "candidatos" | "status">) {
  vagas = [{ ...v, id: crypto.randomUUID(), candidatos: 0, status: "Aberta" }, ...vagas];
  emit();
}
export function addCandidato(c: Omit<Candidato, "id" | "etapa" | "proximaAcao" | "pontuacao" | "status">) {
  candidatos = [{ ...c, id: crypto.randomUUID(), etapa: "Triagem inicial", proximaAcao: "Análise CV", pontuacao: 0, status: "Triagem" }, ...candidatos];
  emit();
}
export function addFatura(f: Omit<Fatura, "id" | "numero" | "status">) {
  const numero = `RF-2026-${String(faturas.length + 1).padStart(3, "0")}`;
  faturas = [{ ...f, id: crypto.randomUUID(), numero, status: "Pendente" }, ...faturas];
  emit();
}
