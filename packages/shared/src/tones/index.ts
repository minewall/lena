import type { Tone } from "../prompt/types.js";

export const TONES: Record<string, string> = {
  Acolhedor: "calorosa, próxima e simpática",
  Profissional: "elegante, profissional e cordial",
  Descontraído: "leve, descontraída e jovem",
};

export const TONE_KEYS: Tone[] = ["Acolhedor", "Profissional", "Descontraído"];

export function describeTone(tone?: string): string {
  return TONES[tone ?? ""] ?? TONES.Acolhedor;
}
