import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Building2, ArrowRight } from "lucide-react";
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

  const displayName = user?.user_metadata?.name as string | undefined;

  return (
    <div className="flex min-h-screen">
      {/* ── Left: Branding ────────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[58%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4f46e5 80%, #6d28d9 100%)" }}
      >
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="absolute top-1/4 -right-16 w-72 h-72 rounded-full opacity-20 blur-3xl"
          style={{ background: "#818cf8" }} />

        <div className="flex items-center gap-3 relative z-10">
          <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-white font-bold text-base">
            T
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">Themis</span>
        </div>

        <div className="space-y-6 relative z-10">
          <div>
            <p className="text-indigo-300 text-sm mb-2">Passo 3 de 3</p>
            <h2 className="text-[2rem] font-bold text-white leading-tight">
              {displayName ? `Olá, ${displayName.split(" ")[0]}!` : "Quase lá!"}<br />
              Configure seu<br />escritório
            </h2>
            <p className="text-indigo-200 mt-3 text-sm leading-relaxed max-w-sm">
              Dê um nome para sua empresa de R&S. Você poderá atualizar isso depois nas configurações.
            </p>
          </div>

          <div
            className="rounded-2xl p-5 space-y-3"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
          >
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-indigo-200" />
            </div>
            <p className="text-white font-medium">Seu espaço de trabalho</p>
            <p className="text-indigo-300 text-xs leading-relaxed">
              Um espaço isolado com seus dados de vagas, clientes, equipe e financeiro.
              Perfeito para agências de recrutamento e seleção.
            </p>
          </div>
        </div>

        <p className="text-indigo-400/60 text-xs relative z-10">© 2026 Themis · Para agências de R&S</p>
      </div>

      {/* ── Right: Form ───────────────────────────────────────── */}
      <div
        className="flex-1 flex items-center justify-center px-6 py-10"
        style={{ background: "var(--sidebar-bg)" }}
      >
        <div className="w-full max-w-[380px] animate-fade-in">
          <div className="flex justify-center mb-8 lg:hidden">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xl">
              T
            </div>
          </div>

          <div
            className="rounded-2xl p-8 shadow-2xl"
            style={{ background: "var(--bg-card)" }}
          >
            <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
              style={{ background: "color-mix(in srgb, var(--accent) 12%, transparent)" }}>
              <Building2 className="w-5 h-5" style={{ color: "var(--accent)" }} />
            </div>
            <h1 className="text-xl font-semibold mb-1" style={{ color: "var(--fg)" }}>
              Configure seu escritório
            </h1>
            <p className="text-sm mb-6" style={{ color: "var(--fg-muted)" }}>
              Crie o espaço de trabalho da sua agência de R&S
            </p>

            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--fg-muted)" }}>
                  Nome da empresa
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Talent Bridge Consultoria"
                  value={companyName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-indigo-500/40"
                  style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg)" }}
                />
              </div>

              {slug && (
                <div
                  className="rounded-lg px-3 py-2 text-xs"
                  style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg-muted)" }}
                >
                  Identificador: <span style={{ color: "var(--fg)" }}>{slug}</span>
                </div>
              )}

              {error && (
                <p
                  className="text-xs rounded-lg px-3 py-2"
                  style={{ color: "var(--destructive)", background: "color-mix(in srgb, var(--destructive) 10%, transparent)" }}
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting || !companyName.trim() || !slug.trim()}
                className="w-full rounded-lg py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-60 hover:opacity-90 active:scale-[0.99]"
                style={{ background: "#6366f1", color: "#fff" }}
              >
                {submitting ? "Criando…" : (<>Criar escritório <ArrowRight className="w-4 h-4" /></>)}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
