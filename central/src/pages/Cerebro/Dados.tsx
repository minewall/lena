import { type FormEvent, useEffect, useState } from "react";
import type { TenantBrainRow } from "@lena/shared/db";
import { loadBrain, updateBrain } from "../../lib/brain";
import { SEGMENTS } from "../../lib/segments";
import { useAuth } from "../../store/auth";
import { Button, Card, Field, Select, StatusPill, TextInput, Textarea } from "../../components/ui";

export function CerebroDados() {
  const tenantId = useAuth((s) => s.currentTenantId);
  const [brain, setBrain] = useState<TenantBrainRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    if (!tenantId) return;
    setState("idle");
    loadBrain(tenantId)
      .then((b) => setBrain(b))
      .catch((e) => setError(e.message));
  }, [tenantId]);

  if (!tenantId) {
    return <p className="text-cafe-soft">Escolha um negócio na barra lateral.</p>;
  }

  if (!brain) {
    return (
      <Card className="text-cafe-soft animate-pulse-soft">carregando…</Card>
    );
  }

  function set<K extends keyof TenantBrainRow>(key: K, value: TenantBrainRow[K]) {
    setBrain((prev) => (prev ? { ...prev, [key]: value } : prev));
    setState("idle");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!brain || !tenantId) return;
    setState("saving");
    setError(null);
    try {
      const updated = await updateBrain(tenantId, {
        business_name: brain.business_name,
        segment: brain.segment,
        hours: brain.hours,
        address: brain.address,
        promo: brain.promo,
        extras: brain.extras,
      });
      setBrain(updated);
      setState("saved");
    } catch (e) {
      setError((e as Error).message);
      setState("error");
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <Card className="flex flex-col gap-4">
        <Field label="Nome do negócio">
          <TextInput
            required
            value={brain.business_name}
            onChange={(e) => set("business_name", e.target.value)}
          />
        </Field>

        <Field label="Segmento">
          <Select
            value={brain.segment}
            onChange={(e) => set("segment", e.target.value)}
          >
            {SEGMENTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Horário de funcionamento"
          hint="Ex.: segunda a sexta, 8h às 17h30; sábados, 9h às 12h."
        >
          <TextInput
            value={brain.hours ?? ""}
            onChange={(e) => set("hours", e.target.value)}
          />
        </Field>

        <Field label="Endereço">
          <TextInput
            value={brain.address ?? ""}
            onChange={(e) => set("address", e.target.value)}
            placeholder="Rua, número, bairro, cidade"
          />
        </Field>

        <Field
          label="Promoção atual"
          hint="Se houver, a Lena cita quando fizer sentido."
        >
          <TextInput
            value={brain.promo ?? ""}
            onChange={(e) => set("promo", e.target.value)}
          />
        </Field>

        <Field
          label="Outras informações"
          hint="Diferenciais, restrições, instruções específicas para a Lena."
        >
          <Textarea
            value={brain.extras ?? ""}
            onChange={(e) => set("extras", e.target.value)}
          />
        </Field>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={state === "saving"}>
          {state === "saving" ? "salvando…" : "Salvar"}
        </Button>
        {state === "saved" ? <StatusPill kind="saved">salvo</StatusPill> : null}
        {state === "error" && error ? (
          <StatusPill kind="error">{error}</StatusPill>
        ) : null}
      </div>
    </form>
  );
}
