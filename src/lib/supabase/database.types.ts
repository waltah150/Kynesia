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
      boxes: {
        Row: {
          activo: boolean
          created_at: string
          id: string
          numero: number
          updated_at: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          id?: string
          numero: number
          updated_at?: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          id?: string
          numero?: number
          updated_at?: string
        }
        Relationships: []
      }
      clientes: {
        Row: {
          activo: boolean
          apellido: string
          busqueda: string | null
          creado_por: string | null
          created_at: string
          id: string
          nombre: string
          notas: string | null
          telefono: string | null
          updated_at: string
        }
        Insert: {
          activo?: boolean
          apellido: string
          busqueda?: string | null
          creado_por?: string | null
          created_at?: string
          id?: string
          nombre: string
          notas?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          activo?: boolean
          apellido?: string
          busqueda?: string | null
          creado_por?: string | null
          created_at?: string
          id?: string
          nombre?: string
          notas?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clientes_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      grupos: {
        Row: {
          activo: boolean
          created_at: string
          id: string
          nombre: string
          orden: number
          updated_at: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          id?: string
          nombre: string
          orden?: number
          updated_at?: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          id?: string
          nombre?: string
          orden?: number
          updated_at?: string
        }
        Relationships: []
      }
      horario_spa: {
        Row: {
          apertura: string
          cierre: string
          created_at: string
          dia_semana: number
          id: string
          updated_at: string
        }
        Insert: {
          apertura: string
          cierre: string
          created_at?: string
          dia_semana: number
          id?: string
          updated_at?: string
        }
        Update: {
          apertura?: string
          cierre?: string
          created_at?: string
          dia_semana?: number
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      horarios_profesional: {
        Row: {
          created_at: string
          dia_semana: number
          fin: string
          id: string
          inicio: string
          profesional_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          dia_semana: number
          fin: string
          id?: string
          inicio: string
          profesional_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          dia_semana?: number
          fin?: string
          id?: string
          inicio?: string
          profesional_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "horarios_profesional_profesional_id_fkey"
            columns: ["profesional_id"]
            isOneToOne: false
            referencedRelation: "profesionales"
            referencedColumns: ["id"]
          },
        ]
      }
      paquetes: {
        Row: {
          activo: boolean
          created_at: string
          id: string
          precio: number
          servicio_id: string
          sesiones: number
          updated_at: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          id?: string
          precio: number
          servicio_id: string
          sesiones: number
          updated_at?: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          id?: string
          precio?: number
          servicio_id?: string
          sesiones?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "paquetes_servicio_id_fkey"
            columns: ["servicio_id"]
            isOneToOne: false
            referencedRelation: "servicios"
            referencedColumns: ["id"]
          },
        ]
      }
      perfiles: {
        Row: {
          activo: boolean
          created_at: string
          id: string
          nombre: string
          profesional_id: string | null
          rol: Database["public"]["Enums"]["rol_usuario"]
          updated_at: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          id: string
          nombre: string
          profesional_id?: string | null
          rol?: Database["public"]["Enums"]["rol_usuario"]
          updated_at?: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          id?: string
          nombre?: string
          profesional_id?: string | null
          rol?: Database["public"]["Enums"]["rol_usuario"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "perfiles_profesional_id_fkey"
            columns: ["profesional_id"]
            isOneToOne: true
            referencedRelation: "profesionales"
            referencedColumns: ["id"]
          },
        ]
      }
      profesional_grupos: {
        Row: {
          created_at: string
          grupo_id: string
          profesional_id: string
        }
        Insert: {
          created_at?: string
          grupo_id: string
          profesional_id: string
        }
        Update: {
          created_at?: string
          grupo_id?: string
          profesional_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profesional_grupos_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "grupos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profesional_grupos_profesional_id_fkey"
            columns: ["profesional_id"]
            isOneToOne: false
            referencedRelation: "profesionales"
            referencedColumns: ["id"]
          },
        ]
      }
      profesionales: {
        Row: {
          activa: boolean
          apellido: string
          color: string
          created_at: string
          id: string
          nombre: string
          updated_at: string
        }
        Insert: {
          activa?: boolean
          apellido: string
          color: string
          created_at?: string
          id?: string
          nombre: string
          updated_at?: string
        }
        Update: {
          activa?: boolean
          apellido?: string
          color?: string
          created_at?: string
          id?: string
          nombre?: string
          updated_at?: string
        }
        Relationships: []
      }
      promociones: {
        Row: {
          activo: boolean
          created_at: string
          fin: string
          id: string
          inicio: string
          paquete_id: string | null
          precio: number
          servicio_id: string | null
          updated_at: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          fin: string
          id?: string
          inicio: string
          paquete_id?: string | null
          precio: number
          servicio_id?: string | null
          updated_at?: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          fin?: string
          id?: string
          inicio?: string
          paquete_id?: string | null
          precio?: number
          servicio_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "promociones_paquete_id_fkey"
            columns: ["paquete_id"]
            isOneToOne: false
            referencedRelation: "paquetes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promociones_servicio_id_fkey"
            columns: ["servicio_id"]
            isOneToOne: false
            referencedRelation: "servicios"
            referencedColumns: ["id"]
          },
        ]
      }
      servicios: {
        Row: {
          activo: boolean
          created_at: string
          duracion_min: number
          grupo_id: string
          id: string
          nombre: string
          orden: number
          permite_dos_clientes: boolean
          precio: number
          updated_at: string
          visible_web: boolean
        }
        Insert: {
          activo?: boolean
          created_at?: string
          duracion_min: number
          grupo_id: string
          id?: string
          nombre: string
          orden?: number
          permite_dos_clientes?: boolean
          precio: number
          updated_at?: string
          visible_web?: boolean
        }
        Update: {
          activo?: boolean
          created_at?: string
          duracion_min?: number
          grupo_id?: string
          id?: string
          nombre?: string
          orden?: number
          permite_dos_clientes?: boolean
          precio?: number
          updated_at?: string
          visible_web?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "servicios_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "grupos"
            referencedColumns: ["id"]
          },
        ]
      }
      turnos: {
        Row: {
          box_id: string | null
          cliente_id: string
          creado_por: string | null
          created_at: string
          estado: Database["public"]["Enums"]["estado_turno"]
          fin: string
          google_event_id: string | null
          id: string
          inicio: string
          notas: string | null
          origen: Database["public"]["Enums"]["origen_turno"]
          precio_cobrado: number
          profesional_id: string
          servicio_id: string
          updated_at: string
        }
        Insert: {
          box_id?: string | null
          cliente_id: string
          creado_por?: string | null
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_turno"]
          fin: string
          google_event_id?: string | null
          id?: string
          inicio: string
          notas?: string | null
          origen?: Database["public"]["Enums"]["origen_turno"]
          precio_cobrado: number
          profesional_id: string
          servicio_id: string
          updated_at?: string
        }
        Update: {
          box_id?: string | null
          cliente_id?: string
          creado_por?: string | null
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_turno"]
          fin?: string
          google_event_id?: string | null
          id?: string
          inicio?: string
          notas?: string | null
          origen?: Database["public"]["Enums"]["origen_turno"]
          precio_cobrado?: number
          profesional_id?: string
          servicio_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "turnos_box_id_fkey"
            columns: ["box_id"]
            isOneToOne: false
            referencedRelation: "boxes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turnos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turnos_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turnos_profesional_id_fkey"
            columns: ["profesional_id"]
            isOneToOne: false
            referencedRelation: "profesionales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turnos_servicio_id_fkey"
            columns: ["servicio_id"]
            isOneToOne: false
            referencedRelation: "servicios"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      contar_turnos_fuera_de_horario: {
        Args: { p_profesional_id: string }
        Returns: number
      }
      es_paso_15_min: { Args: { hora: string }; Returns: boolean }
      fuera_de_horario: {
        Args: { turno: Database["public"]["Tables"]["turnos"]["Row"] }
        Returns: boolean
      }
      guardar_horario_profesional: {
        Args: { p_profesional_id: string; p_rangos: Json }
        Returns: number
      }
      guardar_horario_spa: { Args: { p_rangos: Json }; Returns: undefined }
      guardar_profesional: {
        Args: {
          p_activa: boolean
          p_apellido: string
          p_color: string
          p_grupos: string[]
          p_id: string
          p_nombre: string
          p_perfil_id: string
        }
        Returns: string
      }
    }
    Enums: {
      estado_turno:
        | "reservado"
        | "confirmado"
        | "realizado"
        | "cancelado"
        | "no_asistio"
      origen_turno: "interno" | "web"
      rol_usuario: "admin" | "profesional"
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
      estado_turno: [
        "reservado",
        "confirmado",
        "realizado",
        "cancelado",
        "no_asistio",
      ],
      origen_turno: ["interno", "web"],
      rol_usuario: ["admin", "profesional"],
    },
  },
} as const
