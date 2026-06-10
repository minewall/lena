import { useRef, useState } from "react";
import {
  isSameDay,
  moveAppointment,
  startOfDay,
  type Appointment,
  type Availability,
} from "../../lib/agenda";
import { type Staff } from "../../lib/staff";
import { AppointmentCard } from "./AppointmentCard";
import { BookingModal } from "./BookingModal";

// ── Constantes do grid ─────────────────────────────────────────────────
const START_HOUR  = 7;
const END_HOUR    = 21;
const SLOT_H      = 56;   // px por slot de 30min
const TOTAL_SLOTS = (END_HOUR - START_HOUR) * 2;
const TOTAL_H     = TOTAL_SLOTS * SLOT_H;

function minuteOfDay(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

function topPx(appt: Appointment): number {
  const start = new Date(appt.starts_at);
  const mins  = minuteOfDay(start) - START_HOUR * 60;
  return Math.max(0, (mins / 30) * SLOT_H);
}

function heightPx(appt: Appointment): number {
  const dur = (new Date(appt.ends_at).getTime() - new Date(appt.starts_at).getTime()) / 60000;
  return Math.max((dur / 30) * SLOT_H, SLOT_H * 0.6);
}

/* Agendamentos sobrepostos dividem a coluna em "lanes" lado a lado
   (estilo Google Calendar) — essencial agora que a agenda permite paralelos. */
function layoutLanes(appts: Appointment[]): Map<string, { lane: number; lanes: number }> {
  const sorted = [...appts].sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const result = new Map<string, { lane: number; lanes: number }>();
  let cluster: { id: string; lane: number }[] = [];
  let laneEnds: number[] = []; // fim (ms) do último appt em cada lane do cluster atual
  let clusterEnd = -1;

  const flush = () => {
    for (const item of cluster) result.set(item.id, { lane: item.lane, lanes: laneEnds.length || 1 });
    cluster = [];
    laneEnds = [];
    clusterEnd = -1;
  };

  for (const a of sorted) {
    const s = new Date(a.starts_at).getTime();
    const e = new Date(a.ends_at).getTime();
    if (cluster.length && s >= clusterEnd) flush();
    let lane = laneEnds.findIndex((end) => end <= s);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(e);
    } else {
      laneEnds[lane] = e;
    }
    cluster.push({ id: a.id, lane });
    clusterEnd = Math.max(clusterEnd, e);
  }
  flush();
  return result;
}

// slots de 30min para os time-labels
const TIME_LABELS: string[] = [];
for (let h = START_HOUR; h <= END_HOUR; h++) {
  TIME_LABELS.push(`${String(h).padStart(2, "0")}:00`);
  if (h < END_HOUR) TIME_LABELS.push(`${String(h).padStart(2, "0")}:30`);
}

interface Props {
  tenantId: string;
  day: Date;
  appointments: Appointment[];
  staffList: Staff[];
  availability: Availability[];
  onChanged: () => void;
}

