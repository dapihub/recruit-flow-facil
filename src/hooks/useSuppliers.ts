import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth";

export type Supplier = {
  id: string;
  company_id: string;
  name: string;
  document: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  is_active: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SupplierInsert = Omit<Supplier, "id" | "company_id" | "deleted_at" | "created_at" | "updated_at">;

export function useSuppliers() {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ["suppliers", profile?.company_id],
    queryFn: async () => {
      const { data, error } = await supabase.from("suppliers" as never).select("*").is("deleted_at", null).order("name");
      if (error) throw error;
      return data as unknown as Supplier[];
    },
    enabled: !!profile?.company_id,
  });
}

export function useCreateSupplier() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<SupplierInsert> & { name: string }) => {
      const { data, error } = await supabase.from("suppliers" as never)
        .insert({ ...payload, company_id: profile!.company_id! } as never).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["suppliers"] }); toast.success("Fornecedor criado"); },
    onError: () => toast.error("Erro ao criar fornecedor"),
  });
}

export function useUpdateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<SupplierInsert> & { id: string }) => {
      const { data, error } = await supabase.from("suppliers" as never).update(payload as never).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["suppliers"] }); toast.success("Fornecedor atualizado"); },
    onError: () => toast.error("Erro ao atualizar fornecedor"),
  });
}

export function useDeleteSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("suppliers" as never).update({ deleted_at: new Date().toISOString() } as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["suppliers"] }); toast.success("Fornecedor removido"); },
  });
}
