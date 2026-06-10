import { type FormEvent, useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  addTenantNote,
  fmtCost,
  HEALTH_META,
  loadTenantDetalhe,
  SEG_LABEL,
  updateTenantStatus,
  type TenantDetalhe,
  type TenantNote,
} from "../../lib/averse-tenants";
import { useAuth } from "../../store/auth";
import {
  Button,
  Card,
  Select,
  StatusPill,
  Textarea,
} from "../../components/ui";

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
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function fmtSeconds(s: number): string {
  if (s < 60) return `${Math.round(s)}s`;
  return `${Math.round(s / 60)}min`;
}

// ── Subcomponentes ─────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-xl bg-creme px-4 py-3 text-center min-w-[100px]">
      <span className="text-xl font-display text-cafe">{value}</span>
      <span className="text-xs text-cafe-muted leading-tight">{label}</span>
      {sub ? <span className="text-[10px] text-cafe-muted">{sub}</span> : null}
    </div>
  );
}

function NoteItem({ note }: { note: TenantNote }) {
  return (
    <div className="flex flex-col gap-0.5 border-t border-creme-edge py-3 first:border-t-0 first:pt-0">
      <p className="text-sm text-cafe leading-relaxed">{note.body}</p>
      <span className="text-xs text-cafe-muted">
        {fmtDateTime(note.created_at)}
        {note.author_name ? ` · ${note.author_name}` : ""}
      </span>
    </div>
  );
}

function NotesPanel({
  notes,
  tenantId,
  authorId,
  onAdded,
}: {
  notes: TenantNote[];
  tenantId: string;
  authorId: string;
  onAdded: () => void;
}) {
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSaving(true);
    setErr(null);
    try {
      await addTenantNote(tenantId, authorId, body);
      setBody("");
      onAdded();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="flex flex-col gap-3">
      <h2 className="font-display text-lg text-cafe">Relacionamento</h2>

      {/* form de nova nota */}
      <form onSubmit={submit} className="flex flex-col gap-2">
        <Textarea
          rows={3}
          placeholder="Registrar contato, observação ou próximo passo…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={saving || !body.trim()}>
            {saving ? "Salvando…" : "Adicionar nota"}
          </Button>
          {err ? <StatusPill kind="error">{err}</StatusPill> : null}
        </div>
      </form>

      {/* lista de notas */}
      {notes.length === 0 ? (
        <p className="text-sm text-cafe-muted">
          Nenhuma nota ainda. Registre o primeiro contato.
        </p>
      ) : (
        <div className="flex flex-col">
          {notes.map((n) => (
            <NoteItem key={n.id} note={n} />
          ))}
        </div>
      )}
    </Card>
  );
}

// ── Página principal ───────────────────────────────────────────────────────

