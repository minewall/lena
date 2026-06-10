import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  APPT_STATUS,
  CONV_STATE,
  fmtPhone,
  loadClienteDetalhe,
  toggleOptOut,
  updateClienteNotas,
  updateClienteTags,
  waUrl,
  type AgendamentoResumo,
  type ClienteDetalhe,
  type ConversaResumo,
  type MensagemResumo,
} from "../../lib/clientes";
import { useAuth } from "../../store/auth";
import { Button, Card, StatusPill, Textarea, TextInput } from "../../components/ui";

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

// ── Subcomponentes ─────────────────────────────────────────────────────────

function TagEditor({
  tags,
  onSave,
}: {
  tags: string[];
  onSave: (tags: string[]) => Promise<void>;
}) {
  const [input, setInput] = useState("");
  const [current, setCurrent] = useState(tags);
  const [saving, setSaving] = useState(false);

  async function add() {
    const t = input.trim().toLowerCase();
    if (!t || current.includes(t)) return;
    const next = [...current, t];
    setCurrent(next);
    setInput("");
    setSaving(true);
    await onSave(next).finally(() => setSaving(false));
  }

  async function remove(tag: string) {
    const next = current.filter((t) => t !== tag);
    setCurrent(next);
    setSaving(true);
    await onSave(next).finally(() => setSaving(false));
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {current.map((t) => (
          <span
            key={t}
            className="flex items-center gap-1 rounded-full bg-creme-edge px-2.5 py-0.5 text-xs text-cafe-soft"
          >
            {t}
            <button
              type="button"
              onClick={() => remove(t)}
              className="text-cafe-muted hover:text-terracota"
            >
              ×
            </button>
          </span>
        ))}
        {current.length === 0 && (
          <span className="text-xs text-cafe-muted">sem tags</span>
        )}
      </div>
      <div className="flex gap-2">
        <TextInput
          placeholder="Nova tag…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          className="text-xs py-1 w-36"
        />
        <Button variant="ghost" onClick={add} className="py-1 text-xs">
          {saving ? "…" : "+ Adicionar"}
        </Button>
      </div>
    </div>
  );
}

