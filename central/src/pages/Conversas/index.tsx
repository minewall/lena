import { useCallback, useEffect, useMemo, useState } from "react";
import {
  loadConversations,
  loadTenantTags,
  type ConversationLifecycle,
  type ConversationListItem,
  type ConversationTag,
} from "../../lib/conversations";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../store/auth";
import { EmptyState } from "../../components/EmptyState";
import { IconMessage } from "../../components/icons";
import { Detail } from "./Detail";
import { List } from "./List";

const LIFECYCLE_TABS: { key: ConversationLifecycle; label: string }[] = [
  { key: "open", label: "Abertas" },
  { key: "resolved", label: "Resolvidas" },
  { key: "archived", label: "Arquivadas" },
];

export function ConversasPage() {
  const tenantId = useAuth((s) => s.currentTenantId);
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lifecycle, setLifecycle] = useState<ConversationLifecycle>("open");
  const [tags, setTags] = useState<ConversationTag[]>([]);
  const [tagFilter, setTagFilter] = useState<string>("");

  const reload = useCallback(async () => {
    if (!tenantId) return;
    try {
      const [list, tenantTags] = await Promise.all([
        loadConversations(tenantId, lifecycle),
        loadTenantTags(tenantId),
      ]);
      setConversations(list);
      setTags(tenantTags);
      setSelectedId((cur) =>
        cur && list.some((c) => c.id === cur) ? cur : (list[0]?.id ?? null),
      );
    } catch (e) {
      setError((e as Error).message);
    }
  }, [tenantId, lifecycle]);

  useEffect(() => {
    setLoading(true);
    reload().finally(() => setLoading(false));
  }, [reload]);

  // Realtime: novas mensagens e mudanças de estado no tenant atual
  useEffect(() => {
    if (!tenantId) return;
    const ch = supabase
      .channel(`inbox-${tenantId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `tenant_id=eq.${tenantId}`,
        },
        () => {
          void reload();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversations",
          filter: `tenant_id=eq.${tenantId}`,
        },
        () => {
          void reload();
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [tenantId, reload]);

  const visible = useMemo(
    () =>
      tagFilter
        ? conversations.filter((c) => c.tags.some((t) => t.id === tagFilter))
        : conversations,
    [conversations, tagFilter],
  );

  const selected = useMemo(
    () => visible.find((c) => c.id === selectedId) ?? null,
    [visible, selectedId],
  );

  if (!tenantId) return null;

  return (
    <div className="grid h-full grid-cols-[340px_1fr] overflow-hidden border-creme-edge">
      <aside className="flex flex-col overflow-hidden border-r border-creme-edge bg-creme-soft">
        <header className="flex flex-col gap-2.5 border-b border-creme-edge px-4 py-3">
          <div className="font-display text-base text-cafe">Conversas</div>
          <div className="flex gap-1 rounded-full border border-creme-edge bg-white p-0.5">
            {LIFECYCLE_TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setLifecycle(t.key)}
                className={`flex-1 rounded-full px-2 py-1 text-[11.5px] font-semibold transition ${
                  lifecycle === t.key
                    ? "bg-terracota text-white"
                    : "text-cafe-soft hover:bg-creme-edge/60"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          {tags.length > 0 ? (
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="rounded-lg border border-creme-edge bg-white px-2 py-1 text-xs text-cafe-soft"
            >
              <option value="">Todas as tags</option>
              {tags.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          ) : null}
        </header>
        <div className="flex-1 overflow-y-auto">
          <List
            conversations={visible}
            selectedId={selectedId}
            onSelect={setSelectedId}
            loading={loading}
            lifecycle={lifecycle}
          />
        </div>
        {error ? (
          <div className="border-t border-creme-edge px-4 py-2 text-xs text-terracota-dark">
            {error}
          </div>
        ) : null}
      </aside>

      <section className="overflow-hidden">
        {selected ? (
          <Detail conversation={selected} onConversationChanged={reload} />
        ) : (
          <div className="flex h-full items-center justify-center bg-creme">
            <EmptyState
              icon={IconMessage}
              title={visible.length > 0 ? "Escolha uma conversa" : "Tudo tranquilo por aqui"}
              description={
                visible.length > 0
                  ? "Selecione uma conversa à esquerda para ler o histórico, assumir o atendimento ou adicionar tags."
                  : "Nenhuma conversa aberta agora. Quando chegar mensagem no WhatsApp da Lena, ela aparece aqui na hora."
              }
            />
          </div>
        )}
      </section>
    </div>
  );
}
