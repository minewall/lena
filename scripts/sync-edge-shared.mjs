#!/usr/bin/env node
// Copia subpacotes de packages/shared/src/* para supabase/functions/_shared/*,
// reescrevendo imports `.js` para `.ts` (Deno em Edge Functions exige
// extensão real do arquivo).
//
// Roda com: npm run sync:edge
//
// Sempre que mudar @lena/shared, rodar este script antes de commitar
// para manter os 2 lados em sincronia.

import {
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const subpackages = ["wa", "prompt", "tones", "db"];

const HEADER =
  "// ==========================================================================\n" +
  "// GERADO POR scripts/sync-edge-shared.mjs — NÃO EDITAR À MÃO.\n" +
  "// Fonte: packages/shared/src/<subpkg>/<file>.ts\n" +
  "// ==========================================================================\n";

function copyDirRecursive(srcDir, dstDir) {
  mkdirSync(dstDir, { recursive: true });
  let count = 0;
  for (const name of readdirSync(srcDir)) {
    const srcPath = join(srcDir, name);
    const dstPath = join(dstDir, name);
    const stat = statSync(srcPath);
    if (stat.isDirectory()) {
      count += copyDirRecursive(srcPath, dstPath);
      continue;
    }
    if (!name.endsWith(".ts")) continue;
    const original = readFileSync(srcPath, "utf8");
    const rewritten = original.replace(
      /(from\s+["'])(\.\.?\/[^"']+?)\.js(["'])/g,
      "$1$2.ts$3",
    );
    writeFileSync(dstPath, HEADER + rewritten);
    count++;
  }
  return count;
}

let totalCount = 0;
for (const subpkg of subpackages) {
  const src = join(root, "packages/shared/src", subpkg);
  const dst = join(root, "supabase/functions/_shared", subpkg);
  try {
    const c = copyDirRecursive(src, dst);
    totalCount += c;
    console.log(`  ${subpkg}/ → ${c} arquivos`);
  } catch (e) {
    console.error(`  ${subpkg}/ → erro: ${e.message}`);
  }
}

console.log(`sync:edge → ${totalCount} arquivos copiados`);
