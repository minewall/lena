import type { BrainCombo, TeamMember, TenantBrain } from "./types.js";
import type { TenantBrainRow, TenantService } from "../db/index.js";

/** Categoria mínima para montar o rótulo hierárquico. */
interface CategoryLite {
  id: string;
  parent_id: string | null;
  name: string;
}

/** Combo mínimo (combo + itens) vindo do banco. */
interface ComboLite {
  name: string;
  kind: "pacote" | "condicional";
  description: string | null;
  price_cents: number | null;
  discount_pct: number | null;
  trigger_service_id: string | null;
  active?: boolean;
  items: { service_id: string; qty: number }[];
}

/** Unidade mínima vinda do banco. */
interface UnitLite {
  name: string;
  is_primary: boolean;
  address: string | null;
  floor: string | null;
  landmark: string | null;
  parking: string | null;
  amenities: Record<string, boolean> | null;
  active: boolean;
}

/** Comodidades: key → rótulo legível (mesma lista do front lib/unidades). */
const AMENITY_LABELS: Record<string, string> = {
  elevator: "elevador",
  electronic_gate: "portaria eletrônica",
  accessibility: "acessibilidade",
  ac: "ar-condicionado",
  wifi: "wi-fi",
  coffee: "café",
  drinks: "água e bebidas",
  phone_charging: "carregador de celular",
  workstation: "estação de trabalho",
};

function amenityLabels(amenities: Record<string, boolean> | null): string[] {
  if (!amenities) return [];
  return Object.entries(amenities)
    .filter(([, on]) => on)
    .map(([k]) => AMENITY_LABELS[k] ?? k);
}

function formatPriceBRL(cents: number | null | undefined): string {
  if (cents == null) return "";
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/**
 * Converte os registros do banco (tenant_brains + tenant_services) no
 * shape de TenantBrain que o buildDemoSystem / buildSystem consome.
 *
 * Regras:
 * - Apenas serviços ativos entram, ordenados por position.
 * - Preço em centavos vira moeda BRL ("R$ 180,00"); null vira "sob consulta"
 *   (string vazia faz o prompt-builder cair no default).
 * - hours/promo/extras nulos viram strings vazias.
 */
// Campos adicionados por migration que ainda não estão nos tipos gerados.
type BrainExtra = TenantBrainRow & {
  parking?: string | null;
  landmark?: string | null;
  restrictions?: string | null;
  escalation_triggers?: string[] | null;
  team_public?: unknown;
  team_private?: string | null;
  persona_age?: number | null;
  payments?: unknown;
};

function parseTeamPublic(value: unknown): TeamMember[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((m) => {
      if (m && typeof m === "object") {
        const obj = m as { name?: unknown; role?: unknown; spec?: unknown };
        return {
          name: typeof obj.name === "string" ? obj.name : undefined,
          role: typeof obj.role === "string" ? obj.role : undefined,
          spec: typeof obj.spec === "string" ? obj.spec : undefined,
        };
      }
      return {};
    })
    .filter((m) => m.name && m.name.trim().length > 0);
}

function parsePayments(value: unknown): TenantBrain["payments"] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const p = value as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);
  const methods = Array.isArray(p.methods)
    ? (p.methods.filter((m) => typeof m === "string") as string[])
    : [];
  const out = {
    methods,
    pixKeyType: str(p.pix_key_type),
    pixKey: str(p.pix_key),
    bank: str(p.bank),
    agency: str(p.agency),
    account: str(p.account),
    holder: str(p.holder),
    note: str(p.note),
  };
  const hasAny =
    methods.length > 0 || out.pixKey || out.bank || out.note || out.holder;
  return hasAny ? out : undefined;
}

/** id da categoria → rótulo "Categoria › Subcategoria". */
function categoryLabels(categories: CategoryLite[]): Map<string, string> {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const out = new Map<string, string>();
  for (const c of categories) {
    const parent = c.parent_id ? byId.get(c.parent_id) : null;
    out.set(c.id, parent ? `${parent.name} › ${c.name}` : c.name);
  }
  return out;
}

function combosToPrompt(
  combos: ComboLite[],
  serviceNames: Map<string, string>,
): BrainCombo[] {
  return combos
    .filter((c) => c.active !== false && c.name?.trim())
    .map((c) => {
      const items = (c.items ?? []).map((it) => {
        const name = serviceNames.get(it.service_id) ?? "serviço";
        return it.qty > 1 ? `${name} x${it.qty}` : name;
      });
      return {
        name: c.name,
        kind: c.kind,
        desc: c.description ?? undefined,
        price: c.kind === "pacote" ? formatPriceBRL(c.price_cents) : undefined,
        discount:
          c.kind === "condicional" && c.discount_pct != null
            ? Number(c.discount_pct)
            : undefined,
        trigger:
          c.kind === "condicional" && c.trigger_service_id
            ? serviceNames.get(c.trigger_service_id)
            : undefined,
        items,
      };
    });
}

export function brainRecordToPrompt(
  brain: TenantBrainRow,
  services: TenantService[],
  categories: CategoryLite[] = [],
  combos: ComboLite[] = [],
  units: UnitLite[] = [],
): TenantBrain {
  const b = brain as BrainExtra;
  const catLabel = categoryLabels(categories);
  const serviceNames = new Map(services.map((s) => [s.id, s.name]));

  // Localização: prefere a unidade primária; cai nos campos do brain (legado)
  // quando não há unidades cadastradas.
  const activeUnits = units.filter((u) => u.active);
  const primary =
    activeUnits.find((u) => u.is_primary) ?? activeUnits[0] ?? null;
  const others = activeUnits
    .filter((u) => u !== primary && String(u.address || "").trim())
    .map((u) => ({ name: u.name, address: u.address ?? undefined }));

  return {
    name: brain.business_name,
    segment: brain.segment,
    hours: brain.hours ?? "",
    address: (primary?.address ?? brain.address) ?? "",
    parking: (primary?.parking ?? b.parking) ?? "",
    landmark: (primary?.landmark ?? b.landmark) ?? "",
    floor: primary?.floor ?? "",
    amenities: amenityLabels(primary?.amenities ?? null),
    otherUnits: others,
    tone: brain.tone,
    personaAge: b.persona_age ?? undefined,
    payments: parsePayments(b.payments),
    promo: brain.promo ?? "",
    extras: brain.extras ?? "",
    restrictions: b.restrictions ?? "",
    escalationTriggers: Array.isArray(b.escalation_triggers)
      ? b.escalation_triggers
      : [],
    teamPublic: parseTeamPublic(b.team_public),
    teamPrivate: b.team_private ?? "",
    services: services
      .filter((s) => s.active)
      .sort((a, b) => a.position - b.position)
      .map((s) => ({
        n: s.name,
        p: formatPriceBRL(s.price_cents),
        cat: s.category_id ? catLabel.get(s.category_id) : undefined,
        dur: s.duration_min ?? undefined,
        prep: s.prep_instructions?.trim() || undefined,
        sessions: s.default_sessions && s.default_sessions > 1 ? s.default_sessions : undefined,
        interval: s.session_interval_days ?? undefined,
      })),
    combos: combosToPrompt(combos, serviceNames),
  };
}
