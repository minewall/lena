import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type { Message } from "@lena/shared/db";
import type { ConversationListItem } from "../../lib/conversations";
import {
  loadMessages,
  operatorSend,
  setConversationState,
} from "../../lib/conversations";
import { dayLabel } from "../../lib/time";
import { supabase } from "../../lib/supabase";
import { Button, StatusPill, Textarea } from "../../components/ui";
import { Bubble } from "./Bubble";

export function Detail({
  conversation,
  onConversationChanged,
}: {
  conversation: ConversationListItem;
  onConversationChanged: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [actionState, setActionState] = useState<"idle" | "saving" | "error">("idle");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Carrega histórico ao trocar de conversa
  useEffect(() => {
    setMessages([]);
    setLoading(true);
    setError(null);
    setDraft("");
    loadMessages(conversation.id)
      .then(setMessages)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [conversation.id]);

  // Realtime: inserts nessa conversation
  useEffect(() => {
    const ch = supabase
      .channel(`detail-${conversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          const m = payload.new as Message;
          setMessages((prev) =>
            prev.some((p) => p.id === m.id) ? prev : [...prev, m],
          );
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [conversation.id]);

  // Auto-scroll para o fim quando muda histórico
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  const grouped = useMemo(() => groupByDay(messages), [messages]);

  const contactName =
    conversation.contact.name?.trim() || conversation.contact.phone_e164;

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await operatorSend(conversation.id, body);
      // realtime vai inserir, mas garantimos optimismo se não chegar em 2s:
      setDraft("");
      // se a Lena estava ativa, podemos sugerir/garantir pausar
      if (conversation.state === "lena") {
        await setConversationState(conversation.id, "human");
        onConversationChanged();
      }
      // se não chegar via realtime em 2s, injetamos manualmente
      setTimeout(() => {
        setMessages((prev) =>
          prev.some((m) => m.id === res.message_id)
            ? prev
            : [
                ...prev,
                {
                  id: res.message_id,
                  conversation_id: conversation.id,
                  tenant_id: conversation.tenant_id,
                  direction: "out",
                  kind: "text",
                  body,
                  wa_message_id: res.wa_message_id,
                  sent_by_user_id: null,
                  meta: { sent_by: "operator" },
                  created_at: res.created_at,
                } as Message,
              ],
        );
      }, 2000);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSending(false);
    }
  }

  async function changeState(next: "lena" | "human" | "paused") {
    setActionState("saving");
    try {
      await setConversationState(conversation.id, next);
      onConversationChanged();
      setActionState("idle");
    } catch (e) {
      setError((e as Error).message);
      setActionState("error");
    }
  }

  const stateLabel =
    conversation.state === "lena"
      ? "Lena está atendendo"
      : conversation.state === "human"
        ? "Você assumiu"
        : "Conversa pausada";

  return (
    <div className="flex h-full flex-col">
      <header className="flex flex-col gap-2 border-b border-creme-edge bg-creme-soft px-6 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="font-display text-lg text-cafe">{contactName}</div>
            <div className="text-xs text-cafe-muted">
              {conversation.contact.phone_e164}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {conversation.state !== "human" && (
              <Button onClick={() => changeState("human")} disabled={actionState === "saving"}>
                Assumir conversa
              </Button>
            )}
            {conversation.state !== "lena" && (
              <Button
                variant="ghost"
                onClick={() => changeState("lena")}
                disabled={actionState === "saving"}
              >
                Devolver para Lena
              </Button>
            )}
            {conversation.state !== "paused" && (
              <Button
                variant="danger"
                onClick={() => changeState("paused")}
                disabled={actionState === "saving"}
              >
                Pausar
              </Button>
            )}
          </div>
        </div>
        <div className="text-xs text-cafe-soft">{stateLabel}</div>
      </header>

      <main className="flex-1 overflow-y-auto bg-creme px-6 py-6">
        {loading ? (
          <p className="text-cafe-soft animate-pulse-soft">carregando histórico…</p>
        ) : error ? (
          <StatusPill kind="error">{error}</StatusPill>
        ) : grouped.length === 0 ? (
          <p className="text-cafe-soft text-sm">Sem mensagens nesta conversa ainda.</p>
        ) : (
          <div className="flex flex-col gap-5">
            {grouped.map(({ day, items }) => (
              <div key={day} className="flex flex-col gap-2">
                <div className="self-center text-[11px] uppercase tracking-wide text-cafe-muted">
                  {day}
                </div>
                {items.map((m) => (
                  <Bubble key={m.id} message={m} />
                ))}
              </div>
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </main>

      <form
        onSubmit={handleSend}
        className="flex flex-col gap-2 border-t border-creme-edge bg-creme-soft px-6 py-4"
      >
        <Textarea
          rows={2}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={
            conversation.state === "lena"
              ? "Escreva para enviar como operador. Isso vai pausar a Lena nesta conversa."
              : "Escreva sua mensagem como operador."
          }
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              void handleSend(e as unknown as FormEvent);
            }
          }}
        />
        <div className="flex items-center justify-between gap-3">
          <span className="text-[11px] text-cafe-muted">
            Cmd ou Ctrl + Enter para enviar
          </span>
          <Button type="submit" disabled={sending || draft.trim().length === 0}>
            {sending ? "enviando…" : "Enviar"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function groupByDay(messages: Message[]): { day: string; items: Message[] }[] {
  const groups: { day: string; items: Message[] }[] = [];
  for (const m of messages) {
    const label = dayLabel(m.created_at);
    const last = groups[groups.length - 1];
    if (last && last.day === label) last.items.push(m);
    else groups.push({ day: label, items: [m] });
  }
  return groups;
}
