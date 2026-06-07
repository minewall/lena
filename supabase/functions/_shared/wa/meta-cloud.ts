// ==========================================================================
// GERADO POR scripts/sync-edge-shared.mjs — NÃO EDITAR À MÃO.
// Fonte: packages/shared/src/wa/<file>.ts
// ==========================================================================
import type { WhatsAppProvider } from "./provider.ts";
import type {
  NumberHealth,
  SendResult,
  WhatsAppInboundEvent,
  WhatsAppInboundMessage,
  WhatsAppMessageKind,
  WhatsAppQualityRating,
  WhatsAppStatusEvent,
} from "./types.ts";
import { validateMetaSignature } from "./signature.ts";
import { stripPlus, toE164 } from "./phone.ts";

const DEFAULT_GRAPH_VERSION = "v21.0";

export interface MetaCloudProviderOpts {
  phoneNumberId: string;
  accessToken: string;
  appSecret: string;
  verifyToken: string;
  graphVersion?: string;
}

export class MetaCloudProvider implements WhatsAppProvider {
  private readonly base: string;

  constructor(private readonly opts: MetaCloudProviderOpts) {
    const v = opts.graphVersion ?? DEFAULT_GRAPH_VERSION;
    this.base = `https://graph.facebook.com/${v}`;
  }

  verifyChallenge(opts: {
    mode: string | null;
    token: string | null;
    challenge: string | null;
  }): string | null {
    if (
      opts.mode === "subscribe" &&
      opts.token === this.opts.verifyToken &&
      typeof opts.challenge === "string"
    ) {
      return opts.challenge;
    }
    return null;
  }

  async parseWebhook(opts: {
    rawBody: string;
    signatureHeader: string | null;
  }): Promise<WhatsAppInboundEvent[]> {
    const valid = await validateMetaSignature({
      rawBody: opts.rawBody,
      signatureHeader: opts.signatureHeader,
      appSecret: this.opts.appSecret,
    });
    if (!valid) {
      throw new Error("invalid_signature");
    }

    let body: unknown;
    try {
      body = JSON.parse(opts.rawBody);
    } catch {
      throw new Error("invalid_json");
    }
    return normalizeMetaWebhook(body);
  }

  async sendText(to: string, body: string): Promise<SendResult> {
    const json = await this.post(`/${this.opts.phoneNumberId}/messages`, {
      messaging_product: "whatsapp",
      to: stripPlus(toE164(to)),
      type: "text",
      text: { body, preview_url: false },
    });
    return extractWaMessageId(json);
  }

  async sendTemplate(
    to: string,
    template: string,
    language: string,
    variables: string[],
  ): Promise<SendResult> {
    const components =
      variables.length > 0
        ? [
            {
              type: "body",
              parameters: variables.map((v) => ({ type: "text", text: v })),
            },
          ]
        : undefined;

    const json = await this.post(`/${this.opts.phoneNumberId}/messages`, {
      messaging_product: "whatsapp",
      to: stripPlus(toE164(to)),
      type: "template",
      template: {
        name: template,
        language: { code: language },
        ...(components ? { components } : {}),
      },
    });
    return extractWaMessageId(json);
  }

  async getNumberHealth(): Promise<NumberHealth> {
    const url = `${this.base}/${this.opts.phoneNumberId}?fields=display_phone_number,verified_name,quality_rating,messaging_limit_tier`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${this.opts.accessToken}` },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`getNumberHealth ${res.status}: ${text}`);
    }
    const json = (await res.json()) as {
      display_phone_number?: string;
      verified_name?: string;
      quality_rating?: string;
      messaging_limit_tier?: string;
    };
    return {
      phoneNumberId: this.opts.phoneNumberId,
      displayPhoneNumber: json.display_phone_number,
      verifiedName: json.verified_name,
      qualityRating: normalizeQuality(json.quality_rating),
      messagingLimit: json.messaging_limit_tier,
      checkedAt: Math.floor(Date.now() / 1000),
    };
  }

  // ── helpers internos ───────────────────────────────────────────────
  private async post(path: string, body: unknown): Promise<unknown> {
    const res = await fetch(`${this.base}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.opts.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`meta ${res.status}: ${text}`);
    }
    return res.json();
  }
}

function extractWaMessageId(json: unknown): SendResult {
  const msgs = (json as { messages?: { id: string }[] }).messages;
  if (!msgs || msgs.length === 0) throw new Error("no wa_message_id");
  return { waMessageId: msgs[0].id };
}

function normalizeQuality(s?: string): WhatsAppQualityRating {
  const v = s?.toLowerCase();
  if (v === "green" || v === "yellow" || v === "red") return v;
  return "unknown";
}

