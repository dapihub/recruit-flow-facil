import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Briefcase, DollarSign, Users, MessageSquare, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase/client";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

const FEATURES = [
  { icon: Briefcase, label: "Pipeline de vagas", desc: "Kanban visual do processo seletivo" },
  { icon: DollarSign, label: "Gestão de fees", desc: "Controle financeiro e faturamento" },
  { icon: Users, label: "CRM de clientes", desc: "Relacionamento e oportunidades" },
  { icon: MessageSquare, label: "Chat integrado", desc: "Comunicação da equipe centralizada" },
];

function LoginPage() {
  const { user, loading, signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard", replace: true });
  }, [user, loading, navigate]);

  const handleForgotPassword = async () => {
    if (!email) { setError("Digite seu e-mail para receber o link de redefinição."); return; }
    setResetLoading(true);
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    setResetLoading(false);
    setResetSent(true);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error: err } = await signIn(email, password);
    setSubmitting(false);
    if (err) setError("E-mail ou senha incorretos.");
    else navigate({ to: "/dashboard", replace: true });
  };

  return (
    <div className="flex min-h-screen">
      {/* ── Left: Branding ────────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[58%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4f46e5 80%, #6d28d9 100%)" }}
      >
        {/* Dot grid decoration */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        {/* Glow orbs */}
        <div className="absolute top-1/4 -right-20 w-72 h-72 rounded-full opacity-20 blur-3xl"
          style={{ background: "#818cf8" }} />
        <div className="absolute bottom-1/4 -left-10 w-56 h-56 rounded-full opacity-15 blur-3xl"
          style={{ background: "#a78bfa" }} />

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-white font-bold text-base">
            T
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">Themis</span>
        </div>

        {/* Main copy */}
        <div className="space-y-8 relative z-10">
          <div>
            <h2 className="text-[2rem] font-bold text-white leading-tight">
              Recrutamento de alta<br />performance para<br />agências de R&S
            </h2>
            <p className="text-indigo-200 mt-3 text-sm leading-relaxed max-w-sm">
              Pipeline, financeiro, CRM e comunicação — tudo integrado para a sua consultoria crescer com controle.
            </p>
          </div>
          <div className="space-y-3">
            {FEATURES.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-indigo-200" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{label}</p>
                  <p className="text-xs text-indigo-300">{desc}</p>
                </div>
              </div>
            ))}
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
          {/* Mobile logo */}
          <div className="flex justify-center mb-8 lg:hidden">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xl">
              T
            </div>
          </div>

          <div
            className="rounded-2xl p-8 shadow-2xl"
            style={{ background: "var(--bg-card)" }}
          >
            <h1 className="text-xl font-semibold mb-1" style={{ color: "var(--fg)" }}>
              Bem-vinda de volta
            </h1>
            <p className="text-sm mb-6" style={{ color: "var(--fg-muted)" }}>
              Acesse sua conta no Themis
            </p>

            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--fg-muted)" }}>
                  E-mail
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-indigo-500/40"
                  style={{
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                    color: "var(--fg)",
                  }}
                />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--fg-muted)" }}>
                  Senha
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-indigo-500/40"
                  style={{
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                    color: "var(--fg)",
                  }}
                />
              </div>

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
                disabled={submitting}
                className="w-full rounded-lg py-2.5 text-sm font-medium transition-all disabled:opacity-60 hover:opacity-90 active:scale-[0.99]"
                style={{ background: "#6366f1", color: "#fff" }}
              >
                {submitting ? "Aguarde…" : "Entrar"}
              </button>

              <div className="text-center">
                {resetSent ? (
                  <div className="flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <p className="text-xs text-emerald-500">Link enviado! Verifique seu e-mail.</p>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={resetLoading}
                    className="text-xs underline-offset-2 hover:underline disabled:opacity-60 transition-colors"
                    style={{ color: "var(--fg-muted)" }}
                  >
                    {resetLoading ? "Enviando…" : "Esqueci minha senha"}
                  </button>
                )}
              </div>
            </form>
          </div>

          <p className="text-center text-xs mt-5" style={{ color: "var(--fg-muted)" }}>
            Ainda não tem conta?{" "}
            <Link to="/signup" className="font-medium hover:underline" style={{ color: "#818cf8" }}>
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
