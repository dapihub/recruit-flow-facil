import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth";

export type ProfileSummary = {
  id: string;
  name: string;
  avatar_url: string | null;
  role: "admin" | "recruiter" | "financial" | "viewer";
};

export function useProfiles() {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ["profiles", profile?.company_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, avatar_url, role")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as ProfileSummary[];
    },
    enabled: !!profile?.company_id,
  });
}
