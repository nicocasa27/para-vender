
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

  // Load user's tenants with improved error handling
  const loadTenants = async () => {
    if (!user) {
      console.log("TenantContext: No user found, clearing tenant data");
      setTenants([]);
      setCurrentTenant(null);
      setError(null);
      setLoading(false);
      return;
    }

    try {
      console.log("TenantContext: Loading tenants for user:", user.id);
      setLoading(true);
      setError(null);
      
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
        console.error("TenantContext: Error loading tenants:", tenantsError);
        throw tenantsError;
      }

      if (!data || data.length === 0) {
        console.log("TenantContext: No tenants found for user");
        setTenants([]);
        setCurrentTenant(null);
        setError("No tienes organizaciones asignadas. Contacta al administrador.");
        setLoading(false);
        return;
      }

      const userTenants = data.map(item => item.tenants) as Tenant[];
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
      console.error("TenantContext: Error in loadTenants:", error);
      const errorMessage = error.message || "Error al cargar las organizaciones";
      setError(errorMessage);
      toast.error("Error al cargar organizaciones", {
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  // Load subscription and plan limits for the current tenant with better error handling
  const loadSubscriptionDetails = async (tenantId: string) => {
    try {
      console.log("TenantContext: Loading subscription details for tenant:", tenantId);
      
      // Load subscription
      const { data: subData, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('tenant_id', tenantId)
        .maybeSingle();

      if (subError) {
        console.error("TenantContext: Error loading subscription:", subError);
        throw subError;
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
          throw limitError;
        }

        setPlanLimits(limitData);
      } else {
        console.log("TenantContext: No subscription found, using basic plan defaults");
        // If no subscription is found, use basic plan limits
        const { data: defaultLimitData, error: defaultLimitError } = await supabase
          .from('plan_limits')
          .select('*')
          .eq('plan', 'basic')
          .maybeSingle();

        if (defaultLimitError) {
          console.error("TenantContext: Error loading default plan limits:", defaultLimitError);
          throw defaultLimitError;
        }

        setPlanLimits(defaultLimitData);
        setSubscription({
          plan: 'basic',
          status: 'trialing',
        });
      }
    } catch (error: any) {
      console.error("TenantContext: Error loading subscription details:", error);
      setPlanLimits(null);
      setSubscription(null);
      // Don't show error toast for subscription details as it's not critical
    }
  };

  // Switch to a different tenant
  const switchTenant = async (tenantId: string) => {
    const tenant = tenants.find(t => t.id === tenantId);
    if (!tenant) {
      console.error("TenantContext: Tenant not found:", tenantId);
      toast.error("Organización no encontrada");
      return;
    }

    console.log("TenantContext: Switching to tenant:", tenant.name);
    // Save selected tenant to localStorage
    localStorage.setItem('currentTenantId', tenantId);
    setCurrentTenant(tenant);
    await loadSubscriptionDetails(tenantId);
  };

  // Refresh tenants list
  const refreshTenants = async () => {
    console.log("TenantContext: Refreshing tenants");
    await loadTenants();
  };

  // Create a new tenant
  const createTenant = async (name: string, slug: string): Promise<Tenant | null> => {
    if (!user) {
      toast.error("Debes iniciar sesión para crear una organización");
      return null;
    }

    try {
      console.log("TenantContext: Creating new tenant:", name);
      
      // Create the tenant
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .insert([{ name, slug }])
        .select()
        .single();

      if (tenantError) throw tenantError;

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

      if (subscriptionError) throw subscriptionError;

      // Add new tenant to list and switch to it
      const newTenant: Tenant = {
        id: tenantData.id,
        name: tenantData.name,
        slug: tenantData.slug,
        active: true
      };
      
      setTenants([...tenants, newTenant]);
      await switchTenant(newTenant.id);
      toast.success("Organización creada con éxito");
      return newTenant;
    } catch (error: any) {
      console.error("TenantContext: Error creating tenant:", error);
      toast.error(error.message || "Error al crear la organización");
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
