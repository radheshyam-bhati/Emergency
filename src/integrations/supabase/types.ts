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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      alerts: {
        Row: {
          ai_explanation: string | null
          alert_number: string
          alert_type: string
          created_at: string
          description: string | null
          entity_id: string | null
          entity_name: string
          id: string
          resolved_at: string | null
          risk_level: string
          status: string
        }
        Insert: {
          ai_explanation?: string | null
          alert_number: string
          alert_type: string
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_name: string
          id?: string
          resolved_at?: string | null
          risk_level?: string
          status?: string
        }
        Update: {
          ai_explanation?: string | null
          alert_number?: string
          alert_type?: string
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_name?: string
          id?: string
          resolved_at?: string | null
          risk_level?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      cases: {
        Row: {
          assigned_to: string | null
          case_number: string
          created_at: string
          created_by: string | null
          description: string | null
          entity_id: string | null
          id: string
          priority: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          case_number: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          entity_id?: string | null
          id?: string
          priority?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          case_number?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          entity_id?: string | null
          id?: string
          priority?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cases_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      entities: {
        Row: {
          bods_statement_id: string | null
          country_risk_score: number | null
          created_at: string
          created_by: string | null
          entity_type: string
          id: string
          jurisdiction: string | null
          metadata: Json | null
          name: string
          pep_status: string | null
          risk_score: number | null
          sanctions_status: string | null
          source_documents: string[] | null
          updated_at: string
          verification_result: Json | null
          verification_status: string
        }
        Insert: {
          bods_statement_id?: string | null
          country_risk_score?: number | null
          created_at?: string
          created_by?: string | null
          entity_type?: string
          id?: string
          jurisdiction?: string | null
          metadata?: Json | null
          name: string
          pep_status?: string | null
          risk_score?: number | null
          sanctions_status?: string | null
          source_documents?: string[] | null
          updated_at?: string
          verification_result?: Json | null
          verification_status?: string
        }
        Update: {
          bods_statement_id?: string | null
          country_risk_score?: number | null
          created_at?: string
          created_by?: string | null
          entity_type?: string
          id?: string
          jurisdiction?: string | null
          metadata?: Json | null
          name?: string
          pep_status?: string | null
          risk_score?: number | null
          sanctions_status?: string | null
          source_documents?: string[] | null
          updated_at?: string
          verification_result?: Json | null
          verification_status?: string
        }
        Relationships: []
      }
      entity_relationships: {
        Row: {
          confidence_score: number | null
          created_at: string
          id: string
          is_active: boolean
          metadata: Json | null
          ownership_percentage: number | null
          relationship_type: string
          source: string | null
          source_entity_id: string
          target_entity_id: string
          valid_from: string | null
          valid_to: string | null
          verification_status: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          metadata?: Json | null
          ownership_percentage?: number | null
          relationship_type: string
          source?: string | null
          source_entity_id: string
          target_entity_id: string
          valid_from?: string | null
          valid_to?: string | null
          verification_status?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          metadata?: Json | null
          ownership_percentage?: number | null
          relationship_type?: string
          source?: string | null
          source_entity_id?: string
          target_entity_id?: string
          valid_from?: string | null
          valid_to?: string | null
          verification_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entity_relationships_source_entity_id_fkey"
            columns: ["source_entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_relationships_target_entity_id_fkey"
            columns: ["target_entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          agents_used: string[] | null
          ai_summary: string | null
          confidence: number | null
          content: string | null
          created_at: string
          created_by: string | null
          entity_id: string | null
          findings_count: number | null
          id: string
          report_number: string
          report_type: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          agents_used?: string[] | null
          ai_summary?: string | null
          confidence?: number | null
          content?: string | null
          created_at?: string
          created_by?: string | null
          entity_id?: string | null
          findings_count?: number | null
          id?: string
          report_number: string
          report_type?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          agents_used?: string[] | null
          ai_summary?: string | null
          confidence?: number | null
          content?: string | null
          created_at?: string
          created_by?: string | null
          entity_id?: string | null
          findings_count?: number | null
          id?: string
          report_number?: string
          report_type?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      ubo_results: {
        Row: {
          beneficial_owner_id: string | null
          control_type: string | null
          created_at: string
          created_by: string | null
          detection_method: string | null
          id: string
          is_ubo: boolean
          ownership_chain: Json
          root_entity_id: string
          total_ownership_pct: number
          verification_details: Json | null
          verified: boolean
        }
        Insert: {
          beneficial_owner_id?: string | null
          control_type?: string | null
          created_at?: string
          created_by?: string | null
          detection_method?: string | null
          id?: string
          is_ubo?: boolean
          ownership_chain?: Json
          root_entity_id: string
          total_ownership_pct?: number
          verification_details?: Json | null
          verified?: boolean
        }
        Update: {
          beneficial_owner_id?: string | null
          control_type?: string | null
          created_at?: string
          created_by?: string | null
          detection_method?: string | null
          id?: string
          is_ubo?: boolean
          ownership_chain?: Json
          root_entity_id?: string
          total_ownership_pct?: number
          verification_details?: Json | null
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "ubo_results_beneficial_owner_id_fkey"
            columns: ["beneficial_owner_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ubo_results_root_entity_id_fkey"
            columns: ["root_entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      verification_log: {
        Row: {
          agent_outputs: Json | null
          constraints_checked: Json | null
          constraints_satisfied: Json | null
          constraints_violated: Json | null
          created_at: string
          created_by: string | null
          entity_id: string | null
          id: string
          reasoning_trace: string | null
          status: string
          verification_type: string
        }
        Insert: {
          agent_outputs?: Json | null
          constraints_checked?: Json | null
          constraints_satisfied?: Json | null
          constraints_violated?: Json | null
          created_at?: string
          created_by?: string | null
          entity_id?: string | null
          id?: string
          reasoning_trace?: string | null
          status?: string
          verification_type: string
        }
        Update: {
          agent_outputs?: Json | null
          constraints_checked?: Json | null
          constraints_satisfied?: Json | null
          constraints_violated?: Json | null
          created_at?: string
          created_by?: string | null
          entity_id?: string | null
          id?: string
          reasoning_trace?: string | null
          status?: string
          verification_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_log_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_ownership_graph: {
        Args: { max_depth?: number; root_entity_id: string }
        Returns: {
          depth: number
          ownership_percentage: number
          relationship_type: string
          source_id: string
          source_name: string
          source_type: string
          target_id: string
          target_name: string
          target_type: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "analyst" | "regulator"
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
      app_role: ["admin", "analyst", "regulator"],
    },
  },
} as const
