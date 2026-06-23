import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth";
import type { Tables } from "@/lib/supabase/types";
import type { JobStatus, PriorityLevel } from "@/lib/constants";

export type JobRow = Tables<"jobs">;

export type JobWithJoins = JobRow & {
  client: { id: string; name: string } | null;
  recruiter: { id: string; name: string } | null;
};

export type JobDetails = JobRow & {
  client: Tables<"clients"> | null;
  recruiter: { id: string; name: string; avatar_url: string | null } | null;
};

export type JobInsert = {
  title: string;
  client_id?: string | null;
  recruiter_id?: string | null;
  status?: JobStatus;
  priority?: PriorityLevel;
  contract_type?: string | null;
  work_model?: string | null;
  seniority?: string | null;
  department?: string | null;
  location?: string | null;
  headcount?: number;
  salary_min?: number | null;
  salary_max?: number | null;
  fee_model?: string | null;
  fee_value?: number | null;
  is_exclusive?: boolean;
  description?: string | null;
  required_skills?: string | null;
  desired_skills?: string | null;
  responsibilities?: string | null;
  deadline?: string | null;
};

const JOB_LIST_SELECT =
  "*, client:clients(id, name), recruiter:profiles!recruiter_id(id, name)";
const JOB_DETAIL_SELECT =
  "*, client:clients(*), recruiter:profiles!recruiter_id(id, name, avatar_url)";

export function useJobs(filters?: {
  status?: JobStatus;
  search?: string;
}) {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ["jobs", profile?.company_id, filters],
    queryFn: async () => {
      let q = supabase
        .from("jobs")
        .select(JOB_LIST_SELECT)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (filters?.status) q = q.eq("status", filters.status);
      if (filters?.search) q = q.ilike("title", `%${filters.search}%`);

      const { data, error } = await q;
      if (error) throw error;
      return data as JobWithJoins[];
    },
    enabled: !!profile?.company_id,
  });
}

export function useJob(id: string) {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ["jobs", profile?.company_id, id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select(JOB_DETAIL_SELECT)
        .eq("id", id)
        .is("deleted_at", null)
        .single();
      if (error) throw error;
      return data as JobDetails;
    },
    enabled: !!profile?.company_id && !!id,
  });
}

export function useCreateJob() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: JobInsert) => {
      const { data, error } = await supabase
        .from("jobs")
        .insert({ ...payload, company_id: profile!.company_id! } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jobs", profile?.company_id] });
      toast.success("Vaga criada com sucesso");
    },
    onError: () => toast.error("Erro ao criar vaga"),
  });
}

export function useUpdateJob() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: Partial<JobInsert> & { id: string }) => {
      const { data, error } = await supabase
        .from("jobs")
        .update(payload as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jobs", profile?.company_id] });
      toast.success("Vaga atualizada");
    },
    onError: () => toast.error("Erro ao atualizar vaga"),
  });
}

export function useDeleteJob() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("jobs")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jobs", profile?.company_id] });
      toast.success("Vaga removida");
    },
    onError: () => toast.error("Erro ao remover vaga"),
  });
}
