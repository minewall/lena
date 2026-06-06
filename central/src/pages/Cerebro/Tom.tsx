import { useEffect, useState } from "react";
import type { TenantBrainRow, TenantTone } from "@lena/shared/db";
import { Constants } from "@lena/shared/db";
import { loadBrain, updateBrain } from "../../lib/brain";
import { useAuth } from "../../store/auth";
import { Card, StatusPill } from "../../components/ui";

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

      <div className="flex items-center gap-3">
        {state === "saving" ? <StatusPill kind="saving">salvando…</StatusPill> : null}
        {state === "saved" ? <StatusPill kind="saved">tom atualizado</StatusPill> : null}
        {state === "error" && error ? (
          <StatusPill kind="error">{error}</StatusPill>
        ) : null}
      </div>
    </div>
  );
}
