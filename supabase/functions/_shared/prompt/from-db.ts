// ==========================================================================
// GERADO POR scripts/sync-edge-shared.mjs — NÃO EDITAR À MÃO.
// Fonte: packages/shared/src/<subpkg>/<file>.ts
// ==========================================================================
import type { BrainCombo, TeamMember, TenantBrain } from "./types.ts";
import type { TenantBrainRow, TenantService } from "../db/index.ts";

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
};

function parseTeamPublic(value: unknown): TeamMember[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((m) => {
      if (m && typeof m === "object") {
        const obj = m as { name?: unknown; role?: unknown };
        return {
          name: typeof obj.name === "string" ? obj.name : undefined,
          role: typeof obj.role === "string" ? obj.role : undefined,
        };
      }
      return {};
    })
    .filter((m) => m.name && m.name.trim().length > 0);
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
): TenantBrain {
  const b = brain as BrainExtra;
  const catLabel = categoryLabels(categories);
  const serviceNames = new Map(services.map((s) => [s.id, s.name]));
  return {
    name: brain.business_name,
    segment: brain.segment,
    hours: brain.hours ?? "",
    address: brain.address ?? "",
    parking: b.parking ?? "",
    landmark: b.landmark ?? "",
    tone: brain.tone,
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
