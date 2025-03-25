
// Este archivo ahora sirve como punto de entrada para todas las utilidades de autenticación
import { fetchUserRoles, checkHasRole } from './utils/user-roles';
import { fetchAllUsers } from './utils/user-management';

// Re-exportar las funciones para mantener compatibilidad con el código existente
export { fetchUserRoles, checkHasRole, fetchAllUsers };
