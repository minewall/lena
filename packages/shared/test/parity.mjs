// Regression test do buildDemoSystem.
//
// Antes era paridade com a versão original do api/lena.js. Agora a função
// evoluiu (regras anti-hífen/travessão, primeira fala, caminhos curtos)
// então o teste virou um regression check: confirma que propriedades-chave
// estão presentes e que regras de identidade estão sendo cumpridas no
// próprio system prompt.
//
// Roda com: node packages/shared/test/parity.mjs

import { buildDemoSystem } from "../dist/prompt/build.js";

const cases = [
  { label: "vazio", cfg: {} },
  {
    label: "escolas completo (acolhedor)",
    cfg: {
      name: "Colégio Adventista Campo Belo",
      segment: "escola de educação infantil",
      tone: "Acolhedor",
      hours: "seg a sex, 8h às 17h30",
      services: [
        { n: "Visita à escola", p: "sem custo" },
        { n: "Matrícula", p: "sob consulta" },
      ],
      promo: "Visita guiada com a coordenadora pedagógica",
      extras: "Educação infantil ao fundamental I.",
    },
  },
  {
    label: "profissional sem promo",
    cfg: {
      name: "Clínica Estética Vida",
      segment: "clínica de estética",
      tone: "Profissional",
      hours: "ter a sáb, 10h às 19h",
      services: [{ n: "Limpeza de pele", p: "R$ 180" }],
    },
  },
  {
    label: "descontraído sem services válidos",
    cfg: {
      name: "Petshop Patinha",
      segment: "petshop",
      tone: "Descontraído",
      services: [{ n: "  " }, { p: "R$ 30" }],
    },
  },
  {
    label: "tone inexistente cai no default Acolhedor",
    cfg: { tone: "Misterioso", name: "Loja X" },
  },
];

let failed = 0;

function check(label, cond, msg) {
  if (!cond) {
    failed++;
    console.log(`  ✗ ${label}: ${msg}`);
  }
}

for (const { label, cfg } of cases) {
  console.log(`\ncaso: ${label}`);
  const out = buildDemoSystem(cfg);

  // identidade
  check(label, out.includes("Você é a Lena"), "deve conter identidade Lena");
  check(label, out.includes("recepcionista virtual"), "deve mencionar recepcionista virtual");
  check(label, out.includes("REGRAS FIRMES DE ESCRITA"), "deve declarar regras firmes");

  // anti hífens/travessões DENTRO DO PRÓPRIO PROMPT
  // (a Lena precisa ver o exemplo: o prompt em si segue a regra)
  // Travessão longo (em-dash) U+2014 não deve aparecer
  check(label, !out.includes("—"), "system prompt não deve conter em-dash (—)");
  // Travessão curto (en-dash) U+2013 não deve aparecer
  check(label, !out.includes("–"), "system prompt não deve conter en-dash (–)");

  // tom presente
  const toneOk =
    out.includes("calorosa") || out.includes("elegante") || out.includes("leve");
  check(label, toneOk, "deve descrever um tom");

  // valores do cfg refletidos
  if (cfg.name) check(label, out.includes(cfg.name), `deve conter name ${cfg.name}`);
  if (cfg.hours) check(label, out.includes(cfg.hours), `deve conter hours`);
  if (cfg.promo) check(label, out.includes(cfg.promo), `deve conter promo`);

  if (failed === 0) console.log("  ✓ ok");
}

if (failed > 0) {
  console.error(`\n${failed} verificação(ões) falharam.`);
  process.exit(1);
}
console.log(`\nregression OK em ${cases.length} casos.`);