// ─────────────────────────────────────────────────────────────────────
// Normalização do payload bruto da Meta para WhatsAppInboundEvent[].
// ─────────────────────────────────────────────────────────────────────

interface MetaEnvelope {
  object?: string;
  entry?: MetaEntry[];
}
interface MetaEntry {
  id?: string;
  changes?: MetaChange[];
}
interface MetaChange {
  value?: MetaChangeValue;
  field?: string;
}
interface MetaChangeValue {
  messaging_product?: string;
  metadata?: { phone_number_id?: string; display_phone_number?: string };
  contacts?: { profile?: { name?: string }; wa_id?: string }[];
  messages?: MetaMessage[];
  statuses?: MetaStatus[];
}
interface MetaMessage {
  from?: string;
  id?: string;
  timestamp?: string;
  type?: string;
  text?: { body?: string };
  image?: { id?: string; mime_type?: string; caption?: string };
  audio?: { id?: string; mime_type?: string };
  video?: { id?: string; mime_type?: string; caption?: string };
  document?: { id?: string; mime_type?: string; caption?: string };
  sticker?: { id?: string; mime_type?: string };
}
interface MetaStatus {
  id?: string;
  status?: string;
  timestamp?: string;
  recipient_id?: string;
}

export function normalizeMetaWebhook(body: unknown): WhatsAppInboundEvent[] {
  const envelope = body as MetaEnvelope;
  const events: WhatsAppInboundEvent[] = [];

  for (const entry of envelope.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      if (!value) continue;
      const phoneNumberId = value.metadata?.phone_number_id ?? "";

      const contactsByWaId = new Map<string, { name?: string }>();
      for (const c of value.contacts ?? []) {
        if (c.wa_id) contactsByWaId.set(c.wa_id, { name: c.profile?.name });
      }

      for (const m of value.messages ?? []) {
        events.push(toInboundMessage(m, phoneNumberId, contactsByWaId));
      }

      for (const s of value.statuses ?? []) {
        events.push(toStatusEvent(s, phoneNumberId));
      }
    }
  }

  return events;
}

function toInboundMessage(
  m: MetaMessage,
  phoneNumberId: string,
  contactsByWaId: Map<string, { name?: string }>,
): WhatsAppInboundMessage {
  const fromRaw = m.from ?? "";
  const ts = m.timestamp ? Number(m.timestamp) : Math.floor(Date.now() / 1000);
  const kind = mapKind(m.type);
  const contact = contactsByWaId.get(fromRaw);

  let text: string | undefined;
  let media: WhatsAppInboundMessage["media"];

  switch (m.type) {
    case "text":
      text = m.text?.body ?? "";
      break;
    case "image":
      media = pickMedia(m.image);
      text = m.image?.caption;
      break;
    case "video":
      media = pickMedia(m.video);
      text = m.video?.caption;
      break;
    case "document":
      media = pickMedia(m.document);
      text = m.document?.caption;
      break;
    case "audio":
      media = pickMedia(m.audio);
      break;
    case "sticker":
      media = pickMedia(m.sticker);
      break;
  }

  return {
    kind: "message",
    waMessageId: m.id ?? "",
    phoneNumberId,
    fromPhoneE164: toE164(fromRaw),
    contactName: contact?.name,
    timestamp: ts,
    messageKind: kind,
    text,
    media,
    raw: m,
  };
}

function pickMedia(o?: { id?: string; mime_type?: string; caption?: string }) {
  if (!o?.id) return undefined;
  return {
    id: o.id,
    mimeType: o.mime_type,
    caption: o.caption,
  };
}

function toStatusEvent(s: MetaStatus, phoneNumberId: string): WhatsAppStatusEvent {
  const ts = s.timestamp ? Number(s.timestamp) : Math.floor(Date.now() / 1000);
  return {
    kind: "status",
    waMessageId: s.id ?? "",
    phoneNumberId,
    status: mapStatus(s.status),
    timestamp: ts,
    raw: s,
  };
}

function mapKind(t?: string): WhatsAppMessageKind {
  switch (t) {
    case "text":
    case "image":
    case "audio":
    case "video":
    case "document":
    case "sticker":
    case "location":
    case "contacts":
      return t === "contacts" ? "contact" : (t as WhatsAppMessageKind);
    default:
      return "unknown";
  }
}

function mapStatus(s?: string): WhatsAppStatusEvent["status"] {
  switch (s) {
    case "sent":
    case "delivered":
    case "read":
    case "failed":
    case "deleted":
      return s;
    default:
      return "failed";
  }
}
