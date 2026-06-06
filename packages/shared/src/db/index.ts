export type { Database, Json } from "./types.js";
export { Constants } from "./types.js";

import type { Database } from "./types.js";

// Linhas das tabelas
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Tenant = Database["public"]["Tables"]["tenants"]["Row"];
export type TenantMember = Database["public"]["Tables"]["tenant_members"]["Row"];
// Renomeado para não colidir com o tipo TenantBrain do prompt-builder
// (que descreve o INPUT do prompt e tem shape diferente).
export type TenantBrainRow = Database["public"]["Tables"]["tenant_brains"]["Row"];
export type TenantService = Database["public"]["Tables"]["tenant_services"]["Row"];
export type TenantFaq = Database["public"]["Tables"]["tenant_faqs"]["Row"];

// Inserts/Updates úteis para forms
export type TenantBrainUpdate = Database["public"]["Tables"]["tenant_brains"]["Update"];
export type TenantServiceInsert = Database["public"]["Tables"]["tenant_services"]["Insert"];
export type TenantFaqInsert = Database["public"]["Tables"]["tenant_faqs"]["Insert"];

// Enums
export type TenantRole = Database["public"]["Enums"]["tenant_role"];
export type TenantStatus = Database["public"]["Enums"]["tenant_status"];
export type TenantTone = Database["public"]["Enums"]["tenant_tone"];
