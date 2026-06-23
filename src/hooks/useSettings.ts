import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth";

// ─── Company ─────────────────────────────────────────────────

export type Company = {
  id: string;
  name: string;
  cnpj: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  logo_url: string | null;
  city: string | null;
  state: string | null;
  created_at: string;
  updated_at: string;
};

export function useCompany() {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ["company", profile?.company_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("id", profile!.company_id!)
        .single();
      if (error) throw error;
      return data as Company;
    },
    enabled: !!profile?.company_id,
  });
}

export function useUpdateCompany() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Omit<Company, "id" | "created_at" | "updated_at">>) => {
      const { data, error } = await supabase
        .from("companies")
        .update(payload)
        .eq("id", profile!.company_id!)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["company", profile?.company_id] });
      toast.success("Dados da empresa atualizados");
    },
    onError: () => toast.error("Erro ao atualizar empresa"),
  });
}

// ─── Profile ─────────────────────────────────────────────────

export function useUpdateProfile() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name?: string }) => {
      const { data, error } = await supabase
        .from("profiles")
        .update(payload)
        .eq("id", profile!.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profiles"] });
      toast.success("Perfil atualizado — recarregue a página para ver as mudanças");
    },
    onError: () => toast.error("Erro ao atualizar perfil"),
  });
}

// ─── Team ────────────────────────────────────────────────────

export type TeamMember = {
  id: string;
  name: string;
  role: "admin" | "recruiter" | "financial" | "viewer";
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
};

export function useTeamMembers() {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ["team", profile?.company_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, role, avatar_url, is_active, created_at")
        .order("name");
      if (error) throw error;
      return data as TeamMember[];
    },
    enabled: !!profile?.company_id,
  });
}

export function useUpdateMemberRole() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, role }: { id: string; role: TeamMember["role"] }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ role })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team", profile?.company_id] });
      toast.success("Função atualizada");
    },
    onError: () => toast.error("Erro ao atualizar função"),
  });
}

// ─── Categories ───────────────────────────────────────────────

export function useCreateCategory() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string; type: "income" | "expense"; color: string }) => {
      const { data, error } = await supabase
        .from("categories")
        .insert({ ...payload, company_id: profile!.company_id! })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories", profile?.company_id] });
      toast.success("Categoria criada");
    },
    onError: () => toast.error("Erro ao criar categoria"),
  });
}

export function useUpdateCategory() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string; name: string; color: string }) => {
      const { data, error } = await supabase
        .from("categories")
        .update(payload)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories", profile?.company_id] });
      toast.success("Categoria atualizada");
    },
    onError: () => toast.error("Erro ao atualizar categoria"),
  });
}

export function useDeleteCategory() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("categories")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories", profile?.company_id] });
      toast.success("Categoria removida");
    },
    onError: () => toast.error("Erro ao remover categoria"),
  });
}

// ─── CRM Stages ───────────────────────────────────────────────

export function useCreateCrmStage() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string; color: string; probability: number; order: number }) => {
      const { data, error } = await supabase
        .from("crm_stages")
        .insert({ ...payload, company_id: profile!.company_id! })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm_stages", profile?.company_id] });
      toast.success("Etapa criada");
    },
    onError: () => toast.error("Erro ao criar etapa"),
  });
}

export function useUpdateCrmStage() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: { id: string } & Partial<{ name: string; color: string; probability: number; order: number }>) => {
      const { data, error } = await supabase
        .from("crm_stages")
        .update(payload)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm_stages", profile?.company_id] });
    },
    onError: () => toast.error("Erro ao atualizar etapa"),
  });
}

export function useDeleteCrmStage() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("crm_stages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm_stages", profile?.company_id] });
      toast.success("Etapa removida");
    },
    onError: () => toast.error("Erro ao remover etapa"),
  });
}
