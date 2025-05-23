
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/auth/useAuth';
import { TenantPlan, SubscriptionStatus, Tenant as TenantType } from './types';

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

  // Load user's tenants with enhanced error handling and retry logic
  const loadTenants = async (retryCount = 0) => {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 1000 * (retryCount + 1); // Progressive delay

    if (!user) {
      console.log("TenantContext: No user found, clearing tenant data");
      setTenants([]);
      setCurrentTenant(null);
      setError(null);
      setLoading(false);
      return;
    }

    try {
      console.log(`TenantContext: Loading tenants for user: ${user.id} (attempt ${retryCount + 1})`);
      setLoading(true);
      setError(null);
      
      // Add timeout to prevent hanging requests
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );

      const queryPromise = supabase
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

      const { data, error: tenantsError } = await Promise.race([
        queryPromise,
        timeoutPromise
      ]) as any;

      if (tenantsError) {
        console.error(`TenantContext: Error loading tenants (attempt ${retryCount + 1}):`, tenantsError);
        
        // Check if it's a recursion error or connection issue
        if (tenantsError.message?.includes('recursion') || tenantsError.message?.includes('infinite')) {
          throw new Error('Error de configuración del sistema. Contacta al soporte técnico.');
        }
        
        throw tenantsError;
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
    } catch (error: any) {
      console.error(`TenantContext: Error in loadTenants (attempt ${retryCount + 1}):`, error);
      
      // Retry logic for network errors
      if (retryCount < MAX_RETRIES && 
          (error.message?.includes('timeout') || 
           error.message?.includes('network') || 
           error.message?.includes('fetch'))) {
        console.log(`TenantContext: Retrying in ${RETRY_DELAY}ms...`);
        setTimeout(() => loadTenants(retryCount + 1), RETRY_DELAY);
        return;
      }
      
      const errorMessage = error.message || "Error al cargar las organizaciones";
      setError(errorMessage);
      
      // Only show toast on final failure
      if (retryCount >= MAX_RETRIES || !errorMessage.includes('timeout')) {
        toast.error("Error al cargar organizaciones", {
          description: errorMessage,
          action: {
            label: "Reintentar",
            onClick: () => refreshTenants()
          }
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Load subscription and plan limits with enhanced error handling
  const loadSubscriptionDetails = async (tenantId: string) => {
    try {
      console.log("TenantContext: Loading subscription details for tenant:", tenantId);
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Subscription load timeout')), 5000)
      );

      // Load subscription with timeout
      const subPromise = supabase
        .from('subscriptions')
        .select('*')
        .eq('tenant_id', tenantId)
        .maybeSingle();

      const { data: subData, error: subError } = await Promise.race([
        subPromise,
        timeoutPromise
      ]) as any;

      if (subError && !subError.message?.includes('timeout')) {
        console.error("TenantContext: Error loading subscription:", subError);
        // Don't throw, just log and continue with defaults
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
        console.log("TenantContext: No subscription found, using basic plan defaults");
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
      toast.error("Error al cambiar de organización", {
        description: error.message
      });
    }
  };

  // Refresh tenants with debouncing
  const refreshTenants = async () => {
    console.log("TenantContext: Refreshing tenants");
    setError(null); // Clear previous errors
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
        if (tenantError.code === '23505') { // Unique constraint violation
          throw new Error('Ya existe una organización con ese nombre o identificador');
        }
        throw tenantError;
      }

      // Add user as tenant admin
      const { error: membershipError } = await supabase
        .from('tenant_users')
        .insert([{
          tenant_id: tenantData.id,
          user_id: user.id,
          role: 'admin'
        }]);

      if (membershipError) throw membershipError;

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
      toast.error("Error al crear la organización", {
        description: error.message || "Error desconocido"
      });
      return null;
    }
  };

  // Load tenants when user changes with cleanup
  useEffect(() => {
    let isMounted = true;
    
    const loadTenantsIfMounted = async () => {
      if (isMounted && user) {
        console.log("TenantContext: User changed, loading tenants");
        await loadTenants();
      } else if (isMounted && !user) {
        console.log("TenantContext: No user, clearing tenant data");
        setTenants([]);
        setCurrentTenant(null);
        setSubscription(null);
        setPlanLimits(null);
        setError(null);
        setLoading(false);
      }
    };

    loadTenantsIfMounted();

    return () => {
      isMounted = false;
    };
  }, [user]);

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
