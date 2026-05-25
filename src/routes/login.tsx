import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth";
import { DapiLogo } from "@/components/DapiLogo";
import { supabase } from "@/integrations/supabase/client";

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
    if (!loading && user) navigate({ to: "/", replace: true });
  }, [user, loading, navigate]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) setError("E-mail ou senha incorretos.");
    else navigate({ to: "/", replace: true });
  };

  const onReset = async () => {
    if (!email) { setError("Digite seu e-mail antes de resetar a senha."); return; }
    setResetLoading(true);
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    setResetLoading(false);
    setResetSent(true);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 p-8 shadow-2xl">
        <div className="flex justify-center mb-6">
          <DapiLogo variant="color" className="h-10 w-auto" />
        </div>
        <h1 className="text-center text-lg font-semibold text-foreground">Entrar no DAPI HUB</h1>
        <p className="text-center text-xs text-muted-foreground mt-1 mb-6">Acesso restrito</p>

        {resetSent ? (
          <div className="text-center space-y-3">
            <p className="text-sm text-emerald-600 bg-emerald-50 rounded-lg px-4 py-3 border border-emerald-200">
              E-mail de recuperação enviado para <strong>{email}</strong>. Verifique sua caixa de entrada.
            </p>
            <button onClick={() => setResetSent(false)} className="text-xs text-muted-foreground hover:text-foreground">
              Voltar ao login
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-foreground">E-mail</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
                autoComplete="username" />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground">Senha</label>
              <input type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
                autoComplete="current-password" />
            </div>

            {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 border border-red-200">{error}</p>}

            <button type="submit" disabled={submitting}
              className="w-full rounded-lg bg-zinc-900 dark:bg-zinc-100 px-4 py-2.5 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-60 transition-colors">
              {submitting ? "Aguarde…" : "Entrar"}
            </button>

            <div className="text-center pt-1">
              <button type="button" onClick={onReset} disabled={resetLoading}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50">
                {resetLoading ? "Enviando…" : "Esqueci minha senha"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function LoginPage() {
  const { user, loading, signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/", replace: true });
  }, [user, loading, navigate]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) setError("E-mail ou senha incorretos.");
    else navigate({ to: "/", replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--sidebar-bg)] px-4">
      <div className="w-full max-w-md rounded-2xl bg-background p-8 shadow-2xl">
        <div className="flex justify-center mb-6">
          <DapiLogo variant="color" className="h-12 w-auto" />
        </div>
        <h1 className="text-center text-xl font-semibold text-foreground">
          Entrar no DAPI HUB
        </h1>
        <p className="text-center text-sm text-muted-foreground mt-1">
          Acesso restrito
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-foreground">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              autoComplete="username"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground">Senha</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {submitting ? "Aguarde…" : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
