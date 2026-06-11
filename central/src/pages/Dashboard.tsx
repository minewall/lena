import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  loadDashboardStats,
  loadLenaBookedRevenue,
  type DashboardStats,
} from "../lib/dashboard";
import { fmtHHMM, loadAppointmentsForRange, type Appointment } from "../lib/agenda";
import { loadConversations, type ConversationListItem } from "../lib/conversations";
import { relativeTime } from "../lib/time";
import { useAuth } from "../store/auth";
import { Card } from "../components/ui";
import { LenaInline } from "../components/LenaInline";

const PERIODS = [
  { days: 1, label: "Hoje" },
  { days: 7, label: "7 dias" },
  { days: 30, label: "30 dias" },
];

const APPT_STATUS_PILL: Record<string, { label: string; cls: string }> = {
  booked: { label: "aguardando", cls: "bg-amber-50 text-amber-700" },
  confirmed: { label: "confirmado", cls: "bg-salvia-soft text-salvia" },
  done: { label: "realizado", cls: "bg-creme-edge text-cafe-soft" },
  cancelled: { label: "cancelado", cls: "bg-terracota-soft text-terracota-dark" },
  no_show: { label: "faltou", cls: "bg-creme-edge text-cafe-muted" },
};

export function Dashboard() {
  const tenants = useAuth((s) => s.tenants);
  const currentTenantId = useAuth((s) => s.currentTenantId);
  const currentTenant = tenants.find((t) => t.id === currentTenantId) ?? null;

  const [days, setDays] = useState(7);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenue, setRevenue] = useState<{ totalCents: number; count: number } | null>(null);
  const [todayAppts, setTodayAppts] = useState<Appointment[] | null>(null);
  const [recentConvs, setRecentConvs] = useState<ConversationListItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [insightDismissed, setInsightDismissed] = useState(false);

  useEffect(() => {
    if (!currentTenantId) return;
    setLoading(true);
    setError(null);
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    Promise.all([
      loadDashboardStats(currentTenantId, days),
      loadLenaBookedRevenue(currentTenantId, days),
      loadAppointmentsForRange(currentTenantId, dayStart, dayEnd),
      loadConversations(currentTenantId, "open"),
    ])
      .then(([s, r, a, c]) => {
        setStats(s);
        setRevenue(r);
        setTodayAppts(a);
        setRecentConvs(c.slice(0, 5));
      })
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

  const periodLabel = days === 1 ? "hoje" : `nos últimos ${days} dias`;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl text-cafe">Hoje</h1>
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

      {/* Lena inline — insight contextual do dia */}
      {!insightDismissed && stats && todayAppts ? (
        <DashboardInsight
          stats={stats}
          todayAppts={todayAppts}
          onDismiss={() => setInsightDismissed(true)}
        />
      ) : null}

      {/* Hero + KPIs principais */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-[1.35fr_1fr_1fr_1fr]">
        <Hero
          loading={loading}
          totalCents={revenue?.totalCents ?? 0}
          count={revenue?.count ?? 0}
          periodLabel={periodLabel}
        />
        <Kpi
          label="Conversas no período"
          value={loading ? null : stats?.conversations_period ?? 0}
          hint={stats ? `${stats.conversations_today} hoje` : undefined}
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

      {/* KPIs secundários */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Kpi
          label="Respostas da Lena"
          value={loading ? null : stats?.lena_out ?? 0}
          hint={automationPct !== null ? `${automationPct}% das saídas` : undefined}
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

      {/* Agenda de hoje + Conversas recentes */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_1fr]">
        <Panel title="Agenda de hoje" linkTo="/agenda" linkLabel="Abrir agenda →">
          {todayAppts === null ? (
            <PanelEmpty>carregando…</PanelEmpty>
          ) : todayAppts.length === 0 ? (
            <PanelEmpty>
              Nada agendado para hoje ainda. A Lena agenda direto pelo WhatsApp.
            </PanelEmpty>
          ) : (
            todayAppts.slice(0, 6).map((a) => {
              const pill = APPT_STATUS_PILL[a.status] ?? APPT_STATUS_PILL.booked;
              const name =
                a.contact?.name?.trim() || a.customer_name?.trim() ||
                a.contact?.phone_e164 || "Cliente";
              return (
                <Link
                  key={a.id}
                  to="/agenda"
                  className="flex items-center gap-3 border-b border-creme-edge px-5 py-2.5 text-[13px] transition last:border-b-0 hover:bg-creme"
                >
                  <span className="w-11 font-display font-bold tabular-nums text-cafe">
                    {fmtHHMM(new Date(a.starts_at))}
                  </span>
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: a.staff?.color ?? "#897866" }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-cafe">{name}</span>
                    <span className="block truncate text-[11.5px] text-cafe-muted">
                      {[a.service?.name, a.staff?.name].filter(Boolean).join(" · ") || "—"}
                    </span>
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wide ${pill.cls}`}
                  >
                    {pill.label}
                  </span>
                </Link>
              );
            })
          )}
        </Panel>

        <Panel title="Conversas recentes" linkTo="/conversas" linkLabel="Abrir inbox →">
          {recentConvs === null ? (
            <PanelEmpty>carregando…</PanelEmpty>
          ) : recentConvs.length === 0 ? (
            <PanelEmpty>
              Sem conversas abertas. Quando chegar mensagem no WhatsApp, aparece aqui.
            </PanelEmpty>
          ) : (
            recentConvs.map((c) => {
              const name = c.contact.name?.trim() || c.contact.phone_e164;
              const preview = c.last_message?.body?.trim() ?? "";
              const isIn = c.last_message?.direction === "in";
              return (
                <Link
                  key={c.id}
                  to="/conversas"
                  className="flex items-center gap-3 border-b border-creme-edge px-5 py-2.5 text-[13px] transition last:border-b-0 hover:bg-creme"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-cafe">{name}</span>
                    <span
                      className={`block truncate text-[12px] ${
                        isIn ? "font-semibold text-cafe" : "text-cafe-muted"
                      }`}
                    >
                      {isIn ? "" : "Lena: "}
                      {preview || "—"}
                    </span>
                  </span>
                  <span className="shrink-0 text-[11px] text-cafe-muted">
                    {isIn ? <span className="text-terracota">● </span> : null}
                    {relativeTime(c.last_message?.created_at ?? c.opened_at)}
                  </span>
                </Link>
              );
            })
          )}
        </Panel>
      </div>

      {stats && stats.conversations_period === 0 ? (
        <Card>
          <h2 className="font-display text-xl text-cafe">Próximos passos</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-cafe-soft">
            <li>Preencher o cérebro da Lena (horários, serviços, FAQ, tom).</li>
            <li>Conectar o número de WhatsApp via Cloud API.</li>
            <li>Convidar a equipe que vai atender o handoff.</li>
          </ul>
        </Card>
      ) : null}
    </div>
  );
}

/* ── Insight da Lena no Hoje: 1 leitura contextual do dia + 1 ação ─────── */

function DashboardInsight({
  stats,
  todayAppts,
  onDismiss,
}: {
  stats: DashboardStats;
  todayAppts: Appointment[];
  onDismiss: () => void;
}) {
  const h = new Date().getHours();
  const greeting = h < 12 ? "Bom dia." : h < 18 ? "Boa tarde." : "Boa noite.";

  let text: string;
  let action: { to: string; label: string };
  if (stats.needs_attention > 0) {
    text = `${stats.needs_attention} conversa${stats.needs_attention === 1 ? " espera" : "s esperam"} um humano agora — eu pausei e estou segurando o cliente.`;
    action = { to: "/conversas", label: "Abrir conversas" };
  } else if (todayAppts.length > 0) {
    const next = todayAppts.find((a) => new Date(a.starts_at) > new Date());
    text = next
      ? `Hoje tem ${todayAppts.length} agendamento${todayAppts.length === 1 ? "" : "s"}; o próximo é às ${fmtHHMM(new Date(next.starts_at))}. Eu cuido das confirmações.`
      : `Os ${todayAppts.length} agendamentos de hoje já passaram — agenda em dia.`;
    action = { to: "/agenda", label: "Ver agenda" };
  } else {
    text = "Agenda de hoje livre e nenhuma conversa pendente. Estou de olho no WhatsApp.";
    action = { to: "/conversas", label: "Ver conversas" };
  }

  return (
    <LenaInline action={action} onDismiss={onDismiss}>
      <b className="text-cafe">{greeting}</b> {text}
    </LenaInline>
  );
}

/* ── Hero: receita agendada pela Lena ──────────────────────────────────── */

function Hero({
  loading,
  totalCents,
  count,
  periodLabel,
}: {
  loading: boolean;
  totalCents: number;
  count: number;
  periodLabel: string;
}) {
  const valor = (totalCents / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return (
    <div className="relative overflow-hidden rounded-[var(--radius-card)] bg-gradient-to-br from-cafe via-cafe-2 to-cafe-3 px-5 py-[18px] text-creme">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(420px 200px at 85% -20%, rgba(227,91,46,0.4), transparent 70%)",
        }}
      />
      <div className="relative">
        <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-creme/55">
          Receita agendada pela Lena
        </div>
        <div className="mt-2 font-display text-[32px] font-bold leading-none tracking-tight tabular-nums text-white">
          {loading ? (
            <span className="animate-pulse-soft text-creme/40">…</span>
          ) : (
            `R$ ${valor}`
          )}
        </div>
        <div className="mt-1 text-xs text-creme/60">
          {count} agendamento{count === 1 ? "" : "s"} {periodLabel}
        </div>
      </div>
    </div>
  );
}

/* ── Painel com header + lista ─────────────────────────────────────────── */

function Panel({
  title,
  linkTo,
  linkLabel,
  children,
}: {
  title: string;
  linkTo: string;
  linkLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] border border-creme-edge bg-creme-soft">
      <div className="flex items-center justify-between border-b border-creme-edge px-5 py-3">
        <h3 className="font-display text-[14.5px] font-bold text-cafe">{title}</h3>
        <Link to={linkTo} className="text-xs font-semibold text-terracota hover:text-terracota-dark">
          {linkLabel}
        </Link>
      </div>
      {children}
    </div>
  );
}

function PanelEmpty({ children }: { children: React.ReactNode }) {
  return <div className="px-5 py-6 text-sm text-cafe-soft">{children}</div>;
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
      className={`rounded-[var(--radius-card)] border px-5 py-[18px] ${
        highlight
          ? "border-terracota bg-terracota-soft"
          : "border-creme-edge bg-creme-soft shadow-[0_18px_44px_-32px_rgba(36,27,21,0.3)]"
      }`}
    >
      <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-cafe-muted">
        {label}
      </div>
      <div className="mt-2 font-display text-[32px] font-bold leading-none tracking-tight text-cafe tabular-nums">
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
