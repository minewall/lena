import { useState } from "react";
import {
  addDays,
  isSameDay,
  startOfDay,
  type Appointment,
  type Availability,
} from "../../lib/agenda";
import { type Staff } from "../../lib/staff";
import { AppointmentCard } from "./AppointmentCard";
import { BookingModal } from "./BookingModal";

interface Props {
  tenantId: string;
  weekStart: Date;
  appointments: Appointment[];
  staffList: Staff[];
  availability: Availability[];
  onDayClick: (d: Date) => void;
  onChanged: () => void;
}

const WEEKDAY_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function AgendaWeek({
  tenantId,
  weekStart,
  appointments,
  staffList,
  availability,
  onDayClick,
  onChanged,
}: Props) {
  const [booking, setBooking] = useState<{ date: Date } | null>(null);

  const days: Date[] = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  function apptsForDay(d: Date) {
    return appointments
      .filter((a) => isSameDay(new Date(a.starts_at), d))
      .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  }

  const today = startOfDay(new Date());

  return (
    <>
      <div className="overflow-x-auto">
        <div className="grid min-w-[920px] grid-cols-7 overflow-hidden rounded-[var(--radius-card)] border border-creme-edge">
          {days.map((d) => {
            const isToday = isSameDay(d, today);
            const isPast = startOfDay(d).getTime() < today.getTime();
            const dayAppts = apptsForDay(d);
            return (
              <div
                key={d.toISOString()}
                className={`flex flex-col border-l border-creme-edge first:border-l-0 ${
                  isPast ? "bg-creme-edge/25" : ""
                }`}
              >
                {/* header do dia */}
                <button
                  type="button"
                  onClick={() => onDayClick(d)}
                  className={`w-full border-b border-creme-edge px-3 py-2.5 text-left transition hover:bg-creme-soft ${
                    isToday ? "bg-terracota-soft/40" : ""
                  }`}
                >
                  <div
                    className={`text-[11px] font-bold uppercase tracking-wide ${
                      isToday ? "text-terracota" : isPast ? "text-cafe-muted/60" : "text-cafe-muted"
                    }`}
                  >
                    {WEEKDAY_SHORT[d.getDay()]}
                  </div>
                  <div
                    className={`font-display text-xl font-bold leading-tight tabular-nums ${
                      isToday ? "text-terracota" : isPast ? "text-cafe-muted" : "text-cafe"
                    }`}
                  >
                    {d.getDate()}
                  </div>
                </button>

                {/* agendamentos */}
                <div className={`flex min-h-[160px] flex-1 flex-col gap-1 p-1.5 ${isPast ? "opacity-60" : ""}`}>
                  {dayAppts.length === 0 ? (
                    isPast ? (
                      <div className="flex h-full items-center justify-center text-[11px] text-cafe-muted/50">
                        —
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setBooking({ date: d })}
                        className="flex h-full items-center justify-center rounded-lg text-[11px] text-cafe-muted opacity-0 transition hover:bg-creme-soft hover:opacity-100"
                      >
                        + agendar
                      </button>
                    )
                  ) : (
                    <>
                      {dayAppts.slice(0, 6).map((a) => (
                        <AppointmentCard
                          key={a.id}
                          appt={a}
                          staffList={staffList}
                          compact
                          onChanged={onChanged}
                        />
                      ))}
                      {dayAppts.length > 6 && (
                        <button
                          type="button"
                          onClick={() => onDayClick(d)}
                          className="rounded-md px-2 py-1 text-left text-[11px] font-medium text-terracota hover:bg-creme-soft"
                        >
                          +{dayAppts.length - 6} mais
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {booking && (
        <BookingModal
          tenantId={tenantId}
          staffList={staffList}
          availability={availability}
          preselectedDate={booking.date}
          onBooked={() => { setBooking(null); onChanged(); }}
          onClose={() => setBooking(null)}
        />
      )}
    </>
  );
}
