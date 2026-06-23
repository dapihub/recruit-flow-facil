import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
});

function SignupPage() {
  const { user, loading, signUp } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/onboarding", replace: true });
  }, [user, loading, navigate]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) { setError("A senha deve ter pelo menos 8 caracteres."); return; }
    setSubmitting(true);
    const { error: err } = await signUp(email, password, name);
    setSubmitting(false);
    if (err) setError(err);
    else setDone(true);
  };

  if (done) {
    return (
      <div
        className="flex min-h-screen items-center justify-center px-4"
        style={{ background: "var(--sidebar-bg)" }}
      >
        <div
          className="w-full max-w-[400px] rounded-2xl p-8 text-center shadow-2xl"
          style={{ background: "var(--bg-card)" }}
        >
          <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">✉️</span>
          </div>
          <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--fg)" }}>
            Confirme seu e-mail
          </h2>
          <p className="text-sm" style={{ color: "var(--fg-muted)" }}>
            Enviamos um link de confirmação para <strong>{email}</strong>. Clique no link para ativar sua conta.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ background: "var(--sidebar-bg)" }}
    >
      <div
        className="w-full max-w-[400px] rounded-2xl p-8 shadow-2xl"
        style={{ background: "var(--bg-card)" }}
      >
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xl">
            T
          </div>
        </div>
        <h1 className="text-center text-xl font-semibold" style={{ color: "var(--fg)" }}>
          Criar conta
        </h1>
        <p className="text-center text-sm mt-1" style={{ color: "var(--fg-muted)" }}>
          Você configurará seu escritório na próxima etapa
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {[
            { label: "Seu nome", value: name, set: setName, type: "text", auto: "name", required: true },
            { label: "E-mail", value: email, set: setEmail, type: "email", auto: "email", required: true },
            { label: "Senha (mín. 8 caracteres)", value: password, set: setPassword, type: "password", auto: "new-password", required: true },
          ].map(({ label, value, set, type, auto, required }) => (
            <div key={label}>
              <label className="text-xs font-medium block mb-1" style={{ color: "var(--fg)" }}>
                {label}
              </label>
              <input
                type={type}
                required={required}
                value={value}
                onChange={(e) => set(e.target.value)}
                autoComplete={auto}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg)" }}
              />
            </div>
          ))}

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
            {submitting ? "Criando conta…" : "Criar conta"}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: "var(--fg-muted)" }}>
          Já tem conta?{" "}
          <Link to="/login" className="font-medium hover:underline" style={{ color: "var(--accent)" }}>
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
