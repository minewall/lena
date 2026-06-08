import { useCallback, useEffect, useMemo, useState } from "react";
import { loadConversations, type ConversationListItem } from "../../lib/conversations";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../store/auth";
import { Card } from "../../components/ui";
import { Detail } from "./Detail";
import { List } from "./List";

export function ConversasPage() {
  const tenantId = useAuth((s) => s.currentTenantId);
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!tenantId) return;
    try {
      const list = await loadConversations(tenantId);
      setConversations(list);
      setSelectedId((cur) => cur ?? list[0]?.id ?? null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [tenantId]);

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

  const selected = useMemo(
    () => conversations.find((c) => c.id === selectedId) ?? null,
    [conversations, selectedId],
  );

  if (!tenantId) return null;

  return (
    <div className="-mx-8 -my-8 grid h-[calc(100vh-1px)] grid-cols-[340px_1fr] overflow-hidden border-t border-creme-edge">
      <aside className="flex flex-col overflow-hidden border-r border-creme-edge bg-creme-soft">
        <header className="flex items-center justify-between border-b border-creme-edge px-4 py-3">
          <div>
            <div className="font-display text-base text-cafe">Conversas</div>
            <div className="text-xs text-cafe-muted">
              {conversations.length} aberta{conversations.length === 1 ? "" : "s"}
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto">
          <List
            conversations={conversations}
            selectedId={selectedId}
            onSelect={setSelectedId}
            loading={loading}
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
            <Card className="text-cafe-soft">
              Selecione uma conversa à esquerda.
            </Card>
          </div>
        )}
      </section>
    </div>
  );
}
