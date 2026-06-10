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
        <div className="grid min-w-[640px] grid-cols-7 border-l border-t border-creme-edge">
          {days.map((d) => {
            const isToday = isSameDay(d, today);
            const dayAppts = apptsForDay(d);
            return (
              <div key={d.toISOString()} className="border-b border-r border-creme-edge">
                {/* header do dia */}
                <button
                  type="button"
                  onClick={() => onDayClick(d)}
                  className={`w-full px-2 py-2 text-left transition hover:bg-creme-soft ${
                    isToday ? "bg-terracota-soft/30" : ""
                  }`}
                >
                  <div className={`text-xs font-medium ${isToday ? "text-terracota" : "text-cafe-muted"}`}>
                    {WEEKDAY_SHORT[d.getDay()]}
                  </div>
                  <div className={`text-lg font-display leading-tight ${isToday ? "text-terracota" : "text-cafe"}`}>
                    {d.getDate()}
                  </div>
                </button>

                {/* agendamentos */}
                <div className="flex min-h-[120px] flex-col gap-0.5 p-1">
                  {dayAppts.length === 0 ? (
                    <button
                      type="button"
                      onClick={() => setBooking({ date: d })}
                      className="flex h-full items-center justify-center rounded-lg text-[10px] text-cafe-muted opacity-0 hover:opacity-100 hover:bg-creme-soft"
                    >
                      + agendar
                    </button>
                  ) : (
                    <>
                      {dayAppts.slice(0, 4).map((a) => (
                        <AppointmentCard
                          key={a.id}
                          appt={a}
                          staffList={staffList}
                          compact
                          onChanged={onChanged}
                        />
                      ))}
                      {dayAppts.length > 4 && (
                        <button
                          type="button"
                          onClick={() => onDayClick(d)}
                          className="rounded-md px-2 py-0.5 text-left text-[10px] text-cafe-soft hover:bg-creme-soft"
                        >
                          +{dayAppts.length - 4} mais
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
          preselectedDate={booking.date}
          onBooked={() => { setBooking(null); onChanged(); }}
          onClose={() => setBooking(null)}
        />
      )}
    </>
  );
}