export function AverseTenantPerfil() {
  const { id } = useParams<{ id: string }>();
  const isPlatformAdmin = useAuth((s) => s.isPlatformAdmin);
  const userId = useAuth((s) => s.user?.id ?? "");
  const [tenant, setTenant] = useState<TenantDetalhe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusSaving, setStatusSaving] = useState(false);

  const reload = useCallback(async () => {
    if (!id) return;
    try {
      setTenant(await loadTenantDetalhe(id));
    } catch (e) {
      setError((e as Error).message);
    }
  }, [id]);

  useEffect(() => {
    if (!isPlatformAdmin) return;
    setLoading(true);
    reload().finally(() => setLoading(false));
  }, [reload, isPlatformAdmin]);

  if (!isPlatformAdmin) {
    return (
      <Card>
        <p className="text-sm text-cafe-soft">Área exclusiva da Averse.</p>
      </Card>
    );
  }

  if (loading) {
    return <p className="text-cafe-soft animate-pulse-soft">carregando…</p>;
  }

  if (!tenant) {
    return (
      <Card>
        <p className="text-sm text-cafe-soft">Tenant não encontrado.</p>
        <Link
          to="/averse/tenants"
          className="mt-2 text-sm text-terracota underline"
        >
          ← Voltar
        </Link>
      </Card>
    );
  }

  const health = HEALTH_META[tenant.health];
  const d = tenant.dash;

  return (
    <div className="flex flex-col gap-5">
      <Link
        to="/averse/tenants"
        className="text-sm text-cafe-muted hover:text-cafe w-fit"
      >
        ← Clientes Averse
      </Link>

      {error ? <StatusPill kind="error">{error}</StatusPill> : null}

      {/* header */}
      <Card className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-display text-cafe">{tenant.name}</h1>
            <span
              className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5"
              style={{ backgroundColor: health.dot + "22" }}
            >
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: health.dot }}
              />
              <span className={`text-xs font-medium ${health.text}`}>
                {health.label}
              </span>
            </span>
          </div>
          <p className="text-sm text-cafe-soft">
            {SEG_LABEL[tenant.segment] ?? tenant.segment} · slug:{" "}
            <span className="font-mono text-xs">{tenant.slug}</span>
          </p>
          <p className="text-xs text-cafe-muted">
            Cliente desde {fmtDate(tenant.created_at)}
          </p>
        </div>

        {/* status do tenant */}
        <div className="flex items-center gap-3">
          <Select
            value={tenant.status}
            onChange={async (e) => {
              const v = e.target.value;
              setStatusSaving(true);
              try {
                await updateTenantStatus(tenant.id, v);
                setTenant((prev) =>
                  prev ? { ...prev, status: v } : prev,
                );
              } finally {
                setStatusSaving(false);
              }
            }}
            disabled={statusSaving}
            className="py-1 text-sm"
          >
            <option value="active">Ativo</option>
            <option value="paused">Pausado</option>
            <option value="archived">Arquivado</option>
          </Select>
          {statusSaving && (
            <span className="text-xs text-cafe-muted">salvando…</span>
          )}
        </div>
      </Card>

      {/* stats 30d */}
      {d && (
        <div className="flex flex-wrap gap-3">
          <StatCard
            label="Conversas"
            value={d.conversations_period.toLocaleString("pt-BR")}
            sub="30 dias"
          />
          <StatCard
            label="Msgs recebidas"
            value={d.messages_in.toLocaleString("pt-BR")}
            sub="30 dias"
          />
          <StatCard
            label="Msgs enviadas"
            value={d.messages_out.toLocaleString("pt-BR")}
            sub={`Lena: ${d.lena_out}`}
          />
          <StatCard
            label="Novos contatos"
            value={d.contacts_new.toLocaleString("pt-BR")}
            sub="30 dias"
          />
          <StatCard
            label="Custo IA"
            value={fmtCost(d.cost_micro_usd)}
            sub="30 dias"
          />
          {d.avg_response_seconds > 0 && (
            <StatCard
              label="Resp. média"
              value={fmtSeconds(d.avg_response_seconds)}
              sub="pela Lena"
            />
          )}
          {d.needs_attention > 0 && (
            <StatCard
              label="Aguardando"
              value={String(d.needs_attention)}
              sub="handoff"
            />
          )}
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-[1fr_300px]">
        {/* coluna principal: notas de relacionamento */}
        <NotesPanel
          notes={tenant.notes}
          tenantId={tenant.id}
          authorId={userId}
          onAdded={reload}
        />

        {/* sidebar: membros */}
        <Card className="flex flex-col gap-3">
          <h2 className="font-display text-lg text-cafe">Equipe</h2>
          {tenant.members.length === 0 ? (
            <p className="text-sm text-cafe-muted">Sem membros.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-creme-edge">
              {tenant.members.map((m) => (
                <li key={m.user_id} className="flex flex-col gap-0.5 py-2.5">
                  <span className="text-sm font-medium text-cafe">
                    {m.full_name ?? m.email}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-cafe-muted">{m.email}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] ${
                        m.role === "admin"
                          ? "bg-terracota-soft text-terracota-dark"
                          : "bg-creme-edge text-cafe-muted"
                      }`}
                    >
                      {m.role === "admin" ? "Admin" : "Operador"}
                    </span>
                    {!m.accepted_at && (
                      <span className="rounded-full bg-creme-edge px-2 py-0.5 text-[10px] text-cafe-muted">
                        convite pendente
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
