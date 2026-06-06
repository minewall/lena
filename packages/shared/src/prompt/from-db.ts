import type { TenantBrain } from "./types.js";
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
export function brainRecordToPrompt(
  brain: TenantBrainRow,
  services: TenantService[],
): TenantBrain {
  return {
    name: brain.business_name,
    segment: brain.segment,
    hours: brain.hours ?? "",
    tone: brain.tone,
    promo: brain.promo ?? "",
    extras: brain.extras ?? "",
    services: services
      .filter((s) => s.active)
      .sort((a, b) => a.position - b.position)
      .map((s) => ({
        n: s.name,
        p: formatPriceBRL(s.price_cents),
      })),
  };
}
