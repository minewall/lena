import { useEffect, useState } from "react";
import type { TenantService } from "@lena/shared/db";
import {
  deleteService as deleteServiceRow,
  insertService,
  loadServices,
  updateService,
} from "../../lib/brain";
import { useAuth } from "../../store/auth";
import { Button, Card, Field, StatusPill, TextInput, Textarea } from "../../components/ui";

function priceFromInput(s: string): number | null {
  const trimmed = s.trim().replace(/\./g, "").replace(",", ".");
  if (!trimmed) return null;
  const reais = Number(trimmed);
  if (Number.isNaN(reais) || reais < 0) return null;
  return Math.round(reais * 100);
}

function priceToInput(cents: number | null): string {
  if (cents == null) return "";
  return (cents / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function CerebroServicos() {
  const tenantId = useAuth((s) => s.currentTenantId);
  const [items, setItems] = useState<TenantService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantId) return;
    setLoading(true);
    loadServices(tenantId)
      .then((data) => setItems(data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [tenantId]);

  if (!tenantId) return null;

  async function add() {
    if (!tenantId) return;
    try {
      const created = await insertService({
        tenant_id: tenantId,
        name: "Novo serviço",
        position: items.length,
      });
      setItems([...items, created]);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-cafe-soft">
          Cada serviço aparece para a Lena no momento de oferecer agendamentos
          e upsell.
        </p>
        <Button onClick={add}>+ Adicionar serviço</Button>
      </div>

      {error ? <StatusPill kind="error">{error}</StatusPill> : null}

      {loading ? (
        <Card className="text-cafe-soft animate-pulse-soft">carregando…</Card>
      ) : items.length === 0 ? (
        <Card className="text-cafe-soft">
          Sem serviços ainda. Adicione o primeiro para a Lena começar a
          oferecer.
        </Card>
      ) : (
        items.map((service) => (
          <ServiceRow
            key={service.id}
            service={service}
            onUpdated={(updated) =>
              setItems((current) =>
                current.map((s) => (s.id === updated.id ? updated : s)),
              )
            }
            onDeleted={(id) =>
              setItems((current) => current.filter((s) => s.id !== id))
            }
          />
        ))
      )}
    </div>
  );
}

function ServiceRow({
  service,
  onUpdated,
  onDeleted,
}: {
  service: TenantService;
  onUpdated: (s: TenantService) => void;
  onDeleted: (id: string) => void;
}) {
  const [local, setLocal] = useState(service);
  const [priceStr, setPriceStr] = useState(priceToInput(service.price_cents));
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof TenantService>(key: K, value: TenantService[K]) {
    setLocal((prev) => ({ ...prev, [key]: value }));
    setState("idle");
  }

  async function save() {
    setState("saving");
    setError(null);
    try {
      const patch = {
        name: local.name.trim(),
        description: local.description,
        price_cents: priceFromInput(priceStr),
        duration_min: local.duration_min,
        is_upsell: local.is_upsell,
        active: local.active,
        position: local.position,
      };
      await updateService(service.id, patch);
      const updated = { ...local, ...patch };
      onUpdated(updated);
      setState("saved");
    } catch (e) {
      setError((e as Error).message);
      setState("error");
    }
  }

  async function remove() {
    if (!confirm(`Remover "${local.name}"?`)) return;
    try {
      await deleteServiceRow(service.id);
      onDeleted(service.id);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <Card className="flex flex-col gap-3">
      <Field label="Nome">
        <TextInput value={local.name} onChange={(e) => set("name", e.target.value)} />
      </Field>

      <Field label="Descrição (opcional)">
        <Textarea
          value={local.description ?? ""}
          onChange={(e) => set("description", e.target.value || null)}
          rows={2}
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Preço (R$)">
          <TextInput
            placeholder="ex.: 180,00"
            value={priceStr}
            onChange={(e) => {
              setPriceStr(e.target.value);
              setState("idle");
            }}
          />
        </Field>
        <Field label="Duração (min)">
          <TextInput
            type="number"
            min={0}
            value={local.duration_min ?? ""}
            onChange={(e) =>
              set("duration_min", e.target.value === "" ? null : Number(e.target.value))
            }
          />
        </Field>
        <Field label="Upsell">
          <label className="mt-1.5 flex items-center gap-2 text-sm text-cafe">
            <input
              type="checkbox"
              checked={local.is_upsell}
              onChange={(e) => set("is_upsell", e.target.checked)}
            />
            Oferecer como upsell após agendamento
          </label>
        </Field>
      </div>

      <label className="flex items-center gap-2 text-sm text-cafe">
        <input
          type="checkbox"
          checked={local.active}
          onChange={(e) => set("active", e.target.checked)}
        />
        Ativo (a Lena oferece)
      </label>

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={state === "saving"}>
          {state === "saving" ? "salvando…" : "Salvar"}
        </Button>
        <Button variant="danger" onClick={remove}>
          Remover
        </Button>
        {state === "saved" ? <StatusPill kind="saved">salvo</StatusPill> : null}
        {error ? <StatusPill kind="error">{error}</StatusPill> : null}
      </div>
    </Card>
  );
}
