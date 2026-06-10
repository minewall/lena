import { type FormEvent, useEffect, useMemo, useState } from "react";
import { bookAppointmentManual, type Availability } from "../../lib/agenda";
import { type Staff } from "../../lib/staff";
import { supabase } from "../../lib/supabase";
import { Button, Field, Select, StatusPill, TextInput } from "../../components/ui";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as unknown as { from: (t: string) => any };

interface Service {
  id: string;
  name: string;
  duration_min: number | null;
  price_cents: number | null;
}

interface Contact {
  id: string;
  name: string | null;
  phone_e164: string;
}

interface Props {
  tenantId: string;
  staffList: Staff[];
  availability?: Availability[];
  /** Slot pré-selecionado ao clicar no grid. */
  preselectedDate?: Date;
  preselectedTime?: string;   // "HH:MM"
  preselectedStaffId?: string;
  onBooked: () => void;
  onClose: () => void;
}

function fmtPrice(cents: number | null): string {
  if (!cents) return "";
  return ` · R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
}

/** Converte "HH:MM" → minutos desde meia-noite. */
function timeToMins(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

/** Verifica se o slot (startMins, startMins+duration) está coberto por alguma janela do dia. */
function isWithinAvailability(
  avail: Availability[],
  weekday: number,
  startMins: number,
  durationMins: number,
): boolean {
  const endMins = startMins + durationMins;
  return avail.some(
    (a) =>
      a.weekday === weekday &&
      a.active &&
      a.start_minute <= startMins &&
      a.end_minute >= endMins,
  );
}

export function BookingModal({
  tenantId,
  staffList,
  availability = [],
  preselectedDate,
  preselectedTime,
  preselectedStaffId,
  onBooked,
  onClose,
}: Props) {
  const [services, setServices] = useState<Service[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactSearch, setContactSearch] = useState("");
  const [selectedContactId, setSelectedContactId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [staffId, setStaffId] = useState(preselectedStaffId ?? "");
  const [date, setDate] = useState(
    preselectedDate
      ? preselectedDate.toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10),
  );
  const [time, setTime] = useState(preselectedTime ?? "09:00");
  const [duration, setDuration] = useState(60);
  const [state, setState] = useState<"idle" | "saving" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [outsideHoursWarning, setOutsideHoursWarning] = useState(false);

  // Horário mínimo: se for hoje, não permite horário passado
  const today = new Date().toISOString().slice(0, 10);
  const minTime = useMemo(() => {
    if (date !== today) return undefined;
    const now = new Date();
    // arredonda para o próximo slot de 5 min
    const mins = now.getHours() * 60 + now.getMinutes() + 5;
    const hh = String(Math.floor(mins / 60)).padStart(2, "0");
    const mm = String(mins % 60).padStart(2, "0");
    return `${hh}:${mm}`;
  }, [date, today]);

  // Detecta se o horário selecionado está fora do expediente configurado
  const isOutsideHours = useMemo(() => {
    if (!availability.length) return false;
    const d = new Date(`${date}T${time}:00`);
    const weekday = d.getDay();
    const startMins = timeToMins(time);
    return !isWithinAvailability(availability, weekday, startMins, duration);
  }, [availability, date, time, duration]);

  useEffect(() => {
    db.from("tenant_services")
      .select("id,name,duration_min,price_cents")
      .eq("tenant_id", tenantId)
      .eq("active", true)
      .order("position")
      .then(({ data }: { data: Service[] }) => setServices(data ?? []));
  }, [tenantId]);

  // Busca contatos ao digitar (debounce simples)
  useEffect(() => {
    const q = contactSearch.trim();
    if (q.length < 2) { setContacts([]); return; }
    const timer = setTimeout(async () => {
      const { data } = await db.from("contacts")
        .select("id,name,phone_e164")
        .eq("tenant_id", tenantId)
        .or(`name.ilike.%${q}%,phone_e164.ilike.%${q}%`)
        .limit(8);
      setContacts((data ?? []) as Contact[]);
    }, 300);
    return () => clearTimeout(timer);
  }, [contactSearch, tenantId]);

  // Ao selecionar serviço, preenche duração
  function onServiceChange(id: string) {
    setServiceId(id);
    const svc = services.find((s) => s.id === id);
    if (svc?.duration_min) setDuration(svc.duration_min);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();

    // Bloqueia horário passado antes de chamar o backend
    if (minTime && time < minTime) {
      setErrorMsg("Este horário já passou. Escolha um horário futuro.");
      setState("error");
      return;
    }

    // Fora do expediente → pede confirmação (primeira tentativa mostra aviso)
    if (isOutsideHours && !outsideHoursWarning) {
      setOutsideHoursWarning(true);
      return;
    }

    setState("saving");
    setErrorMsg(null);
    setOutsideHoursWarning(false);
    try {
      const startsAt = new Date(`${date}T${time}:00`);
      const result = await bookAppointmentManual(
        tenantId,
        startsAt.toISOString(),
        duration,
        customerName.trim() || "",
        selectedContactId || undefined,
        serviceId || undefined,
        staffId || undefined,
      );
      if (!result.ok) {
        setErrorMsg(
          result.error === "slot_taken" ? "Horário já ocupado para este profissional." :
          result.error === "past_time"  ? "Horário no passado." :
          result.error ?? "Erro desconhecido.",
        );
        setState("error");
        return;
      }
      onBooked();
      onClose();
    } catch (err) {
      setErrorMsg((err as Error).message);
      setState("error");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-cafe/30 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <form
        onSubmit={onSubmit}
        className="flex w-full max-w-md flex-col gap-4 rounded-2xl border border-creme-edge bg-white p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl text-cafe">Novo agendamento</h2>
          <button type="button" onClick={onClose} className="text-cafe-muted hover:text-cafe">✕</button>
        </div>

        {/* cliente */}
        <Field label="Cliente">
          <TextInput
            placeholder="Buscar por nome ou telefone…"
            value={contactSearch}
            onChange={(e) => { setContactSearch(e.target.value); setSelectedContactId(""); }}
          />
          {contacts.length > 0 && !selectedContactId && (
            <ul className="mt-1 rounded-xl border border-creme-edge bg-white shadow">
              {contacts.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm text-cafe hover:bg-creme-soft"
                    onClick={() => {
                      setSelectedContactId(c.id);
                      setCustomerName(c.name ?? "");
                      setContactSearch(c.name ?? c.phone_e164);
                    }}
                  >
                    {c.name ?? c.phone_e164}
                    {c.name && (
                      <span className="ml-2 text-xs text-cafe-muted">{c.phone_e164}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {!selectedContactId && (
            <TextInput
              placeholder="ou nome livre (sem cadastro)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="mt-2 text-sm"
            />
          )}
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Data">
            <TextInput
              type="date"
              required
              min={today}
              value={date}
              onChange={(e) => { setDate(e.target.value); setOutsideHoursWarning(false); }}
            />
          </Field>
          <Field label="Horário">
            <TextInput
              type="time"
              required
              min={minTime}
              value={time}
              onChange={(e) => { setTime(e.target.value); setOutsideHoursWarning(false); }}
            />
          </Field>
        </div>

        {/* Aviso fora do expediente — aparece ANTES do botão confirmar */}
        {isOutsideHours && (
          <div className={`rounded-xl px-3 py-2.5 text-sm ${
            outsideHoursWarning
              ? "border border-amber-300 bg-amber-50 text-amber-800"
              : "bg-creme-edge text-cafe-soft"
          }`}>
            {outsideHoursWarning ? (
              <>
                ⚠️ <strong>Confirmar fora do horário?</strong> Este horário está fora do expediente
                configurado. Clique em "Confirmar" para agendar mesmo assim.
              </>
            ) : (
              <>🕐 Fora do horário comercial configurado.</>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Serviço">
            <Select value={serviceId} onChange={(e) => onServiceChange(e.target.value)}>
              <option value="">— Selecionar —</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}{fmtPrice(s.price_cents)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Duração (min)">
            <TextInput
              type="number"
              min={5}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            />
          </Field>
        </div>

        {staffList.length > 0 && (
          <Field label="Profissional">
            <Select value={staffId} onChange={(e) => setStaffId(e.target.value)}>
              <option value="">— Sem profissional —</option>
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}{s.role ? ` (${s.role})` : ""}
                </option>
              ))}
            </Select>
          </Field>
        )}

        <div className="flex items-center justify-between gap-3">
          <Button
            type="submit"
            disabled={state === "saving"}
            className={outsideHoursWarning ? "bg-amber-500 hover:bg-amber-600" : ""}
          >
            {state === "saving"
              ? "Agendando…"
              : outsideHoursWarning
                ? "Confirmar mesmo assim"
                : "Confirmar agendamento"}
          </Button>
          {errorMsg ? (
            <StatusPill kind="error">{errorMsg}</StatusPill>
          ) : null}
        </div>
      </form>
    </div>
  );
}
