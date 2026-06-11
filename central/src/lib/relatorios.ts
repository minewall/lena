import { supabase } from "./supabase";

export interface SentimentRow {
  sentiment: "positivo" | "neutro" | "negativo";
  n: number;
}
export interface EffortRow {
  desfecho: "agendamento" | "transferencia" | "finalizada" | "em_andamento";
  n: number;
  trocas_medias: number;
}
export interface FunnelRow {
  hora: number;
  tipo: string;
  n: number;
  agendamentos: number;
}
export interface AttendanceReport {
  total: number;
  classificadas: number;
  sentiment: SentimentRow[];
  effort: EffortRow[];
  funnel: FunnelRow[];
}

// attendance_report ainda não está nos tipos gerados; cast localizado (mesmo
// padrão de dashboard_stats).
export async function loadAttendanceReport(
  tenantId: string,
  days = 30,
): Promise<AttendanceReport> {
  const { data, error } = await (
    supabase.rpc as unknown as (
      fn: string,
      args: Record<string, unknown>,
    ) => Promise<{ data: unknown; error: { message: string } | null }>
  )("attendance_report", { p_tenant_id: tenantId, p_days: days });
  if (error) throw new Error(error.message);
  return data as AttendanceReport;
}
