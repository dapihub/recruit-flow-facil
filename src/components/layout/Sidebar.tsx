import { useState, useEffect } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Briefcase,
  CheckSquare,
  Calendar,
  FileText,
  MessageSquare,
  TrendingUp,
  Building2,
  Users,
  Star,
  DollarSign,
  BarChart2,
  Settings,
  ChevronDown,
  ChevronRight,
  PanelLeft,
  LogOut,
} from "lucide-react";
import { cn, initials } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

type NavItem = {
  to: string;
  label: string;
  icon: React.FC<{ className?: string }>;
};

type NavGroup = {
  id: string;
  label: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    id: "overview",
    label: "VISÃO GERAL",
    items: [{ to: "/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    id: "operation",
    label: "OPERAÇÃO",
    items: [
      { to: "/vagas", label: "Vagas", icon: Briefcase },
      { to: "/tarefas", label: "Tarefas", icon: CheckSquare },
      { to: "/agenda", label: "Agenda", icon: Calendar },
      { to: "/reunioes", label: "Reuniões", icon: FileText },
      { to: "/chat", label: "Chat", icon: MessageSquare },
    ],
  },
  {
    id: "commercial",
    label: "COMERCIAL",
    items: [
      { to: "/crm", label: "CRM", icon: TrendingUp },
      { to: "/clientes", label: "Clientes", icon: Building2 },
      { to: "/contatos", label: "Contatos", icon: Users },
      { to: "/ranking", label: "Ranking", icon: Star },
    ],
  },
  {
    id: "financial",
    label: "FINANCEIRO",
    items: [
      { to: "/financeiro", label: "Financeiro", icon: DollarSign },
      { to: "/relatorios", label: "Relatórios", icon: BarChart2 },
    ],
  },
];

const STANDALONE: NavItem = { to: "/configuracoes", label: "Configurações", icon: Settings };

const ALL_ITEMS = [...NAV_GROUPS.flatMap((g) => g.items), STANDALONE];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(() =>
    localStorage.getItem("themis:sidebar") === "collapsed"
  );
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(NAV_GROUPS.map((g) => [g.id, true]))
  );
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("themis:favorites") ?? "[]");
    } catch {
      return [];
    }
  });

  const path = useRouterState({ select: (s) => s.location.pathname });
  const { user, profile, signOut } = useAuth();

  useEffect(() => {
    localStorage.setItem("themis:sidebar", collapsed ? "collapsed" : "expanded");
  }, [collapsed]);

  useEffect(() => {
    localStorage.setItem("themis:favorites", JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (to: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites((prev) => (prev.includes(to) ? prev.filter((f) => f !== to) : [...prev, to]));
  };

  const toggleGroup = (id: string) =>
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));

  const isActive = (to: string) => {
    if (to === "/vagas") return path.startsWith("/vagas");
    return path === to || path.startsWith(to + "/");
  };

  const favoriteItems = ALL_ITEMS.filter((i) => favorites.includes(i.to));
  const displayName = profile?.name || user?.email?.split("@")[0] || "Usuário";

  return (
    <aside
      className="flex flex-col h-screen sticky top-0 shrink-0 overflow-hidden transition-[width] duration-200"
      style={{
        width: collapsed ? "var(--sidebar-width-collapsed)" : "var(--sidebar-width)",
        background: "var(--sidebar-bg)",
        borderRight: "1px solid var(--sidebar-border)",
      }}
    >
      {/* ── Logo + toggle ── */}
      <div
        className="flex items-center h-[var(--header-h)] shrink-0 px-3 gap-2"
        style={{ borderBottom: "1px solid var(--sidebar-border)" }}
      >
        <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
          T
        </div>
        {!collapsed && (
          <>
            <span className="text-white font-semibold text-sm tracking-tight flex-1">Themis</span>
            <button
              onClick={() => setCollapsed(true)}
              title="Recolher menu"
              className="p-1 rounded text-[color:var(--sidebar-group-label)] hover:text-white transition-colors"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
          </>
        )}
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            title="Expandir menu"
            className="absolute left-0 right-0 flex justify-center"
          />
        )}
      </div>

      {/* ── Expand button (collapsed state) ── */}
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          title="Expandir menu"
          className="mx-auto mt-3 p-1.5 rounded text-[color:var(--sidebar-group-label)] hover:text-white hover:bg-[var(--sidebar-hover-bg)] transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* ── Nav ── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 px-2 space-y-0.5">
        {/* Favorites */}
        {!collapsed && favoriteItems.length > 0 && (
          <section className="mb-3">
            <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--sidebar-group-label)" }}>
              Favoritos
            </p>
            {favoriteItems.map((item) => (
              <NavItem
                key={item.to}
                item={item}
                active={isActive(item.to)}
                collapsed={false}
                favorited={true}
                onToggleFavorite={toggleFavorite}
              />
            ))}
            <div className="my-2 mx-2" style={{ borderTop: "1px solid var(--sidebar-border)" }} />
          </section>
        )}

        {/* Groups */}
        {NAV_GROUPS.map((group) => (
          <section key={group.id} className="mb-2">
            {!collapsed && (
              <button
                onClick={() => toggleGroup(group.id)}
                className="w-full flex items-center justify-between px-2 py-1 text-[10px] font-semibold uppercase tracking-widest transition-colors hover:opacity-80"
                style={{ color: "var(--sidebar-group-label)" }}
              >
                {group.label}
                <ChevronDown
                  className={cn("w-3 h-3 transition-transform", !openGroups[group.id] && "-rotate-90")}
                />
              </button>
            )}
            {(collapsed || openGroups[group.id]) && (
              <div className="mt-0.5 space-y-0.5">
                {group.items.map((item) => (
                  <NavItem
                    key={item.to}
                    item={item}
                    active={isActive(item.to)}
                    collapsed={collapsed}
                    favorited={favorites.includes(item.to)}
                    onToggleFavorite={toggleFavorite}
                  />
                ))}
              </div>
            )}
          </section>
        ))}

        {/* Configurações */}
        <div className="pt-1" style={{ borderTop: "1px solid var(--sidebar-border)" }}>
          <NavItem
            item={STANDALONE}
            active={isActive(STANDALONE.to)}
            collapsed={collapsed}
            favorited={favorites.includes(STANDALONE.to)}
            onToggleFavorite={toggleFavorite}
          />
        </div>
      </nav>

      {/* ── User area ── */}
      <div
        className="shrink-0 p-2"
        style={{ borderTop: "1px solid var(--sidebar-border)" }}
      >
        {collapsed ? (
          <div className="flex justify-center">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-semibold">
              {initials(displayName)}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg group">
            <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-semibold shrink-0">
              {initials(displayName)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{displayName}</p>
              <p className="text-[10px] truncate" style={{ color: "var(--sidebar-group-label)" }}>
                {user?.email}
              </p>
            </div>
            <button
              onClick={signOut}
              title="Sair"
              className="p-1 rounded opacity-0 group-hover:opacity-100 transition-all text-[color:var(--sidebar-group-label)] hover:text-white"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

function NavItem({
  item,
  active,
  collapsed,
  favorited,
  onToggleFavorite,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  favorited: boolean;
  onToggleFavorite: (to: string, e: React.MouseEvent) => void;
}) {
  const Icon = item.icon;

  return (
    <div className="relative group/nav">
      <Link
        to={item.to}
        title={collapsed ? item.label : undefined}
        className={cn(
          "flex items-center gap-2.5 rounded-md text-sm transition-colors py-2",
          collapsed ? "justify-center px-0" : "px-2",
          active
            ? "font-medium"
            : "hover:bg-[var(--sidebar-hover-bg)]"
        )}
        style={
          active
            ? {
                background: "var(--sidebar-active-bg)",
                color: "var(--sidebar-fg-active)",
                borderLeft: collapsed ? undefined : "2px solid var(--sidebar-active-border)",
                paddingLeft: collapsed ? undefined : "calc(0.5rem - 2px)",
              }
            : { color: "var(--sidebar-fg)" }
        }
      >
        <Icon
          className={cn(
            "shrink-0 transition-colors",
            collapsed ? "w-5 h-5" : "w-4 h-4",
            active ? "text-indigo-400" : ""
          )}
        />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </Link>

      {!collapsed && (
        <button
          onClick={(e) => onToggleFavorite(item.to, e)}
          title={favorited ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          className={cn(
            "absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded transition-all",
            favorited
              ? "opacity-100 text-amber-400"
              : "opacity-0 group-hover/nav:opacity-100 text-[color:var(--sidebar-group-label)] hover:text-amber-400"
          )}
        >
          <Star className="w-3 h-3" fill={favorited ? "currentColor" : "none"} />
        </button>
      )}
    </div>
  );
}
