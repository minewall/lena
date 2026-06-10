import { useState } from "react";
import { addDays, isSameDay, startOfDay, type Appointment, type Availability } from "../../lib/agenda";
import { type Staff } from "../../lib/staff";
import { AppointmentCard } from "./AppointmentCard";
import { BookingModal } from "./BookingModal";

interface Props {
  tenantId: string;
  monthStart: Date;    // 1º dia do mês
  appointments: Appointment[];
  staffList: Staff[];
  availability: Availability[];
  onDayClick: (d: Date) => void;
  onChanged: () => void;
}

const WEEKDAY_HEADER = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function AgendaMonth({
  tenantId,
  monthStart,
  appointments,
  staffList,
  availability,
  onDayClick,
  onChanged,
}: Props) {
  const [booking, setBooking] = useState<{ date: Date } | null>(null);

  // Preenche a grade: começa no domingo antes (ou no próprio dia se for domingo)
  const gridStart = addDays(monthStart, -monthStart.getDay());
  // 6 semanas = 42 dias
  const cells: Date[] = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));

  const today = startOfDay(new Date());
  const currentMonth = monthStart.getMonth();

  function apptsForDay(d: Date) {
    return appointments
      .filter((a) => isSameDay(new Date(a.starts_at), d))
      .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  }

  return (
    <>
      <div className="overflow-x-auto">
        {/* cabeçalho dias da semana */}
        <div className="grid grid-cols-7">
          {WEEKDAY_HEADER.map((d) => (
            <div key={d} className="py-1.5 text-center text-xs font-medium text-cafe-muted">
              {d}
            </div>
          ))}
        </div>

        {/* grade de 6 semanas */}
        <div className="grid grid-cols-7 border-l border-t border-creme-edge">
          {cells.map((d) => {
            const isToday    = isSameDay(d, today);
            const isCurMonth = d.getMonth() === currentMonth;
            const dayAppts   = apptsForDay(d);

            return (
              <div
                key={d.toISOString()}
                className={`min-h-[80px] border-b border-r border-creme-edge p-1 ${
                  !isCurMonth ? "bg-creme-soft/60" : ""
                } ${isToday ? "bg-terracota-soft/20" : ""}`}
              >
                {/* número do dia */}
                <button
                  type="button"
                  onClick={() => onDayClick(d)}
                  className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium transition hover:bg-creme-edge
                    ${isToday ? "bg-terracota text-white hover:bg-terracota-dark" : "text-cafe"}
                    ${!isCurMonth ? "text-cafe-muted" : ""}`}
                >
                  {d.getDate()}
                </button>

                {/* até 2 chips + contador */}
                <div className="flex flex-col gap-0.5">
                  {dayAppts.slice(0, 2).map((a) => (
                    <AppointmentCard
                      key={a.id}
                      appt={a}
                      staffList={staffList}
                      compact
                      onChanged={onChanged}
                    />
                  ))}
                  {dayAppts.length > 2 && (
                    <button
                      type="button"
                      onClick={() => onDayClick(d)}
                      className="text-left text-[10px] text-cafe-muted hover:text-cafe"
                    >
                      +{dayAppts.length - 2} mais
                    </button>
                  )}
                  {dayAppts.length === 0 && (
                    <button
                      type="button"
                      onClick={() => setBooking({ date: d })}
                      className="h-4 w-4 rounded text-[10px] text-cafe-muted opacity-0 hover:opacity-100"
                    >
                      +
                    </button>
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
