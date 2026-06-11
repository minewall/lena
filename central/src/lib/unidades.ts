import type { TenantUnit, TenantUnitInsert } from "@lena/shared/db";
import { supabase } from "./supabase";

/** Comodidades canônicas (genéricas p/ qualquer negócio). key → rótulo. */
export const AMENITIES: { key: string; label: string }[] = [
  { key: "elevator", label: "Elevador" },
  { key: "electronic_gate", label: "Portaria eletrônica" },
  { key: "accessibility", label: "Acessibilidade (rampa/cadeirante)" },
  { key: "ac", label: "Ar-condicionado" },
  { key: "wifi", label: "Wi-Fi" },
  { key: "coffee", label: "Café" },
  { key: "drinks", label: "Água e bebidas" },
  { key: "phone_charging", label: "Carregador de celular" },
  { key: "workstation", label: "Estação de trabalho" },
];

export type Amenities = Record<string, boolean>;

export async function loadUnits(tenantId: string) {
  const { data, error } = await supabase
    .from("tenant_units")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("position", { ascending: true });
  if (error) throw error;
  return (data ?? []) as TenantUnit[];
}

export async function insertUnit(input: TenantUnitInsert) {
  const { data, error } = await supabase
    .from("tenant_units")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as TenantUnit;
}

export async function updateUnit(id: string, patch: Partial<TenantUnit>) {
  const { data, error } = await supabase
    .from("tenant_units")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as TenantUnit;
}

export async function deleteUnit(id: string) {
  const { error } = await supabase.from("tenant_units").delete().eq("id", id);
  if (error) throw error;
}

/** Torna `id` a unidade primária (zera as outras antes p/ não violar o índice). */
export async function setPrimaryUnit(tenantId: string, id: string) {
  const { error: clearErr } = await supabase
    .from("tenant_units")
    .update({ is_primary: false })
    .eq("tenant_id", tenantId)
    .neq("id", id);
  if (clearErr) throw clearErr;
  const { error } = await supabase
    .from("tenant_units")
    .update({ is_primary: true })
    .eq("id", id);
  if (error) throw error;
}
