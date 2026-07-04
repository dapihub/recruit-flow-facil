import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Search,
  Mail,
  Phone,
  Linkedin,
  Download,
  X,
  Building2,
  ExternalLink,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { PageKpis, KpiItem } from "@/components/layout/PageKpis";
import { EmptyState } from "@/components/ui/EmptyState";
import { ContatoForm } from "@/components/contatos/ContatoForm";
import { useContatos, useDeleteContato, type Contato } from "@/hooks/useContatos";
import { useClients } from "@/hooks/useClients";

export const Route = createFileRoute("/_authenticated/contatos")({
  component: ContatosPage,
});

function exportContatosCSV(rows: Contato[]) {
  const header = ["Nome", "Empresa", "Cargo", "Email", "Telefone", "LinkedIn"];
  const lines = rows.map((c) =>
    [
      c.name,
      c.client?.name ?? "",
      c.role ?? "",
      c.email ?? "",
      c.phone ?? "",
      c.linkedin ?? "",
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",")
  );
  const csv = [header.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "contatos.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function ContatoDrawer({
  contato,
  onClose,
  onEdit,
}: {
  contato: Contato | null;
  onClose: () => void;
  onEdit: (c: Contato) => void;
}) {
  useEffect(() => {
    const handle = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [onClose]);

  const open = !!contato;

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 transition-opacity duration-300"
        style={{ background: "rgba(0,0,0,0.4)", opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none" }}
      />
      <div
        className="fixed top-0 right-0 h-full z-50 flex flex-col overflow-hidden transition-transform duration-300"
        style={{
          width: "min(480px, 100vw)",
          background: "var(--bg-card)",
          borderLeft: "1px solid var(--border)",
          transform: open ? "translateX(0)" : "translateX(100%)",
        }}
      >
        {contato && (
          <>
            {/* Header */}
            <div className="flex items-start justify-between p-5 shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold shrink-0" style={{ background: "color-mix(in srgb, var(--accent) 12%, transparent)", color: "var(--accent)" }}>
                  {contato.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-base font-semibold" style={{ color: "var(--fg)" }}>{contato.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>{contato.role ?? "Sem cargo definido"}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => { onEdit(contato); onClose(); }} className="p-1.5 rounded-lg hover:opacity-80" style={{ color: "var(--fg-muted)" }} title="Editar">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={onClose} className="p-1.5 rounded-lg hover:opacity-80" style={{ color: "var(--fg-muted)" }} title="Fechar">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Empresa */}
              {contato.client && (
                <div className="flex items-center gap-2 rounded-lg p-3" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                  <Building2 className="w-4 h-4 shrink-0" style={{ color: "var(--accent)" }} />
                  <span className="text-sm font-medium" style={{ color: "var(--fg)" }}>{contato.client.name}</span>
                </div>
              )}

              {/* Contato */}
              <section>
                <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--fg-muted)" }}>Informações de Contato</p>
                <div className="space-y-2">
                  {contato.email && (
                    <a href={`mailto:${contato.email}`} className="flex items-center gap-3 rounded-lg p-3 hover:opacity-80" style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg)", textDecoration: "none" }}>
                      <Mail className="w-4 h-4 shrink-0" style={{ color: "var(--accent)" }} />
                      <span className="text-sm">{contato.email}</span>
                    </a>
                  )}
                  {contato.phone && (
                    <a href={`tel:${contato.phone}`} className="flex items-center gap-3 rounded-lg p-3 hover:opacity-80" style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg)", textDecoration: "none" }}>
                      <Phone className="w-4 h-4 shrink-0" style={{ color: "var(--accent)" }} />
                      <span className="text-sm">{contato.phone}</span>
                    </a>
                  )}
                  {contato.linkedin && (
                    <a href={contato.linkedin.startsWith("http") ? contato.linkedin : `https://${contato.linkedin}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-lg p-3 hover:opacity-80" style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg)", textDecoration: "none" }}>
                      <Linkedin className="w-4 h-4 shrink-0" style={{ color: "#0077b5" }} />
                      <span className="text-sm flex-1 truncate">{contato.linkedin}</span>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--fg-muted)" }} />
                    </a>
                  )}
                  {!contato.email && !contato.phone && !contato.linkedin && (
                    <p className="text-sm px-3 py-4 text-center" style={{ color: "var(--fg-muted)" }}>Nenhuma informação de contato</p>
                  )}
                </div>
              </section>

              {/* Notas */}
              {contato.notes && (
                <section>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--fg-muted)" }}>Notas</p>
                  <p className="text-sm whitespace-pre-wrap rounded-lg p-3 max-h-48 overflow-y-auto" style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg)" }}>
                    {contato.notes}
                  </p>
                </section>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}

function ContatosPage() {
  const [search, setSearch] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editContato, setEditContato] = useState<Contato | null>(null);
  const [selectedContato, setSelectedContato] = useState<Contato | null>(null);

  const { data: contatos = [], isLoading } = useContatos();
  const { data: clients = [] } = useClients();
  const deleteContato = useDeleteContato();

  const filtered = contatos.filter((c) => {
    const matchSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (c.role ?? "").toLowerCase().includes(search.toLowerCase());
    const matchClient = !clientFilter || c.client_id === clientFilter;
    return matchSearch && matchClient;
  });

  const thisMonth = contatos.filter((c) => {
    const d = new Date(c.created_at);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });

  function openEdit(c: Contato) {
    setEditContato(c);
    setFormOpen(true);
  }

  function openCreate() {
    setEditContato(null);
    setFormOpen(true);
  }

  function handleClose() {
    setFormOpen(false);
    setEditContato(null);
  }

  function handleDelete(c: Contato) {
    if (!confirm(`Remover o contato "${c.name}"?`)) return;
    deleteContato.mutate(c.id);
  }

  return (
    <div className="flex flex-col min-h-full">
      <Header
        title="Contatos"
        subtitle="Gestores e pontos de contato nos clientes"
        actions={
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            <Plus className="w-4 h-4" /> Novo Contato
          </button>
        }
      />

      <PageKpis>
        <KpiItem label="Total" value={contatos.length.toString()} accent={contatos.length > 0} />
        <KpiItem label="Novos este Mês" value={thisMonth.length.toString()} />
        <KpiItem
          label="Com Email"
          value={contatos.filter((c) => c.email).length.toString()}
        />
      </PageKpis>

      <div className="px-6 py-4 flex items-center gap-3">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: "var(--fg-muted)" }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar nome, email, cargo..."
            className="pl-9 pr-3 py-2 rounded-lg text-sm w-60 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              color: "var(--fg)",
            }}
          />
        </div>
        <select
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            color: "var(--fg)",
          }}
        >
          <option value="">Todos os clientes</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {filtered.length > 0 && (
          <button
            onClick={() => exportContatosCSV(filtered)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium"
            style={{ border: "1px solid var(--border)", color: "var(--fg-muted)", background: "var(--bg-card)" }}
            title="Exportar CSV"
          >
            <Download className="w-3.5 h-3.5" /> Exportar
          </button>
        )}
      </div>

      <div className="flex-1 px-6 pb-6 flex flex-col">
        {isLoading ? (
          <TableSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title={
              search || clientFilter
                ? "Nenhum contato encontrado"
                : "Nenhum contato"
            }
            description={
              search || clientFilter
                ? "Tente ajustar os filtros."
                : "Registre gestores, RHs e outros pontos de contato nas empresas clientes."
            }
            action={
              !search && !clientFilter && (
                <button
                  onClick={openCreate}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium"
                  style={{ background: "var(--accent)", color: "#fff" }}
                >
                  <Plus className="w-4 h-4" /> Novo Contato
                </button>
              )
            }
          />
        ) : (
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: "1px solid var(--border)" }}
          >
            <table className="w-full text-sm data-table">
              <thead>
                <tr
                  style={{
                    background: "var(--bg-card)",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <Th>Nome</Th>
                  <Th>Empresa</Th>
                  <Th>Cargo</Th>
                  <Th>Contato</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((contato, i) => (
                  <tr
                    key={contato.id}
                    onClick={() => setSelectedContato(contato)}
                    className="cursor-pointer hover:opacity-90 transition-opacity"
                    style={{
                      background: i % 2 === 0 ? "var(--bg)" : "var(--bg-card)",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                          style={{
                            background: "color-mix(in srgb, var(--accent) 12%, transparent)",
                            color: "var(--accent)",
                          }}
                        >
                          {contato.name.charAt(0).toUpperCase()}
                        </div>
                        <span
                          className="font-medium"
                          style={{ color: "var(--fg)" }}
                        >
                          {contato.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {contato.client ? (
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium"
                          style={{
                            background: "var(--border)",
                            color: "var(--fg)",
                          }}
                        >
                          {contato.client.name}
                        </span>
                      ) : (
                        <span style={{ color: "var(--fg-muted)" }}>—</span>
                      )}
                    </td>
                    <td
                      className="px-4 py-3 text-sm"
                      style={{ color: "var(--fg-muted)" }}
                    >
                      {contato.role ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {contato.email && (
                          <a
                            href={`mailto:${contato.email}`}
                            className="flex items-center gap-1 text-xs hover:underline"
                            style={{ color: "var(--fg-muted)" }}
                          >
                            <Mail className="w-3.5 h-3.5" />
                            {contato.email}
                          </a>
                        )}
                        {contato.phone && (
                          <a
                            href={`tel:${contato.phone}`}
                            className="flex items-center gap-1 text-xs hover:underline"
                            style={{ color: "var(--fg-muted)" }}
                          >
                            <Phone className="w-3.5 h-3.5" />
                            {contato.phone}
                          </a>
                        )}
                        {contato.linkedin && (
                          <a
                            href={
                              contato.linkedin.startsWith("http")
                                ? contato.linkedin
                                : `https://${contato.linkedin}`
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="hover:opacity-70"
                            style={{ color: "#0077b5" }}
                            title="LinkedIn"
                          >
                            <Linkedin className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {!contato.email && !contato.phone && !contato.linkedin && (
                          <span style={{ color: "var(--fg-muted)" }}>—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => openEdit(contato)}
                          className="p-1.5 rounded-lg hover:opacity-80"
                          style={{ color: "var(--fg-muted)" }}
                          title="Editar"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(contato)}
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

      <ContatoDrawer
        contato={selectedContato}
        onClose={() => setSelectedContato(null)}
        onEdit={openEdit}
      />

      <ContatoForm
        key={editContato?.id ?? "new"}
        open={formOpen}
        onClose={handleClose}
        defaultValues={editContato ?? undefined}
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
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex gap-4 px-4 py-3 animate-pulse"
          style={{
            background: i % 2 === 0 ? "var(--bg)" : "var(--bg-card)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          {[2, 2, 1, 2].map((w, j) => (
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

