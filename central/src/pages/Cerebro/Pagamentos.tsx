import { type FormEvent, useEffect, useState } from "react";
import {
  loadBrain,
  updateBrain,
  type PaymentsConfig,
  type TenantBrainRow,
} from "../../lib/brain";
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

const METHODS = [
  "Dinheiro",
  "Cartão de crédito",
  "Cartão de débito",
  "Pix",
  "Boleto",
  "Link de pagamento",
];

const PIX_KEY_TYPES = ["CPF", "CNPJ", "E-mail", "Telefone", "Aleatória"];

function normalize(p: unknown): PaymentsConfig {
  if (p && typeof p === "object" && !Array.isArray(p)) return p as PaymentsConfig;
  return {};
}

export function CerebroPagamentos() {
  const tenantId = useAuth((s) => s.currentTenantId);
  const [brain, setBrain] = useState<TenantBrainRow | null>(null);
  const [pay, setPay] = useState<PaymentsConfig>({});
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantId) return;
    loadBrain(tenantId)
      .then((b) => {
        setBrain(b);
        setPay(normalize(b.payments));
      })
      .catch((e) => setError(e.message));
  }, [tenantId]);

  if (!tenantId) return null;
  if (!brain) {
    return <Card className="text-cafe-soft animate-pulse-soft">carregando…</Card>;
  }

  function set<K extends keyof PaymentsConfig>(key: K, value: PaymentsConfig[K]) {
    setPay((prev) => ({ ...prev, [key]: value }));
    setState("idle");
  }

  function toggleMethod(m: string, on: boolean) {
    setPay((prev) => {
      const cur = new Set(prev.methods ?? []);
      if (on) cur.add(m);
      else cur.delete(m);
      return { ...prev, methods: [...cur] };
    });
    setState("idle");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!tenantId) return;
    setState("saving");
    setError(null);
    try {
      const clean: PaymentsConfig = {
        methods: pay.methods ?? [],
        pix_key_type: pay.pix_key?.trim() ? pay.pix_key_type : undefined,
        pix_key: pay.pix_key?.trim() || undefined,
        bank: pay.bank?.trim() || undefined,
        agency: pay.agency?.trim() || undefined,
        account: pay.account?.trim() || undefined,
        holder: pay.holder?.trim() || undefined,
        note: pay.note?.trim() || undefined,
      };
      const updated = await updateBrain(tenantId, { payments: clean });
      setBrain(updated);
      setPay(normalize(updated.payments));
      setState("saved");
    } catch (err) {
      setError((err as Error).message);
      setState("error");
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <p className="text-sm text-cafe-soft">
        Como o cliente pode pagar. A Lena usa para responder na hora quando
        perguntarem sobre formas de pagamento ou Pix.
      </p>

      <Card className="flex flex-col gap-4">
        <h2 className="font-display text-lg text-cafe">Formas aceitas</h2>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
          {METHODS.map((m) => (
            <label key={m} className="flex items-center gap-2 text-sm text-cafe">
              <input
                type="checkbox"
                checked={(pay.methods ?? []).includes(m)}
                onChange={(e) => toggleMethod(m, e.target.checked)}
              />
              {m}
            </label>
          ))}
        </div>
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="font-display text-lg text-cafe">Pix</h2>
        <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
          <Field label="Tipo da chave">
            <Select
              value={pay.pix_key_type ?? ""}
              onChange={(e) => set("pix_key_type", e.target.value || undefined)}
            >
              <option value="">Selecione…</option>
              {PIX_KEY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Chave Pix">
            <TextInput
              value={pay.pix_key ?? ""}
              onChange={(e) => set("pix_key", e.target.value)}
              placeholder="ex.: 11 99999-0000 ou contato@negocio.com.br"
            />
          </Field>
        </div>
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="font-display text-lg text-cafe">Dados bancários (opcional)</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Banco">
            <TextInput
              value={pay.bank ?? ""}
              onChange={(e) => set("bank", e.target.value)}
              placeholder="ex.: Banco do Brasil"
            />
          </Field>
          <Field label="Titular">
            <TextInput
              value={pay.holder ?? ""}
              onChange={(e) => set("holder", e.target.value)}
              placeholder="Razão social ou nome"
            />
          </Field>
          <Field label="Agência">
            <TextInput
              value={pay.agency ?? ""}
              onChange={(e) => set("agency", e.target.value)}
              placeholder="0000"
            />
          </Field>
          <Field label="Conta">
            <TextInput
              value={pay.account ?? ""}
              onChange={(e) => set("account", e.target.value)}
              placeholder="00000-0"
            />
          </Field>
        </div>
        <Field label="Observação (opcional)" hint="ex.: sinal de 50% para reservar, parcela em até 3x.">
          <Textarea
            rows={2}
            value={pay.note ?? ""}
            onChange={(e) => set("note", e.target.value)}
          />
        </Field>
      </Card>

      <p className="text-xs text-cafe-muted">
        Boleto via API (gerar e enviar pela Lena) chega numa fase futura.
      </p>

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
