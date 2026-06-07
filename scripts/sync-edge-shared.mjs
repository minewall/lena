#!/usr/bin/env node
// Copia os arquivos .ts de packages/shared/src/wa para
// supabase/functions/_shared/wa, reescrevendo imports `.js` para `.ts`
// (Deno em Edge Functions exige extensão real do arquivo).
//
// Roda com: npm run sync:edge
//
// Sempre que mudar @lena/shared/wa, rodar este script antes de commitar
// para manter os 2 lados em sincronia.

import { copyFileSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "packages/shared/src/wa");
const dst = join(root, "supabase/functions/_shared/wa");

mkdirSync(dst, { recursive: true });

const HEADER =
  "// ==========================================================================\n" +
  "// GERADO POR scripts/sync-edge-shared.mjs — NÃO EDITAR À MÃO.\n" +
  "// Fonte: packages/shared/src/wa/<file>.ts\n" +
  "// ==========================================================================\n";

let count = 0;
for (const name of readdirSync(src)) {
  if (!name.endsWith(".ts")) continue;
  const original = readFileSync(join(src, name), "utf8");
  // Reescreve imports relativos `.js` → `.ts`
  const rewritten = original.replace(/(from\s+["'])(\.\.?\/[^"']+?)\.js(["'])/g, "$1$2.ts$3");
  writeFileSync(join(dst, name), HEADER + rewritten);
  count++;
}

console.log(`sync:edge → ${count} arquivos copiados para ${dst}`);
