
import { Session, User } from "@supabase/supabase-js";
import { UserRole, UserRoleWithStore, UserWithRoles } from "@/types/auth";

export interface AuthContextType {
  session: Session | null;
  user: User | null;
  userRoles: UserRoleWithStore[];
  loading: boolean;
  rolesLoading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  hasRole: (role: UserRole, storeId?: string) => boolean;
  refreshUserRoles: () => Promise<UserRoleWithStore[]>;
  getAllUsers: () => Promise<UserWithRoles[]>;
  deleteUser: (userId: string) => Promise<boolean>;
}
