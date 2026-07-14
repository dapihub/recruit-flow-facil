import { useState, useEffect } from "react";
import { Sun, Moon, Eye, EyeOff, Bell, Search, Megaphone, CheckCircle2, Menu } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useTheme } from "@/hooks/useTheme";
import { useHideValues } from "@/hooks/useHideValues";
import { useMobileMenu } from "@/hooks/useMobileMenu";
import { cn } from "@/lib/utils";
import { GlobalSearch } from "./GlobalSearch";
import { useNotifications, useMarkAllRead } from "@/hooks/useNotifications";

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

const NOVIDADES = [
  { date: "2026-06-22", title: "CRM com modo tabela", description: "Visualize oportunidades em formato de tabela." },
  { date: "2026-06-20", title: "Relatórios com dados reais", description: "5 relatórios interativos com recharts." },
  { date: "2026-06-18", title: "Agenda integrada", description: "Calendário unificado com vagas, tarefas e reuniões." },
];

const STORAGE_KEY = "themis:novidades_read_count";

function getUnreadCount(): number {
  try {
    const read = parseInt(localStorage.getItem(STORAGE_KEY) ?? "0", 10);
    return Math.max(0, NOVIDADES.length - read);
  } catch {
    return NOVIDADES.length;
  }
}

function markAllRead() {
  try {
    localStorage.setItem(STORAGE_KEY, String(NOVIDADES.length));
  } catch {
    // ignore
  }
}

export function Header({ title, subtitle, actions }: HeaderProps) {
  const { theme, toggle: toggleTheme } = useTheme();
  const { hidden, toggle: toggleHide } = useHideValues();
  const [notifOpen, setNotifOpen] = useState(false);
  const [novidadesOpen, setNovidadesOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(getUnreadCount);
  const [searchOpen, setSearchOpen] = useState(false);
  const { openMenu } = useMobileMenu();
  const { data: notifications = [] } = useNotifications();
  const markNotifsRead = useMarkAllRead();
  const unreadNotifs = notifications.filter((n) => !n.read_at).length;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  function openNovidades() {
    setNovidadesOpen((o) => {
      if (!o) {
        markAllRead();
        setUnreadCount(0);
      }
      return !o;
    });
    setNotifOpen(false);
  }

  function openNotif() {
    setNotifOpen((o) => !o);
    setNovidadesOpen(false);
  }

  return (
    <>
    <header
      className="flex items-center gap-4 px-6 shrink-0"
      style={{
        height: "var(--header-h)",
        background: "var(--bg-card)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      {/* Hambúrguer mobile */}
      <button
        onClick={openMenu}
        aria-label="Abrir menu"
        className="md:hidden p-2 -ml-2 rounded-lg transition-colors hover:bg-[var(--border)]"
        style={{ color: "var(--fg)" }}
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Title */}
      <div className="flex-1 min-w-0">
        <h1 className="font-display text-2xl truncate" style={{ color: "var(--fg)" }}>
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs truncate" style={{ color: "var(--fg-muted)" }}>
            {subtitle}
          </p>
        )}
      </div>

      {/* Actions slot */}
      {actions && <div className="flex items-center gap-2">{actions}</div>}

      {/* Global controls */}
      <div className="flex items-center gap-1">
        {/* Search */}
        <button
          onClick={() => setSearchOpen(true)}
          title="Buscar (⌘K)"
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors border hover:opacity-80"
          style={{
            background: "var(--bg)",
            borderColor: "var(--border)",
            color: "var(--fg-muted)",
          }}
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Buscar</span>
          <kbd
            className="ml-1 px-1 py-0.5 rounded text-[10px] font-mono hidden sm:inline"
            style={{ background: "var(--border)", color: "var(--fg-muted)" }}
          >
            ⌘K
          </kbd>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={openNotif}
            title="Notificações"
            className="relative p-2 rounded-lg transition-all duration-150 hover:bg-[var(--border)] hover:scale-105"
            style={{ color: "var(--fg-muted)" }}
          >
            <Bell className="w-4 h-4" />
            {unreadNotifs > 0 && (
              <span className="absolute top-1 right-1 min-w-[14px] h-[14px] px-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
                {unreadNotifs}
              </span>
            )}
          </button>

          {notifOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
              <div
                className="absolute right-0 top-full mt-2 w-80 rounded-xl shadow-xl z-50 overflow-hidden"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
              >
                <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
                  <p className="text-sm font-semibold" style={{ color: "var(--fg)" }}>Notificações</p>
                  {unreadNotifs > 0 && (
                    <button onClick={() => markNotifsRead.mutate()} className="text-xs hover:underline" style={{ color: "var(--accent)" }}>
                      Marcar todas
                    </button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div className="p-8 text-center flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "#10b98118" }}>
                      <CheckCircle2 className="w-6 h-6" style={{ color: "#10b981" }} />
                    </div>
                    <p className="text-sm font-medium" style={{ color: "var(--fg)" }}>Tudo em dia</p>
                    <p className="text-xs" style={{ color: "var(--fg-muted)" }}>Nenhuma notificação no momento</p>
                  </div>
                ) : (
                  <div className="max-h-80 overflow-y-auto divide-y" style={{ borderColor: "var(--border)" }}>
                    {notifications.map((n) => (
                      <div key={n.id} className="px-4 py-3" style={{ background: n.read_at ? "transparent" : "color-mix(in srgb, var(--accent) 6%, transparent)" }}>
                        <p className="text-sm font-medium" style={{ color: "var(--fg)" }}>{n.title}</p>
                        {n.message && <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>{n.message}</p>}
                        <p className="text-[10px] mt-1" style={{ color: "var(--fg-muted)" }}>
                          {format(new Date(n.created_at), "dd/MM HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Novidades */}
        <div className="relative">
          <button
            onClick={openNovidades}
            title="Novidades"
            className="relative p-2 rounded-lg transition-all duration-150 hover:bg-[var(--border)] hover:scale-105"
            style={{ color: novidadesOpen ? "var(--accent)" : "var(--fg-muted)" }}
          >
            <Megaphone className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[14px] h-[14px] px-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center leading-none animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {novidadesOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setNovidadesOpen(false)} />
              <div
                className="absolute right-0 top-full mt-2 w-80 rounded-xl shadow-xl z-50 overflow-hidden"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
              >
                <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                  <p className="text-sm font-semibold" style={{ color: "var(--fg)" }}>Novidades</p>
                </div>
                <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                  {NOVIDADES.map((n) => (
                    <div key={n.date} className="px-4 py-3">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="text-sm font-medium" style={{ color: "var(--fg)" }}>{n.title}</p>
                        <span className="text-[11px]" style={{ color: "var(--fg-muted)" }}>
                          {format(new Date(n.date), "dd/MM", { locale: ptBR })}
                        </span>
                      </div>
                      <p className="text-xs" style={{ color: "var(--fg-muted)" }}>{n.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Hide values */}
        <button
          onClick={toggleHide}
          title={hidden ? "Mostrar valores" : "Ocultar valores"}
          className="p-2 rounded-lg transition-all duration-150 hover:bg-[var(--border)] hover:scale-105"
          style={{ color: hidden ? "var(--accent)" : "var(--fg-muted)" }}
        >
          {hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={theme === "dark" ? "Modo claro" : "Modo escuro"}
          className="p-2 rounded-lg transition-all duration-150 hover:bg-[var(--border)] hover:scale-105"
          style={{ color: "var(--fg-muted)" }}
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
    <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
