import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Building2,
  Plus,
  Pencil,
  Trash2,
  Search,
  Mail,
  Phone,
  Download,
  X,
  Star,
  Briefcase,
} from "lucide-react";
import { format } from "date-fns";
import { Header } from "@/components/layout/Header";
import { PageKpis, KpiItem } from "@/components/layout/PageKpis";
import { EmptyState } from "@/components/ui/EmptyState";
import { ClienteForm } from "@/components/clientes/ClienteForm";
import { useClients, useDeleteClient, type Client } from "@/hooks/useClients";
import { useClientRatings, useUpsertRating } from "@/hooks/useRanking";
import { useJobs, type JobWithJoins } from "@/hooks/useJobs";
import { fmtBRL } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/clientes")({
  component: ClientesPage,
});

function exportClientesCSV(rows: Client[]) {
  const header = ["Nome", "Tipo", "CNPJ", "Email", "Telefone", "Cidade", "Estado", "Ativo"];
  const lines = rows.map((c) =>
    [
      c.name,
      c.person_type === "pj" ? "Pessoa Jurídica" : "Pessoa Física",
      c.cnpj ?? "",
      c.email ?? "",
      c.phone ?? "",
      c.city ?? "",
      c.state ?? "",
      c.is_active ? "Sim" : "Não",
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",")
  );
  const csv = [header.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "clientes.csv";
  a.click();
  URL.revokeObjectURL(url);
}

const JOB_STATUS_LABELS: Record<string, string> = {
  open: "Aberta",
  screening: "Triagem",
  interviewing: "Entrevistas",
  proposal: "Proposta",
  closed: "Fechada",
  cancelled: "Cancelada",
  paused: "Pausada",
};

const JOB_STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  open: { bg: "#6366f122", color: "#6366f1" },
  screening: { bg: "#f59e0b22", color: "#f59e0b" },
  interviewing: { bg: "#3b82f622", color: "#3b82f6" },
  proposal: { bg: "#8b5cf622", color: "#8b5cf6" },
  closed: { bg: "#10b98122", color: "#10b981" },
  cancelled: { bg: "#ef444422", color: "#ef4444" },
  paused: { bg: "#6b728022", color: "#6b7280" },
};

