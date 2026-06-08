import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FUNIS,
  loadProspects,
  updateFunil,
  updateNotas,
  type Prospect,
  type ProspectFunil,
} from "../lib/prospects";
import { useAuth } from "../store/auth";
import { Card, StatusPill, TextInput, Textarea, Select } from "../components/ui";

export function Prospeccao() {
  const isPlatformAdmin = useAuth((s) => s.isPlatformAdmin);
  const [items, setItems] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [segFiltro, setSegFiltro] = useState("");
  const [contatoFiltro, setContatoFiltro] = useState<
    "" | "whats" | "tel" | "email"
  >("");
  const [dragId, setDragId] = useState<string | null>(null);
  const [view, setView] = useState<"kanban" | "lista">("kanban");

  const reload = useCallback(async () => {
    try {
      setItems(await loadProspects());
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
    () => Array.from(new Set(items.map((p) => p.segmento))).sort(),
    [items],
  );

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    const filtered = items.filter((p) => {
      if (segFiltro && p.segmento !== segFiltro) return false;
      if (contatoFiltro === "whats" && p.whatsapps.length === 0) return false;
      if (contatoFiltro === "tel" && p.telefones.length === 0) return false;
      if (contatoFiltro === "email" && p.emails.length === 0) return false;
      if (!q) return true;
      return (
        p.nome.toLowerCase().includes(q) ||
        (p.bairros ?? "").toLowerCase().includes(q)
      );
    });
    // Alfabético previsível em pt-BR (a collation do Postgres deixava
    // números/acentos/maiúsculas em posições não intuitivas).
    return filtered.sort((a, b) =>
      a.nome.localeCompare(b.nome, "pt-BR", { numeric: true }),
    );
  }, [items, busca, segFiltro, contatoFiltro]);

  const porFunil = useMemo(() => {
    const map: Record<ProspectFunil, Prospect[]> = {
      novo: [],
      contatado: [],
      em_conversa: [],
      cliente: [],
      perdido: [],
    };
    for (const p of filtrados) map[p.funil].push(p);
    // Dentro da coluna: mais recém-movido no topo; desempate alfabético.
    for (const funil of Object.keys(map) as ProspectFunil[]) {
      map[funil].sort(
        (a, b) =>
          b.funil_changed_at.localeCompare(a.funil_changed_at) ||
          a.nome.localeCompare(b.nome, "pt-BR", { numeric: true }),
      );
    }
    return map;
  }, [filtrados]);

  // Move otimista: atualiza UI na hora, reverte se o backend falhar.
  async function mover(id: string, funil: ProspectFunil) {
    // Zera o drag aqui (não só no dragEnd): ao trocar de coluna o card
    // re-renderiza em outro pai e o dragEnd do nó antigo pode não disparar,
    // deixando o card preso em opacity-40.
    setDragId(null);
    const atual = items.find((p) => p.id === id);
    if (!atual || atual.funil === funil) return;
    // Carimba a data de movimento no cliente para reposicionar no topo já;
    // o backend grava a hora real via trigger.
    const movedAt = new Date().toISOString();
    setItems((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, funil, funil_changed_at: movedAt } : p,
      ),
    );
    try {
      await updateFunil(id, funil);
    } catch (e) {
      setError((e as Error).message);
      setItems((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, funil: atual.funil, funil_changed_at: atual.funil_changed_at }
            : p,
        ),
      );
    }
  }

  function patchNotas(id: string, notas: string) {
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, notas } : p)));
  }

  if (!isPlatformAdmin) {
    return (
      <Card className="text-cafe-soft">
        <h2 className="font-display text-lg text-cafe">Acesso restrito</h2>
        <p className="mt-2 text-sm">
          A prospecção é uma área interna da Averse. Só a equipe da plataforma
          tem acesso.
        </p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl text-cafe">Prospecção</h1>
          <p className="mt-1 text-cafe-soft">
            {items.length} empresas no funil.{" "}
            {view === "kanban"
              ? "Arraste os cards entre as colunas para mudar o estágio."
              : "Mude o estágio direto na coluna Funil."}
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex rounded-xl border border-creme-edge bg-white p-0.5 text-sm">
            {(["kanban", "lista"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={`rounded-lg px-3 py-1.5 capitalize transition ${
                  view === v
                    ? "bg-terracota text-white"
                    : "text-cafe-soft hover:bg-creme-soft"
                }`}
              >
                {v === "kanban" ? "Kanban" : "Lista"}
              </button>
            ))}
          </div>
          <TextInput
            placeholder="Buscar nome ou bairro…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-56"
          />
          <Select value={segFiltro} onChange={(e) => setSegFiltro(e.target.value)}>
            <option value="">Todos os segmentos</option>
            {segmentos.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
          <Select
            value={contatoFiltro}
            onChange={(e) =>
              setContatoFiltro(
                e.target.value as "" | "whats" | "tel" | "email",
              )
            }
          >
            <option value="">Qualquer contato</option>
            <option value="whats">Com WhatsApp</option>
            <option value="tel">Com telefone</option>
            <option value="email">Com e-mail</option>
          </Select>
        </div>
      </header>

      {error ? <StatusPill kind="error">{error}</StatusPill> : null}

      {loading ? (
        <p className="text-cafe-soft animate-pulse-soft">carregando…</p>
      ) : view === "kanban" ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {FUNIS.map((f) => (
            <Coluna
              key={f.value}
              funil={f}
              cards={porFunil[f.value]}
              dragId={dragId}
              onDragStart={setDragId}
              onDragEnd={() => setDragId(null)}
              onDrop={(id) => mover(id, f.value)}
              onPatchNotas={patchNotas}
            />
          ))}
        </div>
      ) : (
        <Lista itens={filtrados} onMover={mover} />
      )}
    </div>
  );
}

