#!/usr/bin/env node
// Imprime o array de files no formato esperado pelo deploy_edge_function MCP.
// Uso: node scripts/print-deploy-payload.mjs <function-name>
// Ex.:  node scripts/print-deploy-payload.mjs msg-processor

import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const functionsDir = join(root, "supabase/functions");

const fnName = process.argv[2];
if (!fnName) {
  console.error("uso: node scripts/print-deploy-payload.mjs <function-name>");
  process.exit(2);
}

function walk(dir, base) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      out.push(...walk(full, base));
    } else if (full.endsWith(".ts")) {
      out.push({
        name: relative(base, full),
        content: readFileSync(full, "utf8"),
      });
    }
  }
  return out;
}

const files = [
  ...walk(join(functionsDir, fnName), functionsDir),
  ...walk(join(functionsDir, "_shared"), functionsDir),
];

process.stdout.write(JSON.stringify(files));
