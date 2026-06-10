import type { ConversationLifecycle, ConversationListItem } from "../../lib/conversations";
import { relativeTime } from "../../lib/time";

const EMPTY_BY_LIFECYCLE: Record<ConversationLifecycle, string> = {
  open: "Sem conversas abertas. Quando alguém mandar mensagem no WhatsApp da Lena, aparece aqui.",
  resolved: "Nenhuma conversa resolvida ainda. Conversas sem resposta há 48h são resolvidas automaticamente.",
  archived: "Nada arquivado. Conversas resolvidas há mais de 30 dias são arquivadas automaticamente.",
};

const STATE_LABEL: Record<ConversationListItem["state"], { label: string; cls: string }> = {
  lena: { label: "Lena", cls: "bg-terracota-soft text-terracota-dark" },
  human: { label: "Humano", cls: "bg-salvia-soft text-cafe" },
  paused: { label: "Pausada", cls: "bg-creme-edge text-cafe" },
};

export function List({
  conversations,
  selectedId,
  onSelect,
  loading,
  lifecycle,
}: {
  conversations: ConversationListItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading: boolean;
  lifecycle: ConversationLifecycle;
}) {
  if (loading) {
    return (
      <div className="p-6 text-cafe-soft animate-pulse-soft">carregando…</div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="p-6 text-cafe-soft text-sm">{EMPTY_BY_LIFECYCLE[lifecycle]}</div>
    );
  }

  return (
    <ul className="flex flex-col">
      {conversations.map((c) => {
        const isActive = c.id === selectedId;
        const name = c.contact.name?.trim() || c.contact.phone_e164;
        const preview = previewText(c.last_message);
        const ts = c.last_message?.created_at ?? c.opened_at;
        const stateMeta = STATE_LABEL[c.state];

        return (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => onSelect(c.id)}
              className={`flex w-full flex-col gap-1 border-b border-creme-edge px-4 py-3 text-left transition ${
                isActive ? "bg-terracota-soft" : "hover:bg-creme-edge/50"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium text-cafe">
                  {name}
                </span>
                <span className="shrink-0 text-[11px] text-cafe-muted">
                  {relativeTime(ts)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-xs text-cafe-soft">
                  {preview || "—"}
                </span>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${stateMeta.cls}`}
                >
                  {stateMeta.label}
                </span>
              </div>
              {c.tags.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {c.tags.map((t) => (
                    <span
                      key={t.id}
                      className="rounded-full px-1.5 py-px text-[9.5px] font-semibold"
                      style={{ backgroundColor: t.color + "20", color: t.color }}
                    >
                      {t.name}
                    </span>
                  ))}
                </div>
              ) : null}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function previewText(last?: ConversationListItem["last_message"]): string {
  if (!last) return "";
  const prefix = last.direction === "out" ? "Lena: " : "";
  const body = (last.body ?? "").trim();
  if (!body) {
    return prefix + (last.kind === "text" ? "" : `(${last.kind})`);
  }
  return prefix + (body.length > 60 ? body.slice(0, 60) + "…" : body);
}
