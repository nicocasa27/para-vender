
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/auth/useAuth';
import { TenantPlan, SubscriptionStatus, Tenant as TenantType } from './types';
import { handleError, createRetryableFunction } from '@/utils/errorHandler';
import { TenantErrorDisplay } from '@/components/tenant/TenantErrorDisplay';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  active: boolean;
  trial_ends_at?: string;
}

export interface Subscription {
  plan: 'basic' | 'standard' | 'premium';
  status: 'active' | 'past_due' | 'canceled' | 'trialing';
  trial_ends_at?: string;
  current_period_end?: string;
}

export interface PlanLimits {
  max_products: number;
  max_users: number;
  max_stores: number;
  allow_analytics: boolean;
  allow_api_access: boolean;
  allow_custom_domain: boolean;
}

interface TenantContextType {
  currentTenant: Tenant | null;
  tenants: Tenant[];
  subscription: Subscription | null;
  planLimits: PlanLimits | null;
  loading: boolean;
  error: string | null;
  switchTenant: (tenantId: string) => Promise<void>;
  refreshTenants: () => Promise<void>;
  createTenant: (name: string, slug: string) => Promise<Tenant | null>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [planLimits, setPlanLimits] = useState<PlanLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Función optimizada para cargar tenants sin recursión
  const loadTenantsCore = async () => {
    if (!user) {
      console.log("TenantContext: No user found, clearing tenant data");
      setTenants([]);
      setCurrentTenant(null);
      setError(null);
      setLoading(false);
      return;
    }

    console.log(`TenantContext: Loading tenants for user: ${user.id}`);
    
    try {
      // Usar una consulta más simple y directa
      const { data, error: tenantsError } = await supabase
        .from('tenant_users')
        .select(`
          tenant_id,
          role,
          tenants!inner(
            id,
            name,
            slug,
            logo_url,
            primary_color,
            secondary_color,
            active,
            trial_ends_at
          )
        `)
        .eq('user_id', user.id);

      if (tenantsError) {
        const errorDetails = handleError(tenantsError, 'loading tenants');
        throw new Error(errorDetails.message);
      }

      if (!data || data.length === 0) {
        console.log("TenantContext: No tenants found for user");
        setTenants([]);
        setCurrentTenant(null);
        setError("No tienes organizaciones asignadas. Contacta al administrador o crea una nueva organización.");
        setLoading(false);
        return;
      }

      const userTenants = data
        .filter(item => item.tenants && typeof item.tenants === 'object')
        .map(item => item.tenants) as Tenant[];
      
      console.log("TenantContext: Loaded tenants:", userTenants.map(t => ({ id: t.id, name: t.name })));
      setTenants(userTenants);

      // Get previously selected tenant from localStorage or use first tenant
      const savedTenantId = localStorage.getItem('currentTenantId');
      const initialTenant = savedTenantId 
        ? userTenants.find(t => t.id === savedTenantId) 
        : userTenants[0] || null;

      if (initialTenant) {
        console.log("TenantContext: Setting initial tenant:", initialTenant.name);
        await switchTenant(initialTenant.id);
      } else {
        console.log("TenantContext: No valid initial tenant found");
        setCurrentTenant(null);
      }
      
      setError(null);
    } catch (error: any) {
      console.error("TenantContext: Error loading tenants:", error);
      const errorDetails = handleError(error, 'tenant loading');
      setError(errorDetails.message);
    } finally {
      setLoading(false);
    }
  };

  // Crear función retryable
  const loadTenants = createRetryableFunction(loadTenantsCore, 2, 1000);

