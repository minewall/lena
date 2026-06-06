// Teste de paridade: compara buildDemoSystem (novo @lena/shared)
// com a função original inline do lena-site/functions/api/lena.js.
// Falha (exit 1) se houver qualquer diferença de caractere.
//
// Roda com: node packages/shared/test/parity.mjs

import { buildDemoSystem } from "../dist/prompt/build.js";

// ── ORIGINAL inline (cópia verbatim do api/lena.js antes do refactor) ──
const TONES = {
  Acolhedor: "calorosa, próxima e simpática",
  Profissional: "elegante, profissional e cordial",
  Descontraído: "leve, descontraída e jovem",
};

function buildSystemOriginal(cfg) {
  const tone = TONES[cfg.tone] || TONES.Acolhedor;
  const svc = (cfg.services || [])
    .filter((s) => s && s.n && String(s.n).trim())
    .map((s) => `${s.n} (${String(s.p || "").trim() || "sob consulta"})`)
    .join("; ") || "não detalhados";
  return `Você é a Lena, a recepcionista virtual com IA do negócio "${cfg.name || "o negócio"}", um(a) ${cfg.segment || "negócio de serviço"}. Você atende os clientes pelo WhatsApp e é ótima no que faz: resolve, não enrola.
Seu tom é ${tone}. Responda em português do Brasil, breve e natural (1 a 3 frases), no máximo 1 emoji.

Use EXCLUSIVAMENTE estas informações do negócio:
- Horário de funcionamento: ${cfg.hours || "não informado"}
- Serviços e valores: ${svc}
- Promoção atual: ${String(cfg.promo || "").trim() || "nenhuma no momento"}
- Outras informações: ${String(cfg.extras || "").trim() || "—"}

Como você age:
- Responda com segurança usando as informações acima. Seja proativa e resolvedora, como uma recepcionista experiente.
- Se faltar um detalhe que não está acima, NÃO responda "vou confirmar com a equipe": dê o contexto típico que ajuda, faça UMA pergunta rápida e conduza para um agendamento.
- Só envolva um humano em casos realmente fora do alcance (reclamações sérias, questões médicas ou clínicas, situações sensíveis).
- Conduza a conversa para agendar sempre que fizer sentido. Se houver promoção, cite quando fizer sentido.
Você está atendendo um possível cliente numa demonstração no site. Mostre o seu melhor: prestativa, resolvedora e simpática.`;
}

// ── Casos de teste ──
const cases = [
  { label: "vazio", cfg: {} },
  {
    label: "escolas completo (acolhedor)",
    cfg: {
      name: "Colégio Adventista Campo Belo",
      segment: "escola de educação infantil",
      tone: "Acolhedor",
      hours: "seg–sex, 8h–17h30",
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
      hours: "ter–sáb, 10h–19h",
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
for (const { label, cfg } of cases) {
  const expected = buildSystemOriginal(cfg);
  const actual = buildDemoSystem(cfg);
  if (expected === actual) {
    console.log(`✓ ${label}`);
  } else {
    failed++;
    console.log(`✗ ${label}`);
    for (let i = 0; i < Math.max(expected.length, actual.length); i++) {
      if (expected[i] !== actual[i]) {
        console.log(
          `   primeira divergência no índice ${i}: ` +
            `esperado=${JSON.stringify(expected[i])} actual=${JSON.stringify(actual[i])}`,
        );
        console.log(`   contexto esperado: ${JSON.stringify(expected.slice(Math.max(0, i - 20), i + 20))}`);
        console.log(`   contexto actual:   ${JSON.stringify(actual.slice(Math.max(0, i - 20), i + 20))}`);
        break;
      }
    }
  }
}

if (failed > 0) {
  console.error(`\n${failed} caso(s) divergente(s).`);
  process.exit(1);
}
console.log(`\nparidade OK em ${cases.length} casos.`);
