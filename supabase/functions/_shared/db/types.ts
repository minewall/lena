// ==========================================================================
// GERADO POR scripts/sync-edge-shared.mjs — NÃO EDITAR À MÃO.
// Fonte: packages/shared/src/<subpkg>/<file>.ts
// ==========================================================================
// AUTO-GERADO por mcp__supabase__generate_typescript_types (project lena-uno).
// Re-gerar quando houver mudança de schema:
//   npx supabase gen types typescript --project-id tirvnwsiokivrswdthge > packages/shared/src/db/types.ts
//
// Não editar à mão.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: { PostgrestVersion: "14.5" };
  public: {
    Tables: {
      ai_usage: {
        Row: {
          conversation_id: string | null;
          cost_micro_usd: number;
          id: string;
          input_tokens: number;
          message_id: string | null;
          meta: Json;
          model: string;
          occurred_at: string;
          output_tokens: number;
          tenant_id: string;
        };
        Insert: {
          conversation_id?: string | null;
          cost_micro_usd?: number;
          id?: string;
          input_tokens?: number;
          message_id?: string | null;
          meta?: Json;
          model: string;
          occurred_at?: string;
          output_tokens?: number;
          tenant_id: string;
        };
        Update: {
          conversation_id?: string | null;
          cost_micro_usd?: number;
          id?: string;
          input_tokens?: number;
          message_id?: string | null;
          meta?: Json;
          model?: string;
          occurred_at?: string;
          output_tokens?: number;
          tenant_id?: string;
        };
        Relationships: [];
      };
      contacts: {
        Row: {
          created_at: string;
          id: string;
          name: string | null;
          notes: string | null;
          opted_out: boolean;
          phone_e164: string;
          tags: string[];
          tenant_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name?: string | null;
          notes?: string | null;
          opted_out?: boolean;
          phone_e164: string;
          tags?: string[];
          tenant_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string | null;
          notes?: string | null;
          opted_out?: boolean;
          phone_e164?: string;
          tags?: string[];
          tenant_id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      conversations: {
        Row: {
          assigned_to: string | null;
          channel: string;
          closed_at: string | null;
          contact_id: string;
          id: string;
          last_message_at: string | null;
          opened_at: string;
          state: Database["public"]["Enums"]["conversation_state"];
          tenant_id: string;
        };
        Insert: {
          assigned_to?: string | null;
          channel?: string;
          closed_at?: string | null;
          contact_id: string;
          id?: string;
          last_message_at?: string | null;
          opened_at?: string;
          state?: Database["public"]["Enums"]["conversation_state"];
          tenant_id: string;
        };
        Update: {
          assigned_to?: string | null;
          channel?: string;
          closed_at?: string | null;
          contact_id?: string;
          id?: string;
          last_message_at?: string | null;
          opened_at?: string;
          state?: Database["public"]["Enums"]["conversation_state"];
          tenant_id?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          body: string | null;
          conversation_id: string;
          created_at: string;
          direction: Database["public"]["Enums"]["message_direction"];
          id: string;
          kind: Database["public"]["Enums"]["message_kind"];
          meta: Json;
          sent_by_user_id: string | null;
          tenant_id: string;
          wa_message_id: string | null;
        };
        Insert: {
          body?: string | null;
          conversation_id: string;
          created_at?: string;
          direction: Database["public"]["Enums"]["message_direction"];
          id?: string;
          kind?: Database["public"]["Enums"]["message_kind"];
          meta?: Json;
          sent_by_user_id?: string | null;
          tenant_id: string;
          wa_message_id?: string | null;
        };
        Update: {
          body?: string | null;
          conversation_id?: string;
          created_at?: string;
          direction?: Database["public"]["Enums"]["message_direction"];
          id?: string;
          kind?: Database["public"]["Enums"]["message_kind"];
          meta?: Json;
          sent_by_user_id?: string | null;
          tenant_id?: string;
          wa_message_id?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          full_name: string | null;
          id: string;
          is_platform_admin: boolean;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string | null;
          id: string;
          is_platform_admin?: boolean;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string | null;
          id?: string;
          is_platform_admin?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      tenant_brains: {
        Row: {
          address: string | null;
          business_name: string;
          convenios: Json;
          escalation_rules: Json;
          extras: string | null;
          hours: string | null;
          payments: Json;
          promo: string | null;
          segment: string;
          tenant_id: string;
          tone: Database["public"]["Enums"]["tenant_tone"];
          updated_at: string;
          version: number;
        };
        Insert: {
          address?: string | null;
          business_name: string;
          convenios?: Json;
          escalation_rules?: Json;
          extras?: string | null;
          hours?: string | null;
          payments?: Json;
          promo?: string | null;
          segment: string;
          tenant_id: string;
          tone?: Database["public"]["Enums"]["tenant_tone"];
          updated_at?: string;
          version?: number;
        };
        Update: {
          address?: string | null;
          business_name?: string;
          convenios?: Json;
          escalation_rules?: Json;
          extras?: string | null;
          hours?: string | null;
          payments?: Json;
          promo?: string | null;
          segment?: string;
          tenant_id?: string;
          tone?: Database["public"]["Enums"]["tenant_tone"];
          updated_at?: string;
          version?: number;
        };
        Relationships: [];
      };
      tenant_faqs: {
        Row: {
          active: boolean;
          answer: string;
          created_at: string;
          id: string;
          position: number;
          question: string;
          tags: string[];
          tenant_id: string;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          answer: string;
          created_at?: string;
          id?: string;
          position?: number;
          question: string;
          tags?: string[];
          tenant_id: string;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          answer?: string;
          created_at?: string;
          id?: string;
          position?: number;
          question?: string;
          tags?: string[];
          tenant_id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tenant_invitations: {
        Row: {
          accepted_at: string | null;
          email: string;
          id: string;
          invited_at: string;
          invited_by: string | null;
          role: Database["public"]["Enums"]["tenant_role"];
          status: Database["public"]["Enums"]["invitation_status"];
          tenant_id: string;
        };
        Insert: {
          accepted_at?: string | null;
          email: string;
          id?: string;
          invited_at?: string;
          invited_by?: string | null;
          role?: Database["public"]["Enums"]["tenant_role"];
          status?: Database["public"]["Enums"]["invitation_status"];
          tenant_id: string;
        };
        Update: {
          accepted_at?: string | null;
          email?: string;
          id?: string;
          invited_at?: string;
          invited_by?: string | null;
          role?: Database["public"]["Enums"]["tenant_role"];
          status?: Database["public"]["Enums"]["invitation_status"];
          tenant_id?: string;
        };
        Relationships: [];
      };
      tenant_members: {
        Row: {
          accepted_at: string | null;
          id: string;
          invited_at: string;
          role: Database["public"]["Enums"]["tenant_role"];
          tenant_id: string;
          user_id: string;
        };
        Insert: {
          accepted_at?: string | null;
          id?: string;
          invited_at?: string;
          role?: Database["public"]["Enums"]["tenant_role"];
          tenant_id: string;
          user_id: string;
        };
        Update: {
          accepted_at?: string | null;
          id?: string;
          invited_at?: string;
          role?: Database["public"]["Enums"]["tenant_role"];
          tenant_id?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      tenant_secrets: {
        Row: {
          created_at: string;
          id: string;
          kind: string;
          meta: Json;
          tenant_id: string;
          updated_at: string;
          value: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          kind: string;
          meta?: Json;
          tenant_id: string;
          updated_at?: string;
          value: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          kind?: string;
          meta?: Json;
          tenant_id?: string;
          updated_at?: string;
          value?: string;
        };
        Relationships: [];
      };
      tenant_services: {
        Row: {
          active: boolean;
          created_at: string;
          description: string | null;
          duration_min: number | null;
          id: string;
          is_upsell: boolean;
          name: string;
          position: number;
          price_cents: number | null;
          tenant_id: string;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          created_at?: string;
          description?: string | null;
          duration_min?: number | null;
          id?: string;
          is_upsell?: boolean;
          name: string;
          position?: number;
          price_cents?: number | null;
          tenant_id: string;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          created_at?: string;
          description?: string | null;
          duration_min?: number | null;
          id?: string;
          is_upsell?: boolean;
          name?: string;
          position?: number;
          price_cents?: number | null;
          tenant_id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tenants: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          id: string;
          name: string;
          segment: string;
          slug: string;
          status: Database["public"]["Enums"]["tenant_status"];
          timezone: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          name: string;
          segment?: string;
          slug: string;
          status?: Database["public"]["Enums"]["tenant_status"];
          timezone?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          name?: string;
          segment?: string;
          slug?: string;
          status?: Database["public"]["Enums"]["tenant_status"];
          timezone?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      wa_numbers: {
        Row: {
          created_at: string;
          display_name: string | null;
          id: string;
          last_health_check: string | null;
          messaging_limit: string | null;
          phone_e164: string;
          phone_number_id: string;
          provider: string;
          quality_rating: Database["public"]["Enums"]["wa_quality_rating"];
          status: Database["public"]["Enums"]["wa_number_status"];
          tenant_id: string;
          updated_at: string;
          waba_id: string;
        };
        Insert: {
          created_at?: string;
          display_name?: string | null;
          id?: string;
          last_health_check?: string | null;
          messaging_limit?: string | null;
          phone_e164: string;
          phone_number_id: string;
          provider?: string;
          quality_rating?: Database["public"]["Enums"]["wa_quality_rating"];
          status?: Database["public"]["Enums"]["wa_number_status"];
          tenant_id: string;
          updated_at?: string;
          waba_id: string;
        };
        Update: {
          created_at?: string;
          display_name?: string | null;
          id?: string;
          last_health_check?: string | null;
          messaging_limit?: string | null;
          phone_e164?: string;
          phone_number_id?: string;
          provider?: string;
          quality_rating?: Database["public"]["Enums"]["wa_quality_rating"];
          status?: Database["public"]["Enums"]["wa_number_status"];
          tenant_id?: string;
          updated_at?: string;
          waba_id?: string;
        };
        Relationships: [];
      };
      wa_templates: {
        Row: {
          body: string;
          category: Database["public"]["Enums"]["wa_template_category"];
          created_at: string;
          id: string;
          language: string;
          meta_template_id: string | null;
          name: string;
          rejection_reason: string | null;
          status: Database["public"]["Enums"]["wa_template_status"];
          tenant_id: string;
          updated_at: string;
          variables: string[];
        };
        Insert: {
          body: string;
          category?: Database["public"]["Enums"]["wa_template_category"];
          created_at?: string;
          id?: string;
          language?: string;
          meta_template_id?: string | null;
          name: string;
          rejection_reason?: string | null;
          status?: Database["public"]["Enums"]["wa_template_status"];
          tenant_id: string;
          updated_at?: string;
          variables?: string[];
        };
        Update: {
          body?: string;
          category?: Database["public"]["Enums"]["wa_template_category"];
          created_at?: string;
          id?: string;
          language?: string;
          meta_template_id?: string | null;
          name?: string;
          rejection_reason?: string | null;
          status?: Database["public"]["Enums"]["wa_template_status"];
          tenant_id?: string;
          updated_at?: string;
          variables?: string[];
        };
        Relationships: [];
      };
      webhook_events: {
        Row: {
          error: string | null;
          external_id: string;
          id: string;
          payload: Json;
          processed_at: string | null;
          received_at: string;
          source: Database["public"]["Enums"]["webhook_event_source"];
          status: Database["public"]["Enums"]["webhook_event_status"];
          tenant_id: string | null;
        };
        Insert: {
          error?: string | null;
          external_id: string;
          id?: string;
          payload: Json;
          processed_at?: string | null;
          received_at?: string;
          source: Database["public"]["Enums"]["webhook_event_source"];
          status?: Database["public"]["Enums"]["webhook_event_status"];
          tenant_id?: string | null;
        };
        Update: {
          error?: string | null;
          external_id?: string;
          id?: string;
          payload?: Json;
          processed_at?: string | null;
          received_at?: string;
          source?: Database["public"]["Enums"]["webhook_event_source"];
          status?: Database["public"]["Enums"]["webhook_event_status"];
          tenant_id?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      accept_my_invitations: {
        Args: never;
        Returns: {
          role: Database["public"]["Enums"]["tenant_role"];
          tenant_id: string;
        }[];
      };
      create_tenant: {
        Args: { p_name: string; p_segment?: string; p_slug: string };
        Returns: string;
      };
      invite_member: {
        Args: {
          p_email: string;
          p_role?: Database["public"]["Enums"]["tenant_role"];
          p_tenant_id: string;
        };
        Returns: string;
      };
      is_platform_admin: { Args: never; Returns: boolean };
      is_tenant_admin: { Args: { t: string }; Returns: boolean };
      is_tenant_member: { Args: { t: string }; Returns: boolean };
      list_tenant_members: {
        Args: { p_tenant_id: string };
        Returns: {
          accepted_at: string;
          email: string;
          full_name: string;
          invited_at: string;
          role: Database["public"]["Enums"]["tenant_role"];
          user_id: string;
        }[];
      };
      revoke_invitation: {
        Args: { p_invitation_id: string };
        Returns: undefined;
      };
      set_tenant_wa_config: {
        Args: {
          p_display_name: string;
          p_phone_e164: string;
          p_phone_number_id: string;
          p_provider?: string;
          p_system_user_token: string;
          p_tenant_id: string;
          p_verify_token: string;
          p_waba_id: string;
        };
        Returns: string;
      };
    };
    Enums: {
      conversation_state: "lena" | "human" | "paused";
      invitation_status: "pending" | "accepted" | "revoked";
      message_direction: "in" | "out";
      message_kind:
        | "text"
        | "image"
        | "audio"
        | "video"
        | "document"
        | "sticker"
        | "location"
        | "contact"
        | "template"
        | "system";
      tenant_role: "admin" | "operador";
      tenant_status: "active" | "paused" | "archived";
      tenant_tone: "Acolhedor" | "Profissional" | "Descontraído";
      wa_number_status: "connected" | "pending" | "disconnected";
      wa_quality_rating: "unknown" | "green" | "yellow" | "red";
      wa_template_category: "utility" | "authentication" | "marketing";
      wa_template_status:
        | "draft"
        | "submitted"
        | "approved"
        | "rejected"
        | "paused"
        | "disabled";
      webhook_event_source: "whatsapp" | "asaas" | "gcal" | "other";
      webhook_event_status: "received" | "processed" | "failed";
    };
    CompositeTypes: Record<string, never>;
  };
};

export const Constants = {
  public: {
    Enums: {
      conversation_state: ["lena", "human", "paused"],
      invitation_status: ["pending", "accepted", "revoked"],
      message_direction: ["in", "out"],
      message_kind: [
        "text",
        "image",
        "audio",
        "video",
        "document",
        "sticker",
        "location",
        "contact",
        "template",
        "system",
      ],
      tenant_role: ["admin", "operador"],
      tenant_status: ["active", "paused", "archived"],
      tenant_tone: ["Acolhedor", "Profissional", "Descontraído"],
      wa_number_status: ["connected", "pending", "disconnected"],
      wa_quality_rating: ["unknown", "green", "yellow", "red"],
      wa_template_category: ["utility", "authentication", "marketing"],
      wa_template_status: [
        "draft",
        "submitted",
        "approved",
        "rejected",
        "paused",
        "disabled",
      ],
      webhook_event_source: ["whatsapp", "asaas", "gcal", "other"],
      webhook_event_status: ["received", "processed", "failed"],
    },
  },
} as const;
