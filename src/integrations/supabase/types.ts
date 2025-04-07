export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      almacenes: {
        Row: {
          created_at: string
          direccion: string | null
          id: string
          nombre: string
        }
        Insert: {
          created_at?: string
          direccion?: string | null
          id?: string
          nombre: string
        }
        Update: {
          created_at?: string
          direccion?: string | null
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      categorias: {
        Row: {
          created_at: string
          id: string
          nombre: string
        }
        Insert: {
          created_at?: string
          id?: string
          nombre: string
        }
        Update: {
          created_at?: string
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      detalles_venta: {
        Row: {
          cantidad: number
          created_at: string
          id: string
          precio_unitario: number
          producto_id: string
          subtotal: number
          venta_id: string
        }
        Insert: {
          cantidad: number
          created_at?: string
          id?: string
          precio_unitario: number
          producto_id: string
          subtotal: number
          venta_id: string
        }
        Update: {
          cantidad?: number
          created_at?: string
          id?: string
          precio_unitario?: number
          producto_id?: string
          subtotal?: number
          venta_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "detalles_venta_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "detalles_venta_venta_id_fkey"
            columns: ["venta_id"]
            isOneToOne: false
            referencedRelation: "ventas"
            referencedColumns: ["id"]
          },
        ]
      }
      inventario: {
        Row: {
          almacen_id: string
          cantidad: number
          created_at: string
          id: string
          producto_id: string
          updated_at: string
        }
        Insert: {
          almacen_id: string
          cantidad?: number
          created_at?: string
          id?: string
          producto_id: string
          updated_at?: string
        }
        Update: {
          almacen_id?: string
          cantidad?: number
          created_at?: string
          id?: string
          producto_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventario_almacen_id_fkey"
            columns: ["almacen_id"]
            isOneToOne: false
            referencedRelation: "almacenes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventario_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      movimientos: {
        Row: {
          almacen_destino_id: string | null
          almacen_origen_id: string | null
          cantidad: number
          created_at: string
          id: string
          notas: string | null
          producto_id: string
          tipo: string
        }
        Insert: {
          almacen_destino_id?: string | null
          almacen_origen_id?: string | null
          cantidad: number
          created_at?: string
          id?: string
          notas?: string | null
          producto_id: string
          tipo: string
        }
        Update: {
          almacen_destino_id?: string | null
          almacen_origen_id?: string | null
          cantidad?: number
          created_at?: string
          id?: string
          notas?: string | null
          producto_id?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "movimientos_almacen_destino_id_fkey"
            columns: ["almacen_destino_id"]
            isOneToOne: false
            referencedRelation: "almacenes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_almacen_origen_id_fkey"
            columns: ["almacen_origen_id"]
            isOneToOne: false
            referencedRelation: "almacenes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      productos: {
        Row: {
          categoria_id: string | null
          created_at: string
          id: string
          nombre: string
          precio_compra: number
          precio_venta: number
          stock_maximo: number
          stock_minimo: number
          unidad_id: string | null
          updated_at: string
        }
        Insert: {
          categoria_id?: string | null
          created_at?: string
          id?: string
          nombre: string
          precio_compra?: number
          precio_venta?: number
          stock_maximo?: number
          stock_minimo?: number
          unidad_id?: string | null
          updated_at?: string
        }
        Update: {
          categoria_id?: string | null
          created_at?: string
          id?: string
          nombre?: string
          precio_compra?: number
          precio_venta?: number
          stock_maximo?: number
          stock_minimo?: number
          unidad_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "productos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "productos_unidad_id_fkey"
            columns: ["unidad_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      unidades: {
        Row: {
          abreviatura: string
          created_at: string
          id: string
          nombre: string
        }
        Insert: {
          abreviatura: string
          created_at?: string
          id?: string
          nombre: string
        }
        Update: {
          abreviatura?: string
          created_at?: string
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          almacen_id: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          almacen_id?: string | null
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          almacen_id?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_roles_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_almacen_id_fkey"
            columns: ["almacen_id"]
            isOneToOne: false
            referencedRelation: "almacenes"
            referencedColumns: ["id"]
          },
        ]
      }
      ventas: {
        Row: {
          almacen_id: string
          cliente: string | null
          created_at: string
          estado: string
          id: string
          metodo_pago: string
          total: number
        }
        Insert: {
          almacen_id: string
          cliente?: string | null
          created_at?: string
          estado?: string
          id?: string
          metodo_pago: string
          total?: number
        }
        Update: {
          almacen_id?: string
          cliente?: string | null
          created_at?: string
          estado?: string
          id?: string
          metodo_pago?: string
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "ventas_almacen_id_fkey"
            columns: ["almacen_id"]
            isOneToOne: false
            referencedRelation: "almacenes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      user_roles_with_name: {
        Row: {
          almacen_id: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_roles_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_almacen_id_fkey"
            columns: ["almacen_id"]
            isOneToOne: false
            referencedRelation: "almacenes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      decrement: {
        Args: { current_value: number; x: number }
        Returns: number
      }
      get_top_productos: {
        Args: { store_ids: string[] }
        Returns: {
          producto: string
          total: number
        }[]
      }
      get_ventas_por_categoria: {
        Args: { store_ids: string[] }
        Returns: {
          categoria: string
          total: number
        }[]
      }
      get_ventas_por_dia: {
        Args: { store_ids: string[] }
        Returns: {
          fecha: string
          total: number
        }[]
      }
      has_role: {
        Args: {
          requested_role: Database["public"]["Enums"]["user_role"]
          store_id?: string
        }
        Returns: boolean
      }
      increment: {
        Args: { current_value: number; x: number }
        Returns: number
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      user_role: "admin" | "manager" | "sales" | "viewer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_role: ["admin", "manager", "sales", "viewer"],
    },
  },
} as const
