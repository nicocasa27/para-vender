
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UserWithEmail {
  id: string;
  email: string;
  full_name: string | null;
}

export function useUserSearch() {
  const [email, setEmail] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithEmail | null>(null);

  // Buscar un usuario por email
  const searchUserByEmail = async () => {
    if (!email || email.trim() === "") {
      toast.error("Ingresa un email válido");
      return;
    }
    
    setSearchLoading(true);
    try {
      // Buscar primero en profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('email', email)
        .maybeSingle();
      
      if (profileError) throw profileError;
      
      if (profileData) {
        setSelectedUser({
          id: profileData.id,
          email: profileData.email || email,
          full_name: profileData.full_name
        });
        toast.success("Usuario encontrado");
        return;
      }
      
      // Si no se encuentra en profiles, buscar en auth.users via la función Edge
      const { data, error } = await supabase.functions.invoke('get_user_id_by_email', {
        body: { email },
      });
      
      if (error) throw error;
      
      if (data) {
        setSelectedUser({
          id: data,
          email: email,
          full_name: null
        });
        toast.success("Usuario encontrado en auth.users");
      } else {
        toast.error("No se encontró ningún usuario con ese email");
        setSelectedUser(null);
      }
    } catch (error: any) {
      console.error("Error al buscar usuario:", error);
      toast.error("Error al buscar usuario", { description: error.message });
      setSelectedUser(null);
    } finally {
      setSearchLoading(false);
    }
  };

  return {
    email,
    setEmail,
    selectedUser,
    setSelectedUser,
    searchLoading,
    searchUserByEmail
  };
}
