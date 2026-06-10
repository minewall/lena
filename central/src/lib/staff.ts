import { supabase } from "./supabase";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as unknown as { from: (t: string) => any };

export interface Staff {
  id: string;
  tenant_id: string;
  name: string;
  role: string | null;
  color: string;
  active: boolean;
  position: number;
}

/** Paleta fixa de 10 cores — uma por profissional. */
export const STAFF_COLORS = [
  { name: "Azul",      hex: "#579bfc" },
  { name: "Verde",     hex: "#4e9e78" },
  { name: "Laranja",   hex: "#fdab3d" },
  { name: "Rosa",      hex: "#e879a0" },
  { name: "Roxo",      hex: "#9d50dd" },
  { name: "Teal",      hex: "#0ca678" },
  { name: "Terracota", hex: "#d9613a" },
  { name: "Índigo",    hex: "#6366f1" },
  { name: "Âmbar",     hex: "#d97706" },
  { name: "Cinza",     hex: "#6b7280" },
] as const;

/** Escolhe a próxima cor da paleta não usada ainda. */
export function nextColor(usedColors: string[]): string {
  const free = STAFF_COLORS.find((c) => !usedColors.includes(c.hex));
  return free?.hex ?? STAFF_COLORS[0].hex;
}

export async function loadStaff(tenantId: string): Promise<Staff[]> {
  const { data, error } = await db
    .from("tenant_staff")
    .select("id,tenant_id,name,role,color,active,position")
    .eq("tenant_id", tenantId)
    .eq("active", true)
    .order("position", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Staff[];
}

export async function loadAllStaff(tenantId: string): Promise<Staff[]> {
  const { data, error } = await db
    .from("tenant_staff")
    .select("id,tenant_id,name,role,color,active,position")
    .eq("tenant_id", tenantId)
    .order("position", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Staff[];
}

export async function createStaff(
  tenantId: string,
  name: string,
  role: string,
  color: string,
  position: number,
): Promise<Staff> {
  const { data, error } = await db
    .from("tenant_staff")
    .insert({ tenant_id: tenantId, name: name.trim(), role: role.trim() || null, color, position })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Staff;
}

export async function updateStaff(
  id: string,
  patch: Partial<Pick<Staff, "name" | "role" | "color" | "active" | "position">>,
): Promise<void> {
  const { error } = await db.from("tenant_staff").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteStaff(id: string): Promise<void> {
  const { error } = await db
    .from("tenant_staff")
    .update({ active: false })
    .eq("id", id);
  if (error) throw new Error(error.message);
}
