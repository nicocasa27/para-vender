
import { useCallback } from 'react';
import { UserRole, UserRoleWithStore } from '@/types/auth';
import { checkHasRole } from '../auth-utils';

export function useRoleVerification(userRoles: UserRoleWithStore[]) {
  const hasRole = useCallback((role: UserRole, storeId?: string): boolean => {
    const result = checkHasRole(userRoles, role, storeId);
    console.log(`Auth: Checking if user has role '${role}'${storeId ? ` for store ${storeId}` : ''}: ${result}`, 
      `Current roles:`, userRoles);
    return result;
  }, [userRoles]);

  return { hasRole };
}
