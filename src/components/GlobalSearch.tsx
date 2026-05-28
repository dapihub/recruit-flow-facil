import { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, Briefcase, Users, Wallet, X, ArrowRight } from "lucide-react";
import { useVagas, useCandidatos, useFaturas } from "@/lib/store";

type Result = {
  id: string;
  type: "vaga" | "candidato" | "fatura";
  title: string;
  subtitle: string;
  to: string;
  params?: Record<string, string>;
};

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const vagas = useVagas();
  const candidatos = useCandidatos();
  const faturas = useFaturas();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(o => !o);
        setQuery("");
        setSelected(0);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const results = useMemo<Result[]>(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const out: Result[] = [];

    vagas.filter(v =>
      v.cargo.toLowerCase().includes(q) || v.empresa.toLowerCase().includes(q)
    ).slice(0, 4).forEach(v => out.push({
      id: v.id, type: "vaga",
      title: v.cargo, subtitle: v.empresa,
      to: "/vagas/$vagaId", params: { vagaId: v.id },
    }));

    candidatos.filter(c =>
      c.nome.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.vaga.toLowerCase().includes(q)
    ).slice(0, 4).forEach(c => out.push({
      id: c.id, type: "candidato",
      title: c.nome, subtitle: `${c.vaga} · ${c.status}`,
      to: "/candidatos",
    }));

    faturas.filter(f =>
      f.cliente.toLowerCase().includes(q) || f.servico?.toLowerCase().includes(q)
    ).slice(0, 3).forEach(f => out.push({
      id: f.id, type: "fatura",
      title: f.cliente, subtitle: `R$ ${f.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} · ${f.status}`,
      to: "/financeiro",
    }));

    return out;
  }, [query, vagas, candidatos, faturas]);

  useEffect(() => { setSelected(0); }, [results]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
    if (e.key === "Enter" && results[selected]) go(results[selected]);
  };

  const go = (r: Result) => {
    setOpen(false);
    setQuery("");
    if (r.params) {
      navigate({ to: r.to as any, params: r.params as any });
    } else {
      navigate({ to: r.to as any });
    }
  };

  const icon = (type: Result["type"]) => {
    if (type === "vaga") return <Briefcase className="w-4 h-4 text-blue-500" />;
    if (type === "candidato") return <Users className="w-4 h-4 text-emerald-500" />;
    return <Wallet className="w-4 h-4 text-amber-500" />;
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/40 backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-xl mx-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
          <Search className="w-4 h-4 text-zinc-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Buscar vagas, candidatos, faturas..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-400 text-zinc-900 dark:text-zinc-100"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-zinc-400 hover:text-zinc-600">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-1 text-[11px] text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded font-mono">Esc</kbd>
        </div>

        {/* Results */}
        {query && (
          <div className="py-2 max-h-80 overflow-y-auto">
            {results.length === 0 ? (
              <p className="text-sm text-zinc-400 text-center py-6">Nenhum resultado para "{query}"</p>
            ) : (
              results.map((r, i) => (
                <button
                  key={r.id}
                  onClick={() => go(r)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                    i === selected ? "bg-zinc-100 dark:bg-zinc-800" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                  }`}
                >
                  <span className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                    {icon(r.type)}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{r.title}</span>
                    <span className="block text-xs text-zinc-400 truncate">{r.subtitle}</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
                </button>
              ))
            )}
          </div>
        )}

        {/* Footer hint */}
        {!query && (
          <div className="px-4 py-3 flex items-center gap-4 text-[11px] text-zinc-400">
            <span><kbd className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded font-mono">↑↓</kbd> navegar</span>
            <span><kbd className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded font-mono">Enter</kbd> abrir</span>
            <span><kbd className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded font-mono">Esc</kbd> fechar</span>
          </div>
        )}
      </div>
    </div>
  );
}
