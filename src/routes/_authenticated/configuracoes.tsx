import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  User,
  Building2,
  Users,
  Sliders,
  TrendingUp,
  Pencil,
  Trash2,
  Check,
  X,
  ChevronUp,
  ChevronDown,
  Plus,
  Cpu,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/lib/auth";
import {
  useCompany,
  useUpdateCompany,
  useUpdateProfile,
  useTeamMembers,
  useUpdateMemberRole,
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
  | "empresa"
  | "equipe"
  | "categorias"
  | "crm-etapas"
  | "coming-soon";

const NAV: {
  group: string;
  items: { id: Section; label: string; icon: React.ElementType; disabled?: boolean }[];
}[] = [
  {
    group: "Conta",
    items: [
      { id: "perfil", label: "Perfil", icon: User },
    ],
  },
  {
    group: "Empresa",
    items: [
      { id: "empresa", label: "Dados da Empresa", icon: Building2 },
      { id: "equipe", label: "Equipe", icon: Users },
      { id: "coming-soon", label: "Assinatura", icon: ShieldCheck, disabled: true },
    ],
  },
  {
    group: "Operação",
    items: [
      { id: "categorias", label: "Categorias Financeiras", icon: Sliders },
      { id: "crm-etapas", label: "Etapas do CRM", icon: TrendingUp },
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
          className="w-56 shrink-0 p-4 space-y-6 overflow-y-auto"
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
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors"
                    style={
                      isActive
                        ? { background: "var(--accent)22", color: "var(--accent)", fontWeight: 600 }
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
          {activeSection === "empresa" && <EmpresaSection />}
          {activeSection === "equipe" && <EquipeSection />}
          {activeSection === "categorias" && <CategoriasSection />}
          {activeSection === "crm-etapas" && <CrmEtapasSection />}
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

function SaveButton({
  onClick,
  loading,
}: {
  onClick: () => void;
  loading?: boolean;
}) {
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

// ─── Perfil ───────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  recruiter: "Recrutador(a)",
  financial: "Financeiro",
  viewer: "Visualizador(a)",
};

function PerfilSection() {
  const { profile, user } = useAuth();
  const [name, setName] = useState(profile?.name ?? "");
  const updateProfile = useUpdateProfile();

  return (
    <div>
      <SectionTitle
        title="Meu Perfil"
        subtitle="Suas informações pessoais dentro da plataforma."
      />
      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium block mb-1" style={{ color: "var(--fg-muted)" }}>
            Nome
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={INPUT}
            style={inputStyle}
          />
        </div>
        <div>
          <label className="text-xs font-medium block mb-1" style={{ color: "var(--fg-muted)" }}>
            Email
          </label>
          <input
            value={user?.email ?? ""}
            disabled
            className={INPUT}
            style={{ ...inputStyle, opacity: 0.6, cursor: "not-allowed" }}
          />
        </div>
        <div>
          <label className="text-xs font-medium block mb-1" style={{ color: "var(--fg-muted)" }}>
            Função
          </label>
          <div
            className="px-3 py-2 rounded-lg text-sm"
            style={{ ...inputStyle, opacity: 0.6 }}
          >
            {ROLE_LABELS[profile?.role ?? ""] ?? profile?.role ?? "—"}
          </div>
        </div>
        <div className="pt-2">
          <SaveButton
            loading={updateProfile.isPending}
            onClick={() => updateProfile.mutate({ name })}
          />
        </div>
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
      <SectionTitle
        title="Dados da Empresa"
        subtitle="Informações do seu escritório de R&S."
      />
      <div className="space-y-4">
        {[
          { key: "name", label: "Razão Social *" },
          { key: "cnpj", label: "CNPJ" },
          { key: "email", label: "Email" },
          { key: "phone", label: "Telefone" },
          { key: "website", label: "Site" },
        ].map(({ key, label }) => (
          <div key={key}>
            <label className="text-xs font-medium block mb-1" style={{ color: "var(--fg-muted)" }}>
              {label}
            </label>
            <input
              value={val(key)}
              onChange={(e) => set(key, e.target.value)}
              className={INPUT}
              style={inputStyle}
            />
          </div>
        ))}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: "var(--fg-muted)" }}>
              Cidade
            </label>
            <input value={val("city")} onChange={(e) => set("city", e.target.value)} className={INPUT} style={inputStyle} />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: "var(--fg-muted)" }}>
              Estado
            </label>
            <input value={val("state")} onChange={(e) => set("state", e.target.value)} className={INPUT} style={inputStyle} maxLength={2} />
          </div>
        </div>
        <div className="pt-2">
          <SaveButton
            loading={update.isPending}
            onClick={() => update.mutate(form as Record<string, string>)}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Equipe ───────────────────────────────────────────────────

const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
  admin: { bg: "#6366f122", color: "#6366f1" },
  recruiter: { bg: "#3b82f622", color: "#3b82f6" },
  financial: { bg: "#10b98122", color: "#10b981" },
  viewer: { bg: "#6b728022", color: "#6b7280" },
};

function EquipeSection() {
  const { profile } = useAuth();
  const { data: members = [], isLoading } = useTeamMembers();
  const updateRole = useUpdateMemberRole();
  const isAdmin = profile?.role === "admin";

  if (isLoading)
    return <p className="text-sm" style={{ color: "var(--fg-muted)" }}>Carregando...</p>;

  return (
    <div>
      <SectionTitle
        title="Equipe"
        subtitle="Membros com acesso ao Themis na sua empresa."
      />
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: "1px solid var(--border)" }}
      >
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
                style={{ background: "var(--accent)22", color: "var(--accent)" }}
              >
                {m.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium" style={{ color: "var(--fg)" }}>
                    {m.name}
                  </span>
                  {isSelf && (
                    <span className="text-xs" style={{ color: "var(--fg-muted)" }}>
                      (você)
                    </span>
                  )}
                  {!m.is_active && (
                    <span
                      className="text-xs px-1.5 py-0.5 rounded-full"
                      style={{ background: "#6b728022", color: "#6b7280" }}
                    >
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
                  onChange={(e) =>
                    updateRole.mutate({ id: m.id, role: e.target.value as TeamMember["role"] })
                  }
                  className="px-2 py-1 rounded-lg text-xs focus:outline-none"
                  style={{ background: rc.bg, color: rc.color, border: "none" }}
                >
                  <option value="admin">Administrador</option>
                  <option value="recruiter">Recrutador(a)</option>
                  <option value="financial">Financeiro</option>
                  <option value="viewer">Visualizador(a)</option>
                </select>
              ) : (
                <span
                  className="text-xs px-2 py-1 rounded-lg font-medium"
                  style={{ background: rc.bg, color: rc.color }}
                >
                  {ROLE_LABELS[m.role] ?? m.role}
                </span>
              )}
            </div>
          );
        })}
      </div>
      {!isAdmin && (
        <p className="text-xs mt-3" style={{ color: "var(--fg-muted)" }}>
          Apenas administradores podem alterar funções.
        </p>
      )}
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
      <SectionTitle
        title="Categorias Financeiras"
        subtitle="Classifique suas receitas e despesas."
      />
      <div className="grid grid-cols-2 gap-6">
        <CategoryColumn
          title="Receitas"
          type="income"
          color="#10b981"
          items={income}
          onCreate={(name, color) =>
            createCat.mutate({ name, type: "income", color })
          }
          onUpdate={(id, name, color) => updateCat.mutate({ id, name, color })}
          onDelete={(id) => deleteCat.mutate(id)}
        />
        <CategoryColumn
          title="Despesas"
          type="expense"
          color="#ef4444"
          items={expense}
          onCreate={(name, color) =>
            createCat.mutate({ name, type: "expense", color })
          }
          onUpdate={(id, name, color) => updateCat.mutate({ id, name, color })}
          onDelete={(id) => deleteCat.mutate(id)}
        />
      </div>
    </div>
  );
}

