import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Phone,
  Video,
  Users,
  FileText,
  CheckCircle2,
  Circle,
  Briefcase,
  CalendarDays,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  format,
  startOfMonth,
  getDaysInMonth,
  getDay,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  isSameMonth,
  startOfWeek,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { Header } from "@/components/layout/Header";
import { ReuniaoForm } from "@/components/reunioes/ReuniaoForm";
import { useMeetings, useDeleteMeeting, type MeetingType, type Meeting } from "@/hooks/useMeetings";
import { useTasks } from "@/hooks/useTasks";
import { useJobs } from "@/hooks/useJobs";

export const Route = createFileRoute("/_authenticated/agenda")({
  component: AgendaPage,
});

const WEEK_DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const TYPE_ICONS: Record<MeetingType, React.ElementType> = {
  call: Phone,
  video_call: Video,
  in_person: Users,
  other: FileText,
};

type ViewMode = "mes" | "semana" | "dia";

function AgendaPage() {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [formOpen, setFormOpen] = useState(false);
  const [editMeeting, setEditMeeting] = useState<Meeting | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("mes");

  const { data: meetings = [] } = useMeetings();
  const deleteMeeting = useDeleteMeeting();
  const { data: tasks = [] } = useTasks();
  const { data: jobs = [] } = useJobs();

  // ── Navigation (context-aware) ───────────────────────────────
  function goToday() {
    const today = new Date();
    setCurrentMonth(startOfMonth(today));
    setSelectedDate(today);
  }

  function goPrev() {
    if (viewMode === "mes") {
      setCurrentMonth((m) => subMonths(m, 1));
    } else if (viewMode === "semana") {
      setSelectedDate((d) => subWeeks(d, 1));
    } else {
      setSelectedDate((d) => subDays(d, 1));
    }
  }

  function goNext() {
    if (viewMode === "mes") {
      setCurrentMonth((m) => addMonths(m, 1));
    } else if (viewMode === "semana") {
      setSelectedDate((d) => addWeeks(d, 1));
    } else {
      setSelectedDate((d) => addDays(d, 1));
    }
  }

  // Keep currentMonth in sync with selectedDate for week/day views
  function selectDate(d: Date) {
    setSelectedDate(d);
    setCurrentMonth(startOfMonth(d));
  }

  // ── Month view data ──────────────────────────────────────────
  const firstDay = startOfMonth(currentMonth);
  const offset = getDay(firstDay);
  const daysInMonth = getDaysInMonth(currentMonth);

  const cells = useMemo(
    () =>
      Array.from({ length: Math.ceil((offset + daysInMonth) / 7) * 7 }, (_, i) => {
        const day = i - offset + 1;
        return day >= 1 && day <= daysInMonth ? day : null;
      }),
    [offset, daysInMonth]
  );

  function getEventsForDate(date: Date) {
    const dayMeetings = meetings.filter((m) =>
      isSameDay(new Date(m.scheduled_at), date)
    );
    const dayTasks = tasks.filter(
      (t) => t.due_date && isSameDay(new Date(t.due_date), date)
    );
    const dayJobs = jobs.filter(
      (j) => j.deadline && isSameDay(new Date(j.deadline), date)
    );
    return { meetings: dayMeetings, tasks: dayTasks, jobs: dayJobs };
  }

  // ── Right panel data (always selectedDate) ───────────────────
  const selectedDayMeetings = meetings.filter((m) =>
    isSameDay(new Date(m.scheduled_at), selectedDate)
  );
  const selectedDayTasks = tasks.filter(
    (t) => t.due_date && isSameDay(new Date(t.due_date), selectedDate)
  );
  const selectedDayJobs = jobs.filter(
    (j) => j.deadline && isSameDay(new Date(j.deadline), selectedDate)
  );
  const totalEventsSelected =
    selectedDayMeetings.length + selectedDayTasks.length + selectedDayJobs.length;

  // ── Legend counts (context-aware) ────────────────────────────
  const legendMeetings = useMemo(() => {
    if (viewMode === "semana") {
      const ws = startOfWeek(selectedDate, { weekStartsOn: 0 });
      const we = addDays(ws, 6);
      return meetings.filter((m) => { const d = new Date(m.scheduled_at); return d >= ws && d <= we; }).length;
    }
    if (viewMode === "dia") {
      return meetings.filter((m) => isSameDay(new Date(m.scheduled_at), selectedDate)).length;
    }
    return meetings.filter((m) => isSameMonth(new Date(m.scheduled_at), currentMonth)).length;
  }, [meetings, viewMode, selectedDate, currentMonth]);

  const legendTasks = useMemo(() => {
    if (viewMode === "semana") {
      const ws = startOfWeek(selectedDate, { weekStartsOn: 0 });
      const we = addDays(ws, 6);
      return tasks.filter((t) => { const d = t.due_date ? new Date(t.due_date) : null; return d && d >= ws && d <= we; }).length;
    }
    if (viewMode === "dia") {
      return tasks.filter((t) => t.due_date && isSameDay(new Date(t.due_date), selectedDate)).length;
    }
    return tasks.filter((t) => t.due_date && isSameMonth(new Date(t.due_date), currentMonth)).length;
  }, [tasks, viewMode, selectedDate, currentMonth]);

  // ── Subtitle ──────────────────────────────────────────────────
  const subtitle = useMemo(() => {
    if (viewMode === "mes") {
      return format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR });
    }
    if (viewMode === "semana") {
      const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
      const weekEnd = addDays(weekStart, 6);
      return `${format(weekStart, "dd/MM")} – ${format(weekEnd, "dd/MM/yyyy")}`;
    }
    return format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  }, [viewMode, currentMonth, selectedDate]);

  return (
    <div className="flex flex-col min-h-full">
      <Header
        title="Agenda"
        subtitle={subtitle}
        actions={
          <div className="flex items-center gap-2">
            {/* View mode toggle */}
            <div
              className="flex rounded-lg overflow-hidden"
              style={{ border: "1px solid var(--border)" }}
            >
              {(["mes", "semana", "dia"] as ViewMode[]).map((mode) => {
                const labels: Record<ViewMode, string> = { mes: "Mês", semana: "Semana", dia: "Dia" };
                return (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className="px-3 py-1.5 text-xs font-medium transition-colors"
                    style={
                      viewMode === mode
                        ? { background: "var(--accent)", color: "#fff" }
                        : { background: "var(--bg-card)", color: "var(--fg-muted)" }
                    }
                  >
                    {labels[mode]}
                  </button>
                );
              })}
            </div>

            {/* Navigation */}
            <div
              className="flex items-center rounded-lg overflow-hidden"
              style={{ border: "1px solid var(--border)" }}
            >
              <button
                onClick={goPrev}
                className="px-2 py-1.5 hover:opacity-80 transition-opacity"
                style={{ color: "var(--fg)" }}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={goToday}
                className="px-3 py-1.5 text-xs font-medium"
                style={{
                  color: "var(--fg)",
                  borderLeft: "1px solid var(--border)",
                  borderRight: "1px solid var(--border)",
                }}
              >
                Hoje
              </button>
              <button
                onClick={goNext}
                className="px-2 py-1.5 hover:opacity-80 transition-opacity"
                style={{ color: "var(--fg)" }}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => { setEditMeeting(null); setFormOpen(true); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              <Plus className="w-4 h-4" /> Nova Reunião
            </button>
          </div>
        }
      />

      {/* Legend */}
      <div
        className="flex items-center gap-4 px-6 py-2 text-xs"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <Legend color="#6366f1" label={`${legendMeetings} ${legendMeetings !== 1 ? "reuniões" : "reunião"}`} />
        <Legend color="#f59e0b" label={`${legendTasks} tarefa${legendTasks !== 1 ? "s" : ""}`} />
      </div>

      {/* Main layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: calendar or week/day view */}
        <div className="flex-1 overflow-auto">
          {viewMode === "mes" && (
            <MonthView
              cells={cells}
              currentMonth={currentMonth}
              selectedDate={selectedDate}
              getEventsForDate={getEventsForDate}
              onSelectDate={selectDate}
              typeIcons={TYPE_ICONS}
            />
          )}
          {viewMode === "semana" && (
            <WeekView
              selectedDate={selectedDate}
              meetings={meetings}
              tasks={tasks}
              jobs={jobs}
              onSelectDate={selectDate}
              typeIcons={TYPE_ICONS}
            />
          )}
          {viewMode === "dia" && (
            <DayView
              selectedDate={selectedDate}
              meetings={selectedDayMeetings}
              tasks={selectedDayTasks}
              jobs={selectedDayJobs}
              typeIcons={TYPE_ICONS}
              onNewMeeting={() => setFormOpen(true)}
            />
          )}
        </div>

        {/* Right: day detail panel (always visible) */}
        <div
          className="w-72 shrink-0 flex flex-col"
          style={{ borderLeft: "1px solid var(--border)" }}
        >
          <div
            className="px-4 py-3 shrink-0"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <p className="text-sm font-semibold" style={{ color: "var(--fg)" }}>
              {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>
              {totalEventsSelected === 0
                ? "Sem eventos"
                : `${totalEventsSelected} evento${totalEventsSelected > 1 ? "s" : ""}`}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {totalEventsSelected === 0 && (
              <div className="text-center py-8">
                <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
                  Nenhum evento neste dia
                </p>
                <button
                  onClick={() => { setEditMeeting(null); setFormOpen(true); }}
                  className="mt-3 text-xs font-medium hover:underline"
                  style={{ color: "var(--accent)" }}
                >
                  + Agendar reunião
                </button>
              </div>
            )}

            {selectedDayMeetings.map((m) => {
              const Icon = TYPE_ICONS[m.type];
              return (
                <div
                  key={m.id}
                  className="rounded-xl p-3"
                  style={{ background: "#6366f111", border: "1px solid #6366f133" }}
                >
                  <div className="flex items-start gap-2">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: "color-mix(in srgb, #6366f1 12%, transparent)", color: "#6366f1" }}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-snug" style={{ color: "var(--fg)" }}>
                        {m.title}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "#6366f1" }}>
                        {format(new Date(m.scheduled_at), "HH:mm")}
                        {m.duration_min && ` · ${m.duration_min} min`}
                      </p>
                      {m.client && (
                        <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>
                          {m.client.name}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        onClick={() => { setEditMeeting(m); setFormOpen(true); }}
                        className="p-1 rounded-lg hover:opacity-80"
                        style={{ color: "var(--fg-muted)" }}
                        title="Editar"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => { if (!confirm(`Remover "${m.title}"?`)) return; deleteMeeting.mutate(m.id); }}
                        className="p-1 rounded-lg hover:opacity-80"
                        style={{ color: "#ef4444" }}
                        title="Remover"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {selectedDayTasks.map((t) => (
              <div
                key={t.id}
                className="rounded-xl p-3"
                style={{ background: "#f59e0b11", border: "1px solid #f59e0b33" }}
              >
                <div className="flex items-start gap-2">
                  <div className="mt-0.5">
                    {t.status === "done" ? (
                      <CheckCircle2 className="w-4 h-4" style={{ color: "#10b981" }} />
                    ) : (
                      <Circle className="w-4 h-4" style={{ color: "#f59e0b" }} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p
                      className="text-sm font-medium leading-snug"
                      style={{ color: "var(--fg)", textDecoration: t.status === "done" ? "line-through" : undefined }}
                    >
                      {t.title}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "#f59e0b" }}>
                      Prazo da tarefa
                    </p>
                    {t.job && (
                      <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>
                        {t.job.title}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {selectedDayJobs.map((j) => (
              <div
                key={j.id}
                className="rounded-xl p-3"
                style={{ background: "#ef444411", border: "1px solid #ef444433" }}
              >
                <div className="flex items-start gap-2">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: "color-mix(in srgb, #ef4444 12%, transparent)", color: "#ef4444" }}
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-snug" style={{ color: "var(--fg)" }}>
                      {j.title}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "#ef4444" }}>
                      Prazo da vaga
                    </p>
                    {j.client && (
                      <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>
                        {j.client.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 shrink-0" style={{ borderTop: "1px solid var(--border)" }}>
            <button
              onClick={() => { setEditMeeting(null); setFormOpen(true); }}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium hover:opacity-80"
              style={{ border: "1px dashed var(--border)", color: "var(--fg-muted)" }}
            >
              <Plus className="w-3.5 h-3.5" /> Agendar para este dia
            </button>
          </div>
        </div>
      </div>

      <ReuniaoForm
        key={editMeeting?.id ?? "new"}
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditMeeting(null); }}
        defaultValues={editMeeting ?? undefined}
        defaultScheduledAt={editMeeting ? undefined : (() => {
          const d = new Date(selectedDate);
          d.setHours(9, 0, 0, 0);
          return d.toISOString();
        })()}
      />
    </div>
  );
}

// ─── Month View ───────────────────────────────────────────────

interface MonthViewProps {
  cells: (number | null)[];
  currentMonth: Date;
  selectedDate: Date;
  getEventsForDate: (d: Date) => { meetings: any[]; tasks: any[]; jobs: any[] };
  onSelectDate: (d: Date) => void;
  typeIcons: Record<MeetingType, React.ElementType>;
}

function MonthView({ cells, currentMonth, selectedDate, getEventsForDate, onSelectDate, typeIcons }: MonthViewProps) {
  return (
    <div className="p-4">
      <div className="grid grid-cols-7 mb-0" style={{ borderBottom: "1px solid var(--border)" }}>
        {WEEK_DAYS.map((d, i) => (
          <div
            key={d}
            className="text-center text-xs font-medium py-2"
            style={{
              color: i === 0 || i === 6 ? "var(--fg-muted)" : "var(--fg-muted)",
              background: i === 0 || i === 6
                ? "color-mix(in srgb, var(--fg) 4%, var(--bg-card))"
                : "var(--bg-card)",
              opacity: i === 0 || i === 6 ? 0.7 : 1,
            }}
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px" style={{ background: "var(--border)" }}>
        {cells.map((day, i) => {
          const col = i % 7;
          const isWeekend = col === 0 || col === 6;
          if (!day) {
            return <div key={`empty-${i}`} className="min-h-[80px]" style={{ background: "var(--bg)" }} />;
          }
          const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
          const { meetings: dm, tasks: dt, jobs: dj } = getEventsForDate(date);
          const isSelected = isSameDay(date, selectedDate);
          const isTodayDate = isToday(date);
          return (
            <button
              key={day}
              onClick={() => onSelectDate(date)}
              className="min-h-[80px] p-2 text-left transition-colors hover:brightness-95"
              style={{
                background: isSelected
                  ? "color-mix(in srgb, var(--accent) 12%, var(--bg-card))"
                  : isWeekend
                  ? "color-mix(in srgb, var(--fg) 4%, var(--bg-card))"
                  : "var(--bg-card)",
                outline: isSelected ? `2px solid var(--accent)` : undefined,
                outlineOffset: "-2px",
              }}
            >
              <span
                className="inline-flex w-6 h-6 items-center justify-center rounded-full text-xs font-medium"
                style={isTodayDate ? { background: "var(--accent)", color: "#fff", fontWeight: 700 } : { color: "var(--fg)" }}
              >
                {day}
              </span>
              <div className="mt-1.5 space-y-0.5">
                {dm.slice(0, 2).map((m) => {
                  const Icon = typeIcons[m.type as MeetingType];
                  return (
                    <div key={m.id} className="flex items-center gap-1 rounded px-1 py-0.5 text-[10px] leading-tight truncate" style={{ background: "color-mix(in srgb, #6366f1 12%, transparent)", color: "#6366f1" }}>
                      <Icon className="w-2.5 h-2.5 shrink-0" />
                      <span className="truncate">{m.title}</span>
                    </div>
                  );
                })}
                {dt.slice(0, 1).map((t) => (
                  <div key={t.id} className="flex items-center gap-1 rounded px-1 py-0.5 text-[10px] leading-tight truncate" style={{ background: "color-mix(in srgb, #f59e0b 12%, transparent)", color: "#f59e0b" }}>
                    <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />
                    <span className="truncate">{t.title}</span>
                  </div>
                ))}
                {dj.slice(0, 1).map((j) => (
                  <div key={j.id} className="flex items-center gap-1 rounded px-1 py-0.5 text-[10px] leading-tight truncate" style={{ background: "color-mix(in srgb, #ef4444 12%, transparent)", color: "#ef4444" }}>
                    <Briefcase className="w-2.5 h-2.5 shrink-0" />
                    <span className="truncate">{j.title}</span>
                  </div>
                ))}
                {dm.length + dt.length + dj.length > 3 && (
                  <p className="text-[10px] px-1" style={{ color: "var(--fg-muted)" }}>
                    +{dm.length + dt.length + dj.length - 3} mais
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Week View ────────────────────────────────────────────────

const GRID_START = 7;   // 7h
const GRID_END   = 22;  // 22h exclusive
const HOUR_PX    = 56;  // px per hour

interface WeekViewProps {
  selectedDate: Date;
  meetings: any[];
  tasks: any[];
  jobs: any[];
  onSelectDate: (d: Date) => void;
  typeIcons: Record<MeetingType, React.ElementType>;
}

function WeekView({ selectedDate, meetings, tasks, jobs, onSelectDate, typeIcons }: WeekViewProps) {
  const weekStart  = startOfWeek(selectedDate, { weekStartsOn: 0 });
  const weekDays   = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const hours      = Array.from({ length: GRID_END - GRID_START }, (_, i) => GRID_START + i);
  const totalH     = (GRID_END - GRID_START) * HOUR_PX;

  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const nowTop = (now.getHours() + now.getMinutes() / 60 - GRID_START) * HOUR_PX;
  const showNowLine = nowTop >= 0 && nowTop <= totalH;

  const hasAllDay = weekDays.some((day) =>
    tasks.some((t) => t.due_date && isSameDay(new Date(t.due_date), day)) ||
    jobs.some((j)  => j.deadline  && isSameDay(new Date(j.deadline),  day))
  );

  function evTop(scheduledAt: string) {
    const d = new Date(scheduledAt);
    return (d.getHours() + d.getMinutes() / 60 - GRID_START) * HOUR_PX;
  }
  function evH(durationMin?: number | null) {
    return Math.max(((durationMin ?? 60) / 60) * HOUR_PX, 24);
  }

  const extraH = hasAllDay ? 32 : 0;

  return (
    <div className="flex flex-col" style={{ height: `calc(100vh - ${210 + extraH}px)` }}>
      {/* Day headers */}
      <div className="flex shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="w-12 shrink-0" />
        {weekDays.map((day) => {
          const isT = isToday(day);
          const isS = isSameDay(day, selectedDate);
          return (
            <button key={day.toISOString()} onClick={() => onSelectDate(day)}
              className="flex-1 text-center py-2 transition-colors hover:brightness-95"
              style={isS ? { background: "var(--accent)11" } : undefined}
            >
              <p className="text-[11px] font-medium" style={{ color: "var(--fg-muted)" }}>{WEEK_DAYS[day.getDay()]}</p>
              <span className="inline-flex w-7 h-7 items-center justify-center rounded-full text-sm font-semibold mt-0.5"
                style={isT ? { background: "var(--accent)", color: "#fff" } : isS ? { background: "color-mix(in srgb, var(--accent) 12%, transparent)", color: "var(--accent)" } : { color: "var(--fg)" }}>
                {format(day, "d")}
              </span>
            </button>
          );
        })}
      </div>

      {/* All-day strip: tasks + deadlines */}
      {hasAllDay && (
        <div className="flex shrink-0" style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-card)" }}>
          <div className="w-12 shrink-0 flex items-center justify-end pr-1.5">
            <span className="text-[9px]" style={{ color: "var(--fg-muted)" }}>dia</span>
          </div>
          {weekDays.map((day) => {
            const dt = tasks.filter((t) => t.due_date && isSameDay(new Date(t.due_date), day));
            const dj = jobs.filter((j)  => j.deadline  && isSameDay(new Date(j.deadline),  day));
            return (
              <div key={day.toISOString()} className="flex-1 p-0.5 space-y-0.5 min-h-[24px]"
                style={{ borderLeft: "1px solid var(--border)" }}>
                {dt.map((t) => (
                  <div key={t.id} className="flex items-center gap-1 rounded px-1 py-0.5 text-[10px] truncate"
                    style={{ background: "color-mix(in srgb, #f59e0b 12%, transparent)", color: "#f59e0b" }}>
                    <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />
                    <span className="truncate">{t.title}</span>
                  </div>
                ))}
                {dj.map((j) => (
                  <div key={j.id} className="flex items-center gap-1 rounded px-1 py-0.5 text-[10px] truncate"
                    style={{ background: "color-mix(in srgb, #ef4444 12%, transparent)", color: "#ef4444" }}>
                    <Briefcase className="w-2.5 h-2.5 shrink-0" />
                    <span className="truncate">{j.title}</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* Scrollable time grid */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="flex" style={{ height: totalH, minWidth: 560 }}>
          {/* Hour gutter */}
          <div className="w-12 shrink-0 relative" style={{ borderRight: "1px solid var(--border)" }}>
            {hours.map((h) => (
              <div key={h} className="absolute right-1.5 select-none text-[10px]"
                style={{ top: (h - GRID_START) * HOUR_PX - 7, color: "var(--fg-muted)" }}>
                {String(h).padStart(2, "0")}h
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((day) => {
            const dm = meetings.filter((m) => isSameDay(new Date(m.scheduled_at), day));
            const isS = isSameDay(day, selectedDate);
            return (
              <div key={day.toISOString()} className="flex-1 relative cursor-pointer"
                style={{ borderLeft: "1px solid var(--border)", background: isS ? "color-mix(in srgb, var(--accent) 4%, transparent)" : undefined }}
                onClick={() => onSelectDate(day)}
              >
                {/* Hour lines */}
                {hours.map((h) => (
                  <div key={h} className="absolute left-0 right-0 pointer-events-none"
                    style={{ top: (h - GRID_START) * HOUR_PX, borderTop: "1px solid var(--border)", opacity: 0.3 }} />
                ))}
                {/* Half-hour lines (subtle) */}
                {hours.map((h) => (
                  <div key={`half-${h}`} className="absolute left-0 right-0 pointer-events-none"
                    style={{ top: (h - GRID_START) * HOUR_PX + HOUR_PX / 2, borderTop: "1px dashed var(--border)", opacity: 0.12 }} />
                ))}

                {/* Current-time line */}
                {showNowLine && isSameDay(day, now) && (
                  <div className="absolute left-0 right-0 pointer-events-none z-10" style={{ top: nowTop }}>
                    <div className="relative flex items-center">
                      <div className="w-2 h-2 rounded-full shrink-0 -ml-1" style={{ background: "#ef4444" }} />
                      <div className="flex-1 h-[1.5px]" style={{ background: "#ef4444" }} />
                    </div>
                  </div>
                )}

                {/* Meeting chips */}
                {dm.map((m) => {
                  const Icon = typeIcons[m.type as MeetingType];
                  const top  = evTop(m.scheduled_at);
                  const h    = evH(m.duration_min);
                  if (top < 0 || top > totalH) return null;
                  const tall = h >= 40;
                  return (
                    <div key={m.id}
                      className="absolute left-0.5 right-0.5 rounded-md px-1.5 overflow-hidden"
                      style={{ top, height: h, background: "#6366f11a", border: "1px solid #6366f144", zIndex: 1, paddingTop: 3 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-1 leading-none">
                        <Icon className="w-2.5 h-2.5 shrink-0" style={{ color: "#6366f1" }} />
                        <span className="text-[10px] font-bold" style={{ color: "#6366f1" }}>
                          {format(new Date(m.scheduled_at), "HH:mm")}
                        </span>
                        {!tall && (
                          <span className="text-[10px] truncate" style={{ color: "#6366f1" }}> {m.title}</span>
                        )}
                      </div>
                      {tall && (
                        <p className="text-[10px] truncate mt-0.5" style={{ color: "#6366f1" }}>{m.title}</p>
                      )}
                      {tall && m.client && (
                        <p className="text-[9px] truncate mt-0.5" style={{ color: "#6366f199" }}>{m.client.name}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Day View ─────────────────────────────────────────────────

interface DayViewProps {
  selectedDate: Date;
  meetings: any[];
  tasks: any[];
  jobs: any[];
  typeIcons: Record<MeetingType, React.ElementType>;
  onNewMeeting: () => void;
}

function DayView({ selectedDate, meetings, tasks, jobs, typeIcons, onNewMeeting }: DayViewProps) {
  const hasEvents = meetings.length + tasks.length + jobs.length > 0;

  if (!hasEvents) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-6">
        <CalendarDays className="w-10 h-10 mb-4 opacity-20" style={{ color: "var(--fg-muted)" }} />
        <h3 className="text-base font-semibold mb-2" style={{ color: "var(--fg)" }}>
          Nenhum evento neste dia
        </h3>
        <p className="text-sm mb-6 max-w-xs" style={{ color: "var(--fg-muted)" }}>
          {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })} está livre.
        </p>
        <button
          onClick={onNewMeeting}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          <Plus className="w-4 h-4" /> Agendar Reunião
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl space-y-3">
      {meetings
        .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
        .map((m) => {
          const Icon = typeIcons[m.type as MeetingType];
          return (
            <div
              key={m.id}
              className="rounded-xl p-4"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "color-mix(in srgb, #6366f1 12%, transparent)", color: "#6366f1" }}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: "var(--fg)" }}>{m.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#6366f1" }}>
                    {format(new Date(m.scheduled_at), "HH:mm", { locale: ptBR })}
                    {m.duration_min && ` · ${m.duration_min} min`}
                  </p>
                  {m.client && <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>{m.client.name}</p>}
                </div>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: "color-mix(in srgb, #6366f1 12%, transparent)", color: "#6366f1" }}
                >
                  Reunião
                </span>
              </div>
            </div>
          );
        })}

      {tasks.map((t) => (
        <div
          key={t.id}
          className="rounded-xl p-4"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "color-mix(in srgb, #f59e0b 12%, transparent)", color: "#f59e0b" }}>
              {t.status === "done" ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-semibold"
                style={{ color: "var(--fg)", textDecoration: t.status === "done" ? "line-through" : undefined }}
              >
                {t.title}
              </p>
              {t.job && <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>{t.job.title}</p>}
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "color-mix(in srgb, #f59e0b 12%, transparent)", color: "#f59e0b" }}>
              Tarefa
            </span>
          </div>
        </div>
      ))}

      {jobs.map((j) => (
        <div
          key={j.id}
          className="rounded-xl p-4"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "color-mix(in srgb, #ef4444 12%, transparent)", color: "#ef4444" }}>
              <Briefcase className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: "var(--fg)" }}>{j.title}</p>
              {j.client && <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>{j.client.name}</p>}
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "color-mix(in srgb, #ef4444 12%, transparent)", color: "#ef4444" }}>
              Prazo vaga
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Legend ───────────────────────────────────────────────────

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-2.5 h-2.5 rounded-sm" style={{ background: color + "44", border: `1px solid ${color}66` }} />
      <span style={{ color: "var(--fg-muted)" }}>{label}</span>
    </div>
  );
}
