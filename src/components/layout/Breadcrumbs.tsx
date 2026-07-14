import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronRight, Home } from "lucide-react";

const LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  vagas: "Vagas",
  tarefas: "Tarefas",
  agenda: "Agenda",
  reunioes: "Reuniões",
  chat: "Chat",
  crm: "CRM",
  clientes: "Clientes",
  contatos: "Contatos",
  ranking: "Ranking",
  vendas: "Vendas",
  produtos: "Produtos & Estoque",
  fornecedores: "Fornecedores",
  compras: "Compras",
  rh: "RH",
  financeiro: "Financeiro",
  relatorios: "Relatórios",
  configuracoes: "Configurações",
};

export function Breadcrumbs() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const segments = path.split("/").filter(Boolean);
  if (segments.length === 0) return null;

  return (
    <nav
      className="flex items-center gap-1.5 px-6 py-2 text-xs shrink-0"
      style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)", color: "var(--fg-muted)" }}
      aria-label="Breadcrumb"
    >
      <Link to="/dashboard" className="flex items-center hover:text-[color:var(--accent)] transition-colors">
        <Home className="w-3 h-3" />
      </Link>
      {segments.map((seg, i) => {
        const isLast = i === segments.length - 1;
        const label = LABELS[seg] ?? seg.charAt(0).toUpperCase() + seg.slice(1);
        return (
          <span key={i} className="flex items-center gap-1.5">
            <ChevronRight className="w-3 h-3 opacity-50" />
            <span style={{ color: isLast ? "var(--fg)" : "var(--fg-muted)", fontWeight: isLast ? 500 : 400 }}>
              {label}
            </span>
          </span>
        );
      })}
    </nav>
  );
}