function CategoryColumn({
  title,
  color,
  items,
  onCreate,
  onUpdate,
  onDelete,
}: {
  title: string;
  type: "income" | "expense";
  color: string;
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

  function startEdit(c: Category) {
    setEditId(c.id);
    setEditName(c.name);
    setEditColor(c.color);
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-4 rounded-full" style={{ background: color }} />
        <h3 className="text-sm font-semibold" style={{ color: "var(--fg)" }}>
          {title}
        </h3>
        <span
          className="text-xs px-1.5 py-0.5 rounded-full"
          style={{ background: "var(--border)", color: "var(--fg-muted)" }}
        >
          {items.length}
        </span>
      </div>
      <div
        className="rounded-xl overflow-hidden mb-3"
        style={{ border: "1px solid var(--border)" }}
      >
        {items.length === 0 && (
          <p
            className="px-3 py-3 text-xs"
            style={{ color: "var(--fg-muted)" }}
          >
            Nenhuma categoria
          </p>
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
                <input
                  type="color"
                  value={editColor}
                  onChange={(e) => setEditColor(e.target.value)}
                  className="w-7 h-7 rounded cursor-pointer border-0 p-0"
                />
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex-1 px-2 py-1 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
                  style={inputStyle}
                  autoFocus
                />
                <button
                  onClick={() => {
                    onUpdate(c.id, editName, editColor);
                    setEditId(null);
                  }}
                  className="p-1 hover:opacity-80"
                  style={{ color: "#10b981" }}
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setEditId(null)}
                  className="p-1 hover:opacity-80"
                  style={{ color: "var(--fg-muted)" }}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <>
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ background: c.color }}
                />
                <span
                  className="flex-1 text-sm"
                  style={{ color: "var(--fg)" }}
                >
                  {c.name}
                </span>
                <button
                  onClick={() => startEdit(c)}
                  className="p-1 hover:opacity-80"
                  style={{ color: "var(--fg-muted)" }}
                >
                  <Pencil className="w-3 h-3" />
                </button>
                <button
                  onClick={() => {
                    if (!confirm(`Remover "${c.name}"?`)) return;
                    onDelete(c.id);
                  }}
                  className="p-1 hover:opacity-80"
                  style={{ color: "#ef4444" }}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </>
            )}
          </div>
        ))}
      </div>
      {/* Add form */}
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={newColor}
          onChange={(e) => setNewColor(e.target.value)}
          className="w-7 h-7 rounded cursor-pointer border-0 p-0 shrink-0"
        />
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nova categoria..."
          className="flex-1 px-2 py-1.5 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
          style={inputStyle}
          onKeyDown={(e) => {
            if (e.key === "Enter" && newName.trim()) {
              onCreate(newName.trim(), newColor);
              setNewName("");
            }
          }}
        />
        <button
          onClick={() => {
            if (!newName.trim()) return;
            onCreate(newName.trim(), newColor);
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

  function startEdit(s: CrmStage) {
    setEditId(s.id);
    setEditName(s.name);
    setEditColor(s.color);
    setEditProb(s.probability);
  }

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
      <SectionTitle
        title="Etapas do CRM"
        subtitle="Configure o funil comercial do seu escritório."
      />
      <div
        className="rounded-xl overflow-hidden mb-4"
        style={{ border: "1px solid var(--border)" }}
      >
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
                <input
                  type="color"
                  value={editColor}
                  onChange={(e) => setEditColor(e.target.value)}
                  className="w-7 h-7 rounded cursor-pointer border-0 p-0 shrink-0"
                />
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex-1 px-2 py-1 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
                  style={inputStyle}
                  autoFocus
                />
                <input
                  type="number"
                  value={editProb}
                  min={0}
                  max={100}
                  onChange={(e) => setEditProb(parseInt(e.target.value) || 0)}
                  className="w-16 px-2 py-1 rounded text-xs text-center focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
                  style={inputStyle}
                />
                <span className="text-xs" style={{ color: "var(--fg-muted)" }}>%</span>
                <button onClick={saveEdit} className="p-1 hover:opacity-80" style={{ color: "#10b981" }}>
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setEditId(null)} className="p-1 hover:opacity-80" style={{ color: "var(--fg-muted)" }}>
                  <X className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <>
                <div className="w-3 h-3 rounded-full shrink-0" style={{ background: stage.color }} />
                <span className="flex-1 text-sm font-medium" style={{ color: "var(--fg)" }}>
                  {stage.name}
                </span>
                <span className="text-xs tabular-nums" style={{ color: "var(--fg-muted)" }}>
                  {stage.probability}%
                </span>
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => moveStage(stage, -1)}
                    disabled={i === 0}
                    className="p-1 hover:opacity-80 disabled:opacity-30"
                    style={{ color: "var(--fg-muted)" }}
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => moveStage(stage, 1)}
                    disabled={i === stages.length - 1}
                    className="p-1 hover:opacity-80 disabled:opacity-30"
                    style={{ color: "var(--fg-muted)" }}
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
                <button onClick={() => startEdit(stage)} className="p-1 hover:opacity-80" style={{ color: "var(--fg-muted)" }}>
                  <Pencil className="w-3 h-3" />
                </button>
                {!stage.is_final && (
                  <button
                    onClick={() => {
                      if (!confirm(`Remover a etapa "${stage.name}"?`)) return;
                      deleteStage.mutate(stage.id);
                    }}
                    className="p-1 hover:opacity-80"
                    style={{ color: "#ef4444" }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {/* Add new stage */}
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={newColor}
          onChange={(e) => setNewColor(e.target.value)}
          className="w-7 h-7 rounded cursor-pointer border-0 p-0 shrink-0"
        />
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nome da etapa..."
          className="flex-1 px-2 py-1.5 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
          style={inputStyle}
        />
        <input
          type="number"
          value={newProb}
          min={0}
          max={100}
          onChange={(e) => setNewProb(parseInt(e.target.value) || 0)}
          className="w-16 px-2 py-1.5 rounded-lg text-xs text-center focus:outline-none"
          style={inputStyle}
        />
        <span className="text-xs shrink-0" style={{ color: "var(--fg-muted)" }}>%</span>
        <button
          onClick={() => {
            if (!newName.trim()) return;
            const maxOrder = stages.reduce((m, s) => Math.max(m, s.order), 0);
            createStage.mutate({
              name: newName.trim(),
              color: newColor,
              probability: newProb,
              order: maxOrder + 1,
            });
            setNewName("");
            setNewProb(25);
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