  // Load subscription and plan limits optimizadamente
  const loadSubscriptionDetails = async (tenantId: string) => {
    try {
      console.log("TenantContext: Loading subscription details for tenant:", tenantId);
      
      const { data: subData, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('tenant_id', tenantId)
        .maybeSingle();

      if (subError) {
        console.error("TenantContext: Error loading subscription:", subError);
        // Don't throw, just use defaults
      }

      if (subData) {
        const planValue = subData.plan as TenantPlan;
        const statusValue = subData.status as SubscriptionStatus;
        
        setSubscription({
          plan: planValue,
          status: statusValue,
          trial_ends_at: subData.trial_ends_at,
          current_period_end: subData.current_period_end
        });

        // Load plan limits
        const { data: limitData, error: limitError } = await supabase
          .from('plan_limits')
          .select('*')
          .eq('plan', planValue)
          .maybeSingle();

        if (limitError) {
          console.error("TenantContext: Error loading plan limits:", limitError);
        }

        setPlanLimits(limitData || {
          max_products: 100,
          max_users: 5,
          max_stores: 1,
          allow_analytics: false,
          allow_api_access: false,
          allow_custom_domain: false
        });
      } else {
        // Set basic plan defaults
        setPlanLimits({
          max_products: 100,
          max_users: 5,
          max_stores: 1,
          allow_analytics: false,
          allow_api_access: false,
          allow_custom_domain: false
        });
        setSubscription({
          plan: 'basic',
          status: 'trialing',
        });
      }
    } catch (error: any) {
      console.error("TenantContext: Error loading subscription details:", error);
      // Set safe defaults
      setPlanLimits({
        max_products: 100,
        max_users: 5,
        max_stores: 1,
        allow_analytics: false,
        allow_api_access: false,
        allow_custom_domain: false
      });
      setSubscription({
        plan: 'basic',
        status: 'trialing',
      });
    }
  };

  // Switch to a different tenant with error handling
  const switchTenant = async (tenantId: string) => {
    try {
      const tenant = tenants.find(t => t.id === tenantId);
      if (!tenant) {
        console.error("TenantContext: Tenant not found:", tenantId);
        toast.error("Organización no encontrada");
        return;
      }

      console.log("TenantContext: Switching to tenant:", tenant.name);
      localStorage.setItem('currentTenantId', tenantId);
      setCurrentTenant(tenant);
      await loadSubscriptionDetails(tenantId);
    } catch (error: any) {
      console.error("TenantContext: Error switching tenant:", error);
      const errorDetails = handleError(error, 'switching tenant');
      toast.error("Error al cambiar de organización", {
        description: errorDetails.message
      });
    }
  };

  // Refresh tenants
  const refreshTenants = async () => {
    console.log("TenantContext: Refreshing tenants");
    setError(null);
    setLoading(true);
    await loadTenants();
  };

  // Create a new tenant with enhanced error handling
  const createTenant = async (name: string, slug: string): Promise<Tenant | null> => {
    if (!user) {
      toast.error("Debes iniciar sesión para crear una organización");
      return null;
    }

    if (!name.trim() || !slug.trim()) {
      toast.error("Nombre y slug son requeridos");
      return null;
    }

    try {
      console.log("TenantContext: Creating new tenant:", name);
      
      // Create the tenant
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .insert([{ 
          name: name.trim(), 
          slug: slug.trim().toLowerCase() 
        }])
        .select()
        .single();

      if (tenantError) {
        const errorDetails = handleError(tenantError, 'creating tenant');
        throw new Error(errorDetails.message);
      }

      // Add user as tenant admin
      const { error: membershipError } = await supabase
        .from('tenant_users')
        .insert([{
          tenant_id: tenantData.id,
          user_id: user.id,
          role: 'admin'
        }]);

      if (membershipError) {
        const errorDetails = handleError(membershipError, 'adding tenant membership');
        throw new Error(errorDetails.message);
      }

      // Create a trial subscription
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 14); // 14-day trial

      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .insert([{
          tenant_id: tenantData.id,
          plan: 'basic',
          status: 'trialing',
          trial_ends_at: trialEnd.toISOString(),
          current_period_end: trialEnd.toISOString()
        }]);

      if (subscriptionError) {
        console.warn("TenantContext: Could not create subscription:", subscriptionError);
        // Don't fail tenant creation for subscription issues
      }

      // Add new tenant to list and switch to it
      const newTenant: Tenant = {
        id: tenantData.id,
        name: tenantData.name,
        slug: tenantData.slug,
        active: true
      };
      
      setTenants(prev => [...prev, newTenant]);
      await switchTenant(newTenant.id);
      toast.success("Organización creada con éxito");
      return newTenant;
    } catch (error: any) {
      console.error("TenantContext: Error creating tenant:", error);
      const errorDetails = handleError(error, 'creating tenant');
      toast.error("Error al crear la organización", {
        description: errorDetails.message
      });
      return null;
    }
  };

  // Load tenants when user changes
  useEffect(() => {
    if (user) {
      console.log("TenantContext: User changed, loading tenants");
      loadTenants();
    } else {
      console.log("TenantContext: No user, clearing tenant data");
      setTenants([]);
      setCurrentTenant(null);
      setSubscription(null);
      setPlanLimits(null);
      setError(null);
      setLoading(false);
    }
  }, [user]);

  // Si hay un error crítico, mostrar el componente de error
  if (error && (error.includes('configuración') || error.includes('recursion') || error.includes('infinite'))) {
    return (
      <TenantErrorDisplay 
        error={error} 
        onRetry={refreshTenants} 
        loading={loading} 
      />
    );
  }

  return (
    <TenantContext.Provider value={{
      currentTenant,
      tenants,
      subscription,
      planLimits,
      loading,
      error,
      switchTenant,
      refreshTenants,
      createTenant
    }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};
