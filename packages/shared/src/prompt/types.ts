export type Tone = "Acolhedor" | "Profissional" | "Descontraído";

export interface BrainService {
  n?: string;
  p?: string;
}

export interface TeamMember {
  name?: string;
  role?: string;
}

export interface TenantBrain {
  name?: string;
  segment?: string;
  hours?: string;
  services?: BrainService[];
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
