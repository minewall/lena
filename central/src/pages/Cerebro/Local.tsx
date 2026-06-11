import { EmptyState } from "../../components/EmptyState";
import { IconBuilding } from "../../components/icons";
import { useEffect, useState } from "react";
import type { TenantUnit } from "@lena/shared/db";
import {
  AMENITIES,
  type Amenities,
  deleteUnit as deleteUnitRow,
  insertUnit,
  loadUnits,
  setPrimaryUnit,
  updateUnit,
} from "../../lib/unidades";
import { useAuth } from "../../store/auth";
import {
  Button,
  Card,
  Field,
  StatusPill,
  TextInput,
  Textarea,
} from "../../components/ui";

export function CerebroLocal() {
  const tenantId = useAuth((s) => s.currentTenantId);
  const [units, setUnits] = useState<TenantUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantId) return;
    setLoading(true);
    loadUnits(tenantId)
      .then(setUnits)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [tenantId]);

  if (!tenantId) return null;

  async function add() {
    if (!tenantId) return;
    try {
      const created = await insertUnit({
        tenant_id: tenantId,
        name: units.length === 0 ? "Unidade principal" : "Nova unidade",
        is_primary: units.length === 0,
        position: units.length,
      });
      setUnits([...units, created]);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function makePrimary(id: string) {
    if (!tenantId) return;
    try {
      await setPrimaryUnit(tenantId, id);
      setUnits((cur) => cur.map((u) => ({ ...u, is_primary: u.id === id })));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="max-w-2xl text-sm text-cafe-soft">
          Onde o seu negócio atende. A Lena usa para responder "onde vocês
          ficam", como chegar e o que tem no local. Você pode ter mais de uma
          unidade.
        </p>
        <Button onClick={add}>+ Adicionar unidade</Button>
      </div>

      {error ? <StatusPill kind="error">{error}</StatusPill> : null}

      {loading ? (
        <Card className="text-cafe-soft animate-pulse-soft">carregando…</Card>
      ) : units.length === 0 ? (
        <Card className="p-0">
          <EmptyState
            icon={IconBuilding}
            title="Cadastre sua unidade"
            description="Endereço, andar, estacionamento e comodidades. A Lena usa tudo isso para orientar o cliente a chegar e saber o que encontra aí."
            action={{ label: "+ Adicionar unidade", onClick: add }}
          />
        </Card>
      ) : (
        units.map((unit) => (
          <UnitRow
            key={unit.id}
            unit={unit}
            onMakePrimary={makePrimary}
            onUpdated={(u) =>
              setUnits((cur) => cur.map((x) => (x.id === u.id ? u : x)))
            }
            onDeleted={(id) =>
              setUnits((cur) => cur.filter((x) => x.id !== id))
            }
          />
        ))
      )}
    </div>
  );
}

function UnitRow({
  unit,
  onMakePrimary,
  onUpdated,
  onDeleted,
}: {
  unit: TenantUnit;
  onMakePrimary: (id: string) => void;
  onUpdated: (u: TenantUnit) => void;
  onDeleted: (id: string) => void;
}) {
  const [local, setLocal] = useState(unit);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const amenities = (local.amenities ?? {}) as Amenities;

  function set<K extends keyof TenantUnit>(key: K, value: TenantUnit[K]) {
    setLocal((prev) => ({ ...prev, [key]: value }));
    setState("idle");
  }

  function toggleAmenity(key: string, on: boolean) {
    const next = { ...amenities };
    if (on) next[key] = true;
    else delete next[key];
    set("amenities", next as TenantUnit["amenities"]);
  }

  async function save() {
    setState("saving");
    setError(null);
    try {
      const updated = await updateUnit(unit.id, {
        name: local.name.trim() || "Unidade",
        address: local.address?.trim() || null,
        floor: local.floor?.trim() || null,
        landmark: local.landmark?.trim() || null,
        parking: local.parking?.trim() || null,
        capacity: local.capacity,
        amenities: local.amenities,
        notes: local.notes?.trim() || null,
        active: local.active,
      });
      setLocal(updated);
      onUpdated(updated);
      setState("saved");
    } catch (e) {
      setError((e as Error).message);
      setState("error");
    }
  }

  async function remove() {
    if (local.is_primary) {
      alert("Defina outra unidade como principal antes de remover esta.");
      return;
    }
    if (!confirm(`Remover "${local.name}"?`)) return;
    try {
      await deleteUnitRow(unit.id);
      onDeleted(unit.id);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-display text-lg text-cafe">
            {local.name || "Unidade"}
          </h3>
          {local.is_primary ? (
            <span className="rounded-full bg-terracota-soft px-2 py-0.5 text-[11px] font-semibold text-terracota-dark">
              principal
            </span>
          ) : (
            <button
              type="button"
              onClick={() => onMakePrimary(unit.id)}
              className="text-xs font-semibold text-terracota hover:text-terracota-dark"
            >
              tornar principal
            </button>
          )}
        </div>
        {!local.active ? (
          <span className="text-xs text-cafe-muted">inativa</span>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-[1.4fr_1fr]">
        <Field label="Nome da unidade">
          <TextInput value={local.name} onChange={(e) => set("name", e.target.value)} />
        </Field>
        <Field label="Andar" hint="ex.: Térreo, 3º andar">
          <TextInput
            value={local.floor ?? ""}
            onChange={(e) => set("floor", e.target.value || null)}
            placeholder="Térreo"
          />
        </Field>
      </div>

      <Field label="Endereço">
        <TextInput
          value={local.address ?? ""}
          onChange={(e) => set("address", e.target.value || null)}
          placeholder="Rua, número, bairro, cidade"
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label="Estacionamento"
          hint="tem? pago? manobrista? conveniado?"
        >
          <TextInput
            value={local.parking ?? ""}
            onChange={(e) => set("parking", e.target.value || null)}
          />
        </Field>
        <Field label="Ponto de referência" hint="ex.: ao lado do Pão de Açúcar">
          <TextInput
            value={local.landmark ?? ""}
            onChange={(e) => set("landmark", e.target.value || null)}
          />
        </Field>
      </div>

      <Field
        label="Capacidade"
        hint="atendimentos simultâneos que cabem nesta unidade (opcional)"
      >
        <TextInput
          type="number"
          min={0}
          className="sm:w-40"
          value={local.capacity ?? ""}
          onChange={(e) =>
            set("capacity", e.target.value === "" ? null : Number(e.target.value))
          }
        />
      </Field>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-cafe-muted">
          Comodidades
        </span>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3">
          {AMENITIES.map((a) => (
            <label key={a.key} className="flex items-center gap-2 text-sm text-cafe">
              <input
                type="checkbox"
                checked={Boolean(amenities[a.key])}
                onChange={(e) => toggleAmenity(a.key, e.target.checked)}
              />
              {a.label}
            </label>
          ))}
        </div>
      </div>

      <Field label="Observações (opcional)" hint="qualquer detalhe do local que ajude o cliente">
        <Textarea
          value={local.notes ?? ""}
          onChange={(e) => set("notes", e.target.value || null)}
          rows={2}
        />
      </Field>

      <label className="flex items-center gap-2 text-sm text-cafe">
        <input
          type="checkbox"
          checked={local.active}
          onChange={(e) => set("active", e.target.checked)}
        />
        Ativa (a Lena considera esta unidade)
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
