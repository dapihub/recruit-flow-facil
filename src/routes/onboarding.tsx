import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase/client";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingPage,
});

function OnboardingPage() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState("");
  const [slug, setSlug] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login", replace: true });
    // Already has a company → go to dashboard
    if (!loading && profile?.company_id) navigate({ to: "/dashboard", replace: true });
  }, [user, profile, loading, navigate]);

  const handleNameChange = (val: string) => {
    setCompanyName(val);
    setSlug(
      val
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
    );
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError(null);
    setSubmitting(true);

    const { error: rpcErr } = await (supabase.rpc as Function)("create_company", {
      p_name: companyName.trim(),
      p_slug: slug.trim(),
    });

    if (rpcErr) {
      setError(rpcErr.message.includes("slug") ? "Esse identificador já está em uso. Escolha outro." : rpcErr.message);
      setSubmitting(false);
      return;
    }

    await refreshProfile();
    navigate({ to: "/dashboard", replace: true });
  };

  if (loading) return null;

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ background: "var(--sidebar-bg)" }}
    >
      <div
        className="w-full max-w-[440px] rounded-2xl p-8 shadow-2xl"
        style={{ background: "var(--bg-card)" }}
      >
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xl">
            T
          </div>
        </div>
        <h1 className="text-center text-xl font-semibold" style={{ color: "var(--fg)" }}>
          Configure seu escritório
        </h1>
        <p className="text-center text-sm mt-1 mb-6" style={{ color: "var(--fg-muted)" }}>
          Vamos criar o espaço de trabalho da sua empresa de R&S
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: "var(--fg)" }}>
              Nome da empresa
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Talent Bridge Consultoria"
              value={companyName}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg)" }}
            />
          </div>

          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: "var(--fg)" }}>
              Identificador (slug)
            </label>
            <div className="flex items-center rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>
              <span
                className="px-3 py-2 text-sm shrink-0"
                style={{ background: "var(--border)", color: "var(--fg-muted)" }}
              >
                themis.app/
              </span>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                className="flex-1 px-3 py-2 text-sm outline-none"
                style={{ background: "var(--bg)", color: "var(--fg)" }}
              />
            </div>
            <p className="text-[11px] mt-1" style={{ color: "var(--fg-muted)" }}>
              Apenas letras minúsculas, números e hífens
            </p>
          </div>

          {error && (
            <p
              className="text-sm rounded-lg px-3 py-2"
              style={{ color: "var(--destructive)", background: "color-mix(in srgb, var(--destructive) 10%, transparent)" }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || !companyName.trim() || !slug.trim()}
            className="w-full rounded-lg py-2.5 text-sm font-medium transition-opacity disabled:opacity-60 mt-2"
            style={{ background: "#6366f1", color: "#fff" }}
          >
            {submitting ? "Criando…" : "Criar escritório →"}
          </button>
        </form>
      </div>
    </div>
  );
}
