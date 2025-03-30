// ...existing code...

export interface UserRoleWithStore {
  id: string;
  user_id: string;
  role: "admin" | "manager" | "sales" | "viewer"; 
  almacen_id: string;
  created_at?: string; // Hacemos que sea opcional aquí para mantener compatibilidad
  // Otros campos que pueda tener
}

// ...existing code...