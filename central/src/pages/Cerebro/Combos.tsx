import { EmptyState } from "../../components/EmptyState";
import { IconTarget } from "../../components/icons";
import { useEffect, useState } from "react";
import type { ComboKind, TenantService } from "@lena/shared/db";
import { loadServices } from "../../lib/brain";
import {
  type ComboWithItems,
  deleteCombo as deleteComboRow,
  insertCombo,
  loadCombos,
  setComboItems,
  updateCombo,
} from "../../lib/catalogo";
import { useAuth } from "../../store/auth";
import {
  Button,
  Card,
  Field,
  Select,
  StatusPill,
  TextInput,
  Textarea,
} from "../../components/ui";

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

export function CerebroCombos() {
  const tenantId = useAuth((s) => s.currentTenantId);
  const [combos, setCombos] = useState<ComboWithItems[]>([]);
  const [services, setServices] = useState<TenantService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantId) return;
    setLoading(true);
    Promise.all([loadCombos(tenantId), loadServices(tenantId)])
      .then(([cb, svc]) => {
        setCombos(cb);
        setServices(svc);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [tenantId]);

  if (!tenantId) return null;

  async function add() {
    if (!tenantId) return;
    try {
      const created = await insertCombo({
        tenant_id: tenantId,
        name: "Novo combo",
        kind: "pacote",
        position: combos.length,
      });
      setCombos([...combos, { ...created, items: [] }]);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="max-w-2xl text-sm text-cafe-soft">
          Combos que a Lena oferece na hora certa: <b>pacotes</b> de preço
          fechado, ou <b>ofertas condicionais</b> ("fechou X, leva Y com
          desconto"). Use os serviços do catálogo.
        </p>
        <Button onClick={add}>+ Adicionar combo</Button>
      </div>

      {error ? <StatusPill kind="error">{error}</StatusPill> : null}

      {loading ? (
        <Card className="text-cafe-soft animate-pulse-soft">carregando…</Card>
      ) : services.length === 0 ? (
        <Card className="p-0">
          <EmptyState
            icon={IconTarget}
            title="Cadastre serviços primeiro"
            description="Combos são montados a partir dos serviços do catálogo. Adicione seus serviços e volte aqui para montar pacotes e ofertas."
            cta={{ label: "Ir para Serviços", to: "/cerebro/servicos" }}
          />
        </Card>
      ) : combos.length === 0 ? (
        <Card className="p-0">
          <EmptyState
            icon={IconTarget}
            title="Nenhum combo ainda"
            description="Crie um pacote fechado (ex.: +Bela = R$ X com 3 serviços) ou uma oferta condicional (ex.: fechou tingimento, unha com 20% off). A Lena oferece no momento certo."
            action={{ label: "+ Adicionar combo", onClick: add }}
          />
        </Card>
      ) : (
        combos.map((combo) => (
          <ComboRow
            key={combo.id}
            combo={combo}
            tenantId={tenantId}
            services={services}
            onUpdated={(u) =>
              setCombos((cur) => cur.map((c) => (c.id === u.id ? u : c)))
            }
            onDeleted={(id) =>
              setCombos((cur) => cur.filter((c) => c.id !== id))
            }
          />
        ))
      )}
    </div>
  );
}

function ComboRow({
  combo,
  tenantId,
  services,
  onUpdated,
  onDeleted,
}: {
  combo: ComboWithItems;
  tenantId: string;
  services: TenantService[];
  onUpdated: (c: ComboWithItems) => void;
  onDeleted: (id: string) => void;
}) {
  const [name, setName] = useState(combo.name);
  const [kind, setKind] = useState<ComboKind>(combo.kind);
  const [description, setDescription] = useState(combo.description ?? "");
  const [priceStr, setPriceStr] = useState(priceToInput(combo.price_cents));
  const [discount, setDiscount] = useState(
    combo.discount_pct == null ? "" : String(combo.discount_pct),
  );
  const [triggerId, setTriggerId] = useState(combo.trigger_service_id ?? "");
  const [active, setActive] = useState(combo.active);
  const [items, setItems] = useState<{ service_id: string; qty: number }[]>(
    combo.items.map((i) => ({ service_id: i.service_id, qty: i.qty })),
  );
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const svcName = (id: string) =>
    services.find((s) => s.id === id)?.name ?? "serviço";

  function touch() {
    setState("idle");
  }

  function addItem() {
    const first = services[0]?.id;
    if (!first) return;
    setItems([...items, { service_id: first, qty: 1 }]);
    touch();
  }

  async function save() {
    setState("saving");
    setError(null);
    try {
      await updateCombo(combo.id, {
        name: name.trim(),
        kind,
        description: description.trim() || null,
        price_cents: kind === "pacote" ? priceFromInput(priceStr) : null,
        discount_pct:
          kind === "condicional" && discount !== "" ? Number(discount) : null,
        trigger_service_id:
          kind === "condicional" ? triggerId || null : null,
        active,
      });
      await setComboItems(combo.id, tenantId, items);
      const updated: ComboWithItems = {
        ...combo,
        name: name.trim(),
        kind,
        description: description.trim() || null,
        price_cents: kind === "pacote" ? priceFromInput(priceStr) : null,
        discount_pct:
          kind === "condicional" && discount !== "" ? Number(discount) : null,
        trigger_service_id: kind === "condicional" ? triggerId || null : null,
        active,
        items: items.map((it, i) => ({
          id: `${combo.id}-${i}`,
          combo_id: combo.id,
          tenant_id: tenantId,
          service_id: it.service_id,
          qty: it.qty,
          position: i,
        })),
      };
      onUpdated(updated);
      setState("saved");
    } catch (e) {
      setError((e as Error).message);
      setState("error");
    }
  }

  async function remove() {
    if (!confirm(`Remover "${name}"?`)) return;
    try {
      await deleteComboRow(combo.id);
      onDeleted(combo.id);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const itemsLabel = kind === "pacote" ? "Serviços incluídos" : "Serviços ofertados";

  return (
    <Card className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-[1.6fr_1fr]">
        <Field label="Nome">
          <TextInput
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              touch();
            }}
          />
        </Field>
        <Field label="Tipo">
          <Select
            value={kind}
            onChange={(e) => {
              setKind(e.target.value as ComboKind);
              touch();
            }}
          >
            <option value="pacote">Pacote (preço fechado)</option>
            <option value="condicional">Oferta condicional (desconto)</option>
          </Select>
        </Field>
      </div>

      <Field label="Descrição (opcional)" hint="como a Lena apresenta o combo">
        <Textarea
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            touch();
          }}
          rows={2}
        />
      </Field>

      {kind === "pacote" ? (
        <Field label="Preço do pacote (R$)">
          <TextInput
            className="sm:w-48"
            placeholder="ex.: 350,00"
            value={priceStr}
            onChange={(e) => {
              setPriceStr(e.target.value);
              touch();
            }}
          />
        </Field>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Gatilho" hint="ao fechar este serviço, a Lena oferece os de baixo">
            <Select
              value={triggerId}
              onChange={(e) => {
                setTriggerId(e.target.value);
                touch();
              }}
            >
              <option value="">Selecione um serviço…</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Desconto (%)">
            <TextInput
              type="number"
              min={0}
              max={100}
              placeholder="ex.: 20"
              value={discount}
              onChange={(e) => {
                setDiscount(e.target.value);
                touch();
              }}
            />
          </Field>
        </div>
      )}

      <div className="flex flex-col gap-2 rounded-[12px] border border-creme-edge bg-creme-soft/60 p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-cafe">{itemsLabel}</span>
          <button
            type="button"
            onClick={addItem}
            className="text-xs font-semibold text-terracota hover:text-terracota-dark"
          >
            + adicionar item
          </button>
        </div>
        {items.length === 0 ? (
          <p className="text-xs text-cafe-muted">
            Nenhum serviço ainda. Adicione os que compõem este combo.
          </p>
        ) : (
          items.map((it, i) => (
            <div key={i} className="flex items-center gap-2">
              <Select
                value={it.service_id}
                onChange={(e) => {
                  const v = e.target.value;
                  setItems(items.map((x, j) => (j === i ? { ...x, service_id: v } : x)));
                  touch();
                }}
                className="flex-1"
              >
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
              <TextInput
                type="number"
                min={1}
                value={it.qty}
                onChange={(e) => {
                  const q = Math.max(1, Number(e.target.value) || 1);
                  setItems(items.map((x, j) => (j === i ? { ...x, qty: q } : x)));
                  touch();
                }}
                className="w-16"
                title={`quantidade de ${svcName(it.service_id)}`}
              />
              <button
                type="button"
                onClick={() => {
                  setItems(items.filter((_, j) => j !== i));
                  touch();
                }}
                className="shrink-0 rounded-md px-2 py-1 text-xs text-cafe-muted transition hover:bg-terracota-soft hover:text-terracota-dark"
              >
                remover
              </button>
            </div>
          ))
        )}
      </div>

      <label className="flex items-center gap-2 text-sm text-cafe">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => {
            setActive(e.target.checked);
            touch();
          }}
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
