import { type FormEvent, useCallback, useEffect, useState } from "react";
import type { TenantRole } from "@lena/shared/db";
import {
  inviteMember,
  listMembers,
  listPendingInvitations,
  revokeInvitation,
  type PendingInvitation,
  type TenantMember,
} from "../../lib/team";
import { useAuth } from "../../store/auth";
import { Button, Card, Field, Select, StatusPill, TextInput } from "../../components/ui";
import { relativeTime } from "../../lib/time";

const ROLE_LABEL: Record<TenantRole, string> = {
  admin: "Administrador",
  operador: "Operador",
};

const ROLE_HINT: Record<TenantRole, string> = {
  admin:
    "Acesso total: cérebro, conversas, configurações, equipe, planos.",
  operador:
    "Acesso ao inbox e conversas. Não edita cérebro nem convida outros.",
};

export function ConfiguracoesEquipe() {
  const tenantId = useAuth((s) => s.currentTenantId);
  const userEmail = useAuth((s) => s.user?.email ?? null);
  const [members, setMembers] = useState<TenantMember[]>([]);
  const [pending, setPending] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // form
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TenantRole>("operador");
  const [submitting, setSubmitting] = useState(false);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!tenantId) return;
    try {
      const [m, p] = await Promise.all([
        listMembers(tenantId),
        listPendingInvitations(tenantId),
      ]);
      setMembers(m);
      setPending(p);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [tenantId]);

  useEffect(() => {
    setLoading(true);
    reload().finally(() => setLoading(false));
  }, [reload]);

  if (!tenantId) return null;

  async function onInvite(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setOkMsg(null);
    try {
      await inviteMember(tenantId!, email.trim(), role);
      setEmail("");
      setOkMsg(`Convite criado para ${email.trim().toLowerCase()}.`);
      await reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function onRevoke(id: string, emailLabel: string) {
    if (!confirm(`Cancelar convite para ${emailLabel}?`)) return;
    try {
      await revokeInvitation(id);
      await reload();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="flex flex-col gap-4">
        <h2 className="font-display text-xl text-cafe">Convidar pessoa</h2>
        <p className="text-sm text-cafe-soft">
          Convide alguém pelo e-mail. Quando essa pessoa entrar na Central
          pelo mesmo e-mail, ela é adicionada automaticamente como{" "}
          <strong>{ROLE_LABEL[role].toLowerCase()}</strong> deste tenant.
        </p>

        <form onSubmit={onInvite} className="flex flex-col gap-4">
          <Field label="E-mail do convidado">
            <TextInput
              type="email"
              required
              placeholder="recepcao@negocio.com.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>

          <Field label="Função" hint={ROLE_HINT[role]}>
            <Select value={role} onChange={(e) => setRole(e.target.value as TenantRole)}>
              <option value="operador">{ROLE_LABEL.operador}</option>
              <option value="admin">{ROLE_LABEL.admin}</option>
            </Select>
          </Field>

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={submitting || !email.trim()}>
              {submitting ? "convidando…" : "Enviar convite"}
            </Button>
            {okMsg ? <StatusPill kind="saved">{okMsg}</StatusPill> : null}
            {error ? <StatusPill kind="error">{error}</StatusPill> : null}
          </div>
        </form>

        <p className="text-xs text-cafe-muted">
          Por enquanto, peça pra essa pessoa abrir{" "}
          <code className="rounded bg-creme-edge px-1.5 py-0.5">{window.location.origin}</code>{" "}
          e fazer login com o e-mail acima. O envio automático de e-mail
          chega na fase 2.
        </p>
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="font-display text-xl text-cafe">Convites pendentes</h2>
        {loading ? (
          <p className="text-cafe-soft animate-pulse-soft">carregando…</p>
        ) : pending.length === 0 ? (
          <p className="text-sm text-cafe-soft">Nenhum convite aguardando aceite.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-creme-edge">
            {pending.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between gap-3 py-3">
                <div className="flex flex-col">
                  <span className="text-sm text-cafe">{inv.email}</span>
                  <span className="text-xs text-cafe-muted">
                    {ROLE_LABEL[inv.role]} · enviado {relativeTime(inv.invited_at)}
                  </span>
                </div>
                <Button variant="danger" onClick={() => onRevoke(inv.id, inv.email)}>
                  Cancelar
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="font-display text-xl text-cafe">Pessoas com acesso</h2>
        {loading ? (
          <p className="text-cafe-soft animate-pulse-soft">carregando…</p>
        ) : members.length === 0 ? (
          <p className="text-sm text-cafe-soft">Nenhum membro ativo.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-creme-edge">
            {members.map((m) => {
              const isSelf = m.email === userEmail;
              return (
                <li key={m.user_id} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex flex-col">
                    <span className="text-sm text-cafe">
                      {m.full_name?.trim() || m.email}
                      {isSelf ? (
                        <span className="ml-2 text-xs text-cafe-muted">(você)</span>
                      ) : null}
                    </span>
                    <span className="text-xs text-cafe-muted">
                      {m.email} · {ROLE_LABEL[m.role]}
                      {m.accepted_at
                        ? ` · entrou ${relativeTime(m.accepted_at)}`
                        : " · pendente"}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
