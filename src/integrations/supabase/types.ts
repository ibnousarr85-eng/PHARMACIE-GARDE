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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      medicines: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          dosage: string | null
          form: string | null
          id: string
          name: string
          package: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          dosage?: string | null
          form?: string | null
          id?: string
          name: string
          package?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          dosage?: string | null
          form?: string | null
          id?: string
          name?: string
          package?: string | null
        }
        Relationships: []
      }
      pharmacies: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          id: string
          is_on_duty: boolean
          lat: number
          lng: number
          locality: string | null
          name: string
          on_duty_until: string | null
          opening_hours: string | null
          osm_id: string | null
          owner_id: string | null
          phone: string | null
          source: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          id?: string
          is_on_duty?: boolean
          lat: number
          lng: number
          locality?: string | null
          name: string
          on_duty_until?: string | null
          opening_hours?: string | null
          osm_id?: string | null
          owner_id?: string | null
          phone?: string | null
          source?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          id?: string
          is_on_duty?: boolean
          lat?: number
          lng?: number
          locality?: string | null
          name?: string
          on_duty_until?: string | null
          opening_hours?: string | null
          osm_id?: string | null
          owner_id?: string | null
          phone?: string | null
          source?: string
          updated_at?: string
        }
        Relationships: []
      }
      pharmacy_departments: {
        Row: {
          boundary: unknown
          boundary_geojson: string
          code: string
          department: string
          region: string
          source: string
        }
        Insert: {
          boundary?: unknown
          boundary_geojson: string
          code: string
          department: string
          region: string
          source?: string
        }
        Update: {
          boundary?: unknown
          boundary_geojson?: string
          code?: string
          department?: string
          region?: string
          source?: string
        }
        Relationships: []
      }
      pharmacy_requests: {
        Row: {
          address: string | null
          admin_note: string | null
          city: string | null
          contact_email: string | null
          created_at: string
          id: string
          lat: number | null
          lng: number | null
          message: string | null
          name: string | null
          opening_hours: string | null
          pharmacy_id: string | null
          phone: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          address?: string | null
          admin_note?: string | null
          city?: string | null
          contact_email?: string | null
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          message?: string | null
          name?: string | null
          opening_hours?: string | null
          pharmacy_id?: string | null
          phone?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
        }
        Update: {
          address?: string | null
          admin_note?: string | null
          city?: string | null
          contact_email?: string | null
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          message?: string | null
          name?: string | null
          opening_hours?: string | null
          pharmacy_id?: string | null
          phone?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pharmacy_requests_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
        ]
      }
      pharmacy_stock: {
        Row: {
          medicine_id: string
          pharmacy_id: string
          price_fcfa: number | null
          quantity: number
          updated_at: string
        }
        Insert: {
          medicine_id: string
          pharmacy_id: string
          price_fcfa?: number | null
          quantity?: number
          updated_at?: string
        }
        Update: {
          medicine_id?: string
          pharmacy_id?: string
          price_fcfa?: number | null
          quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pharmacy_stock_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacy_stock_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
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
      distance_km: {
        Args: { lat1: number; lat2: number; lng1: number; lng2: number }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      nearest_pharmacies: {
        Args: {
          p_lat: number
          p_limit?: number
          p_lng: number
          p_max_km?: number
          p_on_duty?: boolean
          p_search?: string
          p_with_phone?: boolean
        }
        Returns: {
          address: string
          city: string
          distance_km: number
          id: string
          lat: number
          lng: number
          locality: string
          name: string
          on_duty: boolean
          on_duty_until: string
          opening_hours: string
          phone: string
        }[]
      }
      nearest_pharmacies_filtered: {
        Args: {
          p_city?: string
          p_department?: string
          p_lat: number
          p_limit?: number
          p_lng: number
          p_max_km?: number
          p_on_duty?: boolean
          p_region?: string
          p_search?: string
          p_with_phone?: boolean
        }
        Returns: {
          address: string
          city: string
          distance_km: number
          id: string
          lat: number
          lng: number
          locality: string
          name: string
          on_duty: boolean
          on_duty_until: string
          opening_hours: string
          phone: string
        }[]
      }
      pharmacies_with_medicine: {
        Args: {
          p_lat: number
          p_limit?: number
          p_lng: number
          p_medicine_id: string
        }
        Returns: {
          address: string
          city: string
          distance_km: number
          id: string
          lat: number
          lng: number
          locality: string
          name: string
          on_duty: boolean
          phone: string
          price_fcfa: number
          quantity: number
          stock_updated_at: string
        }[]
      }
      pharmacy_geographic_options: {
        Args: never
        Returns: {
          city: string
          department: string
          region: string
        }[]
      }
      review_pharmacy_request: {
        Args: { p_approve: boolean; p_note?: string; p_request_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "user"],
    },
  },
} as const
