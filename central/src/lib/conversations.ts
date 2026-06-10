import type {
  Contact,
  ConversationState,
  Message,
} from "@lena/shared/db";
import { supabase } from "./supabase";

export type ConversationLifecycle = "open" | "resolved" | "archived";

export interface ConversationTag {
  id: string;
  name: string;
  color: string;
}

export interface ConversationListItem {
  id: string;
  tenant_id: string;
  contact_id: string;
  state: ConversationState;
  lifecycle: ConversationLifecycle;
  assigned_to: string | null;
  last_message_at: string | null;
  opened_at: string;
  closed_at: string | null;
  tags: ConversationTag[];
  contact: Pick<Contact, "id" | "phone_e164" | "name">;
  last_message?: {
    body: string | null;
    direction: "in" | "out";
    kind: string;
    created_at: string;
  };
}

// Carrega a lista de conversas do tenant no ciclo de vida pedido, ordenadas
// pela última mensagem (mais recentes primeiro), com contato e tags embutidos.
export async function loadConversations(
  tenantId: string,
  lifecycle: ConversationLifecycle = "open",
): Promise<ConversationListItem[]> {
  const { data, error } = await supabase
    .from("conversations")
    .select(
      `
      id, tenant_id, contact_id, state, lifecycle, assigned_to,
      last_message_at, opened_at, closed_at,
      contact:contacts ( id, phone_e164, name ),
      conversation_tags ( tag:tenant_tags ( id, name, color ) )
    `,
    )
    .eq("tenant_id", tenantId)
    .eq("lifecycle", lifecycle)
    .order("last_message_at", { ascending: false, nullsFirst: false });

  if (error) throw error;

  const list = (data ?? []) as unknown as Array<
    Omit<ConversationListItem, "contact" | "last_message" | "tags"> & {
      contact: Pick<Contact, "id" | "phone_e164" | "name"> | null;
      conversation_tags: { tag: ConversationTag | null }[] | null;
    }
  >;

  // Carrega a última mensagem de cada conversa (1 query, agrupa client-side).
  const conversationIds = list.map((c) => c.id);
  const lastMap = await loadLastMessages(conversationIds);

  return list
    .filter((c) => c.contact)
    .map(({ conversation_tags, ...c }) => ({
      ...c,
      contact: c.contact!,
      tags: (conversation_tags ?? [])
        .map((t) => t.tag)
        .filter((t): t is ConversationTag => t !== null),
      last_message: lastMap[c.id],
    }));
}

/** Muda o ciclo de vida (resolver / reabrir / arquivar). Nada é apagado. */
export async function setConversationLifecycle(
  conversationId: string,
  lifecycle: ConversationLifecycle,
): Promise<void> {
  const patch: {
    lifecycle: ConversationLifecycle;
    resolved_at?: string | null;
    archived_at?: string | null;
    closed_at?: string | null;
  } = { lifecycle };
  if (lifecycle === "resolved") patch.resolved_at = new Date().toISOString();
  if (lifecycle === "archived") patch.archived_at = new Date().toISOString();
  if (lifecycle === "open") {
    patch.resolved_at = null;
    patch.archived_at = null;
    patch.closed_at = null;
  }
  const { error } = await supabase
    .from("conversations")
    .update(patch)
    .eq("id", conversationId);
  if (error) throw error;
}

// ── Tags ─────────────────────────────────────────────────────────────────

const TAG_PALETTE = ["#E35B2E", "#599372", "#F2A93C", "#8A5A9C", "#5B7FB5", "#B5536B"];

export async function loadTenantTags(tenantId: string): Promise<ConversationTag[]> {
  const { data, error } = await supabase
    .from("tenant_tags")
    .select("id, name, color")
    .eq("tenant_id", tenantId)
    .order("name");
  if (error) throw error;
  return (data ?? []) as ConversationTag[];
}

export async function createTenantTag(
  tenantId: string,
  name: string,
  existingCount: number,
): Promise<ConversationTag> {
  const color = TAG_PALETTE[existingCount % TAG_PALETTE.length];
  const { data, error } = await supabase
    .from("tenant_tags")
    .insert({ tenant_id: tenantId, name: name.trim(), color })
    .select("id, name, color")
    .single();
  if (error) throw error;
  return data as ConversationTag;
}

export async function tagConversation(conversationId: string, tagId: string): Promise<void> {
  const { error } = await supabase
    .from("conversation_tags")
    .insert({ conversation_id: conversationId, tag_id: tagId });
  if (error && error.code !== "23505") throw error; // ignora duplicado
}

export async function untagConversation(conversationId: string, tagId: string): Promise<void> {
  const { error } = await supabase
    .from("conversation_tags")
    .delete()
    .eq("conversation_id", conversationId)
    .eq("tag_id", tagId);
  if (error) throw error;
}

async function loadLastMessages(conversationIds: string[]) {
  if (conversationIds.length === 0) return {};
  // pega as últimas N mensagens (3× o número de conversas é folga razoável
  // para garantir 1 por conversa em quase todos os casos)
  const { data, error } = await supabase
    .from("messages")
    .select("id, conversation_id, body, direction, kind, created_at")
    .in("conversation_id", conversationIds)
    .order("created_at", { ascending: false })
    .limit(Math.max(100, conversationIds.length * 3));
  if (error) throw error;

  const map: Record<string, ConversationListItem["last_message"]> = {};
  for (const row of data ?? []) {
    const m = row as {
      conversation_id: string;
      body: string | null;
      direction: "in" | "out";
      kind: string;
      created_at: string;
    };
    if (!map[m.conversation_id]) {
      map[m.conversation_id] = {
        body: m.body,
        direction: m.direction,
        kind: m.kind,
        created_at: m.created_at,
      };
    }
  }
  return map;
}

export async function loadMessages(
  conversationId: string,
  limit = 200,
): Promise<Message[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as Message[];
}

export async function setConversationState(
  conversationId: string,
  state: ConversationState,
  assignedTo: string | null = null,
): Promise<void> {
  const { error } = await supabase
    .from("conversations")
    .update({ state, assigned_to: assignedTo })
    .eq("id", conversationId);
  if (error) throw error;
}

export async function operatorSend(
  conversationId: string,
  body: string,
): Promise<{ message_id: string; wa_message_id: string; created_at: string }> {
  const { data, error } = await supabase.functions.invoke("operator-send", {
    body: { conversation_id: conversationId, body },
  });
  if (error) throw error;
  return data as {
    message_id: string;
    wa_message_id: string;
    created_at: string;
  };
}
