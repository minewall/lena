import { EmptyState } from "../../components/EmptyState";
import { IconCalendar } from "../../components/icons";
import { useEffect, useMemo, useState } from "react";
import type { TenantService, TenantServiceCategory } from "@lena/shared/db";
import {
  deleteService as deleteServiceRow,
  insertService,
  loadServices,
  updateService,
} from "../../lib/brain";
import {
  deleteCategory,
  insertCategory,
  loadCategories,
  updateCategory,
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

/** Opções de categoria com rótulo hierárquico "Categoria › Subcategoria". */
function categoryOptions(cats: TenantServiceCategory[]) {
  const level1 = cats
    .filter((c) => !c.parent_id)
    .sort((a, b) => a.position - b.position);
  const out: { id: string; label: string }[] = [];
  for (const c1 of level1) {
    out.push({ id: c1.id, label: c1.name });
    cats
      .filter((c) => c.parent_id === c1.id)
      .sort((a, b) => a.position - b.position)
      .forEach((s) => out.push({ id: s.id, label: `${c1.name} › ${s.name}` }));
  }
  return out;
}

export function CerebroServicos() {
  const tenantId = useAuth((s) => s.currentTenantId);
  const [items, setItems] = useState<TenantService[]>([]);
  const [cats, setCats] = useState<TenantServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantId) return;
    setLoading(true);
    Promise.all([loadServices(tenantId), loadCategories(tenantId)])
      .then(([svc, cat]) => {
        setItems(svc);
        setCats(cat);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [tenantId]);

  if (!tenantId) return null;

  const opts = categoryOptions(cats);

  async function addService() {
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

  // ordena por categoria (na ordem das opções) e depois por posição, para dar
  // sensação de agrupamento sem quebrar a lista plana de cards.
  const ordered = useMemo(() => {
    const rank = new Map(opts.map((o, i) => [o.id, i]));
    return [...items].sort((a, b) => {
      const ra = a.category_id ? (rank.get(a.category_id) ?? 9998) : 9999;
      const rb = b.category_id ? (rank.get(b.category_id) ?? 9998) : 9999;
      if (ra !== rb) return ra - rb;
      return a.position - b.position;
    });
  }, [items, opts]);

  return (
    <div className="flex flex-col gap-5">
      <CategoriasCard
        tenantId={tenantId}
        cats={cats}
        onChange={setCats}
        onError={setError}
      />

      <div className="flex items-center justify-between">
        <p className="text-sm text-cafe-soft">
          Cada serviço entra na agenda e nas respostas da Lena — com tempo,
          preparo e sessões. Organize por categoria para ela navegar melhor.
        </p>
        <Button onClick={addService}>+ Adicionar serviço</Button>
      </div>

      {error ? <StatusPill kind="error">{error}</StatusPill> : null}

      {loading ? (
        <Card className="text-cafe-soft animate-pulse-soft">carregando…</Card>
      ) : items.length === 0 ? (
        <Card className="p-0">
          <EmptyState
            icon={IconCalendar}
            title="Nenhum serviço cadastrado"
            description="Cada serviço (com preço, duração, preparo e sessões) entra na agenda e nas respostas da Lena. Adicione o primeiro para ela começar a oferecer e marcar."
            action={{ label: "+ Adicionar serviço", onClick: addService }}
          />
        </Card>
      ) : (
        ordered.map((service) => (
          <ServiceRow
            key={service.id}
            service={service}
            options={opts}
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

/* ── Categorias: árvore de 2 níveis, edição inline ─────────────────────── */

function CategoriasCard({
  tenantId,
  cats,
  onChange,
  onError,
}: {
  tenantId: string;
  cats: TenantServiceCategory[];
  onChange: (cats: TenantServiceCategory[]) => void;
  onError: (msg: string) => void;
}) {
  const level1 = cats
    .filter((c) => !c.parent_id)
    .sort((a, b) => a.position - b.position);

  async function add(parentId: string | null) {
    try {
      const siblings = cats.filter((c) => (c.parent_id ?? null) === parentId);
      const created = await insertCategory({
        tenant_id: tenantId,
        parent_id: parentId,
        name: parentId ? "Nova subcategoria" : "Nova categoria",
        position: siblings.length,
      });
      onChange([...cats, created]);
    } catch (e) {
      onError((e as Error).message);
    }
  }

  async function rename(id: string, name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      await updateCategory(id, { name: trimmed });
      onChange(cats.map((c) => (c.id === id ? { ...c, name: trimmed } : c)));
    } catch (e) {
      onError((e as Error).message);
    }
  }

  async function remove(cat: TenantServiceCategory) {
    const hasSubs = cats.some((c) => c.parent_id === cat.id);
    const msg = hasSubs
      ? `Remover "${cat.name}" e suas subcategorias? Os serviços ficam sem categoria.`
      : `Remover "${cat.name}"? Os serviços nessa categoria ficam sem categoria.`;
    if (!confirm(msg)) return;
    try {
      await deleteCategory(cat.id);
      onChange(cats.filter((c) => c.id !== cat.id && c.parent_id !== cat.id));
    } catch (e) {
      onError((e as Error).message);
    }
  }

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg text-cafe">Categorias</h2>
          <p className="text-xs text-cafe-muted">
            Dois níveis. Ex.: <em>Tratamento capilar › Tingimento</em>.
            Subcategoria é opcional.
          </p>
        </div>
        <Button variant="ghost" onClick={() => add(null)}>
          + Categoria
        </Button>
      </div>

      {level1.length === 0 ? (
        <p className="text-sm text-cafe-soft">
          Nenhuma categoria ainda. Crie a primeira para agrupar seus serviços.
        </p>
      ) : (
        <div className="flex flex-col divide-y divide-creme-edge">
          {level1.map((c1) => {
            const subs = cats
              .filter((c) => c.parent_id === c1.id)
              .sort((a, b) => a.position - b.position);
            return (
              <div key={c1.id} className="flex flex-col gap-1.5 py-2.5">
                <CategoryLine
                  cat={c1}
                  onRename={rename}
                  onRemove={remove}
                  strong
                />
                {subs.map((s) => (
                  <div key={s.id} className="pl-5">
                    <CategoryLine cat={s} onRename={rename} onRemove={remove} />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => add(c1.id)}
                  className="ml-5 self-start text-xs font-semibold text-terracota hover:text-terracota-dark"
                >
                  + Subcategoria
                </button>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function CategoryLine({
  cat,
  onRename,
  onRemove,
  strong,
}: {
  cat: TenantServiceCategory;
  onRename: (id: string, name: string) => void;
  onRemove: (cat: TenantServiceCategory) => void;
  strong?: boolean;
}) {
  const [name, setName] = useState(cat.name);
  return (
    <div className="flex items-center gap-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => name !== cat.name && onRename(cat.id, name)}
        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        className={`flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm text-cafe transition hover:border-creme-edge focus:border-terracota focus:bg-white focus:outline-none ${
          strong ? "font-semibold" : ""
        }`}
      />
      <button
        type="button"
        onClick={() => onRemove(cat)}
        title="Remover"
        className="shrink-0 rounded-md px-2 py-1 text-xs text-cafe-muted transition hover:bg-terracota-soft hover:text-terracota-dark"
      >
        remover
      </button>
    </div>
  );
}

/* ── Serviço: card rico ────────────────────────────────────────────────── */

function ServiceRow({
  service,
  options,
  onUpdated,
  onDeleted,
}: {
  service: TenantService;
  options: { id: string; label: string }[];
  onUpdated: (s: TenantService) => void;
  onDeleted: (id: string) => void;
}) {
  const [local, setLocal] = useState(service);
  const [priceStr, setPriceStr] = useState(priceToInput(service.price_cents));
  const [showCare, setShowCare] = useState(
    Boolean(service.prep_instructions || service.aftercare_instructions),
  );
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof TenantService>(key: K, value: TenantService[K]) {
    setLocal((prev) => ({ ...prev, [key]: value }));
    setState("idle");
  }

  const isSeries = (local.default_sessions ?? 1) > 1;

  async function save() {
    setState("saving");
    setError(null);
    try {
      const patch = {
        name: local.name.trim(),
        description: local.description,
        category_id: local.category_id,
        price_cents: priceFromInput(priceStr),
        duration_min: local.duration_min,
        max_parallel: Math.max(1, local.max_parallel ?? 1),
        default_sessions: Math.max(1, local.default_sessions ?? 1),
        session_interval_days: isSeries ? local.session_interval_days : null,
        prep_instructions: local.prep_instructions?.trim() || null,
        aftercare_instructions: local.aftercare_instructions?.trim() || null,
        is_upsell: local.is_upsell,
        active: local.active,
        position: local.position,
      };
      await updateService(service.id, patch);
      const updated = { ...local, ...patch };
      onUpdated(updated);
      setLocal(updated);
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
      <div className="grid gap-3 sm:grid-cols-[1.6fr_1fr]">
        <Field label="Nome">
          <TextInput value={local.name} onChange={(e) => set("name", e.target.value)} />
        </Field>
        <Field label="Categoria">
          <Select
            value={local.category_id ?? ""}
            onChange={(e) => set("category_id", e.target.value || null)}
          >
            <option value="">Sem categoria</option>
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

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
        <Field label="Máx. simultâneos" hint="quantos ao mesmo tempo">
          <TextInput
            type="number"
            min={1}
            value={local.max_parallel ?? 1}
            onChange={(e) => set("max_parallel", Math.max(1, Number(e.target.value) || 1))}
          />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Sessões previstas" hint="1 = atendimento único">
          <TextInput
            type="number"
            min={1}
            value={local.default_sessions ?? 1}
            onChange={(e) =>
              set("default_sessions", Math.max(1, Number(e.target.value) || 1))
            }
          />
        </Field>
        {isSeries ? (
          <Field label="Intervalo entre sessões (dias)">
            <TextInput
              type="number"
              min={1}
              placeholder="ex.: 15"
              value={local.session_interval_days ?? ""}
              onChange={(e) =>
                set(
                  "session_interval_days",
                  e.target.value === "" ? null : Number(e.target.value),
                )
              }
            />
          </Field>
        ) : null}
      </div>

      {isSeries ? (
        <p className="-mt-1 text-xs text-cafe-muted">
          A Lena vai propor a série completa ({local.default_sessions} sessões) já
          no agendamento e considerar isso nas remarcações.
        </p>
      ) : null}

      {showCare ? (
        <div className="grid gap-3 sm:grid-cols-2 rounded-[12px] border border-creme-edge bg-creme-soft/60 p-3">
          <Field
            label="Preparo / pré-requisito"
            hint="antes do atendimento — ex.: não secar o cabelo, sem álcool 24h"
          >
            <Textarea
              value={local.prep_instructions ?? ""}
              onChange={(e) => set("prep_instructions", e.target.value || null)}
              rows={2}
            />
          </Field>
          <Field label="Cuidados depois" hint="pós-atendimento — ex.: não lavar por 48h">
            <Textarea
              value={local.aftercare_instructions ?? ""}
              onChange={(e) => set("aftercare_instructions", e.target.value || null)}
              rows={2}
            />
          </Field>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowCare(true)}
          className="self-start text-xs font-semibold text-terracota hover:text-terracota-dark"
        >
          + Preparo e cuidados
        </button>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-cafe">
          <input
            type="checkbox"
            checked={local.is_upsell}
            onChange={(e) => set("is_upsell", e.target.checked)}
          />
          Oferecer como upsell
        </label>
        <label className="flex items-center gap-2 text-sm text-cafe">
          <input
            type="checkbox"
            checked={local.active}
            onChange={(e) => set("active", e.target.checked)}
          />
          Ativo (a Lena oferece)
        </label>
      </div>

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
