// ==========================================================================
// GERADO POR scripts/sync-edge-shared.mjs — NÃO EDITAR À MÃO.
// Fonte: packages/shared/src/wa/<file>.ts
// ==========================================================================
/**
 * Tipos normalizados para o WhatsApp. A interface WhatsAppProvider devolve
 * estes tipos sem expor o payload bruto da Meta/BSP, para que msg-processor
 * funcione igual com qualquer provedor.
 */

export type WhatsAppMessageKind =
  | "text"
  | "image"
  | "audio"
  | "video"
  | "document"
  | "sticker"
  | "location"
  | "contact"
  | "unknown";

export interface WhatsAppInboundMessage {
  kind: "message";
  waMessageId: string;
  phoneNumberId: string; // o número do tenant que recebeu
  fromPhoneE164: string; // o cliente final (com +)
  contactName?: string;
  timestamp: number; // unix seconds
  messageKind: WhatsAppMessageKind;
  text?: string; // preenchido quando messageKind = 'text'
  media?: {
    id: string;
    mimeType?: string;
    caption?: string;
  };
  raw: unknown; // payload original para inspeção/debug
}

export interface WhatsAppStatusEvent {
  kind: "status";
  waMessageId: string;
  phoneNumberId: string;
  status: "sent" | "delivered" | "read" | "failed" | "deleted";
  timestamp: number;
  raw: unknown;
}

export interface WhatsAppUnknownEvent {
  kind: "unknown";
  raw: unknown;
}

export type WhatsAppInboundEvent =
  | WhatsAppInboundMessage
  | WhatsAppStatusEvent
  | WhatsAppUnknownEvent;

export interface SendResult {
  waMessageId: string;
}

export type WhatsAppQualityRating = "unknown" | "green" | "yellow" | "red";

export interface NumberHealth {
  phoneNumberId: string;
  displayPhoneNumber?: string;
  verifiedName?: string;
  qualityRating: WhatsAppQualityRating;
  messagingLimit?: string;
  checkedAt: number;
}
