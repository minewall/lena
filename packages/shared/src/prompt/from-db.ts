import type { TeamMember, TenantBrain } from "./types.js";
import type { TenantBrainRow, TenantService } from "../db/index.js";

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

export function brainRecordToPrompt(
  brain: TenantBrainRow,
  services: TenantService[],
): TenantBrain {
  const b = brain as BrainExtra;
  return {
    name: brain.business_name,
    segment: brain.segment,
    hours: brain.hours ?? "",
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
      })),
  };
}
