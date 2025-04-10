import { supabase } from "@/integrations/supabase/client";
import { UserRoleWithStore } from "@/types/auth";
import { Role } from "@/types/auth";

export async function addUserRole(userId: string, role: string, storeId?: string) {
  try {
    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (userError) throw userError;
    
    if (!user) {
      throw new Error("User not found");
    }

    const { data: existingRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .eq('role', role);
      
    if (rolesError) throw rolesError;
    
    if (existingRoles && existingRoles.length > 0) {
      // User already has this role
      return existingRoles[0];
    }
    
    // Insert new role
    const { data, error } = await supabase
      .from('user_roles')
      .insert([
        {
          user_id: userId,
          role,
          almacen_id: storeId || null
        }
      ])
      .select()
      .single();
      
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error("Error in addUserRole:", error);
    throw error;
  }
}

export async function removeUserRole(roleId: string) {
  try {
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('id', roleId);
      
    if (error) throw error;
  } catch (error) {
    console.error("Error in removeUserRole:", error);
    throw error;
  }
}

export async function getUserRolesWithStore(userId: string): Promise<UserRoleWithStore[]> {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select(`
        *,
        almacenes(nombre)
      `)
      .eq('user_id', userId);
      
    if (error) throw error;
    
    if (!data || data.length === 0) return [];
    
    return data.map(role => {
      // Handle almacenes data which might be an array or object
      const almacenesData = role.almacenes;
      let almacenNombre = '';
      
      if (almacenesData) {
        if (Array.isArray(almacenesData)) {
          // Handle array case
          if (almacenesData.length > 0) {
            almacenNombre = almacenesData[0].nombre || '';
          }
        } else {
          // Handle object case
          almacenNombre = almacenesData.nombre || '';
        }
      }
      
      return {
        id: role.id,
        user_id: role.user_id,
        role: role.role as Role,
        almacen_id: role.almacen_id,
        almacen_nombre: almacenNombre,
        created_at: role.created_at
      } as UserRoleWithStore;
    });
  } catch (error) {
    console.error("Error in getUserRolesWithStore:", error);
    throw error;
  }
}
