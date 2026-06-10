import { supabase } from "./supabase";

// contacts/conversations/appointments ainda não estão nos tipos gerados.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as unknown as { from: (t: string) => any };

export interface Cliente {
  id: string;
  tenant_id: string;
  phone_e164: string;
  name: string | null;
  tags: string[];
  opted_out: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // agregados
  last_message_at: string | null;
  total_messages: number;
  next_appointment: string | null;
}

export interface ClienteDetalhe extends Cliente {
  conversation: ConversaResumo | null;
  appointments: AgendamentoResumo[];
}

export interface ConversaResumo {
  id: string;
  state: "lena" | "human" | "paused";
  opened_at: string;
  closed_at: string | null;
  last_message_at: string | null;
  messages: MensagemResumo[];
}

export interface MensagemResumo {
  id: string;
  direction: "in" | "out";
  kind: string;
  body: string | null;
  created_at: string;
}

export interface AgendamentoResumo {
  id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  origin: string;
  customer_name: string | null;
  notes: string | null;
  service_name: string | null;
}

export async function loadClientes(tenantId: string): Promise<Cliente[]> {
  const { data, error } = await db
    .from("contacts")
    .select(
      "id,tenant_id,phone_e164,name,tags,opted_out,notes,created_at,updated_at," +
        "conversations(last_message_at)",
    )
    .eq("tenant_id", tenantId)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((c: any) => {
    const conv = c.conversations?.[0] ?? null;
    return {
      id: c.id,
      tenant_id: c.tenant_id,
      phone_e164: c.phone_e164,
      name: c.name,
      tags: c.tags ?? [],
      opted_out: c.opted_out,
      notes: c.notes,
      created_at: c.created_at,
      updated_at: c.updated_at,
      last_message_at: conv?.last_message_at ?? null,
      total_messages: 0,
      next_appointment: null,
    };
  });
}

export async function loadClienteDetalhe(
  tenantId: string,
  contactId: string,
): Promise<ClienteDetalhe | null> {
  const [contactRes, convRes, apptRes] = await Promise.all([
    db
      .from("contacts")
      .select("*")
      .eq("id", contactId)
      .eq("tenant_id", tenantId)
      .maybeSingle(),
    db
      .from("conversations")
      .select(
        "id,state,opened_at,closed_at,last_message_at," +
          "messages(id,direction,kind,body,created_at)",
      )
      .eq("contact_id", contactId)
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: true, foreignTable: "messages" })
      .maybeSingle(),
    db
      .from("appointments")
      .select(
        "id,starts_at,ends_at,status,origin,customer_name,notes," +
          "tenant_services(name)",
      )
      .eq("contact_id", contactId)
      .eq("tenant_id", tenantId)
      .order("starts_at", { ascending: false }),
  ]);

  if (contactRes.error) throw new Error(contactRes.error.message);
  if (!contactRes.data) return null;

  const c = contactRes.data;
  const conv = convRes.data;
  const appts = (apptRes.data ?? []) as any[];

  return {
    id: c.id,
    tenant_id: c.tenant_id,
    phone_e164: c.phone_e164,
    name: c.name,
    tags: c.tags ?? [],
    opted_out: c.opted_out,
    notes: c.notes,
    created_at: c.created_at,
    updated_at: c.updated_at,
    last_message_at: conv?.last_message_at ?? null,
    total_messages: conv?.messages?.length ?? 0,
    next_appointment:
      appts.find(
        (a) => a.status === "booked" && new Date(a.starts_at) > new Date(),
      )?.starts_at ?? null,
    conversation: conv
      ? {
          id: conv.id,
          state: conv.state,
          opened_at: conv.opened_at,
          closed_at: conv.closed_at,
          last_message_at: conv.last_message_at,
          messages: (conv.messages ?? []).map((m: any) => ({
            id: m.id,
            direction: m.direction,
            kind: m.kind,
            body: m.body,
            created_at: m.created_at,
          })),
        }
      : null,
    appointments: appts.map((a) => ({
      id: a.id,
      starts_at: a.starts_at,
      ends_at: a.ends_at,
      status: a.status,
      origin: a.origin,
      customer_name: a.customer_name,
      notes: a.notes,
      service_name: a.tenant_services?.name ?? null,
    })),
  };
}

export async function updateClienteNotas(
  id: string,
  notes: string,
): Promise<void> {
  const { error } = await db
    .from("contacts")
    .update({ notes: notes.trim() || null })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function updateClienteTags(
  id: string,
  tags: string[],
): Promise<void> {
  const { error } = await db
    .from("contacts")
    .update({ tags })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function toggleOptOut(
  id: string,
  opted_out: boolean,
): Promise<void> {
  const { error } = await db
    .from("contacts")
    .update({ opted_out })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

// ── helpers de formatação ──────────────────────────────────────────────────

export function fmtPhone(e164: string): string {
  const d = e164.replace(/\D/g, "").replace(/^55/, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return e164;
}

export function waUrl(e164: string): string {
  return `https://wa.me/${e164.replace(/\D/g, "")}`;
}

export const APPT_STATUS: Record<string, string> = {
  booked: "Agendado",
  confirmed: "Confirmado",
  cancelled: "Cancelado",
  no_show: "Não compareceu",
  done: "Realizado",
};

export const CONV_STATE: Record<string, string> = {
  lena: "Lena",
  human: "Humano",
  paused: "Pausado",
};
