export type { Database, Json } from "./types.js";
export { Constants } from "./types.js";

import type { Database } from "./types.js";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Tenant = Database["public"]["Tables"]["tenants"]["Row"];
export type TenantMember = Database["public"]["Tables"]["tenant_members"]["Row"];
export type TenantRole = Database["public"]["Enums"]["tenant_role"];
export type TenantStatus = Database["public"]["Enums"]["tenant_status"];
