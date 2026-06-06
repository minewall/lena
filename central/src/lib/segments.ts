export const SEGMENTS = [
  { value: "escola", label: "Escola" },
  { value: "clinica", label: "Clínica" },
  { value: "salao", label: "Salão / Estética" },
  { value: "petshop", label: "Petshop" },
  { value: "outro", label: "Outro" },
] as const;

export type SegmentValue = (typeof SEGMENTS)[number]["value"];
