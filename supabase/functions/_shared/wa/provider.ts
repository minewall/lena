// ==========================================================================
// GERADO POR scripts/sync-edge-shared.mjs — NÃO EDITAR À MÃO.
// Fonte: packages/shared/src/<subpkg>/<file>.ts
// ==========================================================================
import type {
  NumberHealth,
  SendResult,
  WhatsAppInboundEvent,
} from "./types.ts";

/**
 * Interface comum. Implementações: MetaCloudProvider (default, piloto) e
 * Dialog360Provider (reserva). msg-processor depende SÓ desta interface.
 */
export interface WhatsAppProvider {
  /**
   * Recebe o request bruto do webhook, valida assinatura e devolve a lista
   * normalizada de eventos. Lança erro se a assinatura for inválida.
   */
  parseWebhook(opts: {
    rawBody: string;
    signatureHeader: string | null;
  }): Promise<WhatsAppInboundEvent[]>;

  /**
   * Verificação inicial do webhook (GET com hub.mode, hub.verify_token,
   * hub.challenge). Retorna o challenge se o token bater, senão null.
   */
  verifyChallenge(opts: {
    mode: string | null;
    token: string | null;
    challenge: string | null;
  }): string | null;

  /** Envia texto livre (válido dentro da janela 24h). */
  sendText(to: string, body: string): Promise<SendResult>;

  /** Envia template aprovado (fora da janela 24h ou marketing). */
  sendTemplate(
    to: string,
    template: string,
    language: string,
    variables: string[],
  ): Promise<SendResult>;

  /** Consulta status do número via API do provedor. */
  getNumberHealth(): Promise<NumberHealth>;
}
