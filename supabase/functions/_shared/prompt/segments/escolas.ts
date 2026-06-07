// ==========================================================================
// GERADO POR scripts/sync-edge-shared.mjs — NÃO EDITAR À MÃO.
// Fonte: packages/shared/src/<subpkg>/<file>.ts
// ==========================================================================
import type { TenantBrain } from "../types.ts";

/**
 * Brain seed para escolas — segmento-foco do piloto da Central.
 * Usado como exemplo padrão no onboarding de novos tenants do segmento "escola".
 * O dono da escola substitui pelos dados reais; este seed só evita tela em branco.
 */
export const ESCOLAS_BRAIN_SEED: TenantBrain = {
  segment: "escola",
  tone: "Acolhedor",
  hours: "segunda a sexta, das 8h às 17h30",
  services: [
    { n: "Visita à escola", p: "sem custo" },
    { n: "Matrícula", p: "sob consulta" },
    { n: "Aulas regulares", p: "mensalidade conforme série" },
  ],
  promo: "",
  extras:
    "Para visita: pergunte nome do responsável, idade da criança e série pretendida antes de oferecer horários.",
};
