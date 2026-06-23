import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth";

// ─── Types ───────────────────────────────────────────────────

export type MeetingType = "call" | "video_call" | "in_person" | "other";
export type MeetingStatus =
  | "scheduled"
  | "completed"
  | "cancelled"
  | "rescheduled";

export type Meeting = {
  id: string;
  company_id: string;
  title: string;
  type: MeetingType;
  client_id: string | null;
  scheduled_at: string;
  duration_min: number | null;
  location: string | null;
  video_link: string | null;
  agenda: string | null;
  notes: string | null;
  status: MeetingStatus;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  client?: { id: string; name: string } | null;
};

export type MeetingInsert = {
  title: string;
  type: MeetingType;
  client_id?: string | null;
  scheduled_at: string;
  duration_min?: number | null;
  location?: string | null;
  video_link?: string | null;
  agenda?: string | null;
  notes?: string | null;
  status?: MeetingStatus;
};

// ─── Labels ──────────────────────────────────────────────────

export const MEETING_TYPE_LABELS: Record<MeetingType, string> = {
  call: "Ligação",
  video_call: "Videoconferência",
  in_person: "Presencial",
  other: "Outro",
};

export const MEETING_STATUS_LABELS: Record<MeetingStatus, string> = {
  scheduled: "Agendada",
  completed: "Realizada",
  cancelled: "Cancelada",
  rescheduled: "Reagendada",
};

export const MEETING_STATUS_COLORS: Record<MeetingStatus, string> = {
  scheduled: "#3b82f6",
  completed: "#10b981",
  cancelled: "#6b7280",
  rescheduled: "#f59e0b",
};

// ─── Hooks ───────────────────────────────────────────────────

export function useMeetings() {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ["meetings", profile?.company_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meetings")
        .select("*, client:clients(id, name)")
        .is("deleted_at", null)
        .order("scheduled_at", { ascending: false });
      if (error) throw error;
      return data as Meeting[];
    },
    enabled: !!profile?.company_id,
  });
}

export function useCreateMeeting() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: MeetingInsert) => {
      const { data, error } = await supabase
        .from("meetings")
        .insert({ ...payload, company_id: profile!.company_id! })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meetings", profile?.company_id] });
      toast.success("Reunião criada");
    },
    onError: () => toast.error("Erro ao criar reunião"),
  });
}

export function useUpdateMeeting() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: MeetingInsert & { id: string }) => {
      const { data, error } = await supabase
        .from("meetings")
        .update(payload)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meetings", profile?.company_id] });
      toast.success("Reunião atualizada");
    },
    onError: () => toast.error("Erro ao atualizar reunião"),
  });
}

export function useDeleteMeeting() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("meetings")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meetings", profile?.company_id] });
      toast.success("Reunião removida");
    },
    onError: () => toast.error("Erro ao remover reunião"),
  });
}