export function AgendaDay({ tenantId, day, appointments, staffList, availability, onChanged }: Props) {
  const [dragId, setDragId]     = useState<string | null>(null);
  const [overCol, setOverCol]   = useState<string | null>(null);   // staffId|"__none__"
  const [booking, setBooking]   = useState<{
    date: Date; time: string; staffId: string;
  } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const dayAppts = appointments.filter((a) => isSameDay(new Date(a.starts_at), day));

  // Agendamentos sem profissional vão para coluna "Avulsos"
  const noStaff = dayAppts.filter((a) => !a.staff_id);
  const byStaff = new Map<string, Appointment[]>();
  for (const s of staffList) byStaff.set(s.id, []);
  for (const a of dayAppts) {
    if (a.staff_id && byStaff.has(a.staff_id)) {
      byStaff.get(a.staff_id)!.push(a);
    }
  }

  // Colunas: profissionais + avulsos (se houver)
  const cols: { id: string; label: string; color: string; appts: Appointment[] }[] = [
    ...staffList.map((s) => ({
      id: s.id, label: s.name, color: s.color,
      appts: byStaff.get(s.id) ?? [],
    })),
    ...(noStaff.length > 0 || staffList.length === 0
      ? [{ id: "__none__", label: "Avulsos", color: "#897866", appts: noStaff }]
      : []),
  ];

  // Se não há profissionais e não há avulsos → mostra coluna única
  const showSingleCol = staffList.length === 0;
  const effectiveCols = showSingleCol
    ? [{ id: "__none__", label: "Todos", color: "#579bfc", appts: dayAppts }]
    : cols;

  async function onDrop(e: React.DragEvent, staffId: string) {
    e.preventDefault();
    if (!dragId || !gridRef.current) return;
    const appt = appointments.find((a) => a.id === dragId);
    if (!appt) return;

    const rect = gridRef.current.getBoundingClientRect();
    const relY  = e.clientY - rect.top;
    const slotIndex = Math.round(relY / SLOT_H);
    const minsFromStart = slotIndex * 30;
    const targetMins = START_HOUR * 60 + minsFromStart;

    // não permite arrastar para horário que já passou
    if (isSameDay(day, new Date())) {
      const now = new Date();
      if (targetMins < now.getHours() * 60 + now.getMinutes()) {
        setDragId(null);
        setOverCol(null);
        return;
      }
    }

    const orig   = new Date(appt.starts_at);
    const dur    = (new Date(appt.ends_at).getTime() - orig.getTime()) / 60000;
    const newStart = startOfDay(day);
    newStart.setHours(Math.floor(targetMins / 60), targetMins % 60, 0, 0);
    const newEnd = new Date(newStart.getTime() + dur * 60000);

    const newStaff = staffId === "__none__" ? null : staffId;
    setDragId(null);
    setOverCol(null);
    try {
      await moveAppointment(appt.id, newStart, newEnd, newStaff);
      onChanged();
    } catch {
      onChanged(); // revert visual
    }
  }

  function slotIsPast(slotIdx: number): boolean {
    if (!isSameDay(day, new Date())) return false;
    const minsFromStart = slotIdx * 30;
    const totalMins = START_HOUR * 60 + minsFromStart;
    const now = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes();
    return totalMins < nowMins;
  }

  function onSlotClick(slotIdx: number, staffId: string) {
    if (slotIsPast(slotIdx)) return; // bloqueia slots passados
    const minsFromStart = slotIdx * 30;
    const totalMins = START_HOUR * 60 + minsFromStart;
    const hh = String(Math.floor(totalMins / 60)).padStart(2, "0");
    const mm = String(totalMins % 60).padStart(2, "0");
    setBooking({ date: day, time: `${hh}:${mm}`, staffId: staffId === "__none__" ? "" : staffId });
  }

  return (
    <>
      {/* Indicador "hoje" */}
      <p className="mb-2 text-xs text-cafe-muted">
        {day.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
      </p>

      <div className="overflow-x-auto">
        {/* Cabeçalho de colunas */}
        <div
          className="flex"
          style={{ paddingLeft: 56 /* largura da coluna de horas */ }}
        >
          {effectiveCols.map((col) => (
            <div
              key={col.id}
              className="flex min-w-[160px] flex-1 items-center gap-2 border-l border-creme-edge px-3 py-2"
            >
              <span
                className="h-3 w-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: col.color }}
              />
              <span className="truncate text-sm font-medium text-cafe">{col.label}</span>
              <span className="ml-auto text-xs text-cafe-muted">{col.appts.length}</span>
            </div>
          ))}
        </div>

        {/* Grid de tempo */}
        <div className="flex" ref={gridRef}>
          {/* Coluna de horas */}
          <div className="w-14 flex-shrink-0" style={{ height: TOTAL_H }}>
            <div className="flex flex-col">
              {TIME_LABELS.map((t, i) => (
                <div
                  key={i}
                  style={{ height: SLOT_H }}
                  className="flex items-start pt-1 pr-2 text-right text-[10px] text-cafe-muted select-none"
                >
                  {t.endsWith(":00") ? (
                    <span className="w-full text-right">{t}</span>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          {/* Colunas por profissional */}
          {effectiveCols.map((col) => (
            <div
              key={col.id}
              className={`relative min-w-[160px] flex-1 border-l border-creme-edge transition ${
                overCol === col.id ? "bg-creme-soft" : ""
              }`}
              style={{ height: TOTAL_H }}
              onDragOver={(e) => { e.preventDefault(); setOverCol(col.id); }}
              onDragLeave={() => setOverCol(null)}
              onDrop={(e) => onDrop(e, col.id)}
            >
              {/* Linhas de slot */}
              {TIME_LABELS.map((_, i) => {
                const past = slotIsPast(i);
                return (
                  <div
                    key={i}
                    style={{ top: i * SLOT_H, height: SLOT_H }}
                    className={`absolute left-0 right-0 border-t ${
                      i % 2 === 0 ? "border-creme-edge" : "border-creme-edge/40"
                    } ${past
                      ? "bg-creme-edge/40 cursor-not-allowed"
                      : "cursor-pointer hover:bg-terracota-soft/30"
                    }`}
                    onClick={() => onSlotClick(i, col.id)}
                  />
                );
              })}

              {/* Cards de agendamento — sobrepostos dividem a coluna em lanes */}
              {(() => {
                const lanes = layoutLanes(col.appts);
                return col.appts.map((a) => {
                  const pos = lanes.get(a.id) ?? { lane: 0, lanes: 1 };
                  return (
                    <AppointmentCard
                      key={a.id}
                      appt={a}
                      staffList={staffList}
                      style={{
                        top: topPx(a),
                        height: heightPx(a),
                        left: `calc(${(pos.lane * 100) / pos.lanes}% + 2px)`,
                        width: `calc(${100 / pos.lanes}% - 4px)`,
                      }}
                      onDragStart={() => setDragId(a.id)}
                      onDragEnd={() => { setDragId(null); setOverCol(null); }}
                      onChanged={onChanged}
                    />
                  );
                });
              })()}

              {/* Indicador de hora atual */}
              {isSameDay(day, new Date()) && (() => {
                const now = new Date();
                const mins = minuteOfDay(now) - START_HOUR * 60;
                if (mins < 0 || mins > TOTAL_SLOTS * 30) return null;
                const top = (mins / 30) * SLOT_H;
                return (
                  <div
                    className="absolute left-0 right-0 z-10 flex items-center"
                    style={{ top }}
                    key="now-line"
                  >
                    <div className="h-2 w-2 rounded-full bg-terracota" />
                    <div className="h-px flex-1 bg-terracota" />
                  </div>
                );
              })()}
            </div>
          ))}
        </div>
      </div>

      {booking && (
        <BookingModal
          tenantId={tenantId}
          staffList={staffList}
          availability={availability}
          preselectedDate={booking.date}
          preselectedTime={booking.time}
          preselectedStaffId={booking.staffId}
          onBooked={() => { setBooking(null); onChanged(); }}
          onClose={() => setBooking(null)}
        />
      )}
    </>
  );
}
