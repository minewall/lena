// ============================================================================
// Lena — Cloudflare Pages Function (proxy seguro)
// Local no projeto do site:  functions/api/lena.js
// Rota gerada automaticamente:  POST /api/lena   (mesma origem, sem CORS)
//
// Configurar no painel do Cloudflare Pages (Settings):
//   - Secret  ANTHROPIC_API_KEY   = sua chave de console.anthropic.com
//   - (opcional) KV binding LENA_KV  para o rate limit por IP
// ============================================================================

const MODEL = "claude-sonnet-4-6";
const MAX_MESSAGES = 24;     // teto de mensagens por conversa
const MAX_CHARS = 1500;      // teto de caracteres por mensagem
const MAX_TOKENS = 600;      // teto de resposta (controla custo)
const RATE_LIMIT = 40;       // mensagens por IP por hora (só se LENA_KV existir)

const TONES = {
  Acolhedor: "calorosa, próxima e simpática",
  Profissional: "elegante, profissional e cordial",
  Descontraído: "leve, descontraída e jovem",
};

function buildSystem(cfg) {
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

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    if (!env.ANTHROPIC_API_KEY) return json({ error: "config ausente" }, 500);

    const body = await request.json();
    const cfg = body.config || {};
    let messages = Array.isArray(body.messages) ? body.messages : [];

    // validação anti-abuso
    if (messages.length === 0 || messages.length > MAX_MESSAGES) {
      return json({ error: "conversa inválida" }, 400);
    }
    messages = messages.map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m.content || "").slice(0, MAX_CHARS),
    }));

    // rate limit por IP (ativa só se você criar e ligar o KV LENA_KV)
    if (env.LENA_KV) {
      const ip = request.headers.get("CF-Connecting-IP") || "anon";
      const bucket = Math.floor(Date.now() / 3600000); // janela de 1h
      const key = `rl:${ip}:${bucket}`;
      const count = parseInt((await env.LENA_KV.get(key)) || "0", 10);
      if (count >= RATE_LIMIT) {
        return json({ error: "limite atingido, tente novamente mais tarde" }, 429);
      }
      await env.LENA_KV.put(key, String(count + 1), { expirationTtl: 3600 });
    }

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: buildSystem(cfg),
        messages,
      }),
    });

    if (!r.ok) return json({ error: "falha na IA" }, 502);
    const data = await r.json();
    const text = (data.content || [])
      .filter((b) => b.type === "text").map((b) => b.text).join("").trim();
    return json({ reply: text || "Desculpa, pode repetir?" });
  } catch (e) {
    return json({ error: "erro interno" }, 500);
  }
}
