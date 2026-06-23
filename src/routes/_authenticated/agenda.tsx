import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
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
import { useMeetings, type MeetingType } from "@/hooks/useMeetings";
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
  const [viewMode, setViewMode] = useState<ViewMode>("mes");

  const { data: meetings = [] } = useMeetings();
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
      Array.from({ length: 42 }, (_, i) => {
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

  // ── Legend counts ─────────────────────────────────────────────
  const monthMeetings = meetings.filter((m) =>
    isSameMonth(new Date(m.scheduled_at), currentMonth)
  ).length;
  const monthTasks = tasks.filter(
    (t) => t.due_date && isSameMonth(new Date(t.due_date), currentMonth)
  ).length;

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
              onClick={() => setFormOpen(true)}
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
        <Legend color="#6366f1" label={`${monthMeetings} reunião${monthMeetings !== 1 ? "ões" : ""}`} />
        <Legend color="#f59e0b" label={`${monthTasks} tarefa${monthTasks !== 1 ? "s" : ""}`} />
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
                  onClick={() => setFormOpen(true)}
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
                      style={{ background: "#6366f122", color: "#6366f1" }}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
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
                    style={{ background: "#ef444422", color: "#ef4444" }}
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
              onClick={() => setFormOpen(true)}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium hover:opacity-80"
              style={{ border: "1px dashed var(--border)", color: "var(--fg-muted)" }}
            >
              <Plus className="w-3.5 h-3.5" /> Agendar para este dia
            </button>
          </div>
        </div>
      </div>

      <ReuniaoForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        defaultScheduledAt={(() => {
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
      <div className="grid grid-cols-7 mb-1">
        {WEEK_DAYS.map((d) => (
          <div key={d} className="text-center text-xs font-medium py-2" style={{ color: "var(--fg-muted)" }}>
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px" style={{ background: "var(--border)" }}>
        {cells.map((day, i) => {
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
                background: isSelected ? "var(--accent)11" : "var(--bg-card)",
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
                    <div key={m.id} className="flex items-center gap-1 rounded px-1 py-0.5 text-[10px] leading-tight truncate" style={{ background: "#6366f122", color: "#6366f1" }}>
                      <Icon className="w-2.5 h-2.5 shrink-0" />
                      <span className="truncate">{m.title}</span>
                    </div>
                  );
                })}
                {dt.slice(0, 1).map((t) => (
                  <div key={t.id} className="flex items-center gap-1 rounded px-1 py-0.5 text-[10px] leading-tight truncate" style={{ background: "#f59e0b22", color: "#f59e0b" }}>
                    <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />
                    <span className="truncate">{t.title}</span>
                  </div>
                ))}
                {dj.slice(0, 1).map((j) => (
                  <div key={j.id} className="flex items-center gap-1 rounded px-1 py-0.5 text-[10px] leading-tight truncate" style={{ background: "#ef444422", color: "#ef4444" }}>
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

interface WeekViewProps {
  selectedDate: Date;
  meetings: any[];
  tasks: any[];
  jobs: any[];
  onSelectDate: (d: Date) => void;
  typeIcons: Record<MeetingType, React.ElementType>;
}

function WeekView({ selectedDate, meetings, tasks, jobs, onSelectDate, typeIcons }: WeekViewProps) {
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="p-4">
      {/* Header row */}
      <div className="grid grid-cols-7 mb-1 gap-px">
        {weekDays.map((day) => {
          const isTodayDate = isToday(day);
          const isSelected = isSameDay(day, selectedDate);
          return (
            <button
              key={day.toISOString()}
              onClick={() => onSelectDate(day)}
              className="text-center py-2 rounded-lg transition-colors hover:brightness-95"
              style={isSelected ? { background: "var(--accent)11" } : undefined}
            >
              <p className="text-xs font-medium" style={{ color: "var(--fg-muted)" }}>
                {WEEK_DAYS[day.getDay()]}
              </p>
              <span
                className="inline-flex w-7 h-7 items-center justify-center rounded-full text-sm font-semibold mt-0.5"
                style={isTodayDate ? { background: "var(--accent)", color: "#fff" } : isSelected ? { background: "var(--accent)22", color: "var(--accent)" } : { color: "var(--fg)" }}
              >
                {format(day, "d")}
              </span>
            </button>
          );
        })}
      </div>

      {/* Event grid */}
      <div className="grid grid-cols-7 gap-px" style={{ background: "var(--border)" }}>
        {weekDays.map((day) => {
          const dm = meetings.filter((m) => isSameDay(new Date(m.scheduled_at), day));
          const dt = tasks.filter((t) => t.due_date && isSameDay(new Date(t.due_date), day));
          const dj = jobs.filter((j) => j.deadline && isSameDay(new Date(j.deadline), day));
          const isSelected = isSameDay(day, selectedDate);

          return (
            <div
              key={day.toISOString()}
              onClick={() => onSelectDate(day)}
              className="min-h-[120px] p-2 cursor-pointer transition-colors hover:brightness-95"
              style={{
                background: isSelected ? "var(--accent)08" : "var(--bg-card)",
                outline: isSelected ? `2px solid var(--accent)` : undefined,
                outlineOffset: "-2px",
              }}
            >
              <div className="space-y-1">
                {dm.map((m) => {
                  const Icon = typeIcons[m.type as MeetingType];
                  return (
                    <div key={m.id} className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] truncate" style={{ background: "#6366f122", color: "#6366f1" }}>
                      <Icon className="w-3 h-3 shrink-0" />
                      <span className="truncate">{m.title}</span>
                    </div>
                  );
                })}
                {dt.map((t) => (
                  <div key={t.id} className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] truncate" style={{ background: "#f59e0b22", color: "#f59e0b" }}>
                    <CheckCircle2 className="w-3 h-3 shrink-0" />
                    <span className="truncate">{t.title}</span>
                  </div>
                ))}
                {dj.map((j) => (
                  <div key={j.id} className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] truncate" style={{ background: "#10b98122", color: "#10b981" }}>
                    <Briefcase className="w-3 h-3 shrink-0" />
                    <span className="truncate">{j.title}</span>
                  </div>
                ))}
                {dm.length === 0 && dt.length === 0 && dj.length === 0 && (
                  <p className="text-[10px] text-center pt-4" style={{ color: "var(--fg-muted)", opacity: 0.4 }}>—</p>
                )}
              </div>
            </div>
          );
        })}
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
                  style={{ background: "#6366f122", color: "#6366f1" }}
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
                  style={{ background: "#6366f122", color: "#6366f1" }}
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
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#f59e0b22", color: "#f59e0b" }}>
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
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#f59e0b22", color: "#f59e0b" }}>
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
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#ef444422", color: "#ef4444" }}>
              <Briefcase className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: "var(--fg)" }}>{j.title}</p>
              {j.client && <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>{j.client.name}</p>}
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#ef444422", color: "#ef4444" }}>
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
