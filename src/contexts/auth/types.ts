
import { Session, User } from "@supabase/supabase-js";
import { UserRole, UserRoleWithStore } from "@/types/auth";

export interface AuthContextType {
  session: Session | null;
  user: User | null;
  userRoles: UserRoleWithStore[];
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  hasRole: (role: UserRole, storeId?: string) => boolean;
}
