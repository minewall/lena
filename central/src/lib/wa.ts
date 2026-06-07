import type { WaNumber } from "@lena/shared/db";
import { supabase } from "./supabase";

export async function loadWaNumber(tenantId: string): Promise<WaNumber | null> {
  const { data, error } = await supabase
    .from("wa_numbers")
    .select("*")
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (error) throw error;
  return (data as WaNumber | null) ?? null;
}

export interface SaveWaConfigInput {
  tenantId: string;
  phoneE164: string;
  displayName: string;
  phoneNumberId: string;
  wabaId: string;
  systemUserToken: string;
  verifyToken: string;
  provider?: string;
}

export async function saveWaConfig(input: SaveWaConfigInput): Promise<string> {
  const { data, error } = await supabase.rpc("set_tenant_wa_config", {
    p_tenant_id: input.tenantId,
    p_phone_e164: input.phoneE164,
    p_display_name: input.displayName,
    p_phone_number_id: input.phoneNumberId,
    p_waba_id: input.wabaId,
    p_system_user_token: input.systemUserToken,
    p_verify_token: input.verifyToken,
    p_provider: input.provider ?? "meta_cloud",
  });
  if (error) throw error;
  return data as string;
}

export function webhookUrl(supabaseUrl: string): string {
  return `${supabaseUrl}/functions/v1/wa-webhook`;
}
