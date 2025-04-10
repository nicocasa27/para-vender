
export type Database = {
  public: {
    Tables: {
      almacenes: {
        Row: {
          id: string;
          nombre: string;
          direccion?: string;
          created_at?: string;
        };
        Insert: {
          id?: string;
          nombre: string;
          direccion?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          nombre?: string;
          direccion?: string;
          created_at?: string;
        };
      };
      categorias: {
        Row: {
          id: string;
          nombre: string;
          created_at?: string;
        };
        Insert: {
          id?: string;
          nombre: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          nombre?: string;
          created_at?: string;
        };
      };
      detalles_venta: {
        Row: {
          id: string;
          venta_id?: string;
          producto_id?: string;
          cantidad: number;
          precio_unitario: number;
          subtotal: number;
          created_at?: string;
        };
        Insert: {
          id?: string;
          venta_id?: string;
          producto_id?: string;
          cantidad: number;
          precio_unitario: number;
          subtotal: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          venta_id?: string;
          producto_id?: string;
          cantidad?: number;
          precio_unitario?: number;
          subtotal?: number;
          created_at?: string;
        };
      };
      inventario: {
        Row: {
          id: string;
          producto_id?: string;
          almacen_id?: string;
          cantidad: number;
          created_at?: string;
          updated_at?: string;
        };
        Insert: {
          id?: string;
          producto_id?: string;
          almacen_id?: string;
          cantidad: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          producto_id?: string;
          almacen_id?: string;
          cantidad?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      movimientos: {
        Row: {
          id: string;
          tipo: string;
          producto_id?: string;
          almacen_origen_id?: string;
          almacen_destino_id?: string;
          cantidad: number;
          notas?: string;
          created_at?: string;
        };
        Insert: {
          id?: string;
          tipo: string;
          producto_id?: string;
          almacen_origen_id?: string;
          almacen_destino_id?: string;
          cantidad: number;
          notas?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          tipo?: string;
          producto_id?: string;
          almacen_origen_id?: string;
          almacen_destino_id?: string;
          cantidad?: number;
          notas?: string;
          created_at?: string;
        };
      };
      productos: {
        Row: {
          id: string;
          nombre: string;
          descripcion?: string;
          categoria_id?: string;
          unidad_id?: string;
          precio_compra?: number;
          precio_venta: number;
          stock_minimo?: number;
          stock_maximo?: number;
          created_at?: string;
          inventario?: any; // For ProductWithInventory compatibility
        };
        Insert: {
          id?: string;
          nombre: string;
          descripcion?: string;
          categoria_id?: string;
          unidad_id?: string;
          precio_compra?: number;
          precio_venta: number;
          stock_minimo?: number;
          stock_maximo?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          nombre?: string;
          descripcion?: string;
          categoria_id?: string;
          unidad_id?: string;
          precio_compra?: number;
          precio_venta?: number;
          stock_minimo?: number;
          stock_maximo?: number;
          created_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          email?: string;
          full_name?: string;
          created_at?: string;
        };
        Insert: {
          id: string;
          email?: string;
          full_name?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          created_at?: string;
        };
      };
      unidades: {
        Row: {
          id: string;
          nombre: string;
          abreviatura?: string;
          created_at?: string;
        };
        Insert: {
          id?: string;
          nombre: string;
          abreviatura?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          nombre?: string;
          abreviatura?: string;
          created_at?: string;
        };
      };
      user_roles: {
        Row: {
          id: string;
          user_id?: string;
          role?: string;
          almacen_id?: string;
          created_at?: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          role?: string;
          almacen_id?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: string;
          almacen_id?: string;
          created_at?: string;
        };
      };
      user_roles_with_name: {
        Row: {
          id?: string;
          user_id?: string;
          role?: string;
          almacen_id?: string;
          created_at?: string;
          email?: string;
          full_name?: string;
          almacen_nombre?: string;
        };
      };
      ventas: {
        Row: {
          id: string;
          almacen_id?: string;
          metodo_pago: string;
          cliente?: string;
          estado?: string;
          total: number;
          created_at?: string;
          almacenes?: {
            nombre: string;
          };
        };
        Insert: {
          id?: string;
          almacen_id?: string;
          metodo_pago: string;
          cliente?: string;
          estado?: string;
          total: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          almacen_id?: string;
          metodo_pago?: string;
          cliente?: string;
          estado?: string;
          total?: number;
          created_at?: string;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
};
