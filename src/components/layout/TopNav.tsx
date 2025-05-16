
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from '@/hooks/auth/useAuth';
import { useTenant } from "@/contexts/tenant/TenantContext";
import { UserCircle2, Settings } from "lucide-react";
import { TenantSelector } from "@/components/tenant/TenantSelector";
import { CreateTenantDialog } from "@/components/tenant/CreateTenantDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

export const TopNav = () => {
  const { user, signOut } = useAuth();
  const { currentTenant } = useTenant();
  const navigate = useNavigate();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Redirect to welcome page if no tenant is selected
  if (!currentTenant) {
    navigate("/welcome");
    return null;
  }

  // Safely access subscription properties with type checking
  const hasSubscription = currentTenant && 
    typeof currentTenant === 'object' && 
    'subscription' in currentTenant && 
    currentTenant.subscription;
    
  const subscriptionPlan = hasSubscription && 
    typeof currentTenant.subscription === 'object' && 
    'plan' in currentTenant.subscription ? 
    currentTenant.subscription.plan || 'basic' : 'basic';

  return (
    <div className="border-b px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <TenantSelector onCreateNew={() => setCreateDialogOpen(true)} />
        {hasSubscription && (
          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
            {subscriptionPlan === 'premium' 
              ? 'Premium' 
              : subscriptionPlan === 'standard' 
                ? 'Estándar' 
                : 'Básico'}
          </span>
        )}
      </div>
      
      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger className="outline-none">
            <div className="flex items-center gap-2">
              <span className="hidden sm:block text-right">
                <p className="text-sm font-medium">{user?.email}</p>
                <p className="text-xs text-muted-foreground">
                  {currentTenant ? currentTenant.name : ""}
                </p>
              </span>
              <UserCircle2 className="w-9 h-9" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate("/profile")}>
              <Settings className="mr-2 h-4 w-4" />
              Mi Perfil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => navigate("/welcome")}
            >
              Cambiar Organización
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut()}
            >
              Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <CreateTenantDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  );
};
