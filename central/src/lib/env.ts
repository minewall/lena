function required(key: string): string {
  const value = import.meta.env[key];
  if (!value || typeof value !== "string") {
    throw new Error(
      `Variável de ambiente ${key} não definida. Verifique central/.env (ver .env.example).`,
    );
  }
  return value;
}

export const env = {
  supabaseUrl: required("VITE_LENA_SUPABASE_URL"),
  supabasePublishableKey: required("VITE_LENA_SUPABASE_PUBLISHABLE_KEY"),
};
