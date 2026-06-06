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
        Relationships: [
          {
            foreignKeyName: "tenant_members_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tenant_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
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
    };
    CompositeTypes: Record<string, never>;
  };
};

export const Constants = {
  public: {
    Enums: {
      tenant_role: ["admin", "operador"],
      tenant_status: ["active", "paused", "archived"],
    },
  },
} as const;
