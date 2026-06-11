export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_usage: {
        Row: {
          conversation_id: string | null
          cost_micro_usd: number
          id: string
          input_tokens: number
          message_id: string | null
          meta: Json
          model: string
          occurred_at: string
          output_tokens: number
          tenant_id: string
        }
        Insert: {
          conversation_id?: string | null
          cost_micro_usd?: number
          id?: string
          input_tokens?: number
          message_id?: string | null
          meta?: Json
          model: string
          occurred_at?: string
          output_tokens?: number
          tenant_id: string
        }
        Update: {
          conversation_id?: string | null
          cost_micro_usd?: number
          id?: string
          input_tokens?: number
          message_id?: string | null
          meta?: Json
          model?: string
          occurred_at?: string
          output_tokens?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversation_effort"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_usage_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_usage_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_usage_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          contact_id: string | null
          conversation_id: string | null
          created_at: string
          customer_name: string | null
          ends_at: string
          id: string
          notes: string | null
          origin: Database["public"]["Enums"]["appointment_origin"]
          reminder_sent_at: string | null
          reschedule_requested_at: string | null
          service_id: string | null
          staff_id: string | null
          starts_at: string
          status: Database["public"]["Enums"]["appointment_status"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          contact_id?: string | null
          conversation_id?: string | null
          created_at?: string
          customer_name?: string | null
          ends_at: string
          id?: string
          notes?: string | null
          origin?: Database["public"]["Enums"]["appointment_origin"]
          reminder_sent_at?: string | null
          reschedule_requested_at?: string | null
          service_id?: string | null
          staff_id?: string | null
          starts_at: string
          status?: Database["public"]["Enums"]["appointment_status"]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          contact_id?: string | null
          conversation_id?: string | null
          created_at?: string
          customer_name?: string | null
          ends_at?: string
          id?: string
          notes?: string | null
          origin?: Database["public"]["Enums"]["appointment_origin"]
          reminder_sent_at?: string | null
          reschedule_requested_at?: string | null
          service_id?: string | null
          staff_id?: string | null
          starts_at?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversation_effort"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "tenant_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "tenant_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          created_at: string
          id: string
          name: string | null
          notes: string | null
          opted_out: boolean
          phone_e164: string
          tags: string[]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string | null
          notes?: string | null
          opted_out?: boolean
          phone_e164: string
          tags?: string[]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string | null
          notes?: string | null
          opted_out?: boolean
          phone_e164?: string
          tags?: string[]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_tags: {
        Row: {
          conversation_id: string
          created_at: string
          tag_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          tag_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_tags_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversation_effort"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_tags_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tenant_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          archived_at: string | null
          assigned_to: string | null
          channel: string
          classified_at: string | null
          closed_at: string | null
          contact_id: string
          id: string
          intent: string | null
          last_message_at: string | null
          lifecycle: Database["public"]["Enums"]["conversation_lifecycle"]
          opened_at: string
          resolved_at: string | null
          sentiment: string | null
          state: Database["public"]["Enums"]["conversation_state"]
          tenant_id: string
        }
        Insert: {
          archived_at?: string | null
          assigned_to?: string | null
          channel?: string
          classified_at?: string | null
          closed_at?: string | null
          contact_id: string
          id?: string
          intent?: string | null
          last_message_at?: string | null
          lifecycle?: Database["public"]["Enums"]["conversation_lifecycle"]
          opened_at?: string
          resolved_at?: string | null
          sentiment?: string | null
          state?: Database["public"]["Enums"]["conversation_state"]
          tenant_id: string
        }
        Update: {
          archived_at?: string | null
          assigned_to?: string | null
          channel?: string
          classified_at?: string | null
          closed_at?: string | null
          contact_id?: string
          id?: string
          intent?: string | null
          last_message_at?: string | null
          lifecycle?: Database["public"]["Enums"]["conversation_lifecycle"]
          opened_at?: string
          resolved_at?: string | null
          sentiment?: string | null
          state?: Database["public"]["Enums"]["conversation_state"]
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      lgpd_requests: {
        Row: {
          completed_at: string | null
          contact_id: string | null
          id: string
          kind: string
          notes: string | null
          requested_at: string
          status: string
          tenant_id: string
        }
        Insert: {
          completed_at?: string | null
          contact_id?: string | null
          id?: string
          kind: string
          notes?: string | null
          requested_at?: string
          status?: string
          tenant_id: string
        }
        Update: {
          completed_at?: string | null
          contact_id?: string | null
          id?: string
          kind?: string
          notes?: string | null
          requested_at?: string
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lgpd_requests_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lgpd_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string | null
          conversation_id: string
          created_at: string
          direction: Database["public"]["Enums"]["message_direction"]
          id: string
          kind: Database["public"]["Enums"]["message_kind"]
          meta: Json
          sent_by_user_id: string | null
          tenant_id: string
          wa_message_id: string | null
        }
        Insert: {
          body?: string | null
          conversation_id: string
          created_at?: string
          direction: Database["public"]["Enums"]["message_direction"]
          id?: string
          kind?: Database["public"]["Enums"]["message_kind"]
          meta?: Json
          sent_by_user_id?: string | null
          tenant_id: string
          wa_message_id?: string | null
        }
        Update: {
          body?: string | null
          conversation_id?: string
          created_at?: string
          direction?: Database["public"]["Enums"]["message_direction"]
          id?: string
          kind?: Database["public"]["Enums"]["message_kind"]
          meta?: Json
          sent_by_user_id?: string | null
          tenant_id?: string
          wa_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversation_effort"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sent_by_user_id_fkey"
            columns: ["sent_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ops_alerts: {
        Row: {
          kind: string
          last_sent_at: string
        }
        Insert: {
          kind: string
          last_sent_at?: string
        }
        Update: {
          kind?: string
          last_sent_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          is_platform_admin: boolean
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          is_platform_admin?: boolean
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_platform_admin?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      prospects: {
        Row: {
          bairros: string | null
          coletado_em: string | null
          created_at: string
          emails: string[]
          facebook: string | null
          fonte: string | null
          funil: Database["public"]["Enums"]["prospect_funil"]
          funil_changed_at: string
          id: string
          instagram: string | null
          linkedin: string | null
          nome: string
          notas: string | null
          observacao: string | null
          segmento: string
          telefones: string[]
          tiktok: string | null
          updated_at: string
          website: string | null
          whatsapp_url: string | null
          whatsapps: string[]
        }
        Insert: {
          bairros?: string | null
          coletado_em?: string | null
          created_at?: string
          emails?: string[]
          facebook?: string | null
          fonte?: string | null
          funil?: Database["public"]["Enums"]["prospect_funil"]
          funil_changed_at?: string
          id?: string
          instagram?: string | null
          linkedin?: string | null
          nome: string
          notas?: string | null
          observacao?: string | null
          segmento: string
          telefones?: string[]
          tiktok?: string | null
          updated_at?: string
          website?: string | null
          whatsapp_url?: string | null
          whatsapps?: string[]
        }
        Update: {
          bairros?: string | null
          coletado_em?: string | null
          created_at?: string
          emails?: string[]
          facebook?: string | null
          fonte?: string | null
          funil?: Database["public"]["Enums"]["prospect_funil"]
          funil_changed_at?: string
          id?: string
          instagram?: string | null
          linkedin?: string | null
          nome?: string
          notas?: string | null
          observacao?: string | null
          segmento?: string
          telefones?: string[]
          tiktok?: string | null
          updated_at?: string
          website?: string | null
          whatsapp_url?: string | null
          whatsapps?: string[]
        }
        Relationships: []
      }
      tenant_availability: {
        Row: {
          active: boolean
          created_at: string
          end_minute: number
          id: string
          slot_minutes: number
          start_minute: number
          tenant_id: string
          weekday: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          end_minute: number
          id?: string
          slot_minutes?: number
          start_minute: number
          tenant_id: string
          weekday: number
        }
        Update: {
          active?: boolean
          created_at?: string
          end_minute?: number
          id?: string
          slot_minutes?: number
          start_minute?: number
          tenant_id?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "tenant_availability_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_brains: {
        Row: {
          address: string | null
          ai_model: string
          business_name: string
          convenios: Json
          escalation_rules: Json
          escalation_triggers: string[]
          extras: string | null
          hours: string | null
          landmark: string | null
          parking: string | null
          payments: Json
          promo: string | null
          restrictions: string | null
          segment: string
          team_private: string | null
          team_public: Json
          tenant_id: string
          tone: Database["public"]["Enums"]["tenant_tone"]
          updated_at: string
          version: number
        }
        Insert: {
          address?: string | null
          ai_model?: string
          business_name: string
          convenios?: Json
          escalation_rules?: Json
          escalation_triggers?: string[]
          extras?: string | null
          hours?: string | null
          landmark?: string | null
          parking?: string | null
          payments?: Json
          promo?: string | null
          restrictions?: string | null
          segment: string
          team_private?: string | null
          team_public?: Json
          tenant_id: string
          tone?: Database["public"]["Enums"]["tenant_tone"]
          updated_at?: string
          version?: number
        }
        Update: {
          address?: string | null
          ai_model?: string
          business_name?: string
          convenios?: Json
          escalation_rules?: Json
          escalation_triggers?: string[]
          extras?: string | null
          hours?: string | null
          landmark?: string | null
          parking?: string | null
          payments?: Json
          promo?: string | null
          restrictions?: string | null
          segment?: string
          team_private?: string | null
          team_public?: Json
          tenant_id?: string
          tone?: Database["public"]["Enums"]["tenant_tone"]
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "tenant_brains_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_combo_items: {
        Row: {
          combo_id: string
          id: string
          position: number
          qty: number
          service_id: string
          tenant_id: string
        }
        Insert: {
          combo_id: string
          id?: string
          position?: number
          qty?: number
          service_id: string
          tenant_id: string
        }
        Update: {
          combo_id?: string
          id?: string
          position?: number
          qty?: number
          service_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_combo_items_combo_id_fkey"
            columns: ["combo_id"]
            isOneToOne: false
            referencedRelation: "tenant_combos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_combo_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "tenant_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_combo_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_combos: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          discount_pct: number | null
          id: string
          kind: Database["public"]["Enums"]["combo_kind"]
          name: string
          position: number
          price_cents: number | null
          tenant_id: string
          trigger_service_id: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          discount_pct?: number | null
          id?: string
          kind: Database["public"]["Enums"]["combo_kind"]
          name: string
          position?: number
          price_cents?: number | null
          tenant_id: string
          trigger_service_id?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          discount_pct?: number | null
          id?: string
          kind?: Database["public"]["Enums"]["combo_kind"]
          name?: string
          position?: number
          price_cents?: number | null
          tenant_id?: string
          trigger_service_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_combos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_combos_trigger_service_id_fkey"
            columns: ["trigger_service_id"]
            isOneToOne: false
            referencedRelation: "tenant_services"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_faqs: {
        Row: {
          active: boolean
          answer: string
          created_at: string
          id: string
          position: number
          question: string
          tags: string[]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          answer: string
          created_at?: string
          id?: string
          position?: number
          question: string
          tags?: string[]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          answer?: string
          created_at?: string
          id?: string
          position?: number
          question?: string
          tags?: string[]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_faqs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_invitations: {
        Row: {
          accepted_at: string | null
          email: string
          id: string
          invited_at: string
          invited_by: string | null
          role: Database["public"]["Enums"]["tenant_role"]
          status: Database["public"]["Enums"]["invitation_status"]
          tenant_id: string
        }
        Insert: {
          accepted_at?: string | null
          email: string
          id?: string
          invited_at?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["tenant_role"]
          status?: Database["public"]["Enums"]["invitation_status"]
          tenant_id: string
        }
        Update: {
          accepted_at?: string | null
          email?: string
          id?: string
          invited_at?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["tenant_role"]
          status?: Database["public"]["Enums"]["invitation_status"]
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_invitations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_members: {
        Row: {
          accepted_at: string | null
          id: string
          invited_at: string
          role: Database["public"]["Enums"]["tenant_role"]
          tenant_id: string
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          id?: string
          invited_at?: string
          role?: Database["public"]["Enums"]["tenant_role"]
          tenant_id: string
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          id?: string
          invited_at?: string
          role?: Database["public"]["Enums"]["tenant_role"]
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_members_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_notes: {
        Row: {
          author_id: string | null
          body: string
          created_at: string
          id: string
          tenant_id: string
        }
        Insert: {
          author_id?: string | null
          body: string
          created_at?: string
          id?: string
          tenant_id: string
        }
        Update: {
          author_id?: string | null
          body?: string
          created_at?: string
          id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_notes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_secrets: {
        Row: {
          created_at: string
          id: string
          kind: string
          meta: Json
          tenant_id: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          meta?: Json
          tenant_id: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          meta?: Json
          tenant_id?: string
          updated_at?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_secrets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_service_categories: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          parent_id: string | null
          position: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
          position?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
          position?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_service_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "tenant_service_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_service_categories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_services: {
        Row: {
          active: boolean
          aftercare_instructions: string | null
          category_id: string | null
          created_at: string
          default_sessions: number
          description: string | null
          duration_min: number | null
          id: string
          is_upsell: boolean
          max_parallel: number
          name: string
          position: number
          prep_instructions: string | null
          price_cents: number | null
          session_interval_days: number | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          aftercare_instructions?: string | null
          category_id?: string | null
          created_at?: string
          default_sessions?: number
          description?: string | null
          duration_min?: number | null
          id?: string
          is_upsell?: boolean
          max_parallel?: number
          name: string
          position?: number
          prep_instructions?: string | null
          price_cents?: number | null
          session_interval_days?: number | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          aftercare_instructions?: string | null
          category_id?: string | null
          created_at?: string
          default_sessions?: number
          description?: string | null
          duration_min?: number | null
          id?: string
          is_upsell?: boolean
          max_parallel?: number
          name?: string
          position?: number
          prep_instructions?: string | null
          price_cents?: number | null
          session_interval_days?: number | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "tenant_service_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_services_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_staff: {
        Row: {
          active: boolean
          color: string
          created_at: string
          id: string
          name: string
          position: number
          role: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          color?: string
          created_at?: string
          id?: string
          name: string
          position?: number
          role?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          color?: string
          created_at?: string
          id?: string
          name?: string
          position?: number
          role?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_staff_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_tags: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          tenant_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          tenant_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_tags_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          name: string
          segment: string
          slug: string
          status: Database["public"]["Enums"]["tenant_status"]
          timezone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          name: string
          segment?: string
          slug: string
          status?: Database["public"]["Enums"]["tenant_status"]
          timezone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          name?: string
          segment?: string
          slug?: string
          status?: Database["public"]["Enums"]["tenant_status"]
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      wa_numbers: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          last_health_check: string | null
          messaging_limit: string | null
          phone_e164: string
          phone_number_id: string
          provider: string
          quality_rating: Database["public"]["Enums"]["wa_quality_rating"]
          status: Database["public"]["Enums"]["wa_number_status"]
          tenant_id: string
          updated_at: string
          waba_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          last_health_check?: string | null
          messaging_limit?: string | null
          phone_e164: string
          phone_number_id: string
          provider?: string
          quality_rating?: Database["public"]["Enums"]["wa_quality_rating"]
          status?: Database["public"]["Enums"]["wa_number_status"]
          tenant_id: string
          updated_at?: string
          waba_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          last_health_check?: string | null
          messaging_limit?: string | null
          phone_e164?: string
          phone_number_id?: string
          provider?: string
          quality_rating?: Database["public"]["Enums"]["wa_quality_rating"]
          status?: Database["public"]["Enums"]["wa_number_status"]
          tenant_id?: string
          updated_at?: string
          waba_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wa_numbers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      wa_templates: {
        Row: {
          body: string
          category: Database["public"]["Enums"]["wa_template_category"]
          created_at: string
          id: string
          language: string
          meta_template_id: string | null
          name: string
          rejection_reason: string | null
          status: Database["public"]["Enums"]["wa_template_status"]
          tenant_id: string
          updated_at: string
          variables: string[]
        }
        Insert: {
          body: string
          category?: Database["public"]["Enums"]["wa_template_category"]
          created_at?: string
          id?: string
          language?: string
          meta_template_id?: string | null
          name: string
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["wa_template_status"]
          tenant_id: string
          updated_at?: string
          variables?: string[]
        }
        Update: {
          body?: string
          category?: Database["public"]["Enums"]["wa_template_category"]
          created_at?: string
          id?: string
          language?: string
          meta_template_id?: string | null
          name?: string
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["wa_template_status"]
          tenant_id?: string
          updated_at?: string
          variables?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "wa_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_events: {
        Row: {
          error: string | null
          external_id: string
          id: string
          payload: Json
          processed_at: string | null
          received_at: string
          source: Database["public"]["Enums"]["webhook_event_source"]
          status: Database["public"]["Enums"]["webhook_event_status"]
          tenant_id: string | null
        }
        Insert: {
          error?: string | null
          external_id: string
          id?: string
          payload: Json
          processed_at?: string | null
          received_at?: string
          source: Database["public"]["Enums"]["webhook_event_source"]
          status?: Database["public"]["Enums"]["webhook_event_status"]
          tenant_id?: string | null
        }
        Update: {
          error?: string | null
          external_id?: string
          id?: string
          payload?: Json
          processed_at?: string | null
          received_at?: string
          source?: Database["public"]["Enums"]["webhook_event_source"]
          status?: Database["public"]["Enums"]["webhook_event_status"]
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webhook_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      attendance_funnel: {
        Row: {
          agendamentos: number | null
          conversas: number | null
          hora_local: number | null
          tenant_id: string | null
          tipo: string | null
          transferencias: number | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_effort: {
        Row: {
          desfecho: string | null
          id: string | null
          intent: string | null
          opened_at: string | null
          sentiment: string | null
          tenant_id: string | null
          trocas_ate_desfecho: number | null
        }
        Insert: {
          desfecho?: never
          id?: string | null
          intent?: string | null
          opened_at?: string | null
          sentiment?: string | null
          tenant_id?: string | null
          trocas_ate_desfecho?: never
        }
        Update: {
          desfecho?: never
          id?: string | null
          intent?: string | null
          opened_at?: string | null
          sentiment?: string | null
          tenant_id?: string | null
          trocas_ate_desfecho?: never
        }
        Relationships: [
          {
            foreignKeyName: "conversations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      accept_my_invitations: {
        Args: never
        Returns: {
          role: Database["public"]["Enums"]["tenant_role"]
          tenant_id: string
        }[]
      }
      attendance_report: {
        Args: { p_days?: number; p_tenant_id: string }
        Returns: Json
      }
      book_appointment:
        | {
            Args: {
              p_contact_id?: string
              p_conversation_id?: string
              p_customer_name?: string
              p_duration_min: number
              p_notes?: string
              p_origin?: Database["public"]["Enums"]["appointment_origin"]
              p_service_id?: string
              p_starts_at: string
              p_tenant_id: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_contact_id?: string
              p_conversation_id?: string
              p_customer_name?: string
              p_duration_min: number
              p_notes?: string
              p_origin?: Database["public"]["Enums"]["appointment_origin"]
              p_service_id?: string
              p_staff_id?: string
              p_starts_at: string
              p_tenant_id: string
            }
            Returns: Json
          }
      cancel_appointment: {
        Args: { p_appointment_id: string; p_reason?: string }
        Returns: Json
      }
      conversation_housekeeping: { Args: never; Returns: undefined }
      create_tenant: {
        Args: { p_name: string; p_segment?: string; p_slug: string }
        Returns: string
      }
      dashboard_stats: {
        Args: { p_days?: number; p_tenant_id: string }
        Returns: Json
      }
      dispatch_conversation_classification: { Args: never; Returns: undefined }
      find_free_slots:
        | {
            Args: {
              p_duration_min?: number
              p_from: string
              p_limit?: number
              p_tenant_id: string
              p_to: string
            }
            Returns: {
              slot_end: string
              slot_start: string
            }[]
          }
        | {
            Args: {
              p_duration_min?: number
              p_from: string
              p_limit?: number
              p_staff_id?: string
              p_tenant_id: string
              p_to: string
            }
            Returns: {
              slot_end: string
              slot_start: string
            }[]
          }
      invite_member: {
        Args: {
          p_email: string
          p_role?: Database["public"]["Enums"]["tenant_role"]
          p_tenant_id: string
        }
        Returns: string
      }
      is_platform_admin: { Args: never; Returns: boolean }
      is_tenant_admin: { Args: { t: string }; Returns: boolean }
      is_tenant_member: { Args: { t: string }; Returns: boolean }
      list_tenant_members: {
        Args: { p_tenant_id: string }
        Returns: {
          accepted_at: string
          email: string
          full_name: string
          invited_at: string
          role: Database["public"]["Enums"]["tenant_role"]
          user_id: string
        }[]
      }
      platform_tenant_stats: {
        Args: { p_days?: number }
        Returns: {
          conversations_30d: number
          cost_micro_usd_30d: number
          last_message_at: string
          messages_30d: number
          tenant_id: string
        }[]
      }
      request_reschedule: { Args: { p_appointment_id: string }; Returns: Json }
      requeue_stuck_webhooks: { Args: never; Returns: undefined }
      revoke_invitation: {
        Args: { p_invitation_id: string }
        Returns: undefined
      }
      set_tenant_wa_config: {
        Args: {
          p_display_name: string
          p_phone_e164: string
          p_phone_number_id: string
          p_provider?: string
          p_system_user_token: string
          p_tenant_id: string
          p_verify_token: string
          p_waba_id: string
        }
        Returns: string
      }
    }
    Enums: {
      appointment_origin: "lena" | "operador" | "externo"
      appointment_status:
        | "booked"
        | "confirmed"
        | "cancelled"
        | "no_show"
        | "done"
      combo_kind: "pacote" | "condicional"
      conversation_lifecycle: "open" | "resolved" | "archived"
      conversation_state: "lena" | "human" | "paused"
      invitation_status: "pending" | "accepted" | "revoked"
      message_direction: "in" | "out"
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
        | "system"
      prospect_funil:
        | "novo"
        | "contatado"
        | "em_conversa"
        | "cliente"
        | "perdido"
      tenant_role: "admin" | "operador"
      tenant_status: "active" | "paused" | "archived"
      tenant_tone: "Acolhedor" | "Profissional" | "Descontraído"
      wa_number_status: "connected" | "pending" | "disconnected"
      wa_quality_rating: "unknown" | "green" | "yellow" | "red"
      wa_template_category: "utility" | "authentication" | "marketing"
      wa_template_status:
        | "draft"
        | "submitted"
        | "approved"
        | "rejected"
        | "paused"
        | "disabled"
      webhook_event_source: "whatsapp" | "asaas" | "gcal" | "other"
      webhook_event_status: "received" | "processed" | "failed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      appointment_origin: ["lena", "operador", "externo"],
      appointment_status: [
        "booked",
        "confirmed",
        "cancelled",
        "no_show",
        "done",
      ],
      combo_kind: ["pacote", "condicional"],
      conversation_lifecycle: ["open", "resolved", "archived"],
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
      prospect_funil: [
        "novo",
        "contatado",
        "em_conversa",
        "cliente",
        "perdido",
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
} as const
