import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string) ||
  "https://urwyvdgqqssgazzhtqan.supabase.co";
const SUPABASE_KEY =
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string) ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVyd3l2ZGdxcXNzZ2F6emh0cWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MjM2MzIsImV4cCI6MjA5NDA5OTYzMn0.MmYHc0lhcSE0puXE1JxWy1Q2TvT8xRuAXYVXvPf6fFM";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
