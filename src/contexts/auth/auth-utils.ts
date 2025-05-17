
// This file now serves as a point of entry for all authentication utilities
import { fetchUserRoles, checkHasRole } from './utils/user-roles';
import { fetchAllUsers } from './utils/user-management';
import { createDefaultRole } from './utils/user-management-defaults';

// Re-export the functions to maintain compatibility with existing code
export { fetchUserRoles, checkHasRole, fetchAllUsers, createDefaultRole };
