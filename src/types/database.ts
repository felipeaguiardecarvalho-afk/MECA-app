/**
 * Supabase / Postgres schema types for the MECA project.
 * Keep in sync with supabase/migrations/0001_meca_full_schema.sql
 *
 * Note: Only include keys required by @supabase/supabase-js GenericSchema for `public`
 * (Tables, Views, Functions) so Schema inference is not `never`.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      access_codes: {
        Row: {
          id: string;
          code: string;
          is_active: boolean;
          expires_at: string | null;
          usage_limit: number | null;
          used_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          is_active?: boolean;
          expires_at?: string | null;
          usage_limit?: number | null;
          used_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          is_active?: boolean;
          expires_at?: string | null;
          usage_limit?: number | null;
          used_count?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      access_grants: {
        Row: {
          id: string;
          user_id: string;
          code: string;
          created_at: string;
          can_take_diagnostic: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          code: string;
          created_at?: string;
          can_take_diagnostic?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          code?: string;
          created_at?: string;
          can_take_diagnostic?: boolean;
        };
        Relationships: [];
      };
      admin_audit_logs: {
        Row: {
          id: string;
          action: string;
          admin_user_id: string;
          admin_email: string;
          target_user_id: string | null;
          target_user_email: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          action: string;
          admin_user_id: string;
          admin_email: string;
          target_user_id?: string | null;
          target_user_email?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          action?: string;
          admin_user_id?: string;
          admin_email?: string;
          target_user_id?: string | null;
          target_user_email?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      responses: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
          answers: Json;
          mentalidade: number;
          engajamento: number;
          cultura: number;
          performance: number;
          direction: number;
          capacity: number;
          archetype: string;
          is_admin: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          created_at?: string;
          answers: Json;
          mentalidade: number;
          engajamento: number;
          cultura: number;
          performance: number;
          direction: number;
          capacity: number;
          archetype: string;
          is_admin?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          created_at?: string;
          answers?: Json;
          mentalidade?: number;
          engajamento?: number;
          cultura?: number;
          performance?: number;
          direction?: number;
          capacity?: number;
          archetype?: string;
          is_admin?: boolean;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      meca_email_login_phase: {
        Args: { p_email: string };
        Returns: string;
      };
      validate_access_code: {
        Args: { p_code: string };
        Returns: unknown;
      };
    };
  };
};
