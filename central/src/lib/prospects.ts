import { supabase } from "./supabase";

// A tabela prospects ainda não está nos tipos gerados; cast localizado
// (mesmo padrão de agenda.ts/dashboard.ts).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as unknown as { from: (t: string) => any };

export type ProspectFunil =
  | "novo"
  | "contatado"
  | "em_conversa"
  | "cliente"
  | "perdido";

export interface Prospect {
  id: string;
  nome: string;
  segmento: string;
  funil: ProspectFunil;
  bairros: string | null;
  telefones: string[];
  whatsapps: string[];
  emails: string[];
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  linkedin: string | null;
  tiktok: string | null;
  fonte: string | null;
  coletado_em: string | null;
  observacao: string | null;
  notas: string | null;
  whatsapp_url: string | null;
  funil_changed_at: string;
}

/** Estágios do funil, na ordem das colunas do Kanban. dot = cor hex (inline). */
export const FUNIS: { value: ProspectFunil; label: string; dot: string }[] = [
  { value: "novo", label: "Novo", dot: "#579bfc" },
  { value: "contatado", label: "Contatado", dot: "#fdab3d" },
  { value: "em_conversa", label: "Em conversa", dot: "#ffcb00" },
  { value: "cliente", label: "Cliente", dot: "#4e9e78" },
  { value: "perdido", label: "Perdido", dot: "#d9613a" },
];

const COLS =
  "id,nome,segmento,funil,bairros,telefones,whatsapps,emails,website," +
  "instagram,facebook,linkedin,tiktok,fonte,coletado_em,observacao,notas," +
  "whatsapp_url,funil_changed_at";

export async function loadProspects(): Promise<Prospect[]> {
  const { data, error } = await db
    .from("prospects")
    .select(COLS)
    .order("nome", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Prospect[];
}

export async function updateFunil(
  id: string,
  funil: ProspectFunil,
): Promise<void> {
  const { error } = await db.from("prospects").update({ funil }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function updateNotas(id: string, notas: string): Promise<void> {
  const { error } = await db
    .from("prospects")
    .update({ notas: notas.trim() || null })
    .eq("id", id);
  if (error) throw new Error(error.message);
}
