import type {
  Contact,
  ConversationState,
  Message,
} from "@lena/shared/db";
import { supabase } from "./supabase";

export interface ConversationListItem {
  id: string;
  tenant_id: string;
  contact_id: string;
  state: ConversationState;
  assigned_to: string | null;
  last_message_at: string | null;
  opened_at: string;
  closed_at: string | null;
  contact: Pick<Contact, "id" | "phone_e164" | "name">;
  last_message?: {
    body: string | null;
    direction: "in" | "out";
    kind: string;
    created_at: string;
  };
}

// Carrega a lista de conversas do tenant (apenas abertas), ordenadas pela
// última mensagem (mais recentes primeiro), com o contato embutido.
export async function loadConversations(
  tenantId: string,
): Promise<ConversationListItem[]> {
  const { data, error } = await supabase
    .from("conversations")
    .select(
      `
      id, tenant_id, contact_id, state, assigned_to,
      last_message_at, opened_at, closed_at,
      contact:contacts ( id, phone_e164, name )
    `,
    )
    .eq("tenant_id", tenantId)
    .is("closed_at", null)
    .order("last_message_at", { ascending: false, nullsFirst: false });

  if (error) throw error;

  const list = (data ?? []) as unknown as Array<
    Omit<ConversationListItem, "contact" | "last_message"> & {
      contact: Pick<Contact, "id" | "phone_e164" | "name"> | null;
    }
  >;

  // Carrega a última mensagem de cada conversa (1 query, agrupa client-side).
  const conversationIds = list.map((c) => c.id);
  const lastMap = await loadLastMessages(conversationIds);

  return list
    .filter((c) => c.contact)
    .map((c) => ({
      ...c,
      contact: c.contact!,
      last_message: lastMap[c.id],
    }));
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
