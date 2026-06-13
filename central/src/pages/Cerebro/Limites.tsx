import { type FormEvent, useEffect, useState } from "react";
import {
  loadBrain,
  updateBrain,
  type TeamMemberRow,
  type TenantBrainRow,
} from "../../lib/brain";
import { useAuth } from "../../store/auth";
import {
  Button,
  Card,
  Field,
  StatusPill,
  TextInput,
  Textarea,
} from "../../components/ui";

export function CerebroLimites() {
  const tenantId = useAuth((s) => s.currentTenantId);
  const [brain, setBrain] = useState<TenantBrainRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  // campos
  const [restrictions, setRestrictions] = useState("");
  const [triggersStr, setTriggersStr] = useState("");
  const [teamPublic, setTeamPublic] = useState<TeamMemberRow[]>([]);
  const [teamPrivate, setTeamPrivate] = useState("");

  useEffect(() => {
    if (!tenantId) return;
    loadBrain(tenantId)
      .then((b) => {
        setBrain(b);
        setRestrictions(b.restrictions ?? "");
        setTriggersStr((b.escalation_triggers ?? []).join(", "));
        setTeamPublic(b.team_public ?? []);
        setTeamPrivate(b.team_private ?? "");
      })
      .catch((e) => setError(e.message));
  }, [tenantId]);

  if (!tenantId) return null;
  if (!brain) {
    return <Card className="text-cafe-soft animate-pulse-soft">carregando…</Card>;
  }

  function addMember() {
    setTeamPublic((prev) => [...prev, { name: "", role: "" }]);
    setState("idle");
  }

  function updateMember(i: number, patch: Partial<TeamMemberRow>) {
    setTeamPublic((prev) =>
      prev.map((m, k) => (k === i ? { ...m, ...patch } : m)),
    );
    setState("idle");
  }

  function removeMember(i: number) {
    setTeamPublic((prev) => prev.filter((_, k) => k !== i));
    setState("idle");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!tenantId) return;
    setState("saving");
    setError(null);
    try {
      const triggers = triggersStr
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const cleanedTeam = teamPublic
        .map((m) => ({
          name: m.name.trim(),
          role: m.role.trim(),
          spec: (m.spec ?? "").trim() || undefined,
        }))
        .filter((m) => m.name.length > 0);
      const updated = await updateBrain(tenantId, {
        restrictions: restrictions.trim() || null,
        escalation_triggers: triggers,
        team_public: cleanedTeam,
        team_private: teamPrivate.trim() || null,
      });
      setBrain(updated);
      setTeamPublic(updated.team_public ?? []);
      setState("saved");
    } catch (err) {
      setError((err as Error).message);
      setState("error");
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <Card className="flex flex-col gap-4">
        <div>
          <h2 className="font-display text-xl text-cafe">
            O que a Lena não pode falar
          </h2>
          <p className="mt-1 text-sm text-cafe-soft">
            Liste temas e condutas proibidas. A Lena nunca vai dar essas
            respostas e vai transferir para um humano quando o assunto surgir.
          </p>
        </div>
        <Field
          label="Restrições"
          hint="Ex.: não dar diagnóstico médico, não prometer resultado de tratamento, não falar de valores fora da tabela, não dar orientação jurídica."
        >
          <Textarea
            rows={4}
            value={restrictions}
            onChange={(e) => setRestrictions(e.target.value)}
            placeholder="Escreva uma restrição por linha."
          />
        </Field>

        <Field
          label="Palavras que transferem na hora para humano"
          hint="Separe por vírgula. Quando o cliente usar uma delas, a Lena chama a equipe imediatamente. Ex.: reclamação, advogado, Procon, processo."
        >
          <TextInput
            value={triggersStr}
            onChange={(e) => setTriggersStr(e.target.value)}
            placeholder="reclamação, advogado, Procon"
          />
        </Field>
      </Card>

      <Card className="flex flex-col gap-4">
        <div>
          <h2 className="font-display text-xl text-cafe">Equipe</h2>
          <p className="mt-1 text-sm text-cafe-soft">
            A Lena só cita pelo nome quem você autorizar aqui. Você é
            responsável por confirmar que essas pessoas concordam em ter o nome
            usado no atendimento.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-cafe">
              Pessoas que a Lena pode citar
            </span>
            <Button onClick={addMember}>+ Adicionar pessoa</Button>
          </div>

          {teamPublic.length === 0 ? (
            <p className="text-sm text-cafe-soft">
              Ninguém autorizado. A Lena vai falar de forma geral (nossa
              equipe, o profissional responsável).
            </p>
          ) : (
            teamPublic.map((m, i) => (
              <div
                key={i}
                className="flex flex-col gap-3 rounded-[12px] border border-creme-edge bg-creme-soft/50 p-3"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Nome">
                    <TextInput
                      value={m.name}
                      onChange={(e) => updateMember(i, { name: e.target.value })}
                      placeholder="Dra. Helena"
                    />
                  </Field>
                  <Field label="Função (opcional)">
                    <TextInput
                      value={m.role}
                      onChange={(e) => updateMember(i, { role: e.target.value })}
                      placeholder="dermatologista"
                    />
                  </Field>
                </div>
                <Field
                  label="Especialidades (opcional)"
                  hint="A Lena usa para indicar a pessoa certa. Separe por vírgula. Ex.: botox, preenchimento, laser."
                >
                  <TextInput
                    value={m.spec ?? ""}
                    onChange={(e) => updateMember(i, { spec: e.target.value })}
                    placeholder="botox, preenchimento, laser"
                  />
                </Field>
                <Button
                  variant="danger"
                  onClick={() => removeMember(i)}
                  className="self-start"
                >
                  Remover
                </Button>
              </div>
            ))
          )}
        </div>

        <Field
          label="Informações internas (a Lena conhece, mas nunca conta ao cliente)"
          hint="Ex.: ramais internos, e-mail da gerência, escala de plantão, quem está de férias. Serve para a Lena entender o contexto sem expor."
        >
          <Textarea
            rows={3}
            value={teamPrivate}
            onChange={(e) => setTeamPrivate(e.target.value)}
          />
        </Field>
      </Card>

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
