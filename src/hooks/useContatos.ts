import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth";

export type Contato = {
  id: string;
  company_id: string;
  client_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  avatar_url: string | null;
  linkedin: string | null;
  notes: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  client?: { id: string; name: string } | null;
};

export type ContatoInsert = {
  name: string;
  client_id?: string | null;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  linkedin?: string | null;
  notes?: string | null;
};

const CONTATO_SELECT = "*, client:clients(id, name)";

export function useContatos(filters?: { client_id?: string; search?: string }) {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ["contatos", profile?.company_id, filters],
    queryFn: async () => {
      let q = supabase
        .from("contacts")
        .select(CONTATO_SELECT)
        .is("deleted_at", null)
        .order("name");
      if (filters?.client_id) q = q.eq("client_id", filters.client_id);
      if (filters?.search) q = q.ilike("name", `%${filters.search}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data as Contato[];
    },
    enabled: !!profile?.company_id,
  });
}

export function useCreateContato() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ContatoInsert) => {
      const { data, error } = await supabase
        .from("contacts")
        .insert({ ...payload, company_id: profile!.company_id! })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contatos", profile?.company_id] });
      toast.success("Contato criado");
    },
    onError: () => toast.error("Erro ao criar contato"),
  });
}

export function useUpdateContato() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: ContatoInsert & { id: string }) => {
      const { data, error } = await supabase
        .from("contacts")
        .update(payload)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contatos", profile?.company_id] });
      toast.success("Contato atualizado");
    },
    onError: () => toast.error("Erro ao atualizar contato"),
  });
}

export function useDeleteContato() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("contacts")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contatos", profile?.company_id] });
      toast.success("Contato removido");
    },
    onError: () => toast.error("Erro ao remover contato"),
  });
}
