import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth";

export type PurchaseOrder = {
  id: string; company_id: string; supplier_id: string | null;
  number: string; status: "draft" | "sent" | "received" | "cancelled";
  order_date: string; expected_date: string | null; total: number;
  notes: string | null; deleted_at: string | null;
  created_at: string; updated_at: string;
};

export type SalesOrder = {
  id: string; company_id: string; client_id: string | null;
  number: string; status: "draft" | "confirmed" | "invoiced" | "cancelled";
  order_date: string; total: number; discount: number;
  notes: string | null; deleted_at: string | null;
  created_at: string; updated_at: string;
};

export function usePurchaseOrders() {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ["purchase_orders", profile?.company_id],
    queryFn: async () => {
      const { data, error } = await supabase.from("purchase_orders" as never)
        .select("*, supplier:suppliers(id,name)").is("deleted_at", null).order("order_date", { ascending: false });
      if (error) throw error;
      return data as unknown as (PurchaseOrder & { supplier: { id: string; name: string } | null })[];
    },
    enabled: !!profile?.company_id,
  });
}

export function useCreatePurchaseOrder() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<PurchaseOrder>) => {
      const number = payload.number ?? `PC-${new Date().getFullYear()}-${Math.floor(Math.random()*9000+1000)}`;
      const { data, error } = await supabase.from("purchase_orders" as never)
        .insert({ ...payload, number, company_id: profile!.company_id! } as never).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["purchase_orders"] }); toast.success("Pedido de compra criado"); },
    onError: () => toast.error("Erro ao criar pedido"),
  });
}

export function useUpdatePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<PurchaseOrder> & { id: string }) => {
      const { data, error } = await supabase.from("purchase_orders" as never).update(payload as never).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["purchase_orders"] }); toast.success("Pedido atualizado"); },
  });
}

export function useDeletePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("purchase_orders" as never).update({ deleted_at: new Date().toISOString() } as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["purchase_orders"] }); toast.success("Pedido removido"); },
  });
}

export function useSalesOrders() {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ["sales_orders", profile?.company_id],
    queryFn: async () => {
      const { data, error } = await supabase.from("sales_orders" as never)
        .select("*, client:clients(id,name)").is("deleted_at", null).order("order_date", { ascending: false });
      if (error) throw error;
      return data as unknown as (SalesOrder & { client: { id: string; name: string } | null })[];
    },
    enabled: !!profile?.company_id,
  });
}

export function useCreateSalesOrder() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<SalesOrder>) => {
      const number = payload.number ?? `PV-${new Date().getFullYear()}-${Math.floor(Math.random()*9000+1000)}`;
      const { data, error } = await supabase.from("sales_orders" as never)
        .insert({ ...payload, number, company_id: profile!.company_id! } as never).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["sales_orders"] }); toast.success("Pedido de venda criado"); },
    onError: () => toast.error("Erro ao criar pedido"),
  });
}

export function useUpdateSalesOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<SalesOrder> & { id: string }) => {
      const { data, error } = await supabase.from("sales_orders" as never).update(payload as never).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["sales_orders"] }); toast.success("Pedido atualizado"); },
  });
}

export function useDeleteSalesOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sales_orders" as never).update({ deleted_at: new Date().toISOString() } as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["sales_orders"] }); toast.success("Pedido removido"); },
  });
}
