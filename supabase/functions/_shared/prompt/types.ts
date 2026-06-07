// ==========================================================================
// GERADO POR scripts/sync-edge-shared.mjs — NÃO EDITAR À MÃO.
// Fonte: packages/shared/src/<subpkg>/<file>.ts
// ==========================================================================
export type Tone = "Acolhedor" | "Profissional" | "Descontraído";

export interface BrainService {
  n?: string;
  p?: string;
}

export interface TenantBrain {
  name?: string;
  segment?: string;
  hours?: string;
  services?: BrainService[];
  promo?: string;
  extras?: string;
  tone?: Tone | string;
}
