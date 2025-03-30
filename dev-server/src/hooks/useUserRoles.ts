import { useState } from "react";
import { UserRole } from "@/hooks/users/types/userManagementTypes";

export function useUserRoles() {
  const [roles, setRoles] = useState<UserRole[]>([]);

  const fetchRoles = async () => {
    try {
      const response = await fetch("/api/roles");
      const data = await response.json();
      setRoles(data as UserRole[]); // Asegúrate de hacer un casting explícito
    } catch (error) {
      console.error("Error fetching roles:", error);
    }
  };

  return {
    roles,
    fetchRoles,
  };
}