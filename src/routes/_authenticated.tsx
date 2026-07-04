import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate({ to: "/login", replace: true }); return; }
    if (profile !== null && !profile.company_id) {
      navigate({ to: "/onboarding", replace: true });
    }
  }, [user, profile, loading, navigate]);

  if (loading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: "var(--bg)" }}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-sm animate-pulse">
            T
          </div>
          <p className="text-sm" style={{ color: "var(--fg-muted)" }}>Carregando…</p>
        </div>
      </div>
    );
  }

  if (!user || (profile !== null && !profile.company_id)) return null;

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg)" }}>
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <div key={pathname} className="animate-fade-in flex-1 flex flex-col">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