const FUNIL_META = Object.fromEntries(
  FUNIS.map((f) => [f.value, f]),
) as Record<ProspectFunil, (typeof FUNIS)[number]>;

function Lista({
  itens,
  onMover,
}: {
  itens: Prospect[];
  onMover: (id: string, funil: ProspectFunil) => void;
}) {
  if (itens.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-cafe-muted">
        Nenhuma empresa com esses filtros.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto rounded-[var(--radius-card)] border border-creme-edge">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-creme-soft text-left text-xs uppercase tracking-wide text-cafe-muted">
            <th className="px-3 py-2 font-medium">Empresa</th>
            <th className="px-3 py-2 font-medium">Segmento</th>
            <th className="px-3 py-2 font-medium">Funil</th>
            <th className="px-3 py-2 font-medium">Contato</th>
            <th className="px-3 py-2 font-medium">Anotações</th>
          </tr>
        </thead>
        <tbody>
          {itens.map((p) => (
            <Linha key={p.id} p={p} onMover={onMover} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Linha({
  p,
  onMover,
}: {
  p: Prospect;
  onMover: (id: string, funil: ProspectFunil) => void;
}) {
  const [savingNotas, setSavingNotas] = useState(false);
  const meta = FUNIL_META[p.funil];

  return (
    <tr className="border-t border-creme-edge align-top hover:bg-creme-soft/60">
      <td className="px-3 py-2">
        <div className="font-medium text-cafe">{p.nome}</div>
        {p.bairros ? (
          <div className="text-xs text-cafe-muted">{p.bairros}</div>
        ) : null}
      </td>
      <td className="px-3 py-2">
        <span className="whitespace-nowrap rounded-full bg-creme-edge px-2 py-0.5 text-xs text-cafe-soft">
          {p.segmento}
        </span>
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: meta.dot }}
          />
          <Select
            value={p.funil}
            onChange={(e) => onMover(p.id, e.target.value as ProspectFunil)}
            className="py-1 text-xs"
          >
            {FUNIS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </Select>
        </div>
      </td>
      <td className="px-3 py-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {p.whatsapp_url ? (
            <a
              href={p.whatsapp_url}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-salvia px-2 py-1 text-xs font-medium text-white hover:opacity-90"
            >
              WhatsApp
            </a>
          ) : null}
          {p.website ? <Ext href={p.website} label="site" /> : null}
          {p.instagram ? <Ext href={p.instagram} label="insta" /> : null}
        </div>
      </td>
      <td className="px-3 py-2">
        <TextInput
          defaultValue={p.notas ?? ""}
          placeholder={savingNotas ? "salvando…" : "anotar…"}
          onBlur={(e) => {
            const v = e.target.value;
            if (v !== (p.notas ?? "")) {
              setSavingNotas(true);
              updateNotas(p.id, v).finally(() => setSavingNotas(false));
            }
          }}
          className="w-48 py-1 text-xs"
        />
      </td>
    </tr>
  );
}

function Coluna({
  funil,
  cards,
  dragId,
  onDragStart,
  onDragEnd,
  onDrop,
  onPatchNotas,
}: {
  funil: (typeof FUNIS)[number];
  cards: Prospect[];
  dragId: string | null;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDrop: (id: string) => void;
  onPatchNotas: (id: string, notas: string) => void;
}) {
  const [over, setOver] = useState(false);
  return (
    <div className="flex w-[280px] shrink-0 flex-col">
      <div className="mb-2 flex items-center gap-2 px-1">
        <span
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: funil.dot }}
        />
        <span className="text-sm font-medium text-cafe">{funil.label}</span>
        <span className="rounded-full bg-creme-edge px-2 py-0.5 text-xs text-cafe-soft">
          {cards.length}
        </span>
      </div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!over) setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={() => {
          setOver(false);
          if (dragId) onDrop(dragId);
        }}
        className={`flex min-h-[120px] flex-1 flex-col gap-2 rounded-[var(--radius-card)] border p-2 transition ${
          over
            ? "border-terracota bg-terracota-soft/40"
            : "border-creme-edge bg-creme-soft"
        }`}
      >
        {cards.length === 0 ? (
          <p className="px-1 py-6 text-center text-xs text-cafe-muted">vazio</p>
        ) : (
          cards.map((p) => (
            <ProspectCard
              key={p.id}
              p={p}
              dragging={dragId === p.id}
              onDragStart={() => onDragStart(p.id)}
              onDragEnd={onDragEnd}
              onPatchNotas={onPatchNotas}
            />
          ))
        )}
      </div>
    </div>
  );
}

