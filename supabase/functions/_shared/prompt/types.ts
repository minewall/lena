// ==========================================================================
// GERADO POR scripts/sync-edge-shared.mjs — NÃO EDITAR À MÃO.
// Fonte: packages/shared/src/<subpkg>/<file>.ts
// ==========================================================================
export type Tone = "Acolhedor" | "Profissional" | "Descontraído";

export interface BrainService {
  /** nome */
  n?: string;
  /** preço formatado (R$ ...) */
  p?: string;
  /** rótulo de categoria hierárquico ("Categoria › Subcategoria") */
  cat?: string;
  /** duração em minutos */
  dur?: number;
  /** preparo / pré-requisito antes do atendimento */
  prep?: string;
  /** nº de sessões previstas (>1 = série) */
  sessions?: number;
  /** intervalo recomendado entre sessões, em dias */
  interval?: number;
}

export interface BrainCombo {
  name?: string;
  kind?: "pacote" | "condicional";
  desc?: string;
  /** pacote: preço fechado formatado */
  price?: string;
  /** condicional: desconto em % */
  discount?: number;
  /** condicional: nome do serviço-gatilho */
  trigger?: string;
  /** serviços do combo, já com quantidade no texto (ex.: "Hidratação x2") */
  items?: string[];
}

export interface TeamMember {
  name?: string;
  role?: string;
}

export interface TenantBrain {
  name?: string;
  segment?: string;
  hours?: string;
  /** Endereço completo da unidade principal (rua, número, bairro, cidade). */
  address?: string;
  /** Estacionamento: tem/não tem, manobrista, conveniado etc. */
  parking?: string;
  /** Ponto de referência para chegar. */
  landmark?: string;
  /** Andar da unidade principal (ex.: "Térreo", "3º andar"). */
  floor?: string;
  /** Comodidades da unidade principal, em rótulos legíveis (ex.: "café"). */
  amenities?: string[];
  /** Outras unidades ativas, para a Lena citar quando perguntarem. */
  otherUnits?: { name: string; address?: string }[];
  services?: BrainService[];
  /** combos: pacotes fechados e ofertas condicionais */
  combos?: BrainCombo[];
  promo?: string;
  extras?: string;
  tone?: Tone | string;
  /** Temas/condutas proibidas para a Lena. */
  restrictions?: string;
  /** Palavras-gatilho que disparam transferência imediata para humano. */
  escalationTriggers?: string[];
  /** Profissionais que a Lena PODE citar pelo nome. */
  teamPublic?: TeamMember[];
  /** Info interna que a Lena conhece mas nunca cita ao cliente. */
  teamPrivate?: string;
}
