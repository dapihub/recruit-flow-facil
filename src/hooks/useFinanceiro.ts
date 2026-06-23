import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth";

// ─── Types ───────────────────────────────────────────────────

export type TransactionType = "income" | "expense";
export type TransactionStatus = "pending" | "paid" | "overdue" | "cancelled";
export type PayrollType = "salary" | "commission" | "bonus" | "other";

export type Category = {
  id: string;
  company_id: string;
  name: string;
  type: "income" | "expense";
  color: string;
  is_default: boolean;
};

export type Transaction = {
  id: string;
  company_id: string;
  type: TransactionType;
  amount: number;
  description: string;
  category_id: string | null;
  client_id: string | null;
  date: string;
  due_date: string | null;
  paid_at: string | null;
  status: TransactionStatus;
  notes: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  category?: { id: string; name: string; color: string } | null;
  client?: { id: string; name: string } | null;
};

export type TransactionInsert = {
  type: TransactionType;
  amount: number;
  description: string;
  category_id?: string | null;
  client_id?: string | null;
  date: string;
  due_date?: string | null;
  status?: TransactionStatus;
  notes?: string | null;
};

export type PayrollEntry = {
  id: string;
  company_id: string;
  person_name: string;
  role: string | null;
  type: PayrollType;
  amount: number;
  reference_month: string;
  payment_date: string | null;
  status: "pending" | "paid";
  notes: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PayrollInsert = {
  person_name: string;
  role?: string | null;
  type: PayrollType;
  amount: number;
  reference_month: string;
  payment_date?: string | null;
  status?: "pending" | "paid";
  notes?: string | null;
};

// ─── Categories ──────────────────────────────────────────────

export function useCategories() {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ["categories", profile?.company_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .is("deleted_at", null)
        .order("name");
      if (error) throw error;
      return data as Category[];
    },
    enabled: !!profile?.company_id,
  });
}

// ─── Transactions ─────────────────────────────────────────────

const TX_SELECT =
  "*, category:categories(id, name, color), client:clients(id, name)";

export function useTransactions() {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ["transactions", profile?.company_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select(TX_SELECT)
        .is("deleted_at", null)
        .order("date", { ascending: false });
      if (error) throw error;
      return data as Transaction[];
    },
    enabled: !!profile?.company_id,
  });
}

export function useCreateTransaction() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: TransactionInsert) => {
      const { data, error } = await supabase
        .from("transactions")
        .insert({ ...payload, company_id: profile!.company_id! })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions", profile?.company_id] });
      toast.success("Lançamento criado");
    },
    onError: () => toast.error("Erro ao criar lançamento"),
  });
}

export function useUpdateTransaction() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: TransactionInsert & { id: string }) => {
      const { data, error } = await supabase
        .from("transactions")
        .update(payload)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions", profile?.company_id] });
      toast.success("Lançamento atualizado");
    },
    onError: () => toast.error("Erro ao atualizar lançamento"),
  });
}

export function useDeleteTransaction() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("transactions")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions", profile?.company_id] });
      toast.success("Lançamento removido");
    },
    onError: () => toast.error("Erro ao remover lançamento"),
  });
}

// ─── Payroll ──────────────────────────────────────────────────

export function usePayroll() {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ["payroll", profile?.company_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payroll_entries")
        .select("*")
        .is("deleted_at", null)
        .order("reference_month", { ascending: false });
      if (error) throw error;
      return data as PayrollEntry[];
    },
    enabled: !!profile?.company_id,
  });
}

export function useCreatePayrollEntry() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: PayrollInsert) => {
      const { data, error } = await supabase
        .from("payroll_entries")
        .insert({ ...payload, company_id: profile!.company_id! })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payroll", profile?.company_id] });
      toast.success("Lançamento de folha criado");
    },
    onError: () => toast.error("Erro ao criar lançamento de folha"),
  });
}

export function useUpdatePayrollEntry() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: PayrollInsert & { id: string }) => {
      const { data, error } = await supabase
        .from("payroll_entries")
        .update(payload)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payroll", profile?.company_id] });
      toast.success("Folha atualizada");
    },
    onError: () => toast.error("Erro ao atualizar folha"),
  });
}

export function useDeletePayrollEntry() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("payroll_entries")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payroll", profile?.company_id] });
      toast.success("Lançamento de folha removido");
    },
    onError: () => toast.error("Erro ao remover lançamento"),
  });
}
