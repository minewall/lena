import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  fmtCost,
  HEALTH_META,
  loadTenantSummaries,
  SEG_LABEL,
  STATUS_LABEL,
  type TenantHealth,
  type TenantSummary,
} from "../../lib/averse-tenants";
import { useAuth } from "../../store/auth";
import { Card, Select, StatusPill, TextInput } from "../../components/ui";

function diasSemContato(iso: string | null): number | null {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function HealthBadge({ health }: { health: TenantHealth }) {
  const m = HEALTH_META[health];
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="inline-block h-2 w-2 rounded-full"
        style={{ backgroundColor: m.dot }}
      />
      <span className={`text-xs font-medium ${m.text}`}>{m.label}</span>
    </span>
  );
}

export function AverseTenants() {
  const isPlatformAdmin = useAuth((s) => s.isPlatformAdmin);
  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [segFiltro, setSegFiltro] = useState("");
  const [healthFiltro, setHealthFiltro] = useState<"" | TenantHealth>("");

  const reload = useCallback(async () => {
    try {
      setTenants(await loadTenantSummaries());
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    if (!isPlatformAdmin) return;
    setLoading(true);
    reload().finally(() => setLoading(false));
  }, [reload, isPlatformAdmin]);

  const segmentos = useMemo(
    () => Array.from(new Set(tenants.map((t) => t.segment))).sort(),
    [tenants],
  );

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return tenants.filter((t) => {
      if (healthFiltro && t.health !== healthFiltro) return false;
      if (segFiltro && t.segment !== segFiltro) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q)
      );
    });
  }, [tenants, busca, segFiltro, healthFiltro]);

  // contadores para o header
  const counts = useMemo(
    () => ({
      total: tenants.length,
      saudavel: tenants.filter((t) => t.health === "saudavel").length,
      em_risco: tenants.filter((t) => t.health === "em_risco").length,
      inativo: tenants.filter((t) => t.health === "inativo").length,
    }),
    [tenants],
  );

  if (!isPlatformAdmin) {
    return (
      <Card className="text-cafe-soft">
        <h2 className="font-display text-lg text-cafe">Acesso restrito</h2>
        <p className="mt-2 text-sm">Área exclusiva da Averse.</p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* header */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl text-cafe">Clientes Averse</h1>
          <p className="mt-1 text-cafe-soft">
            {counts.total} tenants ·{" "}
            <span className="text-salvia">{counts.saudavel} saudáveis</span> ·{" "}
            <span className="text-amber-500">{counts.em_risco} em risco</span> ·{" "}
            <span className="text-terracota">{counts.inativo} inativos</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <TextInput
            placeholder="Buscar nome ou slug…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-48"
          />
          <Select
            value={segFiltro}
            onChange={(e) => setSegFiltro(e.target.value)}
          >
            <option value="">Todos os segmentos</option>
            {segmentos.map((s) => (
              <option key={s} value={s}>
                {SEG_LABEL[s] ?? s}
              </option>
            ))}
          </Select>
          <Select
            value={healthFiltro}
            onChange={(e) => setHealthFiltro(e.target.value as "" | TenantHealth)}
          >
            <option value="">Todos os status</option>
            <option value="saudavel">🟢 Saudável</option>
            <option value="em_risco">🟡 Em risco</option>
            <option value="inativo">🔴 Inativo</option>
          </Select>
        </div>
      </header>

      {error ? <StatusPill kind="error">{error}</StatusPill> : null}

      {loading ? (
        <p className="text-cafe-soft animate-pulse-soft">carregando…</p>
      ) : filtrados.length === 0 ? (
        <Card>
          <p className="text-sm text-cafe-soft">
            {tenants.length === 0
              ? "Nenhum tenant ainda."
              : "Nenhum tenant com esses filtros."}
          </p>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-card)] border border-creme-edge">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-creme-soft text-left text-xs uppercase tracking-wide text-cafe-muted">
                <th className="px-4 py-2.5 font-medium">Negócio</th>
                <th className="px-4 py-2.5 font-medium">Health</th>
                <th className="px-4 py-2.5 font-medium text-right">Msgs 30d</th>
                <th className="px-4 py-2.5 font-medium text-right">Custo IA 30d</th>
                <th className="px-4 py-2.5 font-medium">Último uso</th>
                <th className="px-4 py-2.5 font-medium">Desde</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((t) => {
                const dias = diasSemContato(t.last_message_at);
                return (
                  <tr
                    key={t.id}
                    className="border-t border-creme-edge align-middle hover:bg-creme-soft/60"
                  >
                    <td className="px-4 py-2.5">
                      <Link
                        to={`/averse/tenants/${t.id}`}
                        className="font-medium text-cafe hover:underline"
                      >
                        {t.name}
                      </Link>
                      <div className="text-xs text-cafe-muted">
                        {SEG_LABEL[t.segment] ?? t.segment}
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <HealthBadge health={t.health} />
                    </td>
                    <td className="px-4 py-2.5 text-right text-cafe">
                      {t.messages_30d.toLocaleString("pt-BR")}
                    </td>
                    <td className="px-4 py-2.5 text-right text-cafe-soft">
                      {fmtCost(t.cost_micro_usd_30d)}
                    </td>
                    <td className="px-4 py-2.5">
                      {dias === null ? (
                        <span className="text-cafe-muted text-xs">nunca</span>
                      ) : (
                        <span
                          className={`text-xs ${
                            dias <= 7
                              ? "text-salvia"
                              : dias <= 30
                                ? "text-amber-500"
                                : "text-terracota"
                          }`}
                        >
                          {dias}d atrás
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-cafe-muted">
                      {fmtDate(t.created_at)}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          t.status === "active"
                            ? "bg-salvia-soft text-salvia"
                            : "bg-creme-edge text-cafe-muted"
                        }`}
                      >
                        {STATUS_LABEL[t.status] ?? t.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
