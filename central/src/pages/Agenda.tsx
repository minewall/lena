import { type FormEvent, useCallback, useEffect, useState } from "react";
import {
  addAvailability,
  bookAppointmentManual,
  cancelAppointment,
  deleteAvailability,
  hhmmToMinutes,
  loadAvailability,
  loadUpcomingAppointments,
  minutesToHHMM,
  WEEKDAYS,
  type Appointment,
  type Availability,
} from "../lib/agenda";
import { useAuth } from "../store/auth";
import {
  Button,
  Card,
  Field,
  Select,
  StatusPill,
  TextInput,
} from "../components/ui";

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function Agenda() {
  const tenantId = useAuth((s) => s.currentTenantId);
  const isAdmin = useAuth((s) => s.isAdmin());
  const [appts, setAppts] = useState<Appointment[]>([]);
  const [avail, setAvail] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!tenantId) return;
    try {
      const [a, av] = await Promise.all([
        loadUpcomingAppointments(tenantId),
        loadAvailability(tenantId),
      ]);
      setAppts(a);
      setAvail(av);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [tenantId]);

  useEffect(() => {
    setLoading(true);
    reload().finally(() => setLoading(false));
  }, [reload]);

  if (!tenantId) return null;

  async function onCancel(id: string, name: string) {
    if (!confirm(`Cancelar o agendamento de ${name}?`)) return;
    try {
      await cancelAppointment(id, "cancelado pela equipe");
      await reload();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl text-cafe">Agenda</h1>
        <p className="mt-1 text-cafe-soft">
          A Lena agenda nesta agenda em tempo real, sem dupla marcação.
          Configure os horários de atendimento abaixo.
        </p>
      </header>

      {error ? <StatusPill kind="error">{error}</StatusPill> : null}

      {/* próximos agendamentos */}
      <Card className="flex flex-col gap-3">
        <h2 className="font-display text-xl text-cafe">Próximos agendamentos</h2>
        {loading ? (
          <p className="text-cafe-soft animate-pulse-soft">carregando…</p>
        ) : appts.length === 0 ? (
          <p className="text-sm text-cafe-soft">
            Nenhum agendamento futuro. Quando a Lena marcar, aparece aqui.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-creme-edge">
            {appts.map((a) => {
              const name =
                a.customer_name?.trim() ||
                a.contact?.name?.trim() ||
                a.contact?.phone_e164 ||
                "cliente";
              return (
                <li key={a.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-cafe">
                      {fmtDateTime(a.starts_at)} · {name}
                    </span>
                    <span className="text-xs text-cafe-muted">
                      {a.service?.name ? `${a.service.name} · ` : ""}
                      {a.origin === "lena" ? "agendado pela Lena" : "agendado pela equipe"}
                      {a.status === "confirmed" ? " · confirmado" : ""}
                    </span>
                  </div>
                  <Button variant="danger" onClick={() => onCancel(a.id, name)}>
                    Cancelar
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {/* novo agendamento manual */}
      {isAdmin ? <ManualBooking tenantId={tenantId} onBooked={reload} /> : null}

      {/* disponibilidade */}
      {isAdmin ? (
        <AvailabilityEditor
          tenantId={tenantId}
          avail={avail}
          loading={loading}
          onChange={reload}
        />
      ) : null}
    </div>
  );
}

function ManualBooking({
  tenantId,
  onBooked,
}: {
  tenantId: string;
  onBooked: () => void;
}) {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState(60);
  const [state, setState] = useState<"idle" | "saving" | "error">("idle");
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setState("saving");
    setMsg(null);
    try {
      // monta ISO assumindo horário local do navegador (operador no mesmo fuso)
      const startsAt = new Date(`${date}T${time}:00`);
      const res = await bookAppointmentManual(
        tenantId,
        startsAt.toISOString(),
        duration,
        name.trim(),
      );
      if (!res.ok) {
        setMsg(
          res.error === "slot_taken"
            ? "Esse horário já está ocupado."
            : res.error === "past_time"
              ? "Horário no passado."
              : res.error ?? "erro",
        );
        setState("error");
        return;
      }
      setName("");
      setDate("");
      setTime("");
      setState("idle");
      onBooked();
    } catch (e) {
      setMsg((e as Error).message);
      setState("error");
    }
  }

  return (
    <Card className="flex flex-col gap-4">
      <h2 className="font-display text-xl text-cafe">Agendar manualmente</h2>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nome do cliente">
            <TextInput required value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Duração (min)">
            <TextInput
              type="number"
              min={5}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            />
          </Field>
          <Field label="Data">
            <TextInput
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </Field>
          <Field label="Horário">
            <TextInput
              type="time"
              required
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </Field>
        </div>
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={state === "saving"}>
            {state === "saving" ? "agendando…" : "Agendar"}
          </Button>
          {msg ? <StatusPill kind="error">{msg}</StatusPill> : null}
        </div>
      </form>
    </Card>
  );
}

function AvailabilityEditor({
  tenantId,
  avail,
  loading,
  onChange,
}: {
  tenantId: string;
  avail: Availability[];
  loading: boolean;
  onChange: () => void;
}) {
  const [weekday, setWeekday] = useState(1);
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("18:00");
  const [slot, setSlot] = useState(60);
  const [error, setError] = useState<string | null>(null);

  async function add(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const startMin = hhmmToMinutes(start);
      const endMin = hhmmToMinutes(end);
      if (endMin <= startMin) {
        setError("O fim precisa ser depois do início.");
        return;
      }
      await addAvailability(tenantId, weekday, startMin, endMin, slot);
      onChange();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function remove(id: string) {
    try {
      await deleteAvailability(id);
      onChange();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <Card className="flex flex-col gap-4">
      <div>
        <h2 className="font-display text-xl text-cafe">Horários de atendimento</h2>
        <p className="mt-1 text-sm text-cafe-soft">
          Defina as janelas em que a Lena pode marcar. Ela gera os horários
          dentro dessas janelas, no intervalo que você escolher.
        </p>
      </div>

      {loading ? (
        <p className="text-cafe-soft animate-pulse-soft">carregando…</p>
      ) : avail.length === 0 ? (
        <p className="text-sm text-cafe-soft">
          Nenhuma janela ainda. A Lena só agenda depois que você adicionar ao
          menos uma.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-creme-edge">
          {avail.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 py-2.5">
              <span className="text-sm text-cafe">
                {WEEKDAYS[a.weekday]} · {minutesToHHMM(a.start_minute)} às{" "}
                {minutesToHHMM(a.end_minute)} · slots de {a.slot_minutes} min
              </span>
              <Button variant="danger" onClick={() => remove(a.id)}>
                Remover
              </Button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={add} className="flex flex-wrap items-end gap-3 border-t border-creme-edge pt-4">
        <Field label="Dia">
          <Select value={weekday} onChange={(e) => setWeekday(Number(e.target.value))}>
            {WEEKDAYS.map((d, i) => (
              <option key={i} value={i}>
                {d}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Início">
          <TextInput type="time" value={start} onChange={(e) => setStart(e.target.value)} />
        </Field>
        <Field label="Fim">
          <TextInput type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
        </Field>
        <Field label="Slot (min)">
          <TextInput
            type="number"
            min={5}
            value={slot}
            onChange={(e) => setSlot(Number(e.target.value))}
            className="w-24"
          />
        </Field>
        <Button type="submit">+ Adicionar janela</Button>
      </form>
      {error ? <StatusPill kind="error">{error}</StatusPill> : null}
    </Card>
  );
}