function Bubble({ msg }: { msg: MensagemResumo }) {
  const isOut = msg.direction === "out";
  return (
    <div className={`flex ${isOut ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
          isOut
            ? "rounded-br-sm bg-salvia text-white"
            : "rounded-bl-sm bg-creme-edge text-cafe"
        }`}
      >
        {msg.body ?? <span className="italic text-xs opacity-60">[{msg.kind}]</span>}
        <div
          className={`mt-0.5 text-[10px] ${
            isOut ? "text-white/60 text-right" : "text-cafe-muted"
          }`}
        >
          {new Date(msg.created_at).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
}

function ConversaCard({ conv }: { conv: ConversaResumo }) {
  const [open, setOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [open]);

  return (
    <Card className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium text-cafe">Conversa WhatsApp</span>
          <span className="rounded-full bg-creme-edge px-2 py-0.5 text-xs text-cafe-muted">
            {CONV_STATE[conv.state] ?? conv.state}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-cafe-muted">
            {conv.messages.length} mensagens
          </span>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="text-xs text-cafe-soft hover:text-cafe"
          >
            {open ? "Fechar" : "Ver mensagens"}
          </button>
        </div>
      </div>

      <div className="text-xs text-cafe-muted">
        Desde {fmtDateTime(conv.opened_at)}
        {conv.last_message_at
          ? ` · Última mensagem ${fmtDateTime(conv.last_message_at)}`
          : ""}
      </div>

      {open && (
        <div className="mt-2 flex max-h-80 flex-col gap-2 overflow-y-auto rounded-xl bg-creme p-3">
          {conv.messages.length === 0 ? (
            <p className="text-center text-xs text-cafe-muted">
              Nenhuma mensagem ainda.
            </p>
          ) : (
            conv.messages.map((m) => <Bubble key={m.id} msg={m} />)
          )}
          <div ref={bottomRef} />
        </div>
      )}
    </Card>
  );
}

function AgendamentoCard({ a }: { a: AgendamentoResumo }) {
  const isPast = new Date(a.starts_at) < new Date();
  const status = APPT_STATUS[a.status] ?? a.status;
  const statusColor =
    a.status === "done" || a.status === "confirmed"
      ? "text-salvia"
      : a.status === "cancelled" || a.status === "no_show"
        ? "text-terracota"
        : "text-cafe-soft";

  return (
    <div
      className={`flex items-start justify-between gap-3 rounded-xl border border-creme-edge p-3 text-sm ${
        isPast ? "opacity-60" : ""
      }`}
    >
      <div className="flex flex-col gap-0.5">
        <span className="font-medium text-cafe">
          {a.service_name ?? "Serviço"}
        </span>
        <span className="text-xs text-cafe-muted">
          {fmtDate(a.starts_at)}
          {a.notes ? ` · ${a.notes}` : ""}
        </span>
      </div>
      <span className={`text-xs font-medium ${statusColor}`}>{status}</span>
    </div>
  );
}

// ── Página principal ───────────────────────────────────────────────────────

export function ClientePerfil() {
  const { id } = useParams<{ id: string }>();
  const tenantId = useAuth((s) => s.currentTenantId);
  const [cliente, setCliente] = useState<ClienteDetalhe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingNotas, setSavingNotas] = useState(false);

  const reload = useCallback(async () => {
    if (!tenantId || !id) return;
    try {
      setCliente(await loadClienteDetalhe(tenantId, id));
    } catch (e) {
      setError((e as Error).message);
    }
  }, [tenantId, id]);

  useEffect(() => {
    setLoading(true);
    reload().finally(() => setLoading(false));
  }, [reload]);

  if (!tenantId) return null;

  if (loading) {
    return <p className="text-cafe-soft animate-pulse-soft">carregando…</p>;
  }

  if (!cliente) {
    return (
      <Card>
        <p className="text-sm text-cafe-soft">Cliente não encontrado.</p>
        <Link to="/clientes" className="mt-2 text-sm text-terracota underline">
          ← Voltar
        </Link>
      </Card>
    );
  }

  const name = cliente.name ?? fmtPhone(cliente.phone_e164);
  const diasSemContato = cliente.last_message_at
    ? Math.floor(
        (Date.now() - new Date(cliente.last_message_at).getTime()) / 86_400_000,
      )
    : null;

  return (
    <div className="flex flex-col gap-5">
      {/* voltar */}
      <Link
        to="/clientes"
        className="text-sm text-cafe-muted hover:text-cafe w-fit"
      >
        ← Clientes
      </Link>

      {error ? <StatusPill kind="error">{error}</StatusPill> : null}

      {/* header */}
      <Card className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-display text-cafe">{name}</h1>
          <a
            href={waUrl(cliente.phone_e164)}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-cafe-soft hover:text-salvia"
          >
            {fmtPhone(cliente.phone_e164)}
          </a>
          <p className="text-xs text-cafe-muted">
            Cliente desde {fmtDate(cliente.created_at)}
          </p>
        </div>

        {/* stats rápidos */}
        <div className="flex flex-wrap gap-4">
          <Stat
            label="Último contato"
            value={
              diasSemContato !== null ? `${diasSemContato}d atrás` : "Nunca"
            }
            alert={diasSemContato !== null && diasSemContato > 30}
          />
          <Stat
            label="Mensagens"
            value={String(cliente.total_messages)}
          />
          <Stat
            label="Agendamentos"
            value={String(cliente.appointments.length)}
          />
          {cliente.opted_out && (
            <span className="self-start rounded-full bg-terracota-soft px-2.5 py-1 text-xs text-terracota-dark font-medium">
              Opt-out
            </span>
          )}
        </div>
      </Card>

      <div className="grid gap-5 md:grid-cols-[1fr_280px]">
        {/* coluna principal: conversa + agendamentos */}
        <div className="flex flex-col gap-4">
          {cliente.conversation ? (
            <ConversaCard conv={cliente.conversation} />
          ) : (
            <Card>
              <p className="text-sm text-cafe-soft">
                Nenhuma conversa registrada ainda.
              </p>
            </Card>
          )}

          {cliente.appointments.length > 0 && (
            <Card className="flex flex-col gap-3">
              <h2 className="font-display text-lg text-cafe">Agendamentos</h2>
              <div className="flex flex-col gap-2">
                {cliente.appointments.map((a) => (
                  <AgendamentoCard key={a.id} a={a} />
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* sidebar: tags + notas + opt-out */}
        <div className="flex flex-col gap-4">
          <Card className="flex flex-col gap-3">
            <h2 className="font-display text-base text-cafe">Tags</h2>
            <TagEditor
              tags={cliente.tags}
              onSave={(tags) => updateClienteTags(cliente.id, tags)}
            />
          </Card>

          <Card className="flex flex-col gap-2">
            <h2 className="font-display text-base text-cafe">
              Notas internas {savingNotas ? <span className="text-xs font-normal text-cafe-muted">salvando…</span> : null}
            </h2>
            <Textarea
              defaultValue={cliente.notes ?? ""}
              rows={5}
              placeholder="Observações sobre este cliente…"
              onBlur={async (e) => {
                const v = e.target.value;
                if (v !== (cliente.notes ?? "")) {
                  setSavingNotas(true);
                  await updateClienteNotas(cliente.id, v).finally(() =>
                    setSavingNotas(false),
                  );
                }
              }}
            />
          </Card>

          <Card className="flex flex-col gap-2">
            <h2 className="font-display text-base text-cafe">Preferências</h2>
            <label className="flex items-center gap-2 cursor-pointer text-sm text-cafe-soft">
              <input
                type="checkbox"
                checked={cliente.opted_out}
                onChange={(e) => {
                  const v = e.target.checked;
                  setCliente((prev) =>
                    prev ? { ...prev, opted_out: v } : prev,
                  );
                  toggleOptOut(cliente.id, v);
                }}
                className="accent-terracota"
              />
              Opt-out (não recebe mensagens automáticas)
            </label>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  alert = false,
}: {
  label: string;
  value: string;
  alert?: boolean;
}) {
  return (
    <div className="flex flex-col items-center rounded-xl bg-creme px-4 py-2 text-center">
      <span
        className={`text-xl font-display ${alert ? "text-terracota" : "text-cafe"}`}
      >
        {value}
      </span>
      <span className="text-xs text-cafe-muted">{label}</span>
    </div>
  );
}
