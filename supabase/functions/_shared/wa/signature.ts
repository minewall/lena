// ==========================================================================
// GERADO POR scripts/sync-edge-shared.mjs — NÃO EDITAR À MÃO.
// Fonte: packages/shared/src/<subpkg>/<file>.ts
// ==========================================================================
/**
 * Validação de X-Hub-Signature-256 da Meta.
 * Formato do header: "sha256=<hex_hmac>".
 *
 * Usa Web Crypto API — funciona em Deno (Edge Functions), Node 18+ e browser.
 */

const encoder = new TextEncoder();

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function validateMetaSignature(opts: {
  rawBody: string;
  signatureHeader: string | null;
  appSecret: string;
}): Promise<boolean> {
  if (!opts.signatureHeader) return false;
  const [scheme, hex] = opts.signatureHeader.split("=");
  if (scheme !== "sha256" || !hex || !/^[0-9a-f]+$/i.test(hex)) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(opts.appSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, encoder.encode(opts.rawBody)),
  );
  const provided = hexToBytes(hex);
  return timingSafeEqual(sig, provided);
}
