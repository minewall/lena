// ==========================================================================
// GERADO POR scripts/sync-edge-shared.mjs — NÃO EDITAR À MÃO.
// Fonte: packages/shared/src/<subpkg>/<file>.ts
// ==========================================================================
import type { Tone } from "../prompt/types.ts";

export const TONES: Record<string, string> = {
  Acolhedor: "calorosa, próxima e simpática",
  Profissional: "elegante, profissional e cordial",
  Descontraído: "leve, descontraída e jovem",
};

export const TONE_KEYS: Tone[] = ["Acolhedor", "Profissional", "Descontraído"];

export function describeTone(tone?: string): string {
  return TONES[tone ?? ""] ?? TONES.Acolhedor;
}
