import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Phone,
  Video,
  Users,
  FileText,
  ChevronDown,
  ChevronUp,
  Clock,
  Building2,
  Search,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { format, isAfter, isBefore, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Header } from "@/components/layout/Header";
import { PageKpis, KpiItem } from "@/components/layout/PageKpis";
import { EmptyState } from "@/components/ui/EmptyState";
import { ReuniaoForm } from "@/components/reunioes/ReuniaoForm";
import {
  useMeetings,
  useDeleteMeeting,
  useUpdateMeeting,
  MEETING_TYPE_LABELS,
  MEETING_STATUS_LABELS,
  MEETING_STATUS_COLORS,
  type Meeting,
  type MeetingType,
} from "@/hooks/useMeetings";

export const Route = createFileRoute("/_authenticated/reunioes")({
  component: ReunioesPage,
});

const TYPE_ICONS: Record<MeetingType, React.ElementType> = {
  call: Phone,
  video_call: Video,
  in_person: Users,
  other: FileText,
};

const TABS = ["Próximas", "Realizadas", "Todas"] as const;
type Tab = (typeof TABS)[number];

function ReunioesPage() {
  const [activeTab, setActiveTab] = useState<Tab>("Próximas");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<MeetingType | "">("");
  const [formOpen, setFormOpen] = useState(false);
  const [editMeeting, setEditMeeting] = useState<Meeting | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: meetings = [], isLoading } = useMeetings();
  const deleteMeeting = useDeleteMeeting();
  const updateMeeting = useUpdateMeeting();

  const now = new Date();

  const upcoming = meetings.filter(
    (m) => isAfter(new Date(m.scheduled_at), now) && m.status === "scheduled"
  );
  const past = meetings.filter(
    (m) =>
      m.status === "completed" ||
      m.status === "cancelled" ||
      isBefore(new Date(m.scheduled_at), now)
  );

  const next7 = meetings.filter(
    (m) =>
      isAfter(new Date(m.scheduled_at), now) &&
      isBefore(new Date(m.scheduled_at), addDays(now, 7)) &&
      m.status === "scheduled"
  );

  const tabData: Record<Tab, Meeting[]> = {
    Próximas: upcoming,
    Realizadas: past,
    Todas: meetings,
  };

  const filtered = useMemo(() => {
    return tabData[activeTab].filter((m) => {
      const matchSearch =
        !search ||
        m.title.toLowerCase().includes(search.toLowerCase()) ||
        (m.client?.name ?? "").toLowerCase().includes(search.toLowerCase());
      const matchType = !typeFilter || m.type === typeFilter;
      return matchSearch && matchType;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetings, activeTab, search, typeFilter]);

  function openEdit(m: Meeting) {
    setEditMeeting(m);
    setFormOpen(true);
  }

  function openCreate() {
    setEditMeeting(null);
    setFormOpen(true);
  }

  function handleClose() {
    setFormOpen(false);
    setEditMeeting(null);
  }

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="flex flex-col min-h-full">
      <Header
        title="Reuniões / Atas"
        actions={
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            <Plus className="w-4 h-4" /> Nova Reunião
          </button>
        }
      />

      <PageKpis>
        <KpiItem label="Total" value={meetings.length.toString()} />
        <KpiItem
          label="Próximas 7 dias"
          value={next7.length.toString()}
          accent={next7.length > 0}
        />
        <KpiItem
          label="Realizadas"
          value={
            meetings
              .filter((m) => m.status === "completed")
              .length.toString()
          }
        />
        <KpiItem
          label="Canceladas"
          value={
            meetings
              .filter((m) => m.status === "cancelled")
              .length.toString()
          }
        />
      </PageKpis>

      {/* Tabs */}
      <div
        className="flex gap-0 px-6 shrink-0"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-4 py-2.5 text-sm font-medium transition-colors -mb-px hover:text-[var(--fg)]"
            style={
              activeTab === tab
                ? {
                    borderBottom: "2px solid var(--accent)",
                    color: "var(--accent)",
                  }
                : { color: "var(--fg-muted)" }
            }
          >
            {tab}
            {tab !== "Todas" && (
              <span
                className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full"
                style={{ background: "var(--border)", color: "var(--fg-muted)" }}
              >
                {tabData[tab].length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search + type filter */}
      <div className="flex items-center gap-3 px-6 py-3 shrink-0">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "var(--fg-muted)" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar reunião ou cliente..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg text-sm focus:outline-none"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--fg)" }}
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as MeetingType | "")}
          className="px-3 py-1.5 rounded-lg text-sm focus:outline-none w-44 shrink-0"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--fg)" }}
        >
          <option value="">Todos os tipos</option>
          {(Object.entries(MEETING_TYPE_LABELS) as [MeetingType, string][]).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-6">
        {isLoading ? (
          <MeetingsSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={
              activeTab === "Próximas"
                ? "Sem reuniões agendadas"
                : activeTab === "Realizadas"
                ? "Nenhuma reunião realizada"
                : "Nenhuma reunião registrada"
            }
            description="Registre briefings, alinhamentos e devolutivas com clientes."
            action={
              <button
                onClick={openCreate}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: "var(--accent)", color: "#fff" }}
              >
                <Plus className="w-4 h-4" /> Nova Reunião
              </button>
            }
          />
        ) : (
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: "1px solid var(--border)" }}
          >
            {filtered.map((meeting, i) => {
              const Icon = TYPE_ICONS[meeting.type];
              const isExpanded = expandedId === meeting.id;
              const hasNotes = meeting.agenda || meeting.notes;

              return (
                <div
                  key={meeting.id}
                  style={{
                    borderBottom:
                      i < filtered.length - 1
                        ? "1px solid var(--border)"
                        : undefined,
                  }}
                >
                  {/* Main row */}
                  <div
                    className="flex items-center gap-3 px-4 py-3"
                    style={{
                      background:
                        i % 2 === 0 ? "var(--bg)" : "var(--bg-card)",
                    }}
                  >
                    {/* Type icon */}
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        background: "color-mix(in srgb, var(--accent) 12%, transparent)",
                        color: "var(--accent)",
                      }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="text-sm font-medium"
                          style={{ color: "var(--fg)" }}
                        >
                          {meeting.title}
                        </span>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{
                            background:
                              MEETING_STATUS_COLORS[meeting.status] + "22",
                            color: MEETING_STATUS_COLORS[meeting.status],
                          }}
                        >
                          {MEETING_STATUS_LABELS[meeting.status]}
                        </span>
                        <span
                          className="text-xs"
                          style={{ color: "var(--fg-muted)" }}
                        >
                          {MEETING_TYPE_LABELS[meeting.type]}
                        </span>
                      </div>
                      <div
                        className="flex items-center gap-3 mt-0.5 text-xs"
                        style={{ color: "var(--fg-muted)" }}
                      >
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(
                            new Date(meeting.scheduled_at),
                            "dd/MM/yyyy 'às' HH:mm",
                            { locale: ptBR }
                          )}
                          {meeting.duration_min && (
                            <span className="ml-1">
                              ({meeting.duration_min} min)
                            </span>
                          )}
                        </span>
                        {meeting.client && (
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {meeting.client.name}
                          </span>
                        )}
                        {meeting.location && (
                          <span>{meeting.location}</span>
                        )}
                        {meeting.video_link && (
                          <a
                            href={meeting.video_link}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:underline"
                            style={{ color: "var(--accent)" }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            Entrar
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {hasNotes && (
                        <button
                          onClick={() => toggleExpand(meeting.id)}
                          className="p-1.5 rounded-lg hover:opacity-80"
                          style={{ color: "var(--fg-muted)" }}
                          title={isExpanded ? "Ocultar ata" : "Ver ata"}
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      )}
                      {meeting.status === "scheduled" && (
                        <>
                          <button
                            onClick={() => updateMeeting.mutate({ id: meeting.id, title: meeting.title, type: meeting.type, scheduled_at: meeting.scheduled_at, status: "completed" })}
                            className="p-1.5 rounded-lg hover:opacity-80"
                            style={{ color: "#10b981" }}
                            title="Marcar como Realizada"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => updateMeeting.mutate({ id: meeting.id, title: meeting.title, type: meeting.type, scheduled_at: meeting.scheduled_at, status: "cancelled" })}
                            className="p-1.5 rounded-lg hover:opacity-80"
                            style={{ color: "#f59e0b" }}
                            title="Cancelar"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => openEdit(meeting)}
                        className="p-1.5 rounded-lg hover:opacity-80"
                        style={{ color: "var(--fg-muted)" }}
                        title="Editar"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (!confirm(`Remover "${meeting.title}"?`)) return;
                          deleteMeeting.mutate(meeting.id);
                        }}
                        className="p-1.5 rounded-lg hover:opacity-80"
                        style={{ color: "#ef4444" }}
                        title="Remover"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded: agenda + notes */}
                  {isExpanded && hasNotes && (
                    <div
                      className="px-4 pb-4 pt-2 space-y-3"
                      style={{
                        background:
                          i % 2 === 0 ? "var(--bg)" : "var(--bg-card)",
                        borderTop: "1px solid var(--border)",
                      }}
                    >
                      {meeting.agenda && (
                        <div>
                          <p
                            className="text-xs font-semibold uppercase tracking-wider mb-1.5"
                            style={{ color: "var(--fg-muted)" }}
                          >
                            Pauta
                          </p>
                          <p
                            className="text-sm whitespace-pre-wrap rounded-lg p-3"
                            style={{
                              color: "var(--fg)",
                              background: "var(--bg-card)",
                              border: "1px solid var(--border)",
                            }}
                          >
                            {meeting.agenda}
                          </p>
                        </div>
                      )}
                      {meeting.notes && (
                        <div>
                          <p
                            className="text-xs font-semibold uppercase tracking-wider mb-1.5"
                            style={{ color: "var(--fg-muted)" }}
                          >
                            Ata / Notas
                          </p>
                          <p
                            className="text-sm whitespace-pre-wrap rounded-lg p-3"
                            style={{
                              color: "var(--fg)",
                              background: "var(--bg-card)",
                              border: "1px solid var(--border)",
                            }}
                          >
                            {meeting.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ReuniaoForm
        key={editMeeting?.id ?? "new"}
        open={formOpen}
        onClose={handleClose}
        defaultValues={editMeeting ?? undefined}
      />
    </div>
  );
}

function MeetingsSkeleton() {
  return (
    <div
      className="rounded-xl overflow-hidden animate-pulse"
      style={{ border: "1px solid var(--border)" }}
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-4 py-3"
          style={{
            background: i % 2 === 0 ? "var(--bg)" : "var(--bg-card)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div
            className="w-9 h-9 rounded-xl shrink-0"
            style={{ background: "var(--border)" }}
          />
          <div className="flex-1 space-y-2">
            <div
              className="h-4 w-48 rounded"
              style={{ background: "var(--border)" }}
            />
            <div
              className="h-3 w-32 rounded"
              style={{ background: "var(--border)" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

