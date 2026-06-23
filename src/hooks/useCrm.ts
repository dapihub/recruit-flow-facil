import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth";

// ─── Types ───────────────────────────────────────────────────

export type CrmStage = {
  id: string;
  company_id: string;
  name: string;
  color: string;
  order: number;
  probability: number;
  is_final: boolean;
  outcome: "won" | "lost" | null;
  created_at: string;
  updated_at: string;
};

export type CrmOpportunity = {
  id: string;
  company_id: string;
  stage_id: string;
  client_id: string | null;
  contact_id: string | null;
  assignee_id: string | null;
  title: string;
  value: number | null;
  probability: number;
  expected_close: string | null;
  lead_name: string | null;
  lead_email: string | null;
  notes: string | null;
  lost_reason: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  client?: { id: string; name: string } | null;
  contact?: { id: string; name: string } | null;
  assignee?: { id: string; name: string } | null;
};

export type OpportunityInsert = {
  title: string;
  stage_id: string;
  client_id?: string | null;
  contact_id?: string | null;
  assignee_id?: string | null;
  value?: number | null;
  probability?: number;
  expected_close?: string | null;
  lead_name?: string | null;
  lead_email?: string | null;
  notes?: string | null;
};

// ─── Hooks ───────────────────────────────────────────────────

export function useCrmStages() {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ["crm_stages", profile?.company_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_stages")
        .select("*")
        .order("order");
      if (error) throw error;
      return data as CrmStage[];
    },
    enabled: !!profile?.company_id,
  });
}

export function useCrmOpportunities(filters?: { assignee_id?: string; search?: string }) {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ["crm_opportunities", profile?.company_id, filters],
    queryFn: async () => {
      let q = supabase
        .from("crm_opportunities")
        .select(
          "*, client:clients(id, name), contact:contacts(id, name), assignee:profiles!assignee_id(id, name)"
        )
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (filters?.assignee_id) q = q.eq("assignee_id", filters.assignee_id);
      if (filters?.search) q = q.ilike("title", `%${filters.search}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data as CrmOpportunity[];
    },
    enabled: !!profile?.company_id,
  });
}

export function useCreateOpportunity() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: OpportunityInsert) => {
      const { data, error } = await supabase
        .from("crm_opportunities")
        .insert({ ...payload, company_id: profile!.company_id! } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm_opportunities", profile?.company_id] });
      toast.success("Oportunidade criada");
    },
    onError: () => toast.error("Erro ao criar oportunidade"),
  });
}

export function useUpdateOpportunity() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: Partial<OpportunityInsert> & { id: string }) => {
      const { data, error } = await supabase
        .from("crm_opportunities")
        .update(payload as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm_opportunities", profile?.company_id] });
      toast.success("Oportunidade atualizada");
    },
    onError: () => toast.error("Erro ao atualizar oportunidade"),
  });
}

export function useDeleteOpportunity() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("crm_opportunities")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm_opportunities", profile?.company_id] });
      toast.success("Oportunidade removida");
    },
    onError: () => toast.error("Erro ao remover oportunidade"),
  });
}
