import { useEffect, useState } from "react";
import type { TenantFaq } from "@lena/shared/db";
import {
  deleteFaq as deleteFaqRow,
  insertFaq,
  loadFaqs,
  updateFaq,
} from "../../lib/brain";
import { useAuth } from "../../store/auth";
import { Button, Card, Field, StatusPill, TextInput, Textarea } from "../../components/ui";

export function CerebroFaq() {
  const tenantId = useAuth((s) => s.currentTenantId);
  const [items, setItems] = useState<TenantFaq[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantId) return;
    setLoading(true);
    loadFaqs(tenantId)
      .then(setItems)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [tenantId]);

  if (!tenantId) return null;

  async function add() {
    if (!tenantId) return;
    try {
      const created = await insertFaq({
        tenant_id: tenantId,
        question: "Nova pergunta",
        answer: "",
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
          Cada pergunta vira material que a Lena consulta para responder com
          segurança. Quanto mais específica a resposta, melhor.
        </p>
        <Button onClick={add}>+ Adicionar pergunta</Button>
      </div>

      {error ? <StatusPill kind="error">{error}</StatusPill> : null}

      {loading ? (
        <Card className="text-cafe-soft animate-pulse-soft">carregando…</Card>
      ) : items.length === 0 ? (
        <Card className="text-cafe-soft">
          FAQ ainda vazio. Cadastre as perguntas mais comuns dos seus
          clientes.
        </Card>
      ) : (
        items.map((faq) => (
          <FaqRow
            key={faq.id}
            faq={faq}
            onUpdated={(u) =>
              setItems((cur) => cur.map((f) => (f.id === u.id ? u : f)))
            }
            onDeleted={(id) =>
              setItems((cur) => cur.filter((f) => f.id !== id))
            }
          />
        ))
      )}
    </div>
  );
}

function FaqRow({
  faq,
  onUpdated,
  onDeleted,
}: {
  faq: TenantFaq;
  onUpdated: (f: TenantFaq) => void;
  onDeleted: (id: string) => void;
}) {
  const [local, setLocal] = useState(faq);
  const [tagsStr, setTagsStr] = useState(faq.tags.join(", "));
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof TenantFaq>(key: K, value: TenantFaq[K]) {
    setLocal((prev) => ({ ...prev, [key]: value }));
    setState("idle");
  }

  async function save() {
    setState("saving");
    setError(null);
    try {
      const tags = tagsStr
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const patch = {
        question: local.question.trim(),
        answer: local.answer.trim(),
        tags,
        active: local.active,
        position: local.position,
      };
      await updateFaq(faq.id, patch);
      const updated = { ...local, ...patch };
      onUpdated(updated);
      setState("saved");
    } catch (e) {
      setError((e as Error).message);
      setState("error");
    }
  }

  async function remove() {
    if (!confirm(`Remover "${local.question}"?`)) return;
    try {
      await deleteFaqRow(faq.id);
      onDeleted(faq.id);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <Card className="flex flex-col gap-3">
      <Field label="Pergunta">
        <TextInput value={local.question} onChange={(e) => set("question", e.target.value)} />
      </Field>

      <Field label="Resposta">
        <Textarea
          value={local.answer}
          onChange={(e) => set("answer", e.target.value)}
          rows={3}
        />
      </Field>

      <Field label="Tags" hint="Separe por vírgula. Ex.: preços, horários, convênios.">
        <TextInput
          value={tagsStr}
          onChange={(e) => {
            setTagsStr(e.target.value);
            setState("idle");
          }}
        />
      </Field>

      <label className="flex items-center gap-2 text-sm text-cafe">
        <input
          type="checkbox"
          checked={local.active}
          onChange={(e) => set("active", e.target.checked)}
        />
        Ativo (a Lena pode usar)
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