function ProspectCard({
  p,
  dragging,
  onDragStart,
  onDragEnd,
  onPatchNotas,
}: {
  p: Prospect;
  dragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onPatchNotas: (id: string, notas: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [savingNotas, setSavingNotas] = useState(false);

  async function salvarNotas(valor: string) {
    setSavingNotas(true);
    try {
      await updateNotas(p.id, valor);
    } finally {
      setSavingNotas(false);
    }
  }

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`rounded-xl border border-creme-edge bg-white p-3 text-sm shadow-sm transition ${
        dragging ? "opacity-40" : "cursor-grab hover:border-terracota/60"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-medium leading-snug text-cafe">{p.nome}</span>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="shrink-0 text-xs text-cafe-muted hover:text-cafe"
          title="detalhes"
        >
          {open ? "▲" : "▼"}
        </button>
      </div>

      {p.bairros ? (
        <p className="mt-0.5 text-xs text-cafe-muted">{p.bairros}</p>
      ) : null}

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {p.whatsapp_url ? (
          <a
            href={p.whatsapp_url}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="rounded-lg bg-salvia px-2 py-1 text-xs font-medium text-white hover:opacity-90"
          >
            WhatsApp
          </a>
        ) : null}
        {p.website ? (
          <Ext href={p.website} label="site" />
        ) : null}
        {p.instagram ? (
          <Ext href={p.instagram} label="insta" />
        ) : null}
      </div>

      {open ? (
        <div className="mt-3 flex flex-col gap-2 border-t border-creme-edge pt-2">
          {p.observacao ? (
            <p className="text-xs leading-relaxed text-cafe-soft">
              {p.observacao}
            </p>
          ) : null}
          {p.emails.length > 0 ? (
            <p className="break-all text-xs text-cafe-muted">
              {p.emails.join(" · ")}
            </p>
          ) : null}
          <label className="flex flex-col gap-1">
            <span className="text-[11px] text-cafe-muted">
              Anotações {savingNotas ? "· salvando…" : ""}
            </span>
            <Textarea
              defaultValue={p.notas ?? ""}
              rows={2}
              placeholder="suas anotações de venda…"
              onClick={(e) => e.stopPropagation()}
              onBlur={(e) => {
                const v = e.target.value;
                if (v !== (p.notas ?? "")) {
                  onPatchNotas(p.id, v);
                  void salvarNotas(v);
                }
              }}
              className="text-xs"
            />
          </label>
        </div>
      ) : null}
    </div>
  );
}

function Ext({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="rounded-lg border border-creme-edge px-2 py-1 text-xs text-cafe-soft hover:bg-creme-soft"
    >
      {label}
    </a>
  );
}
