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
      ambulances: {
        Row: {
          ambulance_type: string
          created_at: string
          crew: string | null
          current_latitude: number
          current_longitude: number
          driver_name: string
          id: string
          status: Database["public"]["Enums"]["ambulance_status"]
          vehicle_number: string
        }
        Insert: {
          ambulance_type?: string
          created_at?: string
          crew?: string | null
          current_latitude: number
          current_longitude: number
          driver_name: string
          id?: string
          status?: Database["public"]["Enums"]["ambulance_status"]
          vehicle_number: string
        }
        Update: {
          ambulance_type?: string
          created_at?: string
          crew?: string | null
          current_latitude?: number
          current_longitude?: number
          driver_name?: string
          id?: string
          status?: Database["public"]["Enums"]["ambulance_status"]
          vehicle_number?: string
        }
        Relationships: []
      }
      doctors: {
        Row: {
          availability_status: Database["public"]["Enums"]["doctor_availability"]
          created_at: string
          hospital_id: string
          id: string
          name: string
          shift_end: string | null
          shift_start: string | null
          specialization: string
        }
        Insert: {
          availability_status?: Database["public"]["Enums"]["doctor_availability"]
          created_at?: string
          hospital_id: string
          id?: string
          name: string
          shift_end?: string | null
          shift_start?: string | null
          specialization: string
        }
        Update: {
          availability_status?: Database["public"]["Enums"]["doctor_availability"]
          created_at?: string
          hospital_id?: string
          id?: string
          name?: string
          shift_end?: string | null
          shift_start?: string | null
          specialization?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctors_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_requests: {
        Row: {
          assigned_ambulance_id: string | null
          assigned_hospital_id: string | null
          condition_type: string
          created_at: string
          eta: string | null
          id: string
          patient_id: string | null
          pickup_address: string | null
          pickup_latitude: number
          pickup_longitude: number
          resolved_at: string | null
          severity: string
          status: Database["public"]["Enums"]["emergency_status"]
        }
        Insert: {
          assigned_ambulance_id?: string | null
          assigned_hospital_id?: string | null
          condition_type: string
          created_at?: string
          eta?: string | null
          id?: string
          patient_id?: string | null
          pickup_address?: string | null
          pickup_latitude: number
          pickup_longitude: number
          resolved_at?: string | null
          severity?: string
          status?: Database["public"]["Enums"]["emergency_status"]
        }
        Update: {
          assigned_ambulance_id?: string | null
          assigned_hospital_id?: string | null
          condition_type?: string
          created_at?: string
          eta?: string | null
          id?: string
          patient_id?: string | null
          pickup_address?: string | null
          pickup_latitude?: number
          pickup_longitude?: number
          resolved_at?: string | null
          severity?: string
          status?: Database["public"]["Enums"]["emergency_status"]
        }
        Relationships: [
          {
            foreignKeyName: "emergency_requests_assigned_ambulance_id_fkey"
            columns: ["assigned_ambulance_id"]
            isOneToOne: false
            referencedRelation: "ambulances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_requests_assigned_hospital_id_fkey"
            columns: ["assigned_hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_requests_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      hospital_resources: {
        Row: {
          emergency_beds_available: number
          emergency_beds_total: number
          general_beds_available: number
          general_beds_total: number
          hospital_id: string
          icu_beds_available: number
          icu_beds_total: number
          id: string
          last_updated: string
          ventilators_available: number
          ventilators_total: number
        }
        Insert: {
          emergency_beds_available?: number
          emergency_beds_total?: number
          general_beds_available?: number
          general_beds_total?: number
          hospital_id: string
          icu_beds_available?: number
          icu_beds_total?: number
          id?: string
          last_updated?: string
          ventilators_available?: number
          ventilators_total?: number
        }
        Update: {
          emergency_beds_available?: number
          emergency_beds_total?: number
          general_beds_available?: number
          general_beds_total?: number
          hospital_id?: string
          icu_beds_available?: number
          icu_beds_total?: number
          id?: string
          last_updated?: string
          ventilators_available?: number
          ventilators_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "hospital_resources_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: true
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      hospitals: {
        Row: {
          address: string
          city: string
          contact_number: string | null
          created_at: string
          id: string
          latitude: number
          longitude: number
          name: string
          rating: number | null
          specialization: string[] | null
          status: string
        }
        Insert: {
          address: string
          city?: string
          contact_number?: string | null
          created_at?: string
          id?: string
          latitude: number
          longitude: number
          name: string
          rating?: number | null
          specialization?: string[] | null
          status?: string
        }
        Update: {
          address?: string
          city?: string
          contact_number?: string | null
          created_at?: string
          id?: string
          latitude?: number
          longitude?: number
          name?: string
          rating?: number | null
          specialization?: string[] | null
          status?: string
        }
        Relationships: []
      }
      patients: {
        Row: {
          address: string | null
          age: number | null
          allergies: string[] | null
          blood_group: string | null
          created_at: string
          diseases: string[] | null
          emergency_contact: string | null
          gender: string | null
          id: string
          medications: string[] | null
          name: string
          phone: string | null
          previous_surgeries: string[] | null
        }
        Insert: {
          address?: string | null
          age?: number | null
          allergies?: string[] | null
          blood_group?: string | null
          created_at?: string
          diseases?: string[] | null
          emergency_contact?: string | null
          gender?: string | null
          id?: string
          medications?: string[] | null
          name: string
          phone?: string | null
          previous_surgeries?: string[] | null
        }
        Update: {
          address?: string | null
          age?: number | null
          allergies?: string[] | null
          blood_group?: string | null
          created_at?: string
          diseases?: string[] | null
          emergency_contact?: string | null
          gender?: string | null
          id?: string
          medications?: string[] | null
          name?: string
          phone?: string | null
          previous_surgeries?: string[] | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          ambulance_id: string | null
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          hospital_id: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          ambulance_id?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          hospital_id?: string | null
          id: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          ambulance_id?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          hospital_id?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_ambulance_id_fkey"
            columns: ["ambulance_id"]
            isOneToOne: false
            referencedRelation: "ambulances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      routes: {
        Row: {
          ai_score: number | null
          created_at: string
          distance_km: number
          emergency_id: string
          estimated_time: number
          hospital_id: string
          id: string
          traffic_level: Database["public"]["Enums"]["traffic_level"]
        }
        Insert: {
          ai_score?: number | null
          created_at?: string
          distance_km: number
          emergency_id: string
          estimated_time: number
          hospital_id: string
          id?: string
          traffic_level?: Database["public"]["Enums"]["traffic_level"]
        }
        Update: {
          ai_score?: number | null
          created_at?: string
          distance_km?: number
          emergency_id?: string
          estimated_time?: number
          hospital_id?: string
          id?: string
          traffic_level?: Database["public"]["Enums"]["traffic_level"]
        }
        Relationships: [
          {
            foreignKeyName: "routes_emergency_id_fkey"
            columns: ["emergency_id"]
            isOneToOne: false
            referencedRelation: "emergency_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routes_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
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
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      find_hospitals_in_radius: {
        Args: { p_lat: number; p_lng: number; p_radius_km?: number }
        Returns: {
          distance_km: number
          er_available: number
          hospital_id: string
          hospital_name: string
          hospital_status: string
          icu_available: number
          specialization: string[]
          ventilators_available: number
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
      ambulance_status: "available" | "on_route" | "busy"
      app_role: "admin" | "hospital" | "ambulance" | "doctor"
      doctor_availability: "available" | "on_duty" | "off_duty" | "on_leave"
      emergency_status:
        | "new"
        | "dispatched"
        | "in_transit"
        | "arrived"
        | "resolved"
        | "cancelled"
      traffic_level: "low" | "moderate" | "heavy" | "blocked"
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
      ambulance_status: ["available", "on_route", "busy"],
      app_role: ["admin", "hospital", "ambulance", "doctor"],
      doctor_availability: ["available", "on_duty", "off_duty", "on_leave"],
      emergency_status: [
        "new",
        "dispatched",
        "in_transit",
        "arrived",
        "resolved",
        "cancelled",
      ],
      traffic_level: ["low", "moderate", "heavy", "blocked"],
    },
  },
} as const
