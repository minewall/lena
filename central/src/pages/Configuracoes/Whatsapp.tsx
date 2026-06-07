import { type FormEvent, useEffect, useMemo, useState } from "react";
import type { WaNumber } from "@lena/shared/db";
import { env } from "../../lib/env";
import { loadWaNumber, saveWaConfig, webhookUrl } from "../../lib/wa";
import { useAuth } from "../../store/auth";
import {
  Button,
  Card,
  Field,
  StatusPill,
  TextInput,
  Textarea,
} from "../../components/ui";

const QUALITY_STYLES: Record<WaNumber["quality_rating"], string> = {
  unknown: "bg-creme-edge text-cafe-soft",
  green: "bg-salvia-soft text-cafe",
  yellow: "bg-creme-edge text-cafe",
  red: "bg-terracota-soft text-terracota-dark",
};

const STATUS_LABEL: Record<WaNumber["status"], string> = {
  connected: "Conectado",
  pending: "Pendente",
  disconnected: "Desconectado",
};

export function ConfiguracoesWhatsapp() {
  const tenantId = useAuth((s) => s.currentTenantId);
  const [waNumber, setWaNumber] = useState<WaNumber | null>(null);
  const [loading, setLoading] = useState(true);

  // form
  const [phoneE164, setPhoneE164] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [wabaId, setWabaId] = useState("");
  const [systemUserToken, setSystemUserToken] = useState("");
  const [verifyToken, setVerifyToken] = useState("");

  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantId) return;
    setLoading(true);
    loadWaNumber(tenantId)
      .then((wa) => {
        setWaNumber(wa);
        if (wa) {
          setPhoneE164(wa.phone_e164);
          setDisplayName(wa.display_name ?? "");
          setPhoneNumberId(wa.phone_number_id);
          setWabaId(wa.waba_id);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [tenantId]);

  const url = useMemo(() => webhookUrl(env.supabaseUrl), []);

  if (!tenantId) return null;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!tenantId) return;
    setState("saving");
    setError(null);
    try {
      await saveWaConfig({
        tenantId,
        phoneE164: phoneE164.trim(),
        displayName: displayName.trim(),
        phoneNumberId: phoneNumberId.trim(),
        wabaId: wabaId.trim(),
        systemUserToken: systemUserToken.trim(),
        verifyToken: verifyToken.trim(),
      });
      const wa = await loadWaNumber(tenantId);
      setWaNumber(wa);
      setSystemUserToken("");
      setVerifyToken("");
      setState("saved");
    } catch (e) {
      setError((e as Error).message);
      setState("error");
    }
  }

  if (loading) {
    return <Card className="text-cafe-soft animate-pulse-soft">carregando…</Card>;
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Status */}
      {waNumber ? (
        <Card className="flex flex-wrap items-center gap-4">
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-wide text-cafe-muted">
              Número
            </span>
            <span className="font-display text-xl text-cafe">
              {waNumber.phone_e164}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-wide text-cafe-muted">
              Display name
            </span>
            <span className="text-cafe">
              {waNumber.display_name ?? "—"}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-wide text-cafe-muted">
              Status
            </span>
            <span
              className={`rounded-full px-2.5 py-1 text-xs ${
                waNumber.status === "connected"
                  ? "bg-salvia-soft text-cafe"
                  : waNumber.status === "pending"
                    ? "bg-creme-edge text-cafe"
                    : "bg-terracota-soft text-terracota-dark"
              }`}
            >
              {STATUS_LABEL[waNumber.status]}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-wide text-cafe-muted">
              Quality rating
            </span>
            <span
              className={`rounded-full px-2.5 py-1 text-xs ${QUALITY_STYLES[waNumber.quality_rating]}`}
            >
              {waNumber.quality_rating}
            </span>
          </div>
        </Card>
      ) : (
        <Card className="text-cafe-soft">
          Nenhum número conectado ainda. Configure abaixo para a Lena começar
          a receber.
        </Card>
      )}

      {/* Webhook info */}
      <Card className="flex flex-col gap-2">
        <h2 className="font-display text-lg text-cafe">Webhook da Meta</h2>
        <p className="text-sm text-cafe-soft">
          No painel Meta → WABA → Webhooks, cole esta URL e o verify token que
          você (ou a Averse) escolheu. Eventos para assinar:{" "}
          <code>messages</code>, <code>message_template_status_update</code>,{" "}
          <code>phone_number_quality_update</code>.
        </p>
        <code className="rounded-lg bg-white px-3 py-2 text-xs text-cafe break-all">
          {url}
        </code>
      </Card>

      {/* Form */}
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <Card className="flex flex-col gap-4">
          <Field
            label="Número de WhatsApp (E.164)"
            hint="Com país e DDD, exemplo: +5511999999999"
          >
            <TextInput
              required
              placeholder="+5511999999999"
              value={phoneE164}
              onChange={(e) => setPhoneE164(e.target.value)}
            />
          </Field>

          <Field
            label="Display name aprovado"
            hint="Nome que aparece para o cliente no WhatsApp."
          >
            <TextInput
              required
              placeholder="Lena Demo"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </Field>

          <Field
            label="Phone Number ID (Meta)"
            hint="No painel Meta → WABA → Phone Numbers."
          >
            <TextInput
              required
              value={phoneNumberId}
              onChange={(e) => setPhoneNumberId(e.target.value)}
            />
          </Field>

          <Field label="WABA ID (Meta)" hint="No painel Meta → WABA → Overview.">
            <TextInput
              required
              value={wabaId}
              onChange={(e) => setWabaId(e.target.value)}
            />
          </Field>

          <Field
            label="System User Token"
            hint="Token longo-prazo gerado em Business Settings → Users → System Users. Não é exibido depois de salvo."
          >
            <Textarea
              required={!waNumber}
              placeholder={
                waNumber ? "preencher só para substituir" : "Bearer EAAxxxxx…"
              }
              value={systemUserToken}
              onChange={(e) => setSystemUserToken(e.target.value)}
              rows={3}
            />
          </Field>

          <Field
            label="Verify Token"
            hint="Token combinado com a Averse. Usado pelo handshake do webhook da Meta. Não é exibido depois de salvo."
          >
            <TextInput
              required={!waNumber}
              placeholder={waNumber ? "preencher só para substituir" : ""}
              value={verifyToken}
              onChange={(e) => setVerifyToken(e.target.value)}
            />
          </Field>
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={state === "saving"}>
            {state === "saving"
              ? "salvando…"
              : waNumber
                ? "Salvar mudanças"
                : "Conectar WhatsApp"}
          </Button>
          {state === "saved" ? <StatusPill kind="saved">salvo</StatusPill> : null}
          {state === "error" && error ? (
            <StatusPill kind="error">{error}</StatusPill>
          ) : null}
        </div>
      </form>
    </div>
  );
}
