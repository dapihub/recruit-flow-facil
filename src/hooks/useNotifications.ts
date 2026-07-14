import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth";

export type Notification = {
  id: string; company_id: string; user_id: string;
  title: string; message: string | null; type: string;
  link: string | null; read_at: string | null; created_at: string;
};

export function useNotifications() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("notifications" as never)
        .select("*").order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      return data as unknown as Notification[];
    },
    enabled: !!user?.id,
    refetchInterval: 60000,
  });
}

export function useMarkAllRead() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("notifications" as never)
        .update({ read_at: new Date().toISOString() } as never)
        .eq("user_id", user!.id).is("read_at", null);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}
