import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type { Message } from "@lena/shared/db";
import type { ConversationListItem } from "../../lib/conversations";
import {
  createTenantTag,
  loadMessages,
  loadTenantTags,
  operatorSend,
  setConversationLifecycle,
  setConversationState,
  tagConversation,
  untagConversation,
  type ConversationTag,
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
  const [tagOpen, setTagOpen] = useState(false);
  const [allTags, setAllTags] = useState<ConversationTag[]>([]);
  const [newTag, setNewTag] = useState("");
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

  async function changeLifecycle(next: "open" | "resolved" | "archived") {
    setActionState("saving");
    try {
      await setConversationLifecycle(conversation.id, next);
      onConversationChanged();
      setActionState("idle");
    } catch (e) {
      setError((e as Error).message);
      setActionState("error");
    }
  }

  async function openTagPicker() {
    setTagOpen((v) => !v);
    if (allTags.length === 0) {
      try {
        setAllTags(await loadTenantTags(conversation.tenant_id));
      } catch { /* lista vazia segue ok */ }
    }
  }

  async function toggleTag(tag: ConversationTag) {
    const has = conversation.tags.some((t) => t.id === tag.id);
    try {
      if (has) await untagConversation(conversation.id, tag.id);
      else await tagConversation(conversation.id, tag.id);
      onConversationChanged();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function createAndApplyTag() {
    const name = newTag.trim();
    if (!name) return;
    try {
      const tag = await createTenantTag(conversation.tenant_id, name, allTags.length);
      setAllTags((prev) => [...prev, tag]);
      setNewTag("");
      await tagConversation(conversation.id, tag.id);
      onConversationChanged();
    } catch (e) {
      setError((e as Error).message);
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
            {conversation.lifecycle === "open" ? (
              <Button
                variant="ghost"
                onClick={() => changeLifecycle("resolved")}
                disabled={actionState === "saving"}
              >
                Resolver
              </Button>
            ) : (
              <Button
                variant="ghost"
                onClick={() => changeLifecycle("open")}
                disabled={actionState === "saving"}
              >
                Reabrir
              </Button>
            )}
            {conversation.lifecycle !== "archived" && (
              <Button
                variant="ghost"
                onClick={() => changeLifecycle("archived")}
                disabled={actionState === "saving"}
              >
                Arquivar
              </Button>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-cafe-soft">{stateLabel}</span>
          <span className="text-creme-edge">·</span>
          {conversation.tags.map((t) => (
            <button
              key={t.id}
              type="button"
              title="Remover tag"
              onClick={() => toggleTag(t)}
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
              style={{ backgroundColor: t.color + "20", color: t.color }}
            >
              {t.name} ✕
            </button>
          ))}
          <button
            type="button"
            onClick={openTagPicker}
            className="rounded-full border border-dashed border-creme-edge px-2 py-0.5 text-[10px] font-semibold text-cafe-muted hover:border-terracota hover:text-terracota"
          >
            + tag
          </button>
        </div>
        {tagOpen ? (
          <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-creme-edge bg-white px-3 py-2">
            {allTags.map((t) => {
              const has = conversation.tags.some((x) => x.id === t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggleTag(t)}
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold transition ${has ? "ring-1" : "opacity-60 hover:opacity-100"}`}
                  style={{ backgroundColor: t.color + "20", color: t.color }}
                >
                  {t.name}
                </button>
              );
            })}
            <input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void createAndApplyTag(); } }}
              placeholder="nova tag + Enter"
              className="w-28 rounded-lg border border-creme-edge px-2 py-0.5 text-[11px] outline-none focus:border-terracota"
            />
          </div>
        ) : null}
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
