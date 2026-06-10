import { type FormEvent, useEffect, useState } from "react";
import { bookAppointmentManual } from "../../lib/agenda";
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

export function BookingModal({
  tenantId,
  staffList,
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
    setState("saving");
    setErrorMsg(null);
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
          <Button type="submit" disabled={state === "saving"}>
            {state === "saving" ? "Agendando…" : "Confirmar agendamento"}
          </Button>
          {errorMsg ? (
            <StatusPill kind="error">{errorMsg}</StatusPill>
          ) : null}
        </div>
      </form>
    </div>
  );
}
