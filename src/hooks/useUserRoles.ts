
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserWithRoles } from "@/types/auth";

export function useUserRoles(isAdmin: boolean) {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(false);

  // Cargar todos los usuarios con sus roles
  const loadUsers = useCallback(async () => {
    if (!isAdmin) {
      toast.error("No tienes permisos para gestionar usuarios");
      return;
    }
    
    setLoading(true);
    try {
      // Primero intentamos usar la vista optimizada para obtener los datos
      const { data: viewData, error: viewError } = await supabase
        .from('user_roles_with_name')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (viewError) {
        console.error("Error al cargar vista user_roles_with_name:", viewError);
        throw viewError;
      }
      
      if (viewData && viewData.length > 0) {
        console.log("Datos obtenidos de vista:", viewData);
        
        // Agrupar roles por usuario
        const usersMap = new Map<string, UserWithRoles>();
        
        viewData.forEach(item => {
          const userId = item.user_id;
          
          if (!usersMap.has(userId)) {
            usersMap.set(userId, {
              id: userId,
              email: item.email || "Sin email",
              full_name: item.full_name || "Usuario sin perfil",
              roles: []
            });
          }
          
          const userEntry = usersMap.get(userId);
          if (userEntry) {
            // Aquí asignamos almacen_nombre directamente
            userEntry.roles.push({
              id: item.id,
              user_id: userId,
              role: item.role,
              almacen_id: item.almacen_id,
              almacen_nombre: item.almacen_nombre || null
            });
          }
        });
        
        // Convertir el mapa a array
        setUsers(Array.from(usersMap.values()));
        toast.success("Lista de usuarios actualizada");
        setLoading(false);
        return;
      }
      
      // Si no hay datos en la vista, intentamos el método anterior
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          id,
          user_id,
          role,
          almacen_id,
          profiles:user_id(id, email, full_name),
          almacenes:almacen_id(nombre)
        `)
        .order('created_at', { ascending: false });
        
      if (error) throw error;

      // Agrupar roles por usuario
      const usersMap = new Map<string, UserWithRoles>();
      
      data?.forEach(item => {
        const userId = item.user_id;
        const profile = item.profiles || { id: userId, email: "Sin email", full_name: "Usuario sin perfil" };
        
        if (!usersMap.has(userId)) {
          usersMap.set(userId, {
            id: userId,
            email: profile.email || "Sin email",
            full_name: profile.full_name || "Usuario sin perfil",
            roles: []
          });
        }
        
        const userEntry = usersMap.get(userId);
        if (userEntry) {
          userEntry.roles.push({
            id: item.id,
            user_id: userId,
            role: item.role,
            almacen_id: item.almacen_id,
            almacen_nombre: item.almacenes?.nombre || null
          });
        }
      });
      
      // Convertir el mapa a array
      setUsers(Array.from(usersMap.values()));
      toast.success("Lista de usuarios actualizada");
    } catch (error: any) {
      console.error("Error al cargar usuarios:", error);
      toast.error("Error al cargar usuarios", { description: error.message });
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin, loadUsers]);

  return {
    users,
    loading,
    loadUsers
  };
}
