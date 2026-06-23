import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth";
import type { Tables } from "@/lib/supabase/types";
import type { TaskStatus, PriorityLevel } from "@/lib/constants";

export type TaskRow = Tables<"tasks">;

export type TaskWithJoins = TaskRow & {
  assignee: { id: string; name: string; avatar_url: string | null } | null;
  job: { id: string; title: string } | null;
};

export type TaskInsert = {
  title: string;
  job_id?: string | null;
  assignee_id?: string | null;
  status?: TaskStatus;
  priority?: PriorityLevel;
  due_date?: string | null;
  start_date?: string | null;
  description?: string | null;
};

const TASK_SELECT =
  "*, assignee:profiles!assignee_id(id, name, avatar_url), job:jobs(id, title)";

export function useTasks(filters?: {
  status?: TaskStatus;
  assignee_id?: string;
  job_id?: string;
  search?: string;
}) {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ["tasks", profile?.company_id, filters],
    queryFn: async () => {
      let q = supabase
        .from("tasks")
        .select(TASK_SELECT)
        .is("deleted_at", null)
        .order("due_date", { ascending: true, nullsFirst: false });

      if (filters?.status) q = q.eq("status", filters.status);
      if (filters?.assignee_id) q = q.eq("assignee_id", filters.assignee_id);
      if (filters?.job_id) q = q.eq("job_id", filters.job_id);
      if (filters?.search) q = q.ilike("title", `%${filters.search}%`);

      const { data, error } = await q;
      if (error) throw error;
      return data as TaskWithJoins[];
    },
    enabled: !!profile?.company_id,
  });
}

export function useJobTasks(jobId: string) {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ["tasks", "job", jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select(TASK_SELECT)
        .eq("job_id", jobId)
        .is("deleted_at", null)
        .order("due_date", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data as TaskWithJoins[];
    },
    enabled: !!profile?.company_id && !!jobId,
  });
}

export function useCreateTask() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: TaskInsert) => {
      const { data, error } = await supabase
        .from("tasks")
        .insert({ ...payload, company_id: profile!.company_id! })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["tasks", profile?.company_id] });
      if (vars.job_id) {
        qc.invalidateQueries({ queryKey: ["tasks", "job", vars.job_id] });
      }
      toast.success("Tarefa criada");
    },
    onError: () => toast.error("Erro ao criar tarefa"),
  });
}

export function useUpdateTask() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: Partial<TaskInsert> & { id: string; completed_at?: string | null }) => {
      const { data, error } = await supabase
        .from("tasks")
        .update(payload)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (task) => {
      qc.invalidateQueries({ queryKey: ["tasks", profile?.company_id] });
      if ((task as TaskRow).job_id) {
        qc.invalidateQueries({
          queryKey: ["tasks", "job", (task as TaskRow).job_id],
        });
      }
      toast.success("Tarefa atualizada");
    },
    onError: () => toast.error("Erro ao atualizar tarefa"),
  });
}

export function useDeleteTask() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("tasks")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks", profile?.company_id] });
      toast.success("Tarefa removida");
    },
    onError: () => toast.error("Erro ao remover tarefa"),
  });
}