function ClientDrawer({
  client,
  onClose,
  onEdit,
  jobs,
}: {
  client: Client | null;
  onClose: () => void;
  onEdit: (c: Client) => void;
  jobs: JobWithJoins[];
}) {
  const { data: ratings = [] } = useClientRatings();
  const upsertRating = useUpsertRating();

  const existing = client ? ratings.find((r) => r.client_id === client.id) : undefined;

  const [pt, setPt] = useState(5);
  const [bc, setBc] = useState(5);
  const [fa, setFa] = useState(5);
  const [vp, setVp] = useState(5);
  const [rp, setRp] = useState(5);

  useEffect(() => {
    if (existing) {
      setPt(existing.payment_timeliness);
      setBc(existing.briefing_clarity);
      setFa(existing.feedback_agility);
      setVp(existing.volume_potential);
      setRp(existing.referral_potential);
    } else {
      setPt(5); setBc(5); setFa(5); setVp(5); setRp(5);
    }
  }, [existing, client?.id]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const overallScore = ((pt + bc + fa + vp + rp) / 5).toFixed(1);

  function handleSaveRating() {
    if (!client) return;
    const overall_score = (pt + bc + fa + vp + rp) / 5;
    upsertRating.mutate({
      client_id: client.id,
      payment_timeliness: pt,
      briefing_clarity: bc,
      feedback_agility: fa,
      volume_potential: vp,
      referral_potential: rp,
      overall_score,
      existing_id: existing?.id,
    });
  }

  const clientJobs = client ? jobs.filter((j) => j.client_id === client.id) : [];
  const visibleJobs = clientJobs.slice(0, 5);
  const hasMore = clientJobs.length > 5;

  const open = !!client;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 transition-opacity duration-300"
        style={{
          background: "rgba(0,0,0,0.4)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
        }}
      />

      {/* Drawer panel */}
      <div
        className="fixed top-0 right-0 h-full z-50 flex flex-col overflow-hidden transition-transform duration-300"
        style={{
          width: "480px",
          background: "var(--bg-card)",
          borderLeft: "1px solid var(--border)",
          transform: open ? "translateX(0)" : "translateX(100%)",
        }}
      >
        {client && (
          <>
            {/* Header */}
            <div
              className="flex items-start justify-between p-5 shrink-0"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold shrink-0"
                  style={{ background: "var(--accent)22", color: "var(--accent)" }}
                >
                  {client.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-base font-semibold" style={{ color: "var(--fg)" }}>
                    {client.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium"
                      style={
                        client.is_active
                          ? { background: "#10b98122", color: "#10b981" }
                          : { background: "#6b728022", color: "#6b7280" }
                      }
                    >
                      {client.is_active ? "Ativo" : "Inativo"}
                    </span>
                    <span className="text-xs" style={{ color: "var(--fg-muted)" }}>
                      {client.person_type === "pj" ? "Pessoa Jurídica" : "Pessoa Física"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { onEdit(client); onClose(); }}
                  className="p-1.5 rounded-lg hover:opacity-80"
                  style={{ color: "var(--fg-muted)" }}
                  title="Editar"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:opacity-80"
                  style={{ color: "var(--fg-muted)" }}
                  title="Fechar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Informações */}
              <section>
                <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--fg-muted)" }}>
                  Informações
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: <Mail className="w-3.5 h-3.5" />, label: "Email", value: client.email },
                    { icon: <Phone className="w-3.5 h-3.5" />, label: "Telefone", value: client.phone },
                    { icon: null, label: "CNPJ", value: client.cnpj },
                    {
                      icon: null,
                      label: "Localização",
                      value: client.city && client.state
                        ? `${client.city} / ${client.state}`
                        : client.city || client.state || null,
                    },
                    {
                      icon: null,
                      label: "Cliente desde",
                      value: format(new Date(client.created_at), "MM/yyyy"),
                    },
                  ].map(({ icon, label, value }) => (
                    <div key={label} className="rounded-lg p-3" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                      <p className="text-[10px] uppercase tracking-wide mb-1" style={{ color: "var(--fg-muted)" }}>
                        {label}
                      </p>
                      <div className="flex items-center gap-1.5 text-sm" style={{ color: value ? "var(--fg)" : "var(--fg-muted)" }}>
                        {icon}
                        <span>{value ?? "—"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Avaliação */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--fg-muted)" }}>
                    Avaliação
                  </p>
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5" style={{ color: "#f59e0b" }} />
                    <span className="text-sm font-bold" style={{ color: "var(--fg)" }}>
                      {overallScore} / 10
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { label: "Pontualidade de Pagamento", value: pt, set: setPt },
                    { label: "Clareza do Briefing", value: bc, set: setBc },
                    { label: "Agilidade de Feedback", value: fa, set: setFa },
                    { label: "Potencial de Volume", value: vp, set: setVp },
                    { label: "Potencial de Indicação", value: rp, set: setRp },
                  ].map(({ label, value, set }) => (
                    <div key={label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs" style={{ color: "var(--fg-muted)" }}>{label}</span>
                        <span className="text-xs font-semibold" style={{ color: "var(--accent)" }}>{value}</span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={10}
                        step={1}
                        value={value}
                        onChange={(e) => set(Number(e.target.value))}
                        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                        style={{ accentColor: "var(--accent)" }}
                      />
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleSaveRating}
                  disabled={upsertRating.isPending}
                  className="mt-4 w-full py-2 rounded-lg text-sm font-medium transition-opacity disabled:opacity-60"
                  style={{ background: "var(--accent)", color: "#fff" }}
                >
                  {upsertRating.isPending ? "Salvando…" : "Salvar Avaliação"}
                </button>
              </section>

              {/* Vagas vinculadas */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--fg-muted)" }}>
                    Vagas Vinculadas
                  </p>
                  <span className="text-xs" style={{ color: "var(--fg-muted)" }}>
                    {clientJobs.length} {clientJobs.length === 1 ? "vaga" : "vagas"}
                  </span>
                </div>
                {clientJobs.length === 0 ? (
                  <div
                    className="rounded-lg p-4 flex flex-col items-center text-center gap-2"
                    style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
                  >
                    <Briefcase className="w-6 h-6" style={{ color: "var(--fg-muted)" }} />
                    <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
                      Nenhuma vaga vinculada a este cliente
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {visibleJobs.map((job) => {
                      const statusStyle = JOB_STATUS_COLORS[job.status] ?? { bg: "#6b728022", color: "#6b7280" };
                      return (
                        <div
                          key={job.id}
                          className="flex items-center justify-between rounded-lg px-3 py-2.5"
                          style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
                        >
                          <p className="text-sm truncate mr-3" style={{ color: "var(--fg)" }}>
                            {job.title}
                          </p>
                          <div className="flex items-center gap-2 shrink-0">
                            {job.fee_value ? (
                              <span className="text-xs" style={{ color: "var(--fg-muted)" }}>
                                {fmtBRL(job.fee_value, false)}
                              </span>
                            ) : null}
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium"
                              style={statusStyle}
                            >
                              {JOB_STATUS_LABELS[job.status] ?? job.status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    {hasMore && (
                      <a
                        href="/vagas"
                        className="block text-center text-xs py-1.5 rounded-lg transition-colors hover:underline"
                        style={{ color: "var(--accent)" }}
                      >
                        Ver todas as {clientJobs.length} vagas →
                      </a>
                    )}
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </div>
    </>
  );
}

function ClientesPage() {
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const { data: clients = [], isLoading } = useClients({ includeInactive: true });
  const { data: jobs = [] } = useJobs();
  const deleteClient = useDeleteClient();

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.cnpj ?? "").includes(search) ||
      (c.email ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const active = clients.filter((c) => c.is_active && !c.deleted_at);
  const thisMonth = clients.filter((c) => {
    const d = new Date(c.created_at);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });

  function openEdit(client: Client) {
    setEditClient(client);
    setFormOpen(true);
  }

  function openCreate() {
    setEditClient(null);
    setFormOpen(true);
  }

  function handleClose() {
    setFormOpen(false);
    setEditClient(null);
  }

  function handleDelete(client: Client) {
    if (!confirm(`Remover o cliente "${client.name}"?`)) return;
    deleteClient.mutate(client.id);
  }

  return (
    <div className="flex flex-col min-h-full">
      <Header
        title="Clientes"
        subtitle="Empresas contratantes"
        actions={
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            <Plus className="w-4 h-4" /> Novo Cliente
          </button>
        }
      />

      <PageKpis>
        <KpiItem label="Total" value={clients.length.toString()} />
        <KpiItem label="Ativos" value={active.length.toString()} accent />
        <KpiItem label="Novos este Mês" value={thisMonth.length.toString()} />
      </PageKpis>

      <div className="px-6 pb-4 flex items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: "var(--fg-muted)" }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, CNPJ, email..."
            className="w-full pl-9 pr-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              color: "var(--fg)",
            }}
          />
        </div>
        {filtered.length > 0 && (
          <button
            onClick={() => exportClientesCSV(filtered)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium shrink-0"
            style={{ border: "1px solid var(--border)", color: "var(--fg-muted)", background: "var(--bg-card)" }}
            title="Exportar CSV"
          >
            <Download className="w-3.5 h-3.5" /> Exportar
          </button>
        )}
      </div>

      <div className="flex-1 px-6 pb-6">
        {isLoading ? (
          <TableSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Building2}
            title={search ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
            description={
              search
                ? "Tente buscar por outro nome ou CNPJ."
                : "Cadastre as empresas contratantes para vinculá-las a vagas e oportunidades."
            }
            action={
              !search && (
                <button
                  onClick={openCreate}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium"
                  style={{ background: "var(--accent)", color: "#fff" }}
                >
                  <Plus className="w-4 h-4" /> Novo Cliente
                </button>
              )
            }
          />
        ) : (
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: "1px solid var(--border)" }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr
                  style={{
                    background: "var(--bg-card)",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <Th>Cliente</Th>
                  <Th>CNPJ</Th>
                  <Th>Contato</Th>
                  <Th>Localização</Th>
                  <Th>Status</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((client, i) => (
                  <tr
                    key={client.id}
                    onClick={() => setSelectedClient(client)}
                    className="cursor-pointer hover:opacity-90 transition-opacity"
                    style={{
                      background: i % 2 === 0 ? "var(--bg)" : "var(--bg-card)",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                          style={{
                            background: "var(--accent)22",
                            color: "var(--accent)",
                          }}
                        >
                          {client.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium" style={{ color: "var(--fg)" }}>
                            {client.name}
                          </p>
                          <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
                            {client.person_type === "pj" ? "Pessoa Jurídica" : "Pessoa Física"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3" style={{ color: "var(--fg-muted)" }}>
                      {client.cnpj ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        {client.email && (
                          <div
                            className="flex items-center gap-1 text-xs"
                            style={{ color: "var(--fg-muted)" }}
                          >
                            <Mail className="w-3 h-3" /> {client.email}
                          </div>
                        )}
                        {client.phone && (
                          <div
                            className="flex items-center gap-1 text-xs"
                            style={{ color: "var(--fg-muted)" }}
                          >
                            <Phone className="w-3 h-3" /> {client.phone}
                          </div>
                        )}
                        {!client.email && !client.phone && (
                          <span style={{ color: "var(--fg-muted)" }}>—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3" style={{ color: "var(--fg-muted)" }}>
                      {client.city && client.state
                        ? `${client.city} / ${client.state}`
                        : client.city || client.state || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                        style={
                          client.is_active
                            ? { background: "#10b98122", color: "#10b981" }
                            : { background: "#6b728022", color: "#6b7280" }
                        }
                      >
                        {client.is_active ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div
                        className="flex items-center gap-1 justify-end"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => openEdit(client)}
                          className="p-1.5 rounded-lg hover:opacity-80"
                          style={{ color: "var(--fg-muted)" }}
                          title="Editar"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(client)}
                          className="p-1.5 rounded-lg hover:opacity-80"
                          style={{ color: "#ef4444" }}
                          title="Remover"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ClientDrawer
        client={selectedClient}
        onClose={() => setSelectedClient(null)}
        onEdit={openEdit}
        jobs={jobs}
      />

      <ClienteForm
        key={editClient?.id ?? "new"}
        open={formOpen}
        onClose={handleClose}
        defaultValues={editClient ?? undefined}
      />
    </div>
  );
}

function Th({ children }: { children?: React.ReactNode }) {
  return (
    <th
      className="px-4 py-3 text-left text-xs font-medium"
      style={{ color: "var(--fg-muted)" }}
    >
      {children}
    </th>
  );
}

function TableSkeleton() {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: "1px solid var(--border)" }}
    >
      <div
        className="h-10"
        style={{
          background: "var(--bg-card)",
          borderBottom: "1px solid var(--border)",
        }}
      />
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex gap-4 px-4 py-3 animate-pulse"
          style={{
            background: i % 2 === 0 ? "var(--bg)" : "var(--bg-card)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          {[3, 2, 2, 1, 1].map((w, j) => (
            <div
              key={j}
              className={`h-4 rounded flex-${w}`}
              style={{ background: "var(--border)" }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
