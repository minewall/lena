export type { Database, Json } from "./types.js";
export { Constants } from "./types.js";

import type { Database } from "./types.js";

// ── Tabelas ────────────────────────────────────────────────────────────
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Tenant = Database["public"]["Tables"]["tenants"]["Row"];
export type TenantMember = Database["public"]["Tables"]["tenant_members"]["Row"];
export type TenantBrainRow = Database["public"]["Tables"]["tenant_brains"]["Row"];
export type TenantService = Database["public"]["Tables"]["tenant_services"]["Row"];
export type TenantFaq = Database["public"]["Tables"]["tenant_faqs"]["Row"];
export type TenantServiceCategory =
  Database["public"]["Tables"]["tenant_service_categories"]["Row"];
export type TenantCombo = Database["public"]["Tables"]["tenant_combos"]["Row"];
export type TenantComboItem =
  Database["public"]["Tables"]["tenant_combo_items"]["Row"];
export type TenantUnit = Database["public"]["Tables"]["tenant_units"]["Row"];

export type WaNumber = Database["public"]["Tables"]["wa_numbers"]["Row"];
export type WaTemplate = Database["public"]["Tables"]["wa_templates"]["Row"];
export type Contact = Database["public"]["Tables"]["contacts"]["Row"];
export type Conversation = Database["public"]["Tables"]["conversations"]["Row"];
export type Message = Database["public"]["Tables"]["messages"]["Row"];

// ── Inserts/Updates úteis para forms ───────────────────────────────────
export type TenantBrainUpdate = Database["public"]["Tables"]["tenant_brains"]["Update"];
export type TenantServiceInsert = Database["public"]["Tables"]["tenant_services"]["Insert"];
export type TenantFaqInsert = Database["public"]["Tables"]["tenant_faqs"]["Insert"];
export type TenantServiceCategoryInsert =
  Database["public"]["Tables"]["tenant_service_categories"]["Insert"];
export type TenantComboInsert = Database["public"]["Tables"]["tenant_combos"]["Insert"];
export type TenantComboItemInsert =
  Database["public"]["Tables"]["tenant_combo_items"]["Insert"];
export type TenantUnitInsert = Database["public"]["Tables"]["tenant_units"]["Insert"];

// ── Enums ──────────────────────────────────────────────────────────────
export type TenantRole = Database["public"]["Enums"]["tenant_role"];
export type TenantStatus = Database["public"]["Enums"]["tenant_status"];
export type TenantTone = Database["public"]["Enums"]["tenant_tone"];
export type WaNumberStatus = Database["public"]["Enums"]["wa_number_status"];
export type WaQualityRating = Database["public"]["Enums"]["wa_quality_rating"];
export type WaTemplateStatus = Database["public"]["Enums"]["wa_template_status"];
export type WaTemplateCategory = Database["public"]["Enums"]["wa_template_category"];
export type MessageDirection = Database["public"]["Enums"]["message_direction"];
export type MessageKind = Database["public"]["Enums"]["message_kind"];
export type ConversationState = Database["public"]["Enums"]["conversation_state"];
export type ComboKind = Database["public"]["Enums"]["combo_kind"];
