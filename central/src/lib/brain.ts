import type {
  TenantBrainRow,
  TenantBrainUpdate,
  TenantFaq,
  TenantFaqInsert,
  TenantService,
  TenantServiceInsert,
} from "@lena/shared/db";
import { supabase } from "./supabase";

export async function loadBrain(tenantId: string) {
  const { data, error } = await supabase
    .from("tenant_brains")
    .select("*")
    .eq("tenant_id", tenantId)
    .single();
  if (error) throw error;
  return data as TenantBrainRow;
}

export async function updateBrain(tenantId: string, patch: TenantBrainUpdate) {
  const { data, error } = await supabase
    .from("tenant_brains")
    .update(patch)
    .eq("tenant_id", tenantId)
    .select()
    .single();
  if (error) throw error;
  return data as TenantBrainRow;
}

// ── Services ───────────────────────────────────────────────────────────
export async function loadServices(tenantId: string) {
  const { data, error } = await supabase
    .from("tenant_services")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("position", { ascending: true });
  if (error) throw error;
  return (data ?? []) as TenantService[];
}

export async function insertService(input: TenantServiceInsert) {
  const { data, error } = await supabase
    .from("tenant_services")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as TenantService;
}

export async function updateService(
  id: string,
  patch: Partial<TenantService>,
) {
  const { error } = await supabase
    .from("tenant_services")
    .update(patch)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteService(id: string) {
  const { error } = await supabase
    .from("tenant_services")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

// ── FAQs ───────────────────────────────────────────────────────────────
export async function loadFaqs(tenantId: string) {
  const { data, error } = await supabase
    .from("tenant_faqs")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("position", { ascending: true });
  if (error) throw error;
  return (data ?? []) as TenantFaq[];
}

export async function insertFaq(input: TenantFaqInsert) {
  const { data, error } = await supabase
    .from("tenant_faqs")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as TenantFaq;
}

export async function updateFaq(id: string, patch: Partial<TenantFaq>) {
  const { error } = await supabase.from("tenant_faqs").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteFaq(id: string) {
  const { error } = await supabase.from("tenant_faqs").delete().eq("id", id);
  if (error) throw error;
}
