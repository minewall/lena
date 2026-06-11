import { useEffect, useState } from "react";
import {
  loadAttendanceReport,
  type AttendanceReport,
  type FunnelRow,
} from "../lib/relatorios";
import { useAuth } from "../store/auth";
import { LenaInline } from "../components/LenaInline";

const PERIODS = [
  { days: 7, label: "7 dias" },
  { days: 30, label: "30 dias" },
  { days: 90, label: "90 dias" },
];

const SENTIMENT_META: Record<string, { label: string; color: string }> = {
  positivo: { label: "Positivo", color: "#599372" },
  neutro: { label: "Neutro", color: "#897866" },
  negativo: { label: "Negativo", color: "#E35B2E" },
};

const DESFECHO_LABEL: Record<string, string> = {
  agendamento: "Agendou",
  transferencia: "Foi para humano",
  finalizada: "Finalizada",
  em_andamento: "Em andamento",
};

const TIPO_LABEL: Record<string, string> = {
  agendamento: "Agendamento",
  remarcacao_cancelamento: "Remarcar/cancelar",
  preco_planos: "Preço / planos",
  duvida_info: "Dúvida / info",
  reclamacao: "Reclamação",
  outro: "Outro",
  nao_classificado: "Não classificado",
};

export function Relatorios() {
  const tenantId = useAuth((s) => s.currentTenantId);
  const [days, setDays] = useState(30);
  const [report, setReport] = useState<AttendanceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [insightDismissed, setInsightDismissed] = useState(false);

  useEffect(() => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    loadAttendanceReport(tenantId, days)
      .then(setReport)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [tenantId, days]);

  if (!tenantId) return null;

  const totalSent = report?.sentiment.reduce((s, r) => s + r.n, 0) ?? 0;

  // Conversas que chegaram fora do horário comercial (antes das 8h ou a
  // partir das 19h) — quando a Lena atendeu sozinha. É o argumento de venda.
  const offHours = (() => {
    if (!report) return null;
    const total = report.funnel.reduce((s, r) => s + r.n, 0);
    if (total === 0) return null;
    const off = report.funnel
      .filter((r) => r.hora < 8 || r.hora >= 19)
      .reduce((s, r) => s + r.n, 0);
    return { off, total, pct: Math.round((off / total) * 100) };
  })();

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-cafe">Relatórios</h1>
          <p className="mt-1 text-sm text-cafe-soft">
            Como anda o atendimento da Lena. Os dados aparecem conforme as
            conversas são encerradas.
          </p>
        </div>
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
        <Card className="text-sm text-terracota-dark">{error}</Card>
      ) : loading ? (
        <Card className="animate-pulse-soft text-cafe-soft">carregando…</Card>
      ) : !report || report.total === 0 ? (
        <Card className="text-cafe-soft">
          <h2 className="font-display text-lg text-cafe">Ainda sem dados</h2>
          <p className="mt-1 text-sm">
            Quando a Lena começar a atender e as conversas forem encerradas, os
            indicadores de sentimento, esforço e horários aparecem aqui.
          </p>
        </Card>
      ) : (
        <>
          {!insightDismissed && offHours && offHours.pct >= 15 ? (
            <LenaInline onDismiss={() => setInsightDismissed(true)}>
              <b className="text-cafe">{offHours.pct}% das conversas</b> (
              {offHours.off} de {offHours.total}) chegaram fora do horário
              comercial. Foi quando eu atendi sozinha — sem ninguém perder a
              mensagem.
            </LenaInline>
          ) : null}

          {/* Sentimento + Esforço lado a lado */}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Panel
              title="Sentimento dos clientes"
              hint={
                report.classificadas < report.total
                  ? `${report.classificadas} de ${report.total} conversas classificadas`
                  : `${report.classificadas} conversas`
              }
            >
              {totalSent === 0 ? (
                <Empty>Nenhuma conversa classificada ainda no período.</Empty>
              ) : (
                <div className="flex flex-col gap-3">
                  {["positivo", "neutro", "negativo"].map((key) => {
                    const row = report.sentiment.find((r) => r.sentiment === key);
                    const n = row?.n ?? 0;
                    const pct = Math.round((n / totalSent) * 100);
                    const meta = SENTIMENT_META[key];
                    return (
                      <div key={key} className="flex flex-col gap-1">
                        <div className="flex items-center justify-between text-[13px]">
                          <span className="font-medium text-cafe">{meta.label}</span>
                          <span className="text-cafe-muted tabular-nums">
                            {n} · {pct}%
                          </span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-creme-edge">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, backgroundColor: meta.color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Panel>

            <Panel
              title="Esforço até o desfecho"
              hint="Quantas trocas de mensagem até resolver"
            >
              {report.effort.length === 0 ? (
                <Empty>Sem conversas no período.</Empty>
              ) : (
                <div className="flex flex-col divide-y divide-creme-edge">
                  {report.effort.map((e) => (
                    <div
                      key={e.desfecho}
                      className="flex items-center justify-between py-2.5"
                    >
                      <div>
                        <div className="text-[13px] font-semibold text-cafe">
                          {DESFECHO_LABEL[e.desfecho] ?? e.desfecho}
                        </div>
                        <div className="text-[11.5px] text-cafe-muted">
                          {e.n} conversa{e.n === 1 ? "" : "s"}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-display text-2xl font-bold tabular-nums text-cafe">
                          {e.trocas_medias}
                        </span>
                        <span className="ml-1 text-[11.5px] text-cafe-muted">
                          trocas
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>

          {/* Funil hora × tipo */}
          <Panel
            title="Quando e o que perguntam"
            hint="Conversas por horário e tipo de solicitação"
          >
            {report.funnel.length === 0 ? (
              <Empty>Sem conversas para montar o funil ainda.</Empty>
            ) : (
              <FunnelHeatmap rows={report.funnel} />
            )}
          </Panel>
        </>
      )}
    </div>
  );
}

/* ── Heatmap hora × tipo ──────────────────────────────────────────────── */

function FunnelHeatmap({ rows }: { rows: FunnelRow[] }) {
  const tipos = Array.from(new Set(rows.map((r) => r.tipo)));
  const horas = Array.from(new Set(rows.map((r) => r.hora))).sort((a, b) => a - b);
  const max = Math.max(...rows.map((r) => r.n), 1);
  const get = (hora: number, tipo: string) =>
    rows.find((r) => r.hora === hora && r.tipo === tipo)?.n ?? 0;

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate" style={{ borderSpacing: 3 }}>
        <thead>
          <tr>
            <th className="w-28" />
            {horas.map((h) => (
              <th
                key={h}
                className="text-center text-[10px] font-semibold text-cafe-muted tabular-nums"
              >
                {String(h).padStart(2, "0")}h
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tipos.map((tipo) => (
            <tr key={tipo}>
              <td className="pr-2 text-right text-[11.5px] text-cafe-soft">
                {TIPO_LABEL[tipo] ?? tipo}
              </td>
              {horas.map((h) => {
                const n = get(h, tipo);
                const intensity = n === 0 ? 0 : 0.18 + 0.82 * (n / max);
                return (
                  <td key={h} className="text-center">
                    <div
                      title={`${n} conversa(s)`}
                      className="grid h-8 w-full place-items-center rounded-md text-[11px] font-semibold tabular-nums"
                      style={{
                        backgroundColor:
                          n === 0
                            ? "var(--color-creme-edge)"
                            : `rgba(227,91,46,${intensity})`,
                        color: intensity > 0.55 ? "#fff" : "var(--color-cafe-soft)",
                      }}
                    >
                      {n || ""}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-[11.5px] text-cafe-muted">
        Mais escuro = mais conversas. Use para ver os picos fora do horário
        comercial — exatamente onde a Lena trabalha sozinha.
      </p>
    </div>
  );
}

/* ── primitivos ───────────────────────────────────────────────────────── */

function Panel({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[var(--radius-card)] border border-creme-edge bg-creme-soft p-5 shadow-[0_18px_44px_-32px_rgba(36,27,21,0.3)]">
      <div className="mb-3">
        <h3 className="font-display text-[14.5px] font-bold text-cafe">{title}</h3>
        {hint ? <p className="text-[11.5px] text-cafe-muted">{hint}</p> : null}
      </div>
      {children}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-4 text-sm text-cafe-soft">{children}</p>;
}

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[var(--radius-card)] border border-creme-edge bg-creme-soft p-5 ${className}`}
    >
      {children}
    </div>
  );
}
