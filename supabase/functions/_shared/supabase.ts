import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.0";
import { getEnv } from "./env.ts";

/**
 * Cliente Supabase com SERVICE_ROLE — bypassa RLS. Use APENAS em Edge
 * Functions; nunca expor para front. Não tipado por simplicidade — as
 * Edge Functions tocam pouca superfície da tabela.
 */
export function getServiceClient() {
  const env = getEnv();
  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
