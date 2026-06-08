import { useEffect, useState } from "react";
import type { TenantTone } from "@lena/shared/db";
import { Constants } from "@lena/shared/db";
import { loadBrain, updateBrain, type TenantBrainRow } from "../../lib/brain";
import { useAuth } from "../../store/auth";
import { Card, StatusPill } from "../../components/ui";

const MODELS: {
  id: string;
  name: string;
  desc: string;
  cost: string;
  recommended?: boolean;
}[] = [
  {
    id: "claude-haiku-4-5",
    name: "Econômico",
    desc: "Rápida e direta. Boa para perguntas simples, agendamentos e FAQ.",
    cost: "menor custo",
  },
  {
    id: "claude-sonnet-4-6",
    name: "Equilibrado",
    desc: "Conversas mais ricas e naturais, melhor em nuance e vendas.",
    cost: "custo médio",
    recommended: true,
  },
];

const TONE_DESCRIPTIONS: Record<TenantTone, { headline: string; detail: string }> = {
  Acolhedor: {
    headline: "Calorosa, próxima e simpática.",
    detail:
      "Como uma recepcionista que conhece todo mundo pelo nome. Default para escolas, clínicas pediátricas, contextos de família.",
  },
  Profissional: {
    headline: "Elegante, profissional e cordial.",
    detail:
      "Tom de consultório premium. Útil em clínicas, advocacia, serviços de alto ticket.",
  },
  Descontraído: {
    headline: "Leve, descontraída e jovem.",
    detail:
      "Conversa informal, sem jargão. Combina com salões, petshops, marcas com vibe descontraída.",
  },
};

export function CerebroTom() {
  const tenantId = useAuth((s) => s.currentTenantId);
  const [brain, setBrain] = useState<TenantBrainRow | null>(null);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantId) return;
    loadBrain(tenantId)
      .then(setBrain)
      .catch((e) => setError(e.message));
  }, [tenantId]);

  if (!tenantId) return null;
  if (!brain) return <Card className="text-cafe-soft animate-pulse-soft">carregando…</Card>;

  async function pick(tone: TenantTone) {
    if (!brain || brain.tone === tone) return;
    setState("saving");
    setError(null);
    try {
      const updated = await updateBrain(tenantId!, { tone });
      setBrain(updated);
      setState("saved");
    } catch (e) {
      setError((e as Error).message);
      setState("error");
    }
  }

  async function pickModel(model: string) {
    if (!brain || brain.ai_model === model) return;
    setState("saving");
    setError(null);
    try {
      const updated = await updateBrain(tenantId!, { ai_model: model });
      setBrain(updated);
      setState("saved");
    } catch (e) {
      setError((e as Error).message);
      setState("error");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-cafe-soft">
        Um tom só por vez. Você pode trocar depois sem reescrever nada — a
        identidade da Lena segue a mesma.
      </p>

      <div className="grid gap-4 sm:grid-cols-3">
        {Constants.public.Enums.tenant_tone.map((tone) => {
          const isSelected = brain.tone === tone;
          const desc = TONE_DESCRIPTIONS[tone];
          return (
            <button
              key={tone}
              type="button"
              onClick={() => pick(tone)}
              className={`flex flex-col gap-2 rounded-[var(--radius-card)] border p-5 text-left transition ${
                isSelected
                  ? "border-terracota bg-terracota-soft"
                  : "border-creme-edge bg-creme-soft hover:border-cafe-muted"
              }`}
            >
              <span className="font-display text-lg text-cafe">{tone}</span>
              <span className="text-sm text-cafe">{desc.headline}</span>
              <span className="text-xs text-cafe-soft">{desc.detail}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-creme-edge pt-6">
        <div>
          <h2 className="font-display text-lg text-cafe">Inteligência da Lena</h2>
          <p className="text-sm text-cafe-soft">
            Escolha o motor de IA. O Equilibrado responde melhor em conversas
            complexas e vendas; o Econômico é mais barato e ágil para o básico.
            Dá para trocar quando quiser.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {MODELS.map((m) => {
            const isSelected = brain.ai_model === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => pickModel(m.id)}
                className={`flex flex-col gap-2 rounded-[var(--radius-card)] border p-5 text-left transition ${
                  isSelected
                    ? "border-terracota bg-terracota-soft"
                    : "border-creme-edge bg-creme-soft hover:border-cafe-muted"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="font-display text-lg text-cafe">{m.name}</span>
                  {m.recommended ? (
                    <span className="rounded-full bg-salvia-soft px-2 py-0.5 text-[10px] font-medium text-cafe">
                      recomendado
                    </span>
                  ) : null}
                </span>
                <span className="text-sm text-cafe">{m.desc}</span>
                <span className="text-xs text-cafe-muted">{m.cost}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {state === "saving" ? <StatusPill kind="saving">salvando…</StatusPill> : null}
        {state === "saved" ? <StatusPill kind="saved">salvo</StatusPill> : null}
        {state === "error" && error ? (
          <StatusPill kind="error">{error}</StatusPill>
        ) : null}
      </div>
    </div>
  );
}
