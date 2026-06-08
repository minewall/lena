import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { loadDashboardStats, type DashboardStats } from "../lib/dashboard";
import { useAuth } from "../store/auth";
import { Card } from "../components/ui";

const PERIODS = [
  { days: 1, label: "Hoje" },
  { days: 7, label: "7 dias" },
  { days: 30, label: "30 dias" },
];

export function Dashboard() {
  const tenants = useAuth((s) => s.tenants);
  const currentTenantId = useAuth((s) => s.currentTenantId);
  const currentTenant = tenants.find((t) => t.id === currentTenantId) ?? null;

  const [days, setDays] = useState(7);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentTenantId) return;
    setLoading(true);
    setError(null);
    loadDashboardStats(currentTenantId, days)
      .then(setStats)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [currentTenantId, days]);

  if (!currentTenant) {
    return (
      <div className="rounded-[var(--radius-card)] border border-creme-edge bg-creme-soft p-8 text-center">
        <h2 className="font-display text-2xl text-cafe">
          Bem-vinda à Central da Lena.
        </h2>
        <p className="mt-2 text-cafe-soft">
          Você ainda não tem um negócio cadastrado. Vamos começar?
        </p>
        <Link
          to="/criar-tenant"
          className="mt-6 inline-block rounded-xl bg-terracota px-5 py-2.5 font-medium text-white hover:bg-terracota-dark"
        >
          Criar primeiro negócio
        </Link>
      </div>
    );
  }

  const responseLabel = stats
    ? stats.avg_response_seconds > 0
      ? `${stats.avg_response_seconds.toFixed(0)}s`
      : "—"
    : "—";

  const automationPct =
    stats && stats.messages_out > 0
      ? Math.round((stats.lena_out / stats.messages_out) * 100)
      : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl text-cafe">Visão geral</h1>
        <div className="flex gap-1 rounded-full border border-creme-edge bg-creme-soft p-1">
          {PERIODS.map((p) => (
            <button
              key={p.days}
              type="button"
              onClick={() => setDays(p.days)}
              className={`rounded-full px-3 py-1 text-sm transition ${
                days === p.days
                  ? "bg-terracota text-white"
                  : "text-cafe-soft hover:text-cafe"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <Card className="text-terracota-dark text-sm">{error}</Card>
      ) : null}

      {/* KPIs principais */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Kpi
          label="Conversas no período"
          value={loading ? null : stats?.conversations_period ?? 0}
          hint={
            stats ? `${stats.conversations_today} hoje` : undefined
          }
        />
        <Kpi
          label="Mensagens recebidas"
          value={loading ? null : stats?.messages_in ?? 0}
        />
        <Kpi
          label="Tempo de resposta"
          value={loading ? null : responseLabel}
          hint="média da Lena"
        />
        <Kpi
          label="Precisam de atenção"
          value={loading ? null : stats?.needs_attention ?? 0}
          highlight={(stats?.needs_attention ?? 0) > 0}
        />
      </div>

      {/* segunda linha */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Kpi
          label="Respostas da Lena"
          value={loading ? null : stats?.lena_out ?? 0}
          hint={
            automationPct !== null
              ? `${automationPct}% das saídas`
              : undefined
          }
        />
        <Kpi
          label="Respostas do operador"
          value={loading ? null : stats?.operator_out ?? 0}
        />
        <Kpi
          label="Contatos novos"
          value={loading ? null : stats?.contacts_new ?? 0}
        />
        <Kpi
          label="Custo de IA"
          value={loading ? null : `R$ ${(stats?.cost_brl_approx ?? 0).toFixed(2)}`}
          hint="aprox. no período"
        />
      </div>

      {/* atalho para conversas que precisam de atenção */}
      {stats && stats.needs_attention > 0 ? (
        <Card className="flex items-center justify-between gap-4 border-l-4 border-terracota">
          <div>
            <div className="font-display text-lg text-cafe">
              {stats.needs_attention} conversa
              {stats.needs_attention === 1 ? "" : "s"} esperando você
            </div>
            <p className="text-sm text-cafe-soft">
              Conversas em que a Lena passou para humano ou pausou.
            </p>
          </div>
          <Link
            to="/conversas"
            className="shrink-0 rounded-xl bg-terracota px-4 py-2 text-sm font-medium text-white hover:bg-terracota-dark"
          >
            Abrir inbox
          </Link>
        </Card>
      ) : (
        <Card>
          <h2 className="font-display text-xl text-cafe">Próximos passos</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-cafe-soft">
            <li>Preencher o cérebro da Lena (horários, serviços, FAQ, tom).</li>
            <li>Conectar o número de WhatsApp via Cloud API.</li>
            <li>Convidar a equipe que vai atender o handoff.</li>
          </ul>
        </Card>
      )}
    </div>
  );
}

function Kpi({
  label,
  value,
  hint,
  highlight,
}: {
  label: string;
  value: number | string | null;
  hint?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-[var(--radius-card)] border p-5 ${
        highlight
          ? "border-terracota bg-terracota-soft"
          : "border-creme-edge bg-creme-soft"
      }`}
    >
      <div className="text-xs uppercase tracking-wide text-cafe-muted">
        {label}
      </div>
      <div className="mt-1 font-display text-3xl text-cafe">
        {value === null ? (
          <span className="animate-pulse-soft text-cafe-muted">…</span>
        ) : (
          value
        )}
      </div>
      {hint ? <div className="mt-1 text-xs text-cafe-soft">{hint}</div> : null}
    </div>
  );
}
