import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth";
import { DapiLogo } from "@/components/DapiLogo";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { user, loading, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/", replace: true });
  }, [user, loading, navigate]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error } =
      mode === "signin"
        ? await signIn(email, password)
        : await signUp(email, password, nome);
    setSubmitting(false);
    if (error) setError(error);
    else if (mode === "signin") navigate({ to: "/", replace: true });
    else setError("Conta criada. Faça login.");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--sidebar-bg)] px-4">
      <div className="w-full max-w-md rounded-2xl bg-background p-8 shadow-2xl">
        <div className="flex justify-center mb-6">
          <DapiLogo variant="color" className="h-12 w-auto" />
        </div>
        <h1 className="text-center text-xl font-semibold text-foreground">
          {mode === "signin" ? "Entrar no DAPI HUB" : "Criar conta"}
        </h1>
        <p className="text-center text-sm text-muted-foreground mt-1">
          Acesso restrito à equipe DAPI
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {mode === "signup" && (
            <div>
              <label className="text-xs font-medium text-foreground">Nome</label>
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-foreground">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
            />
            <p className="mt-1 text-[11px] text-muted-foreground">Mínimo 8 caracteres.</p>
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {submitting ? "Aguarde…" : mode === "signin" ? "Entrar" : "Criar conta"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null); }}
          className="mt-4 w-full text-center text-xs text-muted-foreground hover:text-foreground"
        >
          {mode === "signin" ? "Não tem conta? Criar conta" : "Já tem conta? Entrar"}
        </button>
      </div>
    </div>
  );
}
