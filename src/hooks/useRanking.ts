import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth";

// ─── Types ───────────────────────────────────────────────────

export type ClientRating = {
  id: string;
  company_id: string;
  client_id: string;
  evaluator_id: string | null;
  evaluated_at: string;
  payment_timeliness: number;
  briefing_clarity: number;
  feedback_agility: number;
  volume_potential: number;
  referral_potential: number;
  overall_score: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  client?: { id: string; name: string } | null;
  evaluator?: { id: string; name: string } | null;
};

export type RatingInsert = {
  client_id: string;
  payment_timeliness: number;
  briefing_clarity: number;
  feedback_agility: number;
  volume_potential: number;
  referral_potential: number;
  overall_score: number;
  notes?: string | null;
  existing_id?: string;
};

// ─── Hooks ───────────────────────────────────────────────────

export function useClientRatings() {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ["client_ratings", profile?.company_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_ratings")
        .select(
          "*, client:clients(id, name), evaluator:profiles!evaluator_id(id, name)"
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ClientRating[];
    },
    enabled: !!profile?.company_id,
  });
}

export function useUpsertRating() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ existing_id, ...payload }: RatingInsert) => {
      if (existing_id) {
        const { data, error } = await supabase
          .from("client_ratings")
          .update({
            ...payload,
            evaluator_id: profile!.id,
            evaluated_at: new Date().toISOString(),
          })
          .eq("id", existing_id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("client_ratings")
          .insert({
            ...payload,
            company_id: profile!.company_id!,
            evaluator_id: profile!.id,
            evaluated_at: new Date().toISOString(),
          })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client_ratings", profile?.company_id] });
      toast.success("Avaliação salva");
    },
    onError: () => toast.error("Erro ao salvar avaliação"),
  });
}

export function useDeleteRating() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("client_ratings")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client_ratings", profile?.company_id] });
      toast.success("Avaliação removida");
    },
    onError: () => toast.error("Erro ao remover avaliação"),
  });
}
