import type {
  TenantBrainRow as BaseTenantBrainRow,
  TenantBrainUpdate as BaseTenantBrainUpdate,
  TenantFaq,
  TenantFaqInsert,
  TenantService,
  TenantServiceInsert,
} from "@lena/shared/db";
import { supabase } from "./supabase";

// Campos adicionados por migration; estende os tipos gerados até a próxima
// regeneração de @lena/shared/db.
export interface TeamMemberRow {
  name: string;
  role: string;
}

export type TenantBrainRow = BaseTenantBrainRow & {
  ai_model: string;
  parking: string | null;
  landmark: string | null;
  restrictions: string | null;
  escalation_triggers: string[];
  team_public: TeamMemberRow[];
  team_private: string | null;
};

export type TenantBrainUpdate = BaseTenantBrainUpdate & {
  ai_model?: string;
  parking?: string | null;
  landmark?: string | null;
  restrictions?: string | null;
  escalation_triggers?: string[];
  team_public?: TeamMemberRow[];
  team_private?: string | null;
};

export async function loadBrain(tenantId: string) {
  const { data, error } = await supabase
    .from("tenant_brains")
    .select("*")
    .eq("tenant_id", tenantId)
    .single();
  if (error) throw error;
  return data as unknown as TenantBrainRow;
}

export async function updateBrain(tenantId: string, patch: TenantBrainUpdate) {
  const { data, error } = await supabase
    .from("tenant_brains")
    .update(patch as never)
    .eq("tenant_id", tenantId)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as TenantBrainRow;
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
