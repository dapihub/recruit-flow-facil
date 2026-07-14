import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth";

export type Product = {
  id: string;
  company_id: string;
  sku: string;
  name: string;
  description: string | null;
  unit: string;
  cost_price: number;
  sale_price: number;
  min_stock: number;
  current_stock: number;
  category: string | null;
  is_active: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ProductInsert = Omit<Product, "id" | "company_id" | "current_stock" | "deleted_at" | "created_at" | "updated_at"> & {
  current_stock?: number;
};

export type StockMovement = {
  id: string;
  company_id: string;
  product_id: string;
  type: "in" | "out" | "adjust";
  quantity: number;
  unit_cost: number | null;
  reason: string | null;
  reference: string | null;
  movement_date: string;
  created_by: string | null;
  created_at: string;
};

export function useProducts(opts?: { includeInactive?: boolean }) {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ["products", profile?.company_id, opts],
    queryFn: async () => {
      let q = supabase.from("products" as never).select("*").is("deleted_at", null).order("name");
      if (!opts?.includeInactive) q = q.eq("is_active", true);
      const { data, error } = await q;
      if (error) throw error;
      return data as unknown as Product[];
    },
    enabled: !!profile?.company_id,
  });
}

export function useCreateProduct() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ProductInsert) => {
      const { data, error } = await supabase
        .from("products" as never)
        .insert({ ...payload, company_id: profile!.company_id! } as never)
        .select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["products"] }); toast.success("Produto criado"); },
    onError: (e: Error) => toast.error(e.message ?? "Erro ao criar produto"),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<ProductInsert> & { id: string }) => {
      const { data, error } = await supabase.from("products" as never).update(payload as never).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["products"] }); toast.success("Produto atualizado"); },
    onError: () => toast.error("Erro ao atualizar produto"),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products" as never).update({ deleted_at: new Date().toISOString() } as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["products"] }); toast.success("Produto removido"); },
    onError: () => toast.error("Erro ao remover produto"),
  });
}

export function useStockMovements(productId?: string) {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ["stock_movements", profile?.company_id, productId],
    queryFn: async () => {
      let q = supabase.from("stock_movements" as never).select("*").order("created_at", { ascending: false });
      if (productId) q = q.eq("product_id", productId);
      const { data, error } = await q;
      if (error) throw error;
      return data as unknown as StockMovement[];
    },
    enabled: !!profile?.company_id,
  });
}

export function useCreateStockMovement() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<StockMovement, "id" | "company_id" | "created_at" | "created_by">) => {
      const { data, error } = await supabase
        .from("stock_movements" as never)
        .insert({ ...payload, company_id: profile!.company_id! } as never)
        .select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stock_movements"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Movimento registrado");
    },
    onError: (e: Error) => toast.error(e.message ?? "Erro ao registrar movimento"),
  });
}
