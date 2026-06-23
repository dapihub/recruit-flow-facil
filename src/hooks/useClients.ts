import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth";
import type { Tables } from "@/lib/supabase/types";

export type Client = Tables<"clients">;

export type ClientInsert = {
  name: string;
  person_type?: "pf" | "pj";
  cnpj?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  street?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  notes?: string | null;
  is_active?: boolean;
};

const CLIENT_SELECT = "id, name, person_type, cnpj, email, phone, website, city, state, notes, is_active, deleted_at, created_at, updated_at, company_id, street, zip_code, country";

export function useClients(opts?: { includeInactive?: boolean }) {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ["clients", profile?.company_id, opts],
    queryFn: async () => {
      let q = supabase.from("clients").select(CLIENT_SELECT).is("deleted_at", null).order("name");
      if (!opts?.includeInactive) q = q.eq("is_active", true);
      const { data, error } = await q;
      if (error) throw error;
      return data as Client[];
    },
    enabled: !!profile?.company_id,
  });
}

export function useCreateClient() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ClientInsert) => {
      const { data, error } = await supabase
        .from("clients")
        .insert({ ...payload, company_id: profile!.company_id! })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients", profile?.company_id] });
      toast.success("Cliente criado");
    },
    onError: () => toast.error("Erro ao criar cliente"),
  });
}

export function useUpdateClient() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: ClientInsert & { id: string }) => {
      const { data, error } = await supabase
        .from("clients")
        .update(payload)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients", profile?.company_id] });
      toast.success("Cliente atualizado");
    },
    onError: () => toast.error("Erro ao atualizar cliente"),
  });
}

export function useDeleteClient() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("clients")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients", profile?.company_id] });
      toast.success("Cliente removido");
    },
    onError: () => toast.error("Erro ao remover cliente"),
  });
}
