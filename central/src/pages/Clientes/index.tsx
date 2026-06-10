import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  fmtPhone,
  loadClientes,
  waUrl,
  type Cliente,
} from "../../lib/clientes";
import { useAuth } from "../../store/auth";
import { Card, Select, StatusPill, TextInput } from "../../components/ui";

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

function diasDesde(iso: string | null): number | null {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

function InactivityBadge({ iso }: { iso: string | null }) {
  const d = diasDesde(iso);
  if (d === null) return <span className="text-cafe-muted">sem contato</span>;
  if (d <= 7) return <span className="text-salvia text-xs">{d}d atrás</span>;
  if (d <= 30) return <span className="text-amber-500 text-xs">{d}d atrás</span>;
  return <span className="text-terracota text-xs">{d}d atrás</span>;
}

export function ClientesPage() {
  const tenantId = useAuth((s) => s.currentTenantId);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [tagFiltro, setTagFiltro] = useState("");
  const [statusFiltro, setStatusFiltro] = useState<
    "" | "ativo" | "inativo" | "optout"
  >("");

  const reload = useCallback(async () => {
    if (!tenantId) return;
    try {
      setClientes(await loadClientes(tenantId));
    } catch (e) {
      setError((e as Error).message);
    }
  }, [tenantId]);

  useEffect(() => {
    setLoading(true);
    reload().finally(() => setLoading(false));
  }, [reload]);

  const tags = useMemo(
    () => Array.from(new Set(clientes.flatMap((c) => c.tags))).sort(),
    [clientes],
  );

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return clientes.filter((c) => {
      if (c.opted_out && statusFiltro !== "optout") return false;
      if (statusFiltro === "optout" && !c.opted_out) return false;
      if (statusFiltro === "ativo") {
        const d = diasDesde(c.last_message_at);
        if (d === null || d > 30) return false;
      }
      if (statusFiltro === "inativo") {
        const d = diasDesde(c.last_message_at);
        if (d !== null && d <= 30) return false;
      }
      if (tagFiltro && !c.tags.includes(tagFiltro)) return false;
      if (!q) return true;
      return (
        (c.name ?? "").toLowerCase().includes(q) ||
        c.phone_e164.includes(q)
      );
    });
  }, [clientes, busca, tagFiltro, statusFiltro]);

  if (!tenantId) return null;

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl text-cafe">Clientes</h1>
          <p className="mt-1 text-cafe-soft">
            {clientes.length} contatos · {filtrados.length} exibidos
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <TextInput
            placeholder="Buscar nome ou telefone…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-52"
          />
          <Select
            value={tagFiltro}
            onChange={(e) => setTagFiltro(e.target.value)}
          >
            <option value="">Todas as tags</option>
            {tags.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
          <Select
            value={statusFiltro}
            onChange={(e) =>
              setStatusFiltro(e.target.value as "" | "ativo" | "inativo" | "optout")
            }
          >
            <option value="">Todos os status</option>
            <option value="ativo">Ativos (≤30d)</option>
            <option value="inativo">Inativos (&gt;30d)</option>
            <option value="optout">Opt-out</option>
          </Select>
        </div>
      </header>

      {error ? <StatusPill kind="error">{error}</StatusPill> : null}

      {loading ? (
        <p className="text-cafe-soft animate-pulse-soft">carregando…</p>
      ) : filtrados.length === 0 ? (
        <Card>
          <p className="text-sm text-cafe-soft">
            {clientes.length === 0
              ? "Nenhum cliente ainda. Quando alguém mandar mensagem pelo WhatsApp, aparece aqui."
              : "Nenhum cliente com esses filtros."}
          </p>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-card)] border border-creme-edge">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-creme-soft text-left text-xs uppercase tracking-wide text-cafe-muted">
                <th className="px-4 py-2.5 font-medium">Cliente</th>
                <th className="px-4 py-2.5 font-medium">Telefone</th>
                <th className="px-4 py-2.5 font-medium">Último contato</th>
                <th className="px-4 py-2.5 font-medium">Tags</th>
                <th className="px-4 py-2.5 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((c) => (
                <tr
                  key={c.id}
                  className={`border-t border-creme-edge align-middle hover:bg-creme-soft/60 ${
                    c.opted_out ? "opacity-50" : ""
                  }`}
                >
                  <td className="px-4 py-2.5">
                    <Link
                      to={`/clientes/${c.id}`}
                      className="font-medium text-cafe hover:underline"
                    >
                      {c.name ?? fmtPhone(c.phone_e164)}
                    </Link>
                    {c.opted_out ? (
                      <span className="ml-2 rounded-full bg-terracota-soft px-1.5 py-0.5 text-[10px] text-terracota-dark">
                        opt-out
                      </span>
                    ) : null}
                    {c.next_appointment ? (
                      <span className="ml-2 text-xs text-salvia">
                        📅 {fmtDate(c.next_appointment)}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-2.5 text-cafe-soft">
                    {fmtPhone(c.phone_e164)}
                  </td>
                  <td className="px-4 py-2.5">
                    <InactivityBadge iso={c.last_message_at} />
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {c.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-full bg-creme-edge px-2 py-0.5 text-xs text-cafe-soft"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-2">
                      <a
                        href={waUrl(c.phone_e164)}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg bg-salvia px-2.5 py-1 text-xs font-medium text-white hover:opacity-90"
                      >
                        WhatsApp
                      </a>
                      <Link
                        to={`/clientes/${c.id}`}
                        className="rounded-lg border border-creme-edge px-2.5 py-1 text-xs text-cafe-soft hover:bg-creme-soft"
                      >
                        Ver perfil
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
