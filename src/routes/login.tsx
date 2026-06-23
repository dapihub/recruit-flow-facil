import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase/client";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

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
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ background: "var(--sidebar-bg)" }}
    >
      <div
        className="w-full max-w-[400px] rounded-2xl p-8 shadow-2xl"
        style={{ background: "var(--bg-card)" }}
      >
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xl">
            T
          </div>
        </div>

        <h1 className="text-center text-xl font-semibold" style={{ color: "var(--fg)" }}>
          Entrar no Themis
        </h1>
        <p className="text-center text-sm mt-1" style={{ color: "var(--fg-muted)" }}>
          Acesso restrito à equipe
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: "var(--fg)" }}>
              E-mail
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              className="w-full rounded-lg px-3 py-2 text-sm outline-none transition-all"
              style={{
                background: "var(--bg)",
                border: "1px solid var(--border)",
                color: "var(--fg)",
              }}
            />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: "var(--fg)" }}>
              Senha
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full rounded-lg px-3 py-2 text-sm outline-none transition-all"
              style={{
                background: "var(--bg)",
                border: "1px solid var(--border)",
                color: "var(--fg)",
              }}
            />
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
            disabled={submitting}
            className="w-full rounded-lg py-2.5 text-sm font-medium transition-opacity disabled:opacity-60"
            style={{ background: "#6366f1", color: "#fff" }}
          >
            {submitting ? "Aguarde…" : "Entrar"}
          </button>

          <div className="text-center">
            {resetSent ? (
              <p className="text-sm" style={{ color: "var(--success)" }}>
                Link enviado! Verifique seu e-mail.
              </p>
            ) : (
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={resetLoading}
                className="text-sm underline-offset-2 hover:underline disabled:opacity-60 transition-colors"
                style={{ color: "var(--fg-muted)" }}
              >
                {resetLoading ? "Enviando…" : "Esqueci minha senha"}
              </button>
            )}
          </div>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: "var(--fg-muted)" }}>
          Ainda não tem conta?{" "}
          <Link to="/signup" className="font-medium hover:underline" style={{ color: "var(--accent)" }}>
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  );
}
