import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Briefcase, Building2, User, CheckSquare, Search, X } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

type Result = {
  id: string;
  label: string;
  sub?: string;
  category: "vagas" | "clientes" | "contatos" | "tarefas";
  href: string;
};

const CATEGORIES = {
  vagas:    { label: "Vagas",    Icon: Briefcase,   href: "/vagas" },
  clientes: { label: "Clientes", Icon: Building2,   href: "/clientes" },
  contatos: { label: "Contatos", Icon: User,         href: "/contatos" },
  tarefas:  { label: "Tarefas",  Icon: CheckSquare, href: "/tarefas" },
} as const;

type Category = keyof typeof CATEGORIES;

async function search(term: string): Promise<Result[]> {
  const t = `%${term}%`;
  const [jobs, clients, contacts, tasks] = await Promise.all([
    supabase.from("jobs").select("id, title, status").ilike("title", t).is("deleted_at", null).limit(5),
    supabase.from("clients").select("id, name, person_type").ilike("name", t).is("deleted_at", null).limit(5),
    supabase.from("contacts").select("id, name, role").ilike("name", t).is("deleted_at", null).limit(5),
    supabase.from("tasks").select("id, title, status").ilike("title", t).is("deleted_at", null).limit(5),
  ]);

  const results: Result[] = [];

  (jobs.data ?? []).forEach((j: any) =>
    results.push({ id: j.id, label: j.title, sub: j.status, category: "vagas", href: `/vagas/${j.id}` })
  );
  (clients.data ?? []).forEach((c: any) =>
    results.push({ id: c.id, label: c.name, sub: c.person_type === "pj" ? "Pessoa Jurídica" : "Pessoa Física", category: "clientes", href: "/clientes" })
  );
  (contacts.data ?? []).forEach((c: any) =>
    results.push({ id: c.id, label: c.name, sub: c.role ?? undefined, category: "contatos", href: "/contatos" })
  );
  (tasks.data ?? []).forEach((t: any) =>
    results.push({ id: t.id, label: t.title, sub: t.status, category: "tarefas", href: "/tarefas" })
  );

  return results;
}

type Props = { open: boolean; onClose: () => void };

export function GlobalSearch({ open, onClose }: Props) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const runSearch = useCallback((term: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!term.trim()) { setResults([]); setLoading(false); return; }
    setLoading(true);
    timerRef.current = setTimeout(async () => {
      const r = await search(term);
      setResults(r);
      setLoading(false);
    }, 300);
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setQuery(v);
    runSearch(v);
  }

  function handleSelect(result: Result) {
    navigate({ to: result.href as any });
    onClose();
  }

  if (!open) return null;

  const grouped = (Object.keys(CATEGORIES) as Category[]).reduce<Record<Category, Result[]>>(
    (acc, cat) => { acc[cat] = results.filter((r) => r.category === cat); return acc; },
    { vagas: [], clientes: [], contatos: [], tarefas: [] }
  );

  const hasResults = results.length > 0;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />
      <div className="fixed top-[18%] left-1/2 -translate-x-1/2 w-full max-w-lg z-50 px-4">
        <div
          className="rounded-2xl shadow-2xl overflow-hidden"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          {/* Input */}
          <div className="flex items-center gap-2 px-4" style={{ borderBottom: "1px solid var(--border)" }}>
            <Search className="w-4 h-4 shrink-0" style={{ color: "var(--fg-muted)" }} />
            <input
              ref={inputRef}
              value={query}
              onChange={handleChange}
              placeholder="Buscar vagas, clientes, contatos, tarefas..."
              className="flex-1 py-3.5 text-sm bg-transparent outline-none"
              style={{ color: "var(--fg)" }}
            />
            {query && (
              <button onClick={() => { setQuery(""); setResults([]); }} style={{ color: "var(--fg-muted)" }}>
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Body */}
          <div className="max-h-80 overflow-y-auto">
            {!query && (
              <div className="py-8 text-center space-y-4">
                <p className="text-sm" style={{ color: "var(--fg-muted)" }}>
                  Busque vagas, clientes, contatos e tarefas
                </p>
                <div className="flex items-center justify-center gap-3">
                  {[
                    { key: "↑↓", desc: "navegar" },
                    { key: "↵", desc: "abrir" },
                    { key: "Esc", desc: "fechar" },
                  ].map(({ key, desc }) => (
                    <div key={key} className="flex items-center gap-1.5">
                      <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono" style={{ background: "var(--border)", color: "var(--fg-muted)" }}>{key}</kbd>
                      <span className="text-[11px]" style={{ color: "var(--fg-muted)" }}>{desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {query && loading && (
              <p className="text-sm text-center py-10" style={{ color: "var(--fg-muted)" }}>
                Buscando...
              </p>
            )}
            {query && !loading && !hasResults && (
              <p className="text-sm text-center py-10" style={{ color: "var(--fg-muted)" }}>
                Nenhum resultado encontrado.
              </p>
            )}
            {query && !loading && hasResults &&
              (Object.keys(CATEGORIES) as Category[]).map((cat) => {
                const items = grouped[cat];
                if (!items.length) return null;
                const { label, Icon } = CATEGORIES[cat];
                return (
                  <div key={cat}>
                    <div
                      className="px-4 py-1.5 text-[10px] uppercase tracking-wider"
                      style={{ background: "var(--bg)", color: "var(--fg-muted)" }}
                    >
                      {label}
                    </div>
                    {items.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => handleSelect(r)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors hover:bg-[var(--border)]"
                      >
                        <Icon className="w-4 h-4 shrink-0" style={{ color: "var(--accent)" }} />
                        <span className="flex-1 truncate" style={{ color: "var(--fg)" }}>{r.label}</span>
                        {r.sub && (
                          <span className="text-xs shrink-0" style={{ color: "var(--fg-muted)" }}>{r.sub}</span>
                        )}
                      </button>
                    ))}
                  </div>
                );
              })
            }
          </div>
        </div>
      </div>
    </>
  );
}
