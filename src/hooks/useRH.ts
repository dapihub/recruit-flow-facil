import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth";

export type Vacation = {
  id: string; company_id: string; person_name: string; profile_id: string | null;
  start_date: string; end_date: string; days: number;
  status: "requested" | "approved" | "denied" | "taken";
  notes: string | null; deleted_at: string | null;
  created_at: string; updated_at: string;
};

export type TimesheetEntry = {
  id: string; company_id: string; person_name: string; profile_id: string | null;
  work_date: string; check_in: string | null; check_out: string | null;
  break_minutes: number; total_hours: number | null; notes: string | null;
  created_at: string; updated_at: string;
};

export function useVacations() {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ["vacations", profile?.company_id],
    queryFn: async () => {
      const { data, error } = await supabase.from("vacations" as never).select("*")
        .is("deleted_at", null).order("start_date", { ascending: false });
      if (error) throw error;
      return data as unknown as Vacation[];
    },
    enabled: !!profile?.company_id,
  });
}

export function useCreateVacation() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Vacation> & { person_name: string; start_date: string; end_date: string; days: number }) => {
      const { data, error } = await supabase.from("vacations" as never)
        .insert({ ...payload, company_id: profile!.company_id! } as never).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["vacations"] }); toast.success("Férias registradas"); },
    onError: () => toast.error("Erro ao registrar férias"),
  });
}

export function useUpdateVacation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<Vacation> & { id: string }) => {
      const { data, error } = await supabase.from("vacations" as never).update(payload as never).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["vacations"] }); toast.success("Férias atualizadas"); },
  });
}

export function useDeleteVacation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("vacations" as never).update({ deleted_at: new Date().toISOString() } as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["vacations"] }); toast.success("Removido"); },
  });
}

export function useTimesheet() {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ["timesheet", profile?.company_id],
    queryFn: async () => {
      const { data, error } = await supabase.from("timesheet" as never).select("*")
        .order("work_date", { ascending: false }).limit(500);
      if (error) throw error;
      return data as unknown as TimesheetEntry[];
    },
    enabled: !!profile?.company_id,
  });
}

export function useCreateTimesheet() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<TimesheetEntry> & { person_name: string; work_date: string }) => {
      const { data, error } = await supabase.from("timesheet" as never)
        .insert({ ...payload, company_id: profile!.company_id! } as never).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["timesheet"] }); toast.success("Ponto registrado"); },
    onError: () => toast.error("Erro ao registrar ponto"),
  });
}

export function useDeleteTimesheet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("timesheet" as never).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["timesheet"] }); toast.success("Removido"); },
  });
}
