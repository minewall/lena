import { supabase } from "./supabase";

export interface DashboardStats {
  period_days: number;
  conversations_period: number;
  conversations_today: number;
  messages_in: number;
  messages_out: number;
  lena_out: number;
  operator_out: number;
  needs_attention: number;
  active_open: number;
  contacts_new: number;
  cost_micro_usd: number;
  cost_brl_approx: number;
  avg_response_seconds: number;
}

export async function loadDashboardStats(
  tenantId: string,
  days = 7,
): Promise<DashboardStats> {
  // dashboard_stats ainda não está nos tipos gerados; cast localizado.
  const { data, error } = await (
    supabase.rpc as unknown as (
      fn: string,
      args: Record<string, unknown>,
    ) => Promise<{ data: unknown; error: { message: string } | null }>
  )("dashboard_stats", { p_tenant_id: tenantId, p_days: days });
  if (error) throw new Error(error.message);
  return data as DashboardStats;
}

/** Receita agendada pela Lena no período: soma dos preços dos serviços de
    agendamentos criados por ela (booked/confirmed/done). É a métrica-herói
    do Hoje — o que a Lena colocou na agenda em R$. */
export async function loadLenaBookedRevenue(
  tenantId: string,
  days = 7,
): Promise<{ totalCents: number; count: number }> {
  const from = new Date();
  from.setDate(from.getDate() - days);
  const { data, error } = await supabase
    .from("appointments")
    .select("id, service:tenant_services(price_cents)")
    .eq("tenant_id", tenantId)
    .eq("origin", "lena")
    .in("status", ["booked", "confirmed", "done"])
    .gte("created_at", from.toISOString());
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as unknown as { service: { price_cents: number | null } | null }[];
  return {
    totalCents: rows.reduce((sum, r) => sum + (r.service?.price_cents ?? 0), 0),
    count: rows.length,
  };
}
