import type { Tables } from "./supabase/types";

export type JobStatus = Tables<"jobs">["status"];
export type PriorityLevel = Tables<"jobs">["priority"];
export type TaskStatus = Tables<"tasks">["status"];
export type ContractType = NonNullable<Tables<"jobs">["contract_type"]>;
export type WorkModel = NonNullable<Tables<"jobs">["work_model"]>;
export type SeniorityLevel = NonNullable<Tables<"jobs">["seniority"]>;
export type FeeModel = NonNullable<Tables<"jobs">["fee_model"]>;

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  open: "Aberta",
  screening: "Triagem",
  interviewing: "Entrevistas",
  proposal: "Proposta",
  closed: "Fechada",
  cancelled: "Cancelada",
  paused: "Pausada",
};

export const JOB_STATUS_COLORS: Record<JobStatus, string> = {
  open: "#10b981",
  screening: "#3b82f6",
  interviewing: "#8b5cf6",
  proposal: "#f59e0b",
  closed: "#6b7280",
  cancelled: "#ef4444",
  paused: "#eab308",
};

export const PRIORITY_LABELS: Record<PriorityLevel, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  urgent: "Urgente",
};

export const PRIORITY_COLORS: Record<PriorityLevel, string> = {
  low: "#6b7280",
  medium: "#3b82f6",
  high: "#f97316",
  urgent: "#ef4444",
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  not_started: "Não Iniciada",
  in_progress: "Em Andamento",
  in_review: "Em Revisão",
  done: "Finalizada",
};

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  not_started: "#6b7280",
  in_progress: "#3b82f6",
  in_review: "#f59e0b",
  done: "#10b981",
};

export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  clt: "CLT",
  pj: "PJ",
  internship: "Estágio",
  temporary: "Temporário",
  freelance: "Freelance",
};

export const WORK_MODEL_LABELS: Record<WorkModel, string> = {
  onsite: "Presencial",
  hybrid: "Híbrido",
  remote: "Remoto",
};

export const SENIORITY_LABELS: Record<SeniorityLevel, string> = {
  intern: "Estágio",
  junior: "Júnior",
  mid: "Pleno",
  senior: "Sênior",
  specialist: "Especialista",
  lead: "Lead",
};

export const FEE_MODEL_LABELS: Record<FeeModel, string> = {
  salary_pct: "% do Salário",
  fixed: "Fee Fixo",
  fixed_plus_success: "Fixo + Sucesso",
};

export const JOB_STATUS_OPTIONS = (
  Object.entries(JOB_STATUS_LABELS) as [JobStatus, string][]
);
export const PRIORITY_OPTIONS = (
  Object.entries(PRIORITY_LABELS) as [PriorityLevel, string][]
);
export const TASK_STATUS_OPTIONS = (
  Object.entries(TASK_STATUS_LABELS) as [TaskStatus, string][]
);
