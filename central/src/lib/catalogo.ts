import type {
  TenantCombo,
  TenantComboInsert,
  TenantComboItem,
  TenantComboItemInsert,
  TenantServiceCategory,
  TenantServiceCategoryInsert,
} from "@lena/shared/db";
import { supabase } from "./supabase";

// ── Categorias (2 níveis) ──────────────────────────────────────────────
// parent_id null = nível 1; setado = subcategoria. Carrega tudo plano e a
// UI monta a árvore.
export async function loadCategories(tenantId: string) {
  const { data, error } = await supabase
    .from("tenant_service_categories")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("position", { ascending: true });
  if (error) throw error;
  return (data ?? []) as TenantServiceCategory[];
}

export async function insertCategory(input: TenantServiceCategoryInsert) {
  const { data, error } = await supabase
    .from("tenant_service_categories")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as TenantServiceCategory;
}

export async function updateCategory(
  id: string,
  patch: Partial<TenantServiceCategory>,
) {
  const { error } = await supabase
    .from("tenant_service_categories")
    .update(patch)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteCategory(id: string) {
  const { error } = await supabase
    .from("tenant_service_categories")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

// ── Combos ─────────────────────────────────────────────────────────────
export type ComboWithItems = TenantCombo & { items: TenantComboItem[] };

export async function loadCombos(tenantId: string): Promise<ComboWithItems[]> {
  const { data, error } = await supabase
    .from("tenant_combos")
    .select("*, items:tenant_combo_items(*)")
    .eq("tenant_id", tenantId)
    .order("position", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((c) => ({
    ...(c as TenantCombo),
    items: ((c as { items?: TenantComboItem[] }).items ?? []).sort(
      (a, b) => a.position - b.position,
    ),
  }));
}

export async function insertCombo(input: TenantComboInsert) {
  const { data, error } = await supabase
    .from("tenant_combos")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as TenantCombo;
}

export async function updateCombo(id: string, patch: Partial<TenantCombo>) {
  const { error } = await supabase.from("tenant_combos").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteCombo(id: string) {
  const { error } = await supabase.from("tenant_combos").delete().eq("id", id);
  if (error) throw error;
}

// Substitui a lista de itens do combo de uma vez (apaga e reinsere).
export async function setComboItems(
  comboId: string,
  tenantId: string,
  items: { service_id: string; qty: number }[],
) {
  const { error: delErr } = await supabase
    .from("tenant_combo_items")
    .delete()
    .eq("combo_id", comboId);
  if (delErr) throw delErr;
  if (items.length === 0) return;
  const rows: TenantComboItemInsert[] = items.map((it, i) => ({
    combo_id: comboId,
    tenant_id: tenantId,
    service_id: it.service_id,
    qty: it.qty,
    position: i,
  }));
  const { error: insErr } = await supabase.from("tenant_combo_items").insert(rows);
  if (insErr) throw insErr;
}
