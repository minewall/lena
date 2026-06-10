import { useCallback, useEffect, useRef, useState } from "react";
import {
  addDays,
  loadAppointmentsForRange,
  loadAvailability,
  startOfDay,
  type Appointment,
  type Availability,
} from "../../lib/agenda";
import { loadStaff, type Staff } from "../../lib/staff";
import { useAuth } from "../../store/auth";
import { Button, StatusPill } from "../../components/ui";
import { AgendaDay } from "./Day";
import { AgendaWeek } from "./Week";
import { AgendaMonth } from "./Month";
import { StaffManager } from "./StaffManager";
import { BookingModal } from "./BookingModal";

type View = "dia" | "semana" | "quinzena" | "mes";

function mondayOf(d: Date): Date {
  const dow = d.getDay(); // 0=dom
  const diff = dow === 0 ? -6 : 1 - dow;
  return addDays(startOfDay(d), diff);
}

function firstOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function rangeForView(anchor: Date, view: View): [Date, Date] {
  const d = startOfDay(anchor);
  if (view === "dia")      return [d, addDays(d, 1)];
  if (view === "semana")   return [mondayOf(d), addDays(mondayOf(d), 7)];
  if (view === "quinzena") return [mondayOf(d), addDays(mondayOf(d), 14)];
  // mês: 6 semanas ao redor
  const m = firstOfMonth(d);
  const gStart = addDays(m, -m.getDay());
  return [gStart, addDays(gStart, 42)];
}

function navLabel(anchor: Date, view: View): string {
  if (view === "dia") {
    return anchor.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  }
  if (view === "semana" || view === "quinzena") {
    const from = mondayOf(anchor);
    const to   = addDays(from, view === "semana" ? 6 : 13);
    const d1 = from.toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
    const d2 = to.toLocaleDateString("pt-BR",   { day: "numeric", month: "short" });
    return `${d1} – ${d2}`;
  }
  return anchor.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function navigate(anchor: Date, view: View, dir: 1 | -1): Date {
  const steps: Record<View, number> = { dia: 1, semana: 7, quinzena: 14, mes: 30 };
  return addDays(anchor, steps[view] * dir);
}

const VIEWS: { key: View; label: string }[] = [
  { key: "dia",      label: "Dia" },
  { key: "semana",   label: "Semana" },
  { key: "quinzena", label: "Quinzena" },
  { key: "mes",      label: "Mês" },
];

export function Agenda() {
  const tenantId = useAuth((s) => s.currentTenantId);
  const isAdmin  = useAuth((s) => s.isAdmin());

  const [view,         setView]         = useState<View>("dia");
  const [anchor,       setAnchor]       = useState(startOfDay(new Date()));
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [staffList,    setStaffList]    = useState<Staff[]>([]);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [showStaff,    setShowStaff]    = useState(false);
  const [showBooking,  setShowBooking]  = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const reload = useCallback(async () => {
    if (!tenantId) return;
    try {
      const [from, to] = rangeForView(anchor, view);
      const [appts, staff, avail] = await Promise.all([
        loadAppointmentsForRange(tenantId, from, to),
        loadStaff(tenantId),
        loadAvailability(tenantId),
      ]);
      setAppointments(appts);
      setStaffList(staff);
      setAvailability(avail);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [tenantId, anchor, view]);

  useEffect(() => {
    setLoading(true);
    reload().finally(() => setLoading(false));
  }, [reload]);

  // Auto-refresh a cada 60s — agenda sempre reflete o estado atual
  useEffect(() => {
    intervalRef.current = setInterval(() => { void reload(); }, 60_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [reload]);

  if (!tenantId) return null;

  return (
    <div className="flex flex-col gap-4">
      {/* Barra de controles */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        {/* título */}
        <h1 className="text-3xl text-cafe">Agenda</h1>

        {/* seletor de visão */}
        <div className="flex rounded-xl border border-creme-edge bg-white p-0.5 text-sm">
          {VIEWS.map((v) => (
            <button
              key={v.key}
              type="button"
              onClick={() => setView(v.key)}
              className={`rounded-lg px-3 py-1.5 transition ${
                view === v.key
                  ? "bg-terracota text-white"
                  : "text-cafe-soft hover:bg-creme-soft"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>

        {/* ações */}
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button variant="ghost" onClick={() => setShowStaff(true)} className="py-1.5 text-sm">
              👥 Profissionais
            </Button>
          )}
          <Button onClick={() => setShowBooking(true)} className="py-1.5 text-sm">
            + Agendar
          </Button>
        </div>
      </header>

      {/* Navegação de período */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setAnchor((a) => navigate(a, view, -1))}
          className="rounded-lg border border-creme-edge px-3 py-1.5 text-sm text-cafe-soft hover:bg-creme-soft"
        >
          ‹
        </button>
        <button
          type="button"
          onClick={() => setAnchor(startOfDay(new Date()))}
          className={`rounded-lg px-3 py-1.5 text-sm transition ${
            navLabel(anchor, view) === navLabel(startOfDay(new Date()), view)
              ? "bg-terracota-soft text-terracota"
              : "border border-creme-edge text-cafe-soft hover:bg-creme-soft"
          }`}
        >
          Hoje
        </button>
        <button
          type="button"
          onClick={() => setAnchor((a) => navigate(a, view, 1))}
          className="rounded-lg border border-creme-edge px-3 py-1.5 text-sm text-cafe-soft hover:bg-creme-soft"
        >
          ›
        </button>
        <span className="text-sm font-medium text-cafe capitalize">
          {navLabel(anchor, view)}
        </span>
        {loading && (
          <span className="text-xs text-cafe-muted animate-pulse-soft">carregando…</span>
        )}
      </div>

      {error ? <StatusPill kind="error">{error}</StatusPill> : null}

      {/* Conteúdo da visão */}
      {!loading && (
        <>
          {view === "dia" && (
            <AgendaDay
              tenantId={tenantId}
              day={anchor}
              appointments={appointments}
              staffList={staffList}
              availability={availability}
              onChanged={reload}
            />
          )}
          {(view === "semana" || view === "quinzena") && (
            <AgendaWeek
              tenantId={tenantId}
              weekStart={mondayOf(anchor)}
              appointments={appointments}
              staffList={staffList}
              availability={availability}
              onDayClick={(d) => { setAnchor(d); setView("dia"); }}
              onChanged={reload}
            />
          )}
          {view === "mes" && (
            <AgendaMonth
              tenantId={tenantId}
              monthStart={firstOfMonth(anchor)}
              appointments={appointments}
              staffList={staffList}
              availability={availability}
              onDayClick={(d) => { setAnchor(d); setView("dia"); }}
              onChanged={reload}
            />
          )}
        </>
      )}

      {/* Painéis flutuantes */}
      {showStaff && (
        <StaffManager
          tenantId={tenantId}
          onClose={() => setShowStaff(false)}
          onChanged={() => { setShowStaff(false); reload(); }}
        />
      )}
      {showBooking && (
        <BookingModal
          tenantId={tenantId}
          staffList={staffList}
          availability={availability}
          onBooked={() => { setShowBooking(false); reload(); }}
          onClose={() => setShowBooking(false)}
        />
      )}
    </div>
  );
}
