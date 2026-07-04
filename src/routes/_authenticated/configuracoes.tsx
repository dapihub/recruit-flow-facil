import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  User, Building2, Users, Sliders, TrendingUp, Pencil, Trash2,
  Check, X, ChevronUp, ChevronDown, Plus, Cpu, Settings,
  ShieldCheck, Bell, Sun, Moon, Palette, Link2, Gift, Zap,
  ClipboardList, Mail, Copy,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/hooks/useTheme";
import {
  useCompany,
  useUpdateCompany,
  useUpdateProfile,
  useTeamMembers,
  useUpdateMemberRole,
  useInviteMember,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useCreateCrmStage,
  useUpdateCrmStage,
  useDeleteCrmStage,
  type TeamMember,
} from "@/hooks/useSettings";
import { useCategories, type Category } from "@/hooks/useFinanceiro";
import { useCrmStages, type CrmStage } from "@/hooks/useCrm";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  component: ConfiguracoesPage,
});

type Section =
  | "perfil"
  | "preferencias"
  | "notificacoes"
  | "empresa"
  | "equipe"
  | "assinatura"
  | "indicacoes"
  | "categorias"
  | "categorias-crm"
  | "crm-etapas"
  | "status-tarefas"
  | "automacoes"
  | "templates"
  | "integracoes"
  | "coming-soon";

const NAV: {
  group: string;
  items: { id: Section; label: string; icon: React.ElementType; disabled?: boolean }[];
}[] = [
  {
    group: "Conta",
    items: [
      { id: "perfil", label: "Perfil", icon: User },
      { id: "preferencias", label: "Preferências", icon: Palette },
      { id: "notificacoes", label: "Notificações", icon: Bell },
    ],
  },
  {
    group: "Empresa",
    items: [
      { id: "empresa", label: "Dados da Empresa", icon: Building2 },
      { id: "equipe", label: "Equipe", icon: Users },
      { id: "assinatura", label: "Assinatura", icon: ShieldCheck },
      { id: "indicacoes", label: "Indicações", icon: Gift },
    ],
  },
  {
    group: "Operação",
    items: [
      { id: "categorias", label: "Categorias Financeiras", icon: Sliders },
      { id: "categorias-crm", label: "Categorias CRM", icon: TrendingUp },
      { id: "crm-etapas", label: "Etapas do CRM", icon: TrendingUp },
      { id: "status-tarefas", label: "Status de Tarefas", icon: ClipboardList },
      { id: "automacoes", label: "Automações de Tarefas", icon: Zap },
      { id: "templates", label: "Templates de Tarefas", icon: ClipboardList },
    ],
  },
  {
    group: "Integrações",
    items: [
      { id: "integracoes", label: "Google Calendar", icon: Link2 },
    ],
  },
  {
    group: "Avançado",
    items: [
      { id: "coming-soon", label: "Assistente IA", icon: Cpu, disabled: true },
      { id: "coming-soon", label: "Suporte", icon: Settings, disabled: true },
    ],
  },
];

