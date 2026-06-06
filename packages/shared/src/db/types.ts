// AUTO-GERADO por mcp__supabase__generate_typescript_types (project lena-uno).
// Re-gerar quando houver mudança de schema:
//   npx supabase gen types typescript --project-id tirvnwsiokivrswdthge > packages/shared/src/db/types.ts
// (ou via MCP no Claude Code)
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
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
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
    };
    Views: Record<string, never>;
    Functions: {
      create_tenant: {
        Args: { p_name: string; p_segment?: string; p_slug: string };
        Returns: string;
      };
      is_platform_admin: { Args: never; Returns: boolean };
      is_tenant_admin: { Args: { t: string }; Returns: boolean };
      is_tenant_member: { Args: { t: string }; Returns: boolean };
    };
    Enums: {
      tenant_role: "admin" | "operador";
      tenant_status: "active" | "paused" | "archived";
      tenant_tone: "Acolhedor" | "Profissional" | "Descontraído";
    };
    CompositeTypes: Record<string, never>;
  };
};

export const Constants = {
  public: {
    Enums: {
      tenant_role: ["admin", "operador"],
      tenant_status: ["active", "paused", "archived"],
      tenant_tone: ["Acolhedor", "Profissional", "Descontraído"],
    },
  },
} as const;
