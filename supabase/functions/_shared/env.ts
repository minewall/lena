/**
 * Leitura segura de env vars. Em Edge Functions do Supabase, `SUPABASE_URL`
 * e `SUPABASE_SERVICE_ROLE_KEY` vêm preenchidos automaticamente. As demais
 * precisam ser configuradas via `supabase secrets set ...` ou no painel.
 */

function need(key: string): string {
  const v = Deno.env.get(key);
  if (!v) throw new Error(`missing env: ${key}`);
  return v;
}

export function getEnv() {
  return {
    supabaseUrl: need("SUPABASE_URL"),
    supabaseServiceRoleKey: need("SUPABASE_SERVICE_ROLE_KEY"),
    metaAppSecret: need("META_APP_SECRET"),
    metaVerifyToken: need("META_VERIFY_TOKEN"),
  };
}
