import { supabase } from "./supabase";

// RPCs e tabelas de agenda ainda não estão nos tipos gerados; cast localizado.
const rpc = supabase.rpc as unknown as (
  fn: string,
  args: Record<string, unknown>,
) => Promise<{ data: unknown; error: { message: string } | null }>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as unknown as {
  from: (t: string) => any;
};

export interface Availability {
  id: string;
  weekday: number;
  start_minute: number;
  end_minute: number;
  slot_minutes: number;
  active: boolean;
}

export interface Appointment {
  id: string;
  tenant_id: string;
  contact_id: string | null;
  service_id: string | null;
  staff_id: string | null;
  starts_at: string;
  ends_at: string;
  status: "booked" | "confirmed" | "cancelled" | "no_show" | "done";
  origin: "lena" | "operador" | "externo";
  customer_name: string | null;
  notes: string | null;
  reschedule_requested_at: string | null;
  contact?: { phone_e164: string; name: string | null } | null;
  service?: { name: string; duration_min: number | null } | null;
  staff?: { id: string; name: string; color: string; role: string | null } | null;
}

export const WEEKDAYS = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

export function minutesToHHMM(m: number): string {
  const h = Math.floor(m / 60)
    .toString()
    .padStart(2, "0");
  const min = (m % 60).toString().padStart(2, "0");
  return `${h}:${min}`;
}

export function hhmmToMinutes(s: string): number {
  const [h, m] = s.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

// ── availability ───────────────────────────────────────────────────────
export async function loadAvailability(tenantId: string): Promise<Availability[]> {
  const { data, error } = await db.from("tenant_availability")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("weekday", { ascending: true })
    .order("start_minute", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Availability[];
}

export async function addAvailability(
  tenantId: string,
  weekday: number,
  startMinute: number,
  endMinute: number,
  slotMinutes: number,
): Promise<void> {
  const { error } = await db.from("tenant_availability").insert({
    tenant_id: tenantId,
    weekday,
    start_minute: startMinute,
    end_minute: endMinute,
    slot_minutes: slotMinutes,
  });
  if (error) throw error;
}

export async function deleteAvailability(id: string): Promise<void> {
  const { error } = await db.from("tenant_availability").delete().eq("id", id);
  if (error) throw error;
}

const APPT_SELECT =
  "id,tenant_id,contact_id,service_id,staff_id,starts_at,ends_at,status,origin," +
  "customer_name,notes,reschedule_requested_at," +
  "contact:contacts(phone_e164,name)," +
  "service:tenant_services(name,duration_min)," +
  "staff:tenant_staff(id,name,color,role)";

// ── appointments ───────────────────────────────────────────────────────
export async function loadUpcomingAppointments(
  tenantId: string,
): Promise<Appointment[]> {
  const { data, error } = await db
    .from("appointments")
    .select(APPT_SELECT)
    .eq("tenant_id", tenantId)
    .in("status", ["booked", "confirmed"])
    .gte("ends_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as unknown as Appointment[];
}

/** Carrega todos os agendamentos num intervalo de datas (visão calendário). */
export async function loadAppointmentsForRange(
  tenantId: string,
  from: Date,
  to: Date,
): Promise<Appointment[]> {
  const { data, error } = await db
    .from("appointments")
    .select(APPT_SELECT)
    .eq("tenant_id", tenantId)
    .gte("starts_at", from.toISOString())
    .lte("starts_at", to.toISOString())
    .order("starts_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as Appointment[];
}

/** Move um agendamento para novo horário e/ou profissional. */
export async function moveAppointment(
  id: string,
  startsAt: Date,
  endsAt: Date,
  staffId: string | null,
): Promise<void> {
  const { error } = await db.from("appointments").update({
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
    staff_id: staffId,
  }).eq("id", id);
  if (error) throw new Error(error.message);
}

/** Troca apenas o profissional de um agendamento. */
export async function assignStaff(
  id: string,
  staffId: string | null,
): Promise<void> {
  const { error } = await db
    .from("appointments")
    .update({ staff_id: staffId })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

/** Atualiza status de um agendamento. */
export async function updateAppointmentStatus(
  id: string,
  status: Appointment["status"],
): Promise<void> {
  const { error } = await db
    .from("appointments")
    .update({ status })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

/** Solicita reagendamento via Lena — verifica janela de 24h. */
export async function requestReschedule(
  appointmentId: string,
): Promise<{ ok: boolean; window_open: boolean; contact_phone: string | null }> {
  const { data, error } = await rpc("request_reschedule", {
    p_appointment_id: appointmentId,
  });
  if (error) throw new Error(error.message);
  return data as { ok: boolean; window_open: boolean; contact_phone: string | null };
}

export async function cancelAppointment(id: string, reason?: string): Promise<void> {
  const { error } = await rpc("cancel_appointment", {
    p_appointment_id: id,
    p_reason: reason ?? null,
  });
  if (error) throw new Error(error.message);
}

export async function bookAppointmentManual(
  tenantId: string,
  startsAtIso: string,
  durationMin: number,
  customerName: string,
  contactId?: string,
  serviceId?: string,
  staffId?: string,
): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await rpc("book_appointment", {
    p_tenant_id: tenantId,
    p_starts_at: startsAtIso,
    p_duration_min: durationMin,
    p_customer_name: customerName || null,
    p_contact_id: contactId ?? null,
    p_service_id: serviceId ?? null,
    p_staff_id: staffId ?? null,
    p_origin: "operador",
  });
  if (error) throw new Error(error.message);
  return data as { ok: boolean; error?: string };
}

// ── helpers ────────────────────────────────────────────────────────────

export const APPT_STATUS_LABEL: Record<string, string> = {
  booked:    "Agendado",
  confirmed: "Confirmado",
  cancelled: "Cancelado",
  no_show:   "Não compareceu",
  done:      "Realizado",
};

/** Data do dia à meia-noite local do navegador. */
export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function fmtHHMM(d: Date): string {
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function fmtDayLabel(d: Date): string {
  return d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" });
}
