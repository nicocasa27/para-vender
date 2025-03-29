
import { useState, useEffect } from 'react';
import { UserWithRoles } from '@/types/auth';
import { toast } from "sonner";
import { fetchUserRolesData, fetchFromUserRolesView } from './api/userDataApi';
import { processUserRolesData, fetchProfilesWithoutRoles } from './utils/userDataProcessing';
import { transformViewData } from './utils/viewDataTransformer';

export function useFetchUsers(isAdmin: boolean) {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!isAdmin) {
        console.log("Usuario no es administrador, no se cargarán los usuarios");
        setUsers([]);
        return;
      }

      console.log("Iniciando carga de usuarios con roles desde Supabase...");
      
      // Intentar usar la vista optimizada primero
      const viewResult = await fetchFromUserRolesView();
      
      if (viewResult.success && viewResult.data && viewResult.data.length > 0) {
        const processedUsers = transformViewData(viewResult.data);
        setUsers(processedUsers);
        toast.success(`${processedUsers.length} usuarios cargados correctamente`);
        return;
      }
      
      // Si la vista no está disponible o no tiene datos, usar el método alternativo
      const userRolesData = await fetchUserRolesData();
      
      // Si no hay roles, obtener directamente los perfiles
      if (userRolesData.length === 0) {
        console.log("No se encontraron roles de usuario");
        const usersWithoutRoles = await fetchProfilesWithoutRoles();
        console.log("Usuarios sin roles cargados:", usersWithoutRoles);
        setUsers(usersWithoutRoles);
        toast.success(`${usersWithoutRoles.length} usuarios cargados (sin roles)`);
        return;
      }
      
      // Procesar los datos de roles y combinarlos con perfiles
      const usersWithRoles = await processUserRolesData(userRolesData);
      console.log(`Datos combinados: ${usersWithRoles.length} usuarios con sus roles`);
      
      setUsers(usersWithRoles);
      toast.success(`${usersWithRoles.length} usuarios cargados correctamente`);
    } catch (error: any) {
      console.error("Error en useFetchUsers:", error);
      setError(error.message || "Error al cargar usuarios");
      toast.error("Error al cargar usuarios", {
        description: error.message || "No se pudieron cargar los datos de usuarios"
      });
    } finally {
      setLoading(false);
    }
  };

  // Cargar usuarios al montar el componente o cuando cambie isAdmin
  useEffect(() => {
    fetchUsers();
  }, [isAdmin]);

  return {
    users,
    loading,
    error,
    fetchUsers
  };
}
