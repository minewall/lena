import { supabase } from "./supabase";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rpc = supabase.rpc.bind(supabase) as unknown as (
  fn: string,
  args?: Record<string, unknown>,
) => Promise<{ data: unknown; error: { message: string } | null }>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as unknown as { from: (t: string) => any };

export type TenantHealth = "saudavel" | "em_risco" | "inativo";

export interface TenantSummary {
  id: string;
  name: string;
  segment: string;
  slug: string;
  status: string;
  created_at: string;
  last_message_at: string | null;
  messages_30d: number;
  conversations_30d: number;
  cost_micro_usd_30d: number;
  health: TenantHealth;
}

export interface TenantNote {
  id: string;
  tenant_id: string;
  author_id: string | null;
  author_name: string | null;
  body: string;
  created_at: string;
}

export interface TenantMember {
  user_id: string;
  email: string;
  full_name: string | null;
  role: string;
  accepted_at: string | null;
}

export interface TenantDetalhe extends TenantSummary {
  members: TenantMember[];
  notes: TenantNote[];
  // stats do dashboard (reutiliza dashboard_stats existente)
  dash: DashStats | null;
}

export interface DashStats {
  conversations_period: number;
  messages_in: number;
  messages_out: number;
  lena_out: number;
  contacts_new: number;
  cost_micro_usd: number;
  avg_response_seconds: number;
  needs_attention: number;
}

function calcHealth(lastMessageAt: string | null): TenantHealth {
  if (!lastMessageAt) return "inativo";
  const days = Math.floor(
    (Date.now() - new Date(lastMessageAt).getTime()) / 86_400_000,
  );
  if (days <= 7) return "saudavel";
  if (days <= 30) return "em_risco";
  return "inativo";
}

export const HEALTH_META: Record<
  TenantHealth,
  { label: string; dot: string; text: string }
> = {
  saudavel:  { label: "Saudável",  dot: "#4e9e78", text: "text-salvia" },
  em_risco:  { label: "Em risco",  dot: "#fdab3d", text: "text-amber-500" },
  inativo:   { label: "Inativo",   dot: "#d9613a", text: "text-terracota" },
};

export const STATUS_LABEL: Record<string, string> = {
  active:   "Ativo",
  paused:   "Pausado",
  archived: "Arquivado",
};

export const SEG_LABEL: Record<string, string> = {
  escola:   "Escola",
  clinica:  "Clínica",
  salao:    "Salão",
  petshop:  "Petshop",
  outro:    "Outro",
};

export function fmtCost(microUsd: number): string {
  const brl = (microUsd / 1_000_000) * 5.8;
  if (brl < 0.01) return "< R$ 0,01";
  return `R$ ${brl.toFixed(2).replace(".", ",")}`;
}

// ── Queries ────────────────────────────────────────────────────────────────

export async function loadTenantSummaries(): Promise<TenantSummary[]> {
  const [tenantsRes, statsRes] = await Promise.all([
    db
      .from("tenants")
      .select("id,name,segment,slug,status,created_at")
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    rpc("platform_tenant_stats", { p_days: 30 }),
  ]);

  if (tenantsRes.error) throw new Error(tenantsRes.error.message);
  if (statsRes.error) throw new Error(statsRes.error.message);

  const statsMap = new Map<string, any>();
  for (const s of (statsRes.data as any[]) ?? []) {
    statsMap.set(s.tenant_id, s);
  }

  return ((tenantsRes.data ?? []) as any[]).map((t) => {
    const s = statsMap.get(t.id);
    const lastMsg = s?.last_message_at ?? null;
    return {
      id: t.id,
      name: t.name,
      segment: t.segment,
      slug: t.slug,
      status: t.status,
      created_at: t.created_at,
      last_message_at: lastMsg,
      messages_30d: Number(s?.messages_30d ?? 0),
      conversations_30d: Number(s?.conversations_30d ?? 0),
      cost_micro_usd_30d: Number(s?.cost_micro_usd_30d ?? 0),
      health: calcHealth(lastMsg),
    };
  });
}

export async function loadTenantDetalhe(
  tenantId: string,
): Promise<TenantDetalhe | null> {
  const [tenantRes, statsRes, membersRes, notesRes, dashRes] =
    await Promise.all([
      db
        .from("tenants")
        .select("id,name,segment,slug,status,created_at")
        .eq("id", tenantId)
        .maybeSingle(),
      rpc("platform_tenant_stats", { p_days: 30 }),
      rpc("list_tenant_members", { p_tenant_id: tenantId }),
      db
        .from("tenant_notes")
        .select(
          "id,tenant_id,author_id,body,created_at," +
            "profiles(full_name)",
        )
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false }),
      rpc("dashboard_stats", { p_tenant_id: tenantId, p_days: 30 }),
    ]);

  if (tenantRes.error) throw new Error(tenantRes.error.message);
  if (!tenantRes.data) return null;

  const t = tenantRes.data as any;

  const s = ((statsRes.data as any[]) ?? []).find(
    (x) => x.tenant_id === tenantId,
  );
  const lastMsg = s?.last_message_at ?? null;

  const members: TenantMember[] = (
    (membersRes.data as any[]) ?? []
  ).map((m) => ({
    user_id: m.user_id,
    email: m.email,
    full_name: m.full_name,
    role: m.role,
    accepted_at: m.accepted_at,
  }));

  const notes: TenantNote[] = ((notesRes.data as any[]) ?? []).map(
    (n) => ({
      id: n.id,
      tenant_id: n.tenant_id,
      author_id: n.author_id,
      author_name: (n.profiles as any)?.full_name ?? null,
      body: n.body,
      created_at: n.created_at,
    }),
  );

  const d = dashRes.data as any;

  return {
    id: t.id,
    name: t.name,
    segment: t.segment,
    slug: t.slug,
    status: t.status,
    created_at: t.created_at,
    last_message_at: lastMsg,
    messages_30d: Number(s?.messages_30d ?? 0),
    conversations_30d: Number(s?.conversations_30d ?? 0),
    cost_micro_usd_30d: Number(s?.cost_micro_usd_30d ?? 0),
    health: calcHealth(lastMsg),
    members,
    notes,
    dash: d
      ? {
          conversations_period: d.conversations_period ?? 0,
          messages_in: d.messages_in ?? 0,
          messages_out: d.messages_out ?? 0,
          lena_out: d.lena_out ?? 0,
          contacts_new: d.contacts_new ?? 0,
          cost_micro_usd: d.cost_micro_usd ?? 0,
          avg_response_seconds: d.avg_response_seconds ?? 0,
          needs_attention: d.needs_attention ?? 0,
        }
      : null,
  };
}

export async function addTenantNote(
  tenantId: string,
  authorId: string,
  body: string,
): Promise<void> {
  const { error } = await db.from("tenant_notes").insert({
    tenant_id: tenantId,
    author_id: authorId,
    body: body.trim(),
  });
  if (error) throw new Error(error.message);
}

export async function updateTenantStatus(
  tenantId: string,
  status: string,
): Promise<void> {
  const { error } = await db
    .from("tenants")
    .update({ status })
    .eq("id", tenantId);
  if (error) throw new Error(error.message);
}
