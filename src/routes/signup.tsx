import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { CheckCircle2, Mail } from "lucide-react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
});

const STEPS = [
  { n: 1, label: "Criar conta" },
  { n: 2, label: "Confirmar e-mail" },
  { n: 3, label: "Configurar empresa" },
];

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
          className="w-full max-w-[400px] rounded-2xl p-10 text-center shadow-2xl animate-fade-in"
          style={{ background: "var(--bg-card)" }}
        >
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: "color-mix(in srgb, #10b981 12%, transparent)" }}>
            <Mail className="w-6 h-6 text-emerald-500" />
          </div>
          <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--fg)" }}>
            Confirme seu e-mail
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: "var(--fg-muted)" }}>
            Enviamos um link de confirmação para{" "}
            <strong style={{ color: "var(--fg)" }}>{email}</strong>.
            <br />Clique no link para ativar sua conta e configurar sua empresa.
          </p>
          <Link
            to="/login"
            className="inline-block mt-6 text-xs px-4 py-2 rounded-lg"
            style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg-muted)" }}
          >
            Voltar ao login
          </Link>
        </div>
      </div>
    );
  }

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
        <div className="absolute top-1/3 -right-10 w-64 h-64 rounded-full opacity-20 blur-3xl"
          style={{ background: "#818cf8" }} />
        <div className="absolute bottom-1/3 -left-10 w-48 h-48 rounded-full opacity-15 blur-3xl"
          style={{ background: "#a78bfa" }} />

        <div className="flex items-center gap-3 relative z-10">
          <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-white font-bold text-base">
            T
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">Themis</span>
        </div>

        <div className="space-y-8 relative z-10">
          <div>
            <h2 className="text-[2rem] font-bold text-white leading-tight">
              Configure sua agência<br />em minutos
            </h2>
            <p className="text-indigo-200 mt-3 text-sm leading-relaxed max-w-sm">
              Crie sua conta, configure seu escritório e comece a gerenciar vagas, clientes e equipe imediatamente.
            </p>
          </div>

          {/* Steps visual */}
          <div className="space-y-4">
            {STEPS.map((s, i) => (
              <div key={s.n} className="flex items-center gap-3">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: i === 0 ? "white" : "rgba(255,255,255,0.15)", color: i === 0 ? "#4f46e5" : "rgba(255,255,255,0.6)" }}
                >
                  {i === 0 ? <CheckCircle2 className="w-4 h-4" /> : s.n}
                </div>
                <p className={`text-sm ${i === 0 ? "text-white font-medium" : "text-indigo-300"}`}>{s.label}</p>
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
              Criar conta
            </h1>
            <p className="text-sm mb-6" style={{ color: "var(--fg-muted)" }}>
              Você configurará sua empresa na próxima etapa
            </p>

            <form onSubmit={onSubmit} className="space-y-4">
              {[
                { label: "Seu nome", value: name, set: setName, type: "text", auto: "name" },
                { label: "E-mail profissional", value: email, set: setEmail, type: "email", auto: "email" },
                { label: "Senha (mín. 8 caracteres)", value: password, set: setPassword, type: "password", auto: "new-password" },
              ].map(({ label, value, set, type, auto }) => (
                <div key={label}>
                  <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--fg-muted)" }}>
                    {label}
                  </label>
                  <input
                    type={type}
                    required
                    value={value}
                    onChange={(e) => set(e.target.value)}
                    autoComplete={auto}
                    className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-indigo-500/40"
                    style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg)" }}
                  />
                </div>
              ))}

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
                {submitting ? "Criando conta…" : "Criar conta →"}
              </button>
            </form>
          </div>

          <p className="text-center text-xs mt-5" style={{ color: "var(--fg-muted)" }}>
            Já tem conta?{" "}
            <Link to="/login" className="font-medium hover:underline" style={{ color: "#818cf8" }}>
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
