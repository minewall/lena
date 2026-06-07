// ==========================================================================
// GERADO POR scripts/sync-edge-shared.mjs — NÃO EDITAR À MÃO.
// Fonte: packages/shared/src/wa/<file>.ts
// ==========================================================================
/**
 * Helpers de telefone. A Meta entrega números sem "+" no payload
 * ("5511999999999"); nosso schema usa E.164 com "+".
 */

export function toE164(raw: string): string {
  const cleaned = raw.replace(/[^\d]/g, "");
  if (!cleaned) return "";
  return cleaned.startsWith("+") ? cleaned : `+${cleaned}`;
}

export function stripPlus(e164: string): string {
  return e164.replace(/^\+/, "");
}
