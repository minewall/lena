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
  starts_at: string;
  ends_at: string;
  status: "booked" | "confirmed" | "cancelled" | "no_show" | "done";
  origin: "lena" | "operador" | "externo";
  customer_name: string | null;
  notes: string | null;
  contact?: { phone_e164: string; name: string | null } | null;
  service?: { name: string } | null;
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

// ── appointments ───────────────────────────────────────────────────────
export async function loadUpcomingAppointments(
  tenantId: string,
): Promise<Appointment[]> {
  const { data, error } = await db.from("appointments")
    .select(
      `*, contact:contacts(phone_e164, name), service:tenant_services(name)`,
    )
    .eq("tenant_id", tenantId)
    .in("status", ["booked", "confirmed"])
    .gte("ends_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as unknown as Appointment[];
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
): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await rpc("book_appointment", {
    p_tenant_id: tenantId,
    p_starts_at: startsAtIso,
    p_duration_min: durationMin,
    p_customer_name: customerName,
    p_origin: "operador",
  });
  if (error) throw new Error(error.message);
  return data as { ok: boolean; error?: string };
}
