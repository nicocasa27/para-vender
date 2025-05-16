
import React from 'react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Building, ChevronDown, PlusCircle } from "lucide-react";
import { useTenant } from '@/contexts/tenant/TenantContext';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface TenantSelectorProps {
  onCreateNew?: () => void;
}

export const TenantSelector = ({ onCreateNew }: TenantSelectorProps) => {
  const { currentTenant, tenants, loading, switchTenant } = useTenant();

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-5 rounded-full" />
        <Skeleton className="h-4 w-[120px]" />
      </div>
    );
  }

  if (!currentTenant) {
    return (
      <Button 
        variant="outline" 
        onClick={onCreateNew} 
        size="sm" 
        className="border-dashed border-muted-foreground"
      >
        <PlusCircle className="mr-2 h-4 w-4" />
        Crear Organización
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          {currentTenant.logo_url ? (
            <img src={currentTenant.logo_url} alt={currentTenant.name} className="h-4 w-4 rounded-sm" />
          ) : (
            <Building className="h-4 w-4" />
          )}
          <span className="max-w-[150px] truncate">{currentTenant.name}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        {tenants.map(tenant => (
          <DropdownMenuItem
            key={tenant.id}
            onClick={() => switchTenant(tenant.id)}
            className={`flex items-center gap-2 ${currentTenant.id === tenant.id ? 'bg-muted' : ''}`}
          >
            {tenant.logo_url ? (
              <img src={tenant.logo_url} alt={tenant.name} className="h-4 w-4 rounded-sm" />
            ) : (
              <Building className="h-4 w-4" />
            )}
            <span className="flex-1 truncate">{tenant.name}</span>
          </DropdownMenuItem>
        ))}
        {onCreateNew && (
          <DropdownMenuItem onClick={onCreateNew} className="border-t mt-1 pt-1">
            <PlusCircle className="mr-2 h-4 w-4" />
            Nueva Organización
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
