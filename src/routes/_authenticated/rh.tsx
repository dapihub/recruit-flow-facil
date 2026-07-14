import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { UserCircle, Plus, Trash2, Plane, Clock } from "lucide-react";
import { format, differenceInCalendarDays } from "date-fns";
import { Header } from "@/components/layout/Header";
import { PageKpis, KpiItem } from "@/components/layout/PageKpis";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import {
  useVacations, useCreateVacation, useDeleteVacation,
  useTimesheet, useCreateTimesheet, useDeleteTimesheet,
} from "@/hooks/useRH";

export const Route = createFileRoute("/_authenticated/rh")({ component: RHPage });

const V_STATUS_LABELS = { requested: "Solicitada", approved: "Aprovada", denied: "Negada", taken: "Gozada" };
const V_STATUS_COLORS: Record<string, string> = { requested: "#f59e0b", approved: "#3b82f6", denied: "#ef4444", taken: "#10b981" };

function RHPage() {
  const [tab, setTab] = useState<"vac" | "ts">("vac");
  const { data: vacations = [] } = useVacations();
  const { data: timesheet = [] } = useTimesheet();
  const [vacFormOpen, setVacFormOpen] = useState(false);
  const [tsFormOpen, setTsFormOpen] = useState(false);

  const vacKpis = useMemo(() => ({
    total: vacations.length,
    pending: vacations.filter(v => v.status === "requested").length,
    approved: vacations.filter(v => v.status === "approved").length,
  }), [vacations]);

  return (
    <>
      <Header title="RH" subtitle="Férias, ponto e gestão de pessoas"
        actions={
          <button onClick={() => tab === "vac" ? setVacFormOpen(true) : setTsFormOpen(true)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium"
            style={{ background: "var(--accent)", color: "#fff" }}>
            <Plus className="w-4 h-4" /> {tab === "vac" ? "Nova Solicitação" : "Registrar Ponto"}
          </button>
        } />
      <PageKpis>
        <KpiItem label="Solicitações de férias" value={String(vacKpis.total)} />
        <KpiItem label="Pendentes" value={String(vacKpis.pending)} accent />
        <KpiItem label="Aprovadas" value={String(vacKpis.approved)} />
        <KpiItem label="Registros de ponto" value={String(timesheet.length)} />
      </PageKpis>

      <div className="px-6 pt-4 flex gap-1 border-b" style={{ borderColor: "var(--border)" }}>
        {[["vac", "Férias", Plane], ["ts", "Ponto", Clock]].map(([id, label, Icon]) => {
          const active = tab === id;
          const IconEl = Icon as React.FC<{ className?: string }>;
          return (
            <button key={id as string} onClick={() => setTab(id as "vac" | "ts")}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 -mb-px"
              style={{ borderColor: active ? "var(--accent)" : "transparent", color: active ? "var(--accent)" : "var(--fg-muted)" }}>
              <IconEl className="w-4 h-4" /> {label as string}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-auto p-6">
        {tab === "vac" ? <VacationsList /> : <TimesheetList />}
      </div>

      {vacFormOpen && <VacationForm onClose={() => setVacFormOpen(false)} />}
      {tsFormOpen && <TimesheetForm onClose={() => setTsFormOpen(false)} />}
    </>
  );
}

function VacationsList() {
  const { data: items = [] } = useVacations();
  const del = useDeleteVacation();
  if (!items.length) return <EmptyState icon={Plane} title="Sem férias registradas" description="Cadastre a primeira solicitação." />;
  return (
    <div className="rounded-xl overflow-hidden border" style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
      <table className="w-full text-sm">
        <thead style={{ background: "var(--bg)" }}>
          <tr>{["Colaborador", "Início", "Fim", "Dias", "Status", ""].map(h =>
            <th key={h} className="text-left px-4 py-3 text-xs uppercase font-semibold" style={{ color: "var(--fg-muted)" }}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {items.map(v => (
            <tr key={v.id} className="border-t" style={{ borderColor: "var(--border)" }}>
              <td className="px-4 py-3" style={{ color: "var(--fg)" }}>{v.person_name}</td>
              <td className="px-4 py-3" style={{ color: "var(--fg-muted)" }}>{format(new Date(v.start_date), "dd/MM/yyyy")}</td>
              <td className="px-4 py-3" style={{ color: "var(--fg-muted)" }}>{format(new Date(v.end_date), "dd/MM/yyyy")}</td>
              <td className="px-4 py-3 font-semibold" style={{ color: "var(--fg)" }}>{v.days}</td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium"
                  style={{ background: `color-mix(in srgb, ${V_STATUS_COLORS[v.status]} 12%, transparent)`, color: V_STATUS_COLORS[v.status] }}>
                  {V_STATUS_LABELS[v.status]}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <button onClick={() => confirm("Remover?") && del.mutate(v.id)} className="p-1.5 rounded hover:bg-[var(--border)]" style={{ color: "#ef4444" }}><Trash2 className="w-4 h-4" /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TimesheetList() {
  const { data: items = [] } = useTimesheet();
  const del = useDeleteTimesheet();
  if (!items.length) return <EmptyState icon={Clock} title="Sem registros de ponto" description="Registre o primeiro ponto." />;
  return (
    <div className="rounded-xl overflow-hidden border" style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
      <table className="w-full text-sm">
        <thead style={{ background: "var(--bg)" }}>
          <tr>{["Colaborador", "Data", "Entrada", "Saída", "Intervalo", "Total", ""].map(h =>
            <th key={h} className="text-left px-4 py-3 text-xs uppercase font-semibold" style={{ color: "var(--fg-muted)" }}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {items.map(t => (
            <tr key={t.id} className="border-t" style={{ borderColor: "var(--border)" }}>
              <td className="px-4 py-3" style={{ color: "var(--fg)" }}>{t.person_name}</td>
              <td className="px-4 py-3" style={{ color: "var(--fg-muted)" }}>{format(new Date(t.work_date), "dd/MM/yyyy")}</td>
              <td className="px-4 py-3" style={{ color: "var(--fg-muted)" }}>{t.check_in ?? "—"}</td>
              <td className="px-4 py-3" style={{ color: "var(--fg-muted)" }}>{t.check_out ?? "—"}</td>
              <td className="px-4 py-3" style={{ color: "var(--fg-muted)" }}>{t.break_minutes}min</td>
              <td className="px-4 py-3 font-semibold" style={{ color: "var(--fg)" }}>{t.total_hours ?? "—"}h</td>
              <td className="px-4 py-3 text-right">
                <button onClick={() => confirm("Remover?") && del.mutate(t.id)} className="p-1.5 rounded hover:bg-[var(--border)]" style={{ color: "#ef4444" }}><Trash2 className="w-4 h-4" /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function VacationForm({ onClose }: { onClose: () => void }) {
  const create = useCreateVacation();
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({ person_name: "", start_date: today, end_date: today, status: "requested" as const, notes: "" });
  const days = Math.max(1, differenceInCalendarDays(new Date(form.end_date), new Date(form.start_date)) + 1);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await create.mutateAsync({ ...form, days, notes: form.notes || null });
    onClose();
  }
  return (
    <Modal open onClose={onClose} title="Nova Solicitação de Férias" size="md"
      footer={<>
        <button onClick={onClose} className="px-3 py-1.5 rounded-lg text-sm" style={{ background: "var(--bg)", color: "var(--fg)" }}>Cancelar</button>
        <button form="vac-form" type="submit" className="px-3 py-1.5 rounded-lg text-sm font-medium" style={{ background: "var(--accent)", color: "#fff" }}>Salvar</button>
      </>}>
      <form id="vac-form" onSubmit={submit} className="space-y-3">
        <F label="Colaborador *"><input required value={form.person_name} onChange={e => setForm({ ...form, person_name: e.target.value })} className={inp} /></F>
        <div className="grid grid-cols-2 gap-3">
          <F label="Início *"><input required type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} className={inp} /></F>
          <F label="Fim *"><input required type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} className={inp} /></F>
        </div>
        <p className="text-xs" style={{ color: "var(--fg-muted)" }}>Total: <b style={{ color: "var(--fg)" }}>{days} dias</b></p>
        <F label="Observações"><textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className={inp} /></F>
      </form>
    </Modal>
  );
}

function TimesheetForm({ onClose }: { onClose: () => void }) {
  const create = useCreateTimesheet();
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({ person_name: "", work_date: today, check_in: "09:00", check_out: "18:00", break_minutes: 60, notes: "" });
  const total = useMemo(() => {
    if (!form.check_in || !form.check_out) return null;
    const [inH, inM] = form.check_in.split(":").map(Number);
    const [outH, outM] = form.check_out.split(":").map(Number);
    const mins = (outH * 60 + outM) - (inH * 60 + inM) - form.break_minutes;
    return mins > 0 ? +(mins / 60).toFixed(2) : 0;
  }, [form]);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await create.mutateAsync({ ...form, total_hours: total, notes: form.notes || null });
    onClose();
  }
  return (
    <Modal open onClose={onClose} title="Registrar Ponto" size="md"
      footer={<>
        <button onClick={onClose} className="px-3 py-1.5 rounded-lg text-sm" style={{ background: "var(--bg)", color: "var(--fg)" }}>Cancelar</button>
        <button form="ts-form" type="submit" className="px-3 py-1.5 rounded-lg text-sm font-medium" style={{ background: "var(--accent)", color: "#fff" }}>Salvar</button>
      </>}>
      <form id="ts-form" onSubmit={submit} className="space-y-3">
        <F label="Colaborador *"><input required value={form.person_name} onChange={e => setForm({ ...form, person_name: e.target.value })} className={inp} /></F>
        <F label="Data *"><input required type="date" value={form.work_date} onChange={e => setForm({ ...form, work_date: e.target.value })} className={inp} /></F>
        <div className="grid grid-cols-3 gap-3">
          <F label="Entrada"><input type="time" value={form.check_in} onChange={e => setForm({ ...form, check_in: e.target.value })} className={inp} /></F>
          <F label="Saída"><input type="time" value={form.check_out} onChange={e => setForm({ ...form, check_out: e.target.value })} className={inp} /></F>
          <F label="Intervalo (min)"><input type="number" value={form.break_minutes} onChange={e => setForm({ ...form, break_minutes: +e.target.value })} className={inp} /></F>
        </div>
        <p className="text-xs" style={{ color: "var(--fg-muted)" }}>Total: <b style={{ color: "var(--fg)" }}>{total ?? "—"}h</b></p>
        <F label="Observações"><textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className={inp} /></F>
      </form>
    </Modal>
  );
}

const inp = "w-full px-3 py-2 rounded-lg text-sm border bg-[var(--bg)] border-[var(--border)] text-[var(--fg)]";
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="block text-xs mb-1" style={{ color: "var(--fg-muted)" }}>{label}</span>{children}</label>;
}
