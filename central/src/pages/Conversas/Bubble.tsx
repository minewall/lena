import type { Message } from "@lena/shared/db";
import { timeOfDay } from "../../lib/time";

const KIND_LABEL: Record<string, string> = {
  image: "📷 imagem",
  audio: "🎙 áudio",
  video: "🎞 vídeo",
  document: "📎 documento",
  sticker: "sticker",
  location: "📍 localização",
  contact: "👤 contato",
};

export function Bubble({ message }: { message: Message }) {
  const isIn = message.direction === "in";
  const isOperator =
    !isIn && (message.meta as Record<string, unknown> | null)?.sent_by ===
      "operator";
  const isLena =
    !isIn && (message.meta as Record<string, unknown> | null)?.ai_model;

  const text = message.body ?? (KIND_LABEL[message.kind] ?? message.kind);

  const baseStyles = "max-w-[78%] rounded-2xl px-3.5 py-2 text-sm leading-snug";
  const styles = isIn
    ? "self-start bg-white border border-creme-edge text-cafe"
    : isOperator
      ? "self-end bg-cafe text-creme"
      : "self-end bg-terracota text-white";

  return (
    <div className={`flex flex-col gap-0.5 ${isIn ? "items-start" : "items-end"}`}>
      <div className={`${baseStyles} ${styles}`}>
        {text}
      </div>
      <div className="text-[11px] text-cafe-muted px-1">
        {timeOfDay(message.created_at)}
        {isOperator ? " · operador" : isLena ? " · Lena" : ""}
      </div>
    </div>
  );
}