function ConfiguracoesPage() {
  const [activeSection, setActiveSection] = useState<Section>("perfil");

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Configurações" />
      <div className="flex flex-1 overflow-hidden">
        {/* Left nav */}
        <aside
          className="hidden md:block w-56 shrink-0 p-4 space-y-6 overflow-y-auto"
          style={{ borderRight: "1px solid var(--border)" }}
        >
          {NAV.map((group) => (
            <div key={group.group}>
              <p
                className="text-[10px] font-semibold uppercase tracking-widest px-2 mb-1"
                style={{ color: "var(--fg-muted)" }}
              >
                {group.group}
              </p>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id && !item.disabled;
                return (
                  <button
                    key={`${group.group}-${item.label}`}
                    onClick={() => !item.disabled && setActiveSection(item.id)}
                    disabled={item.disabled}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors ${!isActive && !item.disabled ? "hover:bg-[var(--border)]" : ""}`}
                    style={
                      isActive
                        ? { background: "color-mix(in srgb, var(--accent) 12%, transparent)", color: "var(--accent)", fontWeight: 600 }
                        : item.disabled
                        ? { color: "var(--fg-muted)", opacity: 0.5, cursor: "default" }
                        : { color: "var(--fg)" }
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                    {item.disabled && (
                      <span
                        className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full shrink-0"
                        style={{ background: "var(--border)", color: "var(--fg-muted)" }}
                      >
                        Em breve
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </aside>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-8 max-w-2xl">
          {activeSection === "perfil" && <PerfilSection />}
          {activeSection === "preferencias" && <PreferenciasSection />}
          {activeSection === "notificacoes" && <NotificacoesSection />}
          {activeSection === "empresa" && <EmpresaSection />}
          {activeSection === "equipe" && <EquipeSection />}
          {activeSection === "assinatura" && <AssinaturaSection />}
          {activeSection === "indicacoes" && <IndicacoesSection />}
          {activeSection === "categorias" && <CategoriasSection />}
          {activeSection === "categorias-crm" && <CategoriasCrmSection />}
          {activeSection === "crm-etapas" && <CrmEtapasSection />}
          {activeSection === "status-tarefas" && <StatusTarefasSection />}
          {activeSection === "automacoes" && <AutomacoesSection />}
          {activeSection === "templates" && <TemplatesSection />}
          {activeSection === "integracoes" && <IntegracoesSection />}
          {activeSection === "coming-soon" && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-sm" style={{ color: "var(--fg-muted)" }}>
                Esta seção estará disponível em breve.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// ─── Shared helpers ───────────────────────────────────────────

const INPUT =
  "w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40";
const inputStyle = {
  background: "var(--bg)",
  border: "1px solid var(--border)",
  color: "var(--fg)",
};

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-base font-semibold" style={{ color: "var(--fg)" }}>
        {title}
      </h2>
      {subtitle && (
        <p className="text-sm mt-0.5" style={{ color: "var(--fg-muted)" }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

function SaveButton({ onClick, loading }: { onClick: () => void; loading?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity"
      style={{ background: "var(--accent)", color: "#fff", opacity: loading ? 0.7 : 1 }}
    >
      {loading ? "Salvando..." : "Salvar"}
    </button>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors"
      style={{ background: checked ? "var(--accent)" : "var(--border)" }}
    >
      <span
        className="pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform m-0.5"
        style={{ transform: checked ? "translateX(16px)" : "translateX(0)" }}
      />
    </button>
  );
}

// ─── Perfil ───────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  recruiter: "Recrutador(a)",
  financial: "Financeiro",
  viewer: "Visualizador(a)",
};

function PerfilSection() {
  const { profile, user, refreshProfile } = useAuth();
  const [name, setName] = useState(profile?.name ?? (user?.user_metadata?.name as string | undefined) ?? "");
  const [phone, setPhone] = useState((profile as any)?.phone ?? "");
  const [jobTitle, setJobTitle] = useState((profile as any)?.job_title ?? "");
  const updateProfile = useUpdateProfile();

  // Sync form when profile loads asynchronously after mount
  useEffect(() => {
    if (!profile) return;
    setName(profile.name ?? (user?.user_metadata?.name as string | undefined) ?? "");
    setPhone((profile as any).phone ?? "");
    setJobTitle((profile as any).job_title ?? "");
  }, [profile?.id]);  // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <SectionTitle
        title="Meu Perfil"
        subtitle="Suas informações pessoais dentro da plataforma."
      />
      <div className="space-y-4">
        {/* Avatar placeholder */}
        <div className="flex items-center gap-4 mb-2">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white"
            style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" }}
          >
            {(name || user?.email || "U").charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--fg)" }}>{name || user?.email}</p>
            <p className="text-xs" style={{ color: "var(--fg-muted)" }}>{ROLE_LABELS[profile?.role ?? ""] ?? profile?.role}</p>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium block mb-1" style={{ color: "var(--fg-muted)" }}>Nome</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className={INPUT} style={inputStyle} />
        </div>
        <div>
          <label className="text-xs font-medium block mb-1" style={{ color: "var(--fg-muted)" }}>Email</label>
          <input
            value={user?.email ?? ""}
            disabled
            className={INPUT}
            style={{ ...inputStyle, opacity: 0.6, cursor: "not-allowed" }}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: "var(--fg-muted)" }}>Telefone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className={INPUT} style={inputStyle} placeholder="(11) 9xxxx-xxxx" />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: "var(--fg-muted)" }}>Cargo</label>
            <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className={INPUT} style={inputStyle} placeholder="Recrutador Sênior" />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium block mb-1" style={{ color: "var(--fg-muted)" }}>Função</label>
          <div className="px-3 py-2 rounded-lg text-sm" style={{ ...inputStyle, opacity: 0.6 }}>
            {ROLE_LABELS[profile?.role ?? ""] ?? profile?.role ?? "—"}
          </div>
        </div>
        <div className="pt-2">
          <SaveButton
            loading={updateProfile.isPending}
            onClick={() => updateProfile.mutate({ name, phone, job_title: jobTitle }, { onSuccess: () => refreshProfile() })}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Preferências ─────────────────────────────────────────────

function PreferenciasSection() {
  const { theme, toggle } = useTheme();

  return (
    <div>
      <SectionTitle title="Preferências" subtitle="Personalize a aparência e comportamento do Themis." />
      <div className="space-y-4">
        <div
          className="flex items-center justify-between px-4 py-3 rounded-xl"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-3">
            {theme === "dark" ? (
              <Moon className="w-4 h-4" style={{ color: "var(--fg-muted)" }} />
            ) : (
              <Sun className="w-4 h-4" style={{ color: "var(--fg-muted)" }} />
            )}
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--fg)" }}>Tema</p>
              <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
                {theme === "dark" ? "Escuro" : "Claro"}
              </p>
            </div>
          </div>
          <Toggle checked={theme === "dark"} onChange={toggle} />
        </div>
      </div>
    </div>
  );
}

// ─── Notificações ─────────────────────────────────────────────

const DEFAULT_NOTIF = {
  tarefa_vencimento: true,
  tarefa_atrasada: true,
  tarefa_atribuida: true,
  vaga_prazo: true,
  crm_proxima_acao: true,
  crm_sla: false,
  crm_lead: true,
  som: false,
};

function NotificacoesSection() {
  const [settings, setSettings] = useState(() => {
    try {
      return { ...DEFAULT_NOTIF, ...JSON.parse(localStorage.getItem("themis:notif") ?? "{}") };
    } catch {
      return DEFAULT_NOTIF;
    }
  });

  function toggle(key: keyof typeof DEFAULT_NOTIF) {
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    localStorage.setItem("themis:notif", JSON.stringify(next));
  }

  const groups = [
    {
      label: "Tarefas",
      items: [
        { key: "tarefa_vencimento" as const, label: "Vencimento próximo", desc: "Notificar quando uma tarefa está prestes a vencer" },
        { key: "tarefa_atrasada" as const, label: "Tarefa atrasada", desc: "Notificar quando uma tarefa passa do prazo" },
        { key: "tarefa_atribuida" as const, label: "Tarefa atribuída", desc: "Notificar quando uma tarefa é atribuída a você" },
      ],
    },
    {
      label: "Vagas",
      items: [
        { key: "vaga_prazo" as const, label: "Prazo da vaga", desc: "Notificar quando uma vaga está próxima do prazo" },
      ],
    },
    {
      label: "CRM",
      items: [
        { key: "crm_proxima_acao" as const, label: "Próxima ação", desc: "Lembrar da próxima ação agendada em oportunidades" },
        { key: "crm_sla" as const, label: "SLA estourando", desc: "Alertar quando oportunidades ficam sem ação por muito tempo" },
        { key: "crm_lead" as const, label: "Lead atribuído", desc: "Notificar quando um novo lead é atribuído a você" },
      ],
    },
    {
      label: "Geral",
      items: [
        { key: "som" as const, label: "Som ao receber notificação", desc: "Reproduzir som ao receber novas notificações" },
      ],
    },
  ];

  return (
    <div>
      <SectionTitle title="Notificações" subtitle="Controle quais notificações você deseja receber." />
      <div className="space-y-6">
        {groups.map((g) => (
          <div key={g.label}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--fg-muted)" }}>
              {g.label}
            </p>
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
              {g.items.map((item, i) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between px-4 py-3"
                  style={{
                    background: i % 2 === 0 ? "var(--bg)" : "var(--bg-card)",
                    borderBottom: i < g.items.length - 1 ? "1px solid var(--border)" : undefined,
                  }}
                >
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--fg)" }}>{item.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>{item.desc}</p>
                  </div>
                  <Toggle checked={settings[item.key]} onChange={() => toggle(item.key)} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Empresa ──────────────────────────────────────────────────

function EmpresaSection() {
  const { data: company, isLoading } = useCompany();
  const update = useUpdateCompany();
  const [form, setForm] = useState<Record<string, string>>({});

  const val = (field: string) =>
    form[field] !== undefined
      ? form[field]
      : (company as Record<string, string | null>)?.[field] ?? "";

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  if (isLoading)
    return <p className="text-sm" style={{ color: "var(--fg-muted)" }}>Carregando...</p>;

  return (
    <div>
      <SectionTitle title="Dados da Empresa" subtitle="Informações do seu escritório de R&S." />
      <div className="space-y-4">
        {/* Logo placeholder */}
        <div>
          <label className="text-xs font-medium block mb-2" style={{ color: "var(--fg-muted)" }}>Logo</label>
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold"
              style={{ background: "color-mix(in srgb, var(--accent) 12%, transparent)", color: "var(--accent)", border: "1px solid var(--border)" }}
            >
              {(val("name") || "T").charAt(0).toUpperCase()}
            </div>
            <div>
              <label
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-opacity hover:opacity-80"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--fg)" }}
              >
                <Plus className="w-3 h-3" />
                Fazer upload
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => set("logo_url", reader.result as string);
                    reader.readAsDataURL(file);
                  }}
                />
              </label>
              <p className="text-[10px] mt-1" style={{ color: "var(--fg-muted)" }}>PNG, JPG até 2MB</p>
            </div>
          </div>
        </div>

        {[
          { key: "name", label: "Razão Social *" },
          { key: "cnpj", label: "CNPJ" },
          { key: "email", label: "Email" },
          { key: "phone", label: "Telefone" },
          { key: "website", label: "Site" },
        ].map(({ key, label }) => (
          <div key={key}>
            <label className="text-xs font-medium block mb-1" style={{ color: "var(--fg-muted)" }}>{label}</label>
            <input value={val(key)} onChange={(e) => set(key, e.target.value)} className={INPUT} style={inputStyle} />
          </div>
        ))}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: "var(--fg-muted)" }}>Cidade</label>
            <input value={val("city")} onChange={(e) => set("city", e.target.value)} className={INPUT} style={inputStyle} />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: "var(--fg-muted)" }}>Estado</label>
            <input value={val("state")} onChange={(e) => set("state", e.target.value)} className={INPUT} style={inputStyle} maxLength={2} />
          </div>
        </div>
        <div className="pt-2">
          <SaveButton loading={update.isPending} onClick={() => update.mutate(form as Record<string, string>)} />
        </div>
      </div>
    </div>
  );
}

// ─── Equipe ───────────────────────────────────────────────────

const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
  admin: { bg: "color-mix(in srgb, #6366f1 12%, transparent)", color: "#6366f1" },
  recruiter: { bg: "color-mix(in srgb, #3b82f6 12%, transparent)", color: "#3b82f6" },
  financial: { bg: "color-mix(in srgb, #10b981 12%, transparent)", color: "#10b981" },
  viewer: { bg: "color-mix(in srgb, #6b7280 12%, transparent)", color: "#6b7280" },
};

function EquipeSection() {
  const { profile } = useAuth();
  const { data: members = [], isLoading } = useTeamMembers();
  const updateRole = useUpdateMemberRole();
  const inviteMember = useInviteMember();
  const isAdmin = profile?.role === "admin";

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("recruiter");

  function handleInvite() {
    if (!inviteEmail.trim()) return;
    inviteMember.mutate(
      { email: inviteEmail.trim(), role: inviteRole },
      {
        onSuccess: () => {
          setInviteOpen(false);
          setInviteEmail("");
        },
      }
    );
  }

  if (isLoading)
    return <p className="text-sm" style={{ color: "var(--fg-muted)" }}>Carregando...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <SectionTitle
          title="Equipe"
          subtitle="Membros com acesso ao Themis na sua empresa."
        />
        {isAdmin && (
          <button
            onClick={() => setInviteOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium shrink-0"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            <Mail className="w-3.5 h-3.5" /> Convidar Membro
          </button>
        )}
      </div>

      {/* Invite modal */}
      {inviteOpen && (
        <div
          className="mb-4 rounded-xl p-4 space-y-3"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <p className="text-sm font-semibold" style={{ color: "var(--fg)" }}>Convidar novo membro</p>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: "var(--fg-muted)" }}>Email</label>
            <input
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="email@empresa.com"
              className={INPUT}
              style={inputStyle}
              onKeyDown={(e) => e.key === "Enter" && handleInvite()}
            />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: "var(--fg-muted)" }}>Função</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className={INPUT}
              style={inputStyle}
            >
              <option value="admin">Administrador</option>
              <option value="recruiter">Recrutador(a)</option>
              <option value="financial">Financeiro</option>
              <option value="viewer">Visualizador(a)</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleInvite}
              disabled={inviteMember.isPending}
              className="px-4 py-1.5 rounded-lg text-sm font-medium"
              style={{ background: "var(--accent)", color: "#fff", opacity: inviteMember.isPending ? 0.7 : 1 }}
            >
              {inviteMember.isPending ? "Enviando..." : "Enviar convite"}
            </button>
            <button
              onClick={() => setInviteOpen(false)}
              className="px-4 py-1.5 rounded-lg text-sm font-medium"
              style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg)" }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
        {members.map((m, i) => {
          const rc = ROLE_COLORS[m.role] ?? ROLE_COLORS.viewer;
          const isSelf = m.id === profile?.id;
          return (
            <div
              key={m.id}
              className="flex items-center gap-3 px-4 py-3"
              style={{
                background: i % 2 === 0 ? "var(--bg)" : "var(--bg-card)",
                borderBottom: i < members.length - 1 ? "1px solid var(--border)" : undefined,
              }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={{ background: "color-mix(in srgb, var(--accent) 12%, transparent)", color: "var(--accent)" }}
              >
                {m.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium" style={{ color: "var(--fg)" }}>{m.name}</span>
                  {isSelf && <span className="text-xs" style={{ color: "var(--fg-muted)" }}>(você)</span>}
                  {!m.is_active && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: "color-mix(in srgb, #6b7280 12%, transparent)", color: "#6b7280" }}>
                      Inativo
                    </span>
                  )}
                </div>
                <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
                  Desde {format(new Date(m.created_at), "MMM yyyy", { locale: ptBR })}
                </p>
              </div>
              {isAdmin && !isSelf ? (
                <select
                  value={m.role}
                  onChange={(e) => updateRole.mutate({ id: m.id, role: e.target.value as TeamMember["role"] })}
                  className="px-2 py-1 rounded-lg text-xs focus:outline-none"
                  style={{ background: rc.bg, color: rc.color, border: "none" }}
                >
                  <option value="admin">Administrador</option>
                  <option value="recruiter">Recrutador(a)</option>
                  <option value="financial">Financeiro</option>
                  <option value="viewer">Visualizador(a)</option>
                </select>
              ) : (
                <span className="text-xs px-2 py-1 rounded-lg font-medium" style={{ background: rc.bg, color: rc.color }}>
                  {ROLE_LABELS[m.role] ?? m.role}
                </span>
              )}
            </div>
          );
        })}
      </div>
      {!isAdmin && (
        <p className="text-xs mt-3" style={{ color: "var(--fg-muted)" }}>
          Apenas administradores podem alterar funções e convidar membros.
        </p>
      )}
    </div>
  );
}

// ─── Assinatura ───────────────────────────────────────────────

const PLANS = [
  { id: "essencial", name: "Essencial", price: "R$ 97", period: "/mês", desc: "Para agências solo ou pequenas equipes", features: ["Até 3 usuários", "Vagas ilimitadas", "CRM completo", "Financeiro básico"] },
  { id: "profissional", name: "Profissional", price: "R$ 197", period: "/mês", desc: "Para equipes em crescimento", features: ["Até 10 usuários", "Tudo do Essencial", "Relatórios avançados", "Chat em tempo real", "Automações"], highlight: true },
  { id: "enterprise", name: "Enterprise", price: "Sob consulta", period: "", desc: "Para grandes agências e grupos", features: ["Usuários ilimitados", "Tudo do Profissional", "Suporte dedicado", "SLA garantido"] },
];

function AssinaturaSection() {
  return (
    <div>
      <SectionTitle title="Assinatura" subtitle="Escolha o plano ideal para a sua agência." />
      <div className="space-y-4">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className="rounded-xl p-5 relative"
            style={{
              background: plan.highlight ? "color-mix(in srgb, var(--accent) 6%, transparent)" : "var(--bg-card)",
              border: `1px solid ${plan.highlight ? "var(--accent)" : "var(--border)"}`,
            }}
          >
            {plan.highlight && (
              <span
                className="absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded-full font-semibold"
                style={{ background: "var(--accent)", color: "#fff" }}
              >
                Mais popular
              </span>
            )}
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--fg)" }}>{plan.name}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>{plan.desc}</p>
              </div>
              <div className="text-right">
                <span className="text-xl font-bold" style={{ color: "var(--fg)" }}>{plan.price}</span>
                <span className="text-xs" style={{ color: "var(--fg-muted)" }}>{plan.period}</span>
              </div>
            </div>
            <ul className="space-y-1 mb-4">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-xs" style={{ color: "var(--fg-muted)" }}>
                  <Check className="w-3 h-3 shrink-0" style={{ color: "#10b981" }} /> {f}
                </li>
              ))}
            </ul>
            <button
              className="w-full py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-90"
              style={{
                background: plan.highlight ? "var(--accent)" : "var(--bg)",
                color: plan.highlight ? "#fff" : "var(--fg)",
                border: plan.highlight ? undefined : "1px solid var(--border)",
              }}
            >
              {plan.id === "enterprise" ? "Falar com vendas" : "Assinar agora"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Indicações ───────────────────────────────────────────────

function IndicacoesSection() {
  const { user } = useAuth();
  const referralCode = `THEMIS-${(user?.id ?? "").slice(0, 8).toUpperCase()}`;
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div>
      <SectionTitle title="Indicações" subtitle="Indique o Themis e ganhe descontos na assinatura." />
      <div className="space-y-4">
        <div className="rounded-xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <p className="text-xs font-medium mb-2" style={{ color: "var(--fg-muted)" }}>Seu código de indicação</p>
          <div className="flex items-center gap-2">
            <div
              className="flex-1 px-3 py-2 rounded-lg text-sm font-mono font-semibold"
              style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg)" }}
            >
              {referralCode}
            </div>
            <button
              onClick={copy}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copiado!" : "Copiar"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Indicações Pendentes", value: "0", color: "var(--fg-muted)" },
            { label: "Conversões", value: "0", color: "#10b981" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl p-4 text-center"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
            >
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs mt-1" style={{ color: "var(--fg-muted)" }}>{s.label}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <p className="text-sm font-semibold mb-1" style={{ color: "var(--fg)" }}>Como funciona?</p>
          <ul className="space-y-2">
            {[
              "Compartilhe seu código com outros donos de agências",
              "Quando alguém assinar usando seu código, você ganha 1 mês grátis",
              "Sem limite de indicações — acumule descontos",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs" style={{ color: "var(--fg-muted)" }}>
                <span
                  className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5"
                  style={{ background: "color-mix(in srgb, var(--accent) 12%, transparent)", color: "var(--accent)" }}
                >
                  {i + 1}
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ─── Categorias Financeiras ───────────────────────────────────

function CategoriasSection() {
  const { data: categories = [] } = useCategories();
  const createCat = useCreateCategory();
  const deleteCat = useDeleteCategory();
  const updateCat = useUpdateCategory();

  const income = categories.filter((c) => c.type === "income");
  const expense = categories.filter((c) => c.type === "expense");

  return (
    <div>
      <SectionTitle title="Categorias Financeiras" subtitle="Classifique suas receitas e despesas." />
      <div className="grid grid-cols-2 gap-6">
        <CategoryColumn
          title="Receitas"
          type="income"
          color="#10b981"
          items={income}
          onCreate={(name, color) => createCat.mutate({ name, type: "income", color })}
          onUpdate={(id, name, color) => updateCat.mutate({ id, name, color })}
          onDelete={(id) => deleteCat.mutate(id)}
        />
        <CategoryColumn
          title="Despesas"
          type="expense"
          color="#ef4444"
          items={expense}
          onCreate={(name, color) => createCat.mutate({ name, type: "expense", color })}
          onUpdate={(id, name, color) => updateCat.mutate({ id, name, color })}
          onDelete={(id) => deleteCat.mutate(id)}
        />
      </div>
    </div>
  );
}

function CategoryColumn({
  title, color, items, onCreate, onUpdate, onDelete,
}: {
  title: string; type: "income" | "expense"; color: string;
  items: Category[];
  onCreate: (name: string, color: string) => void;
  onUpdate: (id: string, name: string, color: string) => void;
  onDelete: (id: string) => void;
}) {
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(color);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");

  function startEdit(c: Category) { setEditId(c.id); setEditName(c.name); setEditColor(c.color); }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-4 rounded-full" style={{ background: color }} />
        <h3 className="text-sm font-semibold" style={{ color: "var(--fg)" }}>{title}</h3>
        <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: "var(--border)", color: "var(--fg-muted)" }}>
          {items.length}
        </span>
      </div>
      <div className="rounded-xl overflow-hidden mb-3" style={{ border: "1px solid var(--border)" }}>
        {items.length === 0 && (
          <p className="px-3 py-3 text-xs" style={{ color: "var(--fg-muted)" }}>Nenhuma categoria</p>
        )}
        {items.map((c, i) => (
          <div
            key={c.id}
            className="flex items-center gap-2 px-3 py-2"
            style={{
              background: i % 2 === 0 ? "var(--bg)" : "var(--bg-card)",
              borderBottom: i < items.length - 1 ? "1px solid var(--border)" : undefined,
            }}
          >
            {editId === c.id ? (
              <>
                <input type="color" value={editColor} onChange={(e) => setEditColor(e.target.value)} className="w-7 h-7 rounded cursor-pointer border-0 p-0" />
                <input value={editName} onChange={(e) => setEditName(e.target.value)} className="flex-1 px-2 py-1 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500/40" style={inputStyle} autoFocus />
                <button onClick={() => { onUpdate(c.id, editName, editColor); setEditId(null); }} className="p-1 hover:opacity-80" style={{ color: "#10b981" }}><Check className="w-3.5 h-3.5" /></button>
                <button onClick={() => setEditId(null)} className="p-1 hover:opacity-80" style={{ color: "var(--fg-muted)" }}><X className="w-3.5 h-3.5" /></button>
              </>
            ) : (
              <>
                <div className="w-3 h-3 rounded-full shrink-0" style={{ background: c.color }} />
                <span className="flex-1 text-sm" style={{ color: "var(--fg)" }}>{c.name}</span>
                <button onClick={() => startEdit(c)} className="p-1 hover:opacity-80" style={{ color: "var(--fg-muted)" }}><Pencil className="w-3 h-3" /></button>
                <button onClick={() => { if (!confirm(`Remover "${c.name}"?`)) return; onDelete(c.id); }} className="p-1 hover:opacity-80" style={{ color: "#ef4444" }}><Trash2 className="w-3 h-3" /></button>
              </>
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} className="w-7 h-7 rounded cursor-pointer border-0 p-0 shrink-0" />
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nova categoria..."
          className="flex-1 px-2 py-1.5 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
          style={inputStyle}
          onKeyDown={(e) => { if (e.key === "Enter" && newName.trim()) { onCreate(newName.trim(), newColor); setNewName(""); } }}
        />
        <button onClick={() => { if (!newName.trim()) return; onCreate(newName.trim(), newColor); setNewName(""); }} className="p-1.5 rounded-lg hover:opacity-80" style={{ background: "var(--accent)", color: "#fff" }}>
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Categorias CRM ───────────────────────────────────────────

const DEFAULT_CRM_CATS = [
  { id: "1", name: "Recrutamento Executivo", color: "#6366f1" },
  { id: "2", name: "Hunting Especializado", color: "#3b82f6" },
  { id: "3", name: "RPO", color: "#8b5cf6" },
  { id: "4", name: "Assessoria", color: "#f59e0b" },
];

function CategoriasCrmSection() {
  const [cats, setCats] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("themis:crm-cats") ?? "null") ?? DEFAULT_CRM_CATS;
    } catch {
      return DEFAULT_CRM_CATS;
    }
  });
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#6366f1");

  function save(updated: typeof cats) {
    setCats(updated);
    localStorage.setItem("themis:crm-cats", JSON.stringify(updated));
  }

  return (
    <div>
      <SectionTitle title="Categorias CRM" subtitle="Classifique as oportunidades do seu funil comercial." />
      <div className="rounded-xl overflow-hidden mb-3" style={{ border: "1px solid var(--border)" }}>
        {cats.length === 0 && (
          <p className="px-3 py-3 text-xs" style={{ color: "var(--fg-muted)" }}>Nenhuma categoria</p>
        )}
        {cats.map((c: { id: string; name: string; color: string }, i: number) => (
          <div
            key={c.id}
            className="flex items-center gap-3 px-4 py-3"
            style={{
              background: i % 2 === 0 ? "var(--bg)" : "var(--bg-card)",
              borderBottom: i < cats.length - 1 ? "1px solid var(--border)" : undefined,
            }}
          >
            <div className="w-3 h-3 rounded-full shrink-0" style={{ background: c.color }} />
            <span className="flex-1 text-sm" style={{ color: "var(--fg)" }}>{c.name}</span>
            <button
              onClick={() => save(cats.filter((_: any, j: number) => j !== i))}
              className="p-1 hover:opacity-80"
              style={{ color: "#ef4444" }}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} className="w-7 h-7 rounded cursor-pointer border-0 p-0 shrink-0" />
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nova categoria CRM..."
          className="flex-1 px-2 py-1.5 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
          style={inputStyle}
          onKeyDown={(e) => {
            if (e.key === "Enter" && newName.trim()) {
              save([...cats, { id: crypto.randomUUID(), name: newName.trim(), color: newColor }]);
              setNewName("");
            }
          }}
        />
        <button
          onClick={() => {
            if (!newName.trim()) return;
            save([...cats, { id: crypto.randomUUID(), name: newName.trim(), color: newColor }]);
            setNewName("");
          }}
          className="p-1.5 rounded-lg hover:opacity-80"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Etapas do CRM ────────────────────────────────────────────

function CrmEtapasSection() {
  const { data: stages = [] } = useCrmStages();
  const createStage = useCreateCrmStage();
  const updateStage = useUpdateCrmStage();
  const deleteStage = useDeleteCrmStage();

  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [editProb, setEditProb] = useState(0);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#6366f1");
  const [newProb, setNewProb] = useState(25);

  function startEdit(s: CrmStage) { setEditId(s.id); setEditName(s.name); setEditColor(s.color); setEditProb(s.probability); }
  function saveEdit() {
    if (!editId) return;
    updateStage.mutate({ id: editId, name: editName, color: editColor, probability: editProb });
    setEditId(null);
  }
  function moveStage(stage: CrmStage, dir: -1 | 1) {
    const newOrder = stage.order + dir;
    const swapWith = stages.find((s) => s.order === newOrder);
    if (!swapWith) return;
    updateStage.mutate({ id: stage.id, order: newOrder });
    updateStage.mutate({ id: swapWith.id, order: stage.order });
  }

  return (
    <div>
      <SectionTitle title="Etapas do CRM" subtitle="Configure o funil comercial do seu escritório." />
      <div className="rounded-xl overflow-hidden mb-4" style={{ border: "1px solid var(--border)" }}>
        {stages.map((stage, i) => (
          <div
            key={stage.id}
            className="flex items-center gap-3 px-4 py-3"
            style={{
              background: i % 2 === 0 ? "var(--bg)" : "var(--bg-card)",
              borderBottom: i < stages.length - 1 ? "1px solid var(--border)" : undefined,
            }}
          >
            {editId === stage.id ? (
              <>
                <input type="color" value={editColor} onChange={(e) => setEditColor(e.target.value)} className="w-7 h-7 rounded cursor-pointer border-0 p-0 shrink-0" />
                <input value={editName} onChange={(e) => setEditName(e.target.value)} className="flex-1 px-2 py-1 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/40" style={inputStyle} autoFocus />
                <input type="number" value={editProb} min={0} max={100} onChange={(e) => setEditProb(parseInt(e.target.value) || 0)} className="w-16 px-2 py-1 rounded text-xs text-center focus:outline-none focus:ring-1 focus:ring-indigo-500/40" style={inputStyle} />
                <span className="text-xs" style={{ color: "var(--fg-muted)" }}>%</span>
                <button onClick={saveEdit} className="p-1 hover:opacity-80" style={{ color: "#10b981" }}><Check className="w-3.5 h-3.5" /></button>
                <button onClick={() => setEditId(null)} className="p-1 hover:opacity-80" style={{ color: "var(--fg-muted)" }}><X className="w-3.5 h-3.5" /></button>
              </>
            ) : (
              <>
                <div className="w-3 h-3 rounded-full shrink-0" style={{ background: stage.color }} />
                <span className="flex-1 text-sm font-medium" style={{ color: "var(--fg)" }}>{stage.name}</span>
                <span className="text-xs tabular-nums" style={{ color: "var(--fg-muted)" }}>{stage.probability}%</span>
                <div className="flex items-center gap-0.5">
                  <button onClick={() => moveStage(stage, -1)} disabled={i === 0} className="p-1 hover:opacity-80 disabled:opacity-30" style={{ color: "var(--fg-muted)" }}><ChevronUp className="w-3.5 h-3.5" /></button>
                  <button onClick={() => moveStage(stage, 1)} disabled={i === stages.length - 1} className="p-1 hover:opacity-80 disabled:opacity-30" style={{ color: "var(--fg-muted)" }}><ChevronDown className="w-3.5 h-3.5" /></button>
                </div>
                <button onClick={() => startEdit(stage)} className="p-1 hover:opacity-80" style={{ color: "var(--fg-muted)" }}><Pencil className="w-3 h-3" /></button>
                {!stage.is_final && (
                  <button onClick={() => { if (!confirm(`Remover a etapa "${stage.name}"?`)) return; deleteStage.mutate(stage.id); }} className="p-1 hover:opacity-80" style={{ color: "#ef4444" }}><Trash2 className="w-3 h-3" /></button>
                )}
              </>
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} className="w-7 h-7 rounded cursor-pointer border-0 p-0 shrink-0" />
        <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nome da etapa..." className="flex-1 px-2 py-1.5 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/40" style={inputStyle} />
        <input type="number" value={newProb} min={0} max={100} onChange={(e) => setNewProb(parseInt(e.target.value) || 0)} className="w-16 px-2 py-1.5 rounded-lg text-xs text-center focus:outline-none" style={inputStyle} />
        <span className="text-xs shrink-0" style={{ color: "var(--fg-muted)" }}>%</span>
        <button
          onClick={() => {
            if (!newName.trim()) return;
            const maxOrder = stages.reduce((m, s) => Math.max(m, s.order), 0);
            createStage.mutate({ name: newName.trim(), color: newColor, probability: newProb, order: maxOrder + 1 });
            setNewName(""); setNewProb(25);
          }}
          className="p-1.5 rounded-lg hover:opacity-80"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Status de Tarefas ────────────────────────────────────────

const DEFAULT_TASK_STATUSES = [
  { id: "not_started", name: "Não Iniciada", color: "#6b7280", locked: true },
  { id: "in_progress", name: "Em Andamento", color: "#6366f1", locked: true },
  { id: "in_review", name: "Em Revisão", color: "#f59e0b", locked: false },
  { id: "done", name: "Finalizada", color: "#10b981", locked: true },
];

function StatusTarefasSection() {
  const [statuses, setStatuses] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("themis:task-statuses") ?? "null") ?? DEFAULT_TASK_STATUSES;
    } catch {
      return DEFAULT_TASK_STATUSES;
    }
  });
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#6366f1");

  function save(updated: typeof statuses) {
    setStatuses(updated);
    localStorage.setItem("themis:task-statuses", JSON.stringify(updated));
  }

  return (
    <div>
      <SectionTitle title="Status de Tarefas" subtitle="Personalize os status disponíveis para suas tarefas." />
      <div className="rounded-xl overflow-hidden mb-3" style={{ border: "1px solid var(--border)" }}>
        {statuses.map((s: any, i: number) => (
          <div
            key={s.id}
            className="flex items-center gap-3 px-4 py-3"
            style={{
              background: i % 2 === 0 ? "var(--bg)" : "var(--bg-card)",
              borderBottom: i < statuses.length - 1 ? "1px solid var(--border)" : undefined,
            }}
          >
            <div className="w-3 h-3 rounded-full shrink-0" style={{ background: s.color }} />
            <span className="flex-1 text-sm" style={{ color: "var(--fg)" }}>{s.name}</span>
            {s.locked ? (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "var(--border)", color: "var(--fg-muted)" }}>Padrão</span>
            ) : (
              <button onClick={() => save(statuses.filter((_: any, j: number) => j !== i))} className="p-1 hover:opacity-80" style={{ color: "#ef4444" }}>
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} className="w-7 h-7 rounded cursor-pointer border-0 p-0 shrink-0" />
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Novo status..."
          className="flex-1 px-2 py-1.5 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
          style={inputStyle}
          onKeyDown={(e) => {
            if (e.key === "Enter" && newName.trim()) {
              save([...statuses, { id: crypto.randomUUID(), name: newName.trim(), color: newColor, locked: false }]);
              setNewName("");
            }
          }}
        />
        <button
          onClick={() => {
            if (!newName.trim()) return;
            save([...statuses, { id: crypto.randomUUID(), name: newName.trim(), color: newColor, locked: false }]);
            setNewName("");
          }}
          className="p-1.5 rounded-lg hover:opacity-80"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Automações ───────────────────────────────────────────────

const TRIGGER_OPTIONS = [
  "Tarefa criada",
  "Tarefa concluída",
  "Tarefa atrasada",
  "Vaga criada",
  "Candidato movido de etapa",
  "Oportunidade CRM avançada",
];

const ACTION_OPTIONS = [
  "Criar tarefa automática",
  "Notificar responsável",
  "Enviar email",
  "Mover candidato",
];

function AutomacoesSection() {
  const [automations, setAutomations] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("themis:automations") ?? "[]");
    } catch {
      return [];
    }
  });
  const [adding, setAdding] = useState(false);
  const [trigger, setTrigger] = useState(TRIGGER_OPTIONS[0]);
  const [action, setAction] = useState(ACTION_OPTIONS[0]);
  const [name, setName] = useState("");

  function saveAll(updated: any[]) {
    setAutomations(updated);
    localStorage.setItem("themis:automations", JSON.stringify(updated));
  }

  function addAutomation() {
    if (!name.trim()) return;
    saveAll([...automations, { id: crypto.randomUUID(), name: name.trim(), trigger, action, active: true }]);
    setAdding(false);
    setName("");
    setTrigger(TRIGGER_OPTIONS[0]);
    setAction(ACTION_OPTIONS[0]);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <SectionTitle title="Automações de Tarefas" subtitle="Crie regras que executam ações automaticamente." />
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium shrink-0"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          <Plus className="w-3.5 h-3.5" /> Nova Automação
        </button>
      </div>

      {adding && (
        <div className="mb-4 rounded-xl p-4 space-y-3" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <p className="text-sm font-semibold" style={{ color: "var(--fg)" }}>Nova automação</p>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: "var(--fg-muted)" }}>Nome</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={INPUT} style={inputStyle} placeholder="Ex: Notificar quando tarefa atrasar" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: "var(--fg-muted)" }}>Gatilho (quando)</label>
              <select value={trigger} onChange={(e) => setTrigger(e.target.value)} className={INPUT} style={inputStyle}>
                {TRIGGER_OPTIONS.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: "var(--fg-muted)" }}>Ação (então)</label>
              <select value={action} onChange={(e) => setAction(e.target.value)} className={INPUT} style={inputStyle}>
                {ACTION_OPTIONS.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={addAutomation} className="px-4 py-1.5 rounded-lg text-sm font-medium" style={{ background: "var(--accent)", color: "#fff" }}>Salvar</button>
            <button onClick={() => setAdding(false)} className="px-4 py-1.5 rounded-lg text-sm font-medium" style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg)" }}>Cancelar</button>
          </div>
        </div>
      )}

      {automations.length === 0 && !adding ? (
        <div className="text-center py-12" style={{ color: "var(--fg-muted)" }}>
          <Zap className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhuma automação criada</p>
          <p className="text-xs mt-1">Crie regras para automatizar tarefas repetitivas</p>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          {automations.map((a: any, i: number) => (
            <div
              key={a.id}
              className="flex items-center gap-3 px-4 py-3"
              style={{
                background: i % 2 === 0 ? "var(--bg)" : "var(--bg-card)",
                borderBottom: i < automations.length - 1 ? "1px solid var(--border)" : undefined,
              }}
            >
              <Zap className="w-4 h-4 shrink-0" style={{ color: "var(--accent)" }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ color: "var(--fg)" }}>{a.name}</p>
                <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
                  {a.trigger} → {a.action}
                </p>
              </div>
              <Toggle checked={a.active} onChange={() => saveAll(automations.map((x: any) => x.id === a.id ? { ...x, active: !x.active } : x))} />
              <button onClick={() => saveAll(automations.filter((_: any, j: number) => j !== i))} className="p-1 hover:opacity-80" style={{ color: "#ef4444" }}>
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Templates de Tarefas ─────────────────────────────────────

function TemplatesSection() {
  const [templates, setTemplates] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("themis:task-templates") ?? "[]");
    } catch {
      return [];
    }
  });
  const [adding, setAdding] = useState(false);
  const [tplName, setTplName] = useState("");
  const [tasks, setTasks] = useState<string[]>([""]);

  function saveAll(updated: any[]) {
    setTemplates(updated);
    localStorage.setItem("themis:task-templates", JSON.stringify(updated));
  }

  function addTemplate() {
    const validTasks = tasks.filter((t) => t.trim());
    if (!tplName.trim() || validTasks.length === 0) return;
    saveAll([...templates, { id: crypto.randomUUID(), name: tplName.trim(), tasks: validTasks }]);
    setAdding(false);
    setTplName("");
    setTasks([""]);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <SectionTitle title="Templates de Tarefas" subtitle="Reutilize listas de tarefas em diferentes vagas." />
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium shrink-0"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          <Plus className="w-3.5 h-3.5" /> Novo Template
        </button>
      </div>

      {adding && (
        <div className="mb-4 rounded-xl p-4 space-y-3" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <p className="text-sm font-semibold" style={{ color: "var(--fg)" }}>Novo template</p>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: "var(--fg-muted)" }}>Nome do template</label>
            <input value={tplName} onChange={(e) => setTplName(e.target.value)} className={INPUT} style={inputStyle} placeholder="Ex: Processo Padrão de Recrutamento" />
          </div>
          <div>
            <label className="text-xs font-medium block mb-2" style={{ color: "var(--fg-muted)" }}>Tarefas</label>
            <div className="space-y-2">
              {tasks.map((t, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={t}
                    onChange={(e) => { const next = [...tasks]; next[i] = e.target.value; setTasks(next); }}
                    className={INPUT}
                    style={inputStyle}
                    placeholder={`Tarefa ${i + 1}`}
                  />
                  {tasks.length > 1 && (
                    <button onClick={() => setTasks(tasks.filter((_, j) => j !== i))} className="p-1 shrink-0" style={{ color: "#ef4444" }}>
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={() => setTasks([...tasks, ""])}
              className="mt-2 text-xs flex items-center gap-1"
              style={{ color: "var(--accent)" }}
            >
              <Plus className="w-3 h-3" /> Adicionar tarefa
            </button>
          </div>
          <div className="flex gap-2">
            <button onClick={addTemplate} className="px-4 py-1.5 rounded-lg text-sm font-medium" style={{ background: "var(--accent)", color: "#fff" }}>Salvar</button>
            <button onClick={() => setAdding(false)} className="px-4 py-1.5 rounded-lg text-sm font-medium" style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg)" }}>Cancelar</button>
          </div>
        </div>
      )}

      {templates.length === 0 && !adding ? (
        <div className="text-center py-12" style={{ color: "var(--fg-muted)" }}>
          <ClipboardList className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhum template criado</p>
          <p className="text-xs mt-1">Crie templates para agilizar a criação de tarefas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map((tpl: any) => (
            <div key={tpl.id} className="rounded-xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold" style={{ color: "var(--fg)" }}>{tpl.name}</p>
                <div className="flex gap-1">
                  <span className="text-xs" style={{ color: "var(--fg-muted)" }}>{tpl.tasks.length} tarefa{tpl.tasks.length !== 1 ? "s" : ""}</span>
                  <button onClick={() => saveAll(templates.filter((t: any) => t.id !== tpl.id))} className="p-1 ml-2 hover:opacity-80" style={{ color: "#ef4444" }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <ul className="space-y-1">
                {tpl.tasks.slice(0, 3).map((t: string, i: number) => (
                  <li key={i} className="flex items-center gap-2 text-xs" style={{ color: "var(--fg-muted)" }}>
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "var(--border)" }} />
                    {t}
                  </li>
                ))}
                {tpl.tasks.length > 3 && (
                  <li className="text-xs" style={{ color: "var(--fg-muted)" }}>+{tpl.tasks.length - 3} mais</li>
                )}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Integrações ──────────────────────────────────────────────

function IntegracoesSection() {
  const [connected, setConnected] = useState(false);
  const [syncSettings, setSyncSettings] = useState({
    sync_events: true,
    create_events: false,
    sync_tasks: true,
    receive_invites: true,
  });

  function toggle(key: keyof typeof syncSettings) {
    setSyncSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div>
      <SectionTitle title="Integrações" subtitle="Conecte ferramentas externas ao Themis." />
      <div className="space-y-4">
        <div className="rounded-xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ background: "color-mix(in srgb, #ea4335 12%, transparent)", border: "1px solid var(--border)" }}>
                📅
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--fg)" }}>Google Calendar</p>
                <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
                  {connected ? "Conectado" : "Não conectado"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setConnected(!connected)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium"
              style={
                connected
                  ? { background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg)" }
                  : { background: "var(--accent)", color: "#fff" }
              }
            >
              {connected ? "Desconectar" : "Conectar"}
            </button>
          </div>

          {connected && (
            <div className="space-y-2 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
              {[
                { key: "sync_events" as const, label: "Sincronizar eventos", desc: "Importar eventos do Google Calendar para a Agenda" },
                { key: "create_events" as const, label: "Criar eventos automaticamente", desc: "Criar eventos no Google Calendar ao agendar reuniões" },
                { key: "sync_tasks" as const, label: "Sincronizar tarefas", desc: "Exibir tarefas com prazo no Google Calendar" },
                { key: "receive_invites" as const, label: "Receber convites", desc: "Aceitar convites de reunião pelo Google Calendar" },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--fg)" }}>{item.label}</p>
                    <p className="text-xs" style={{ color: "var(--fg-muted)" }}>{item.desc}</p>
                  </div>
                  <Toggle checked={syncSettings[item.key]} onChange={() => toggle(item.key)} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
