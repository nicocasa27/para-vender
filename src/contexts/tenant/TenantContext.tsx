
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/auth/useAuth';

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

  // Load user's tenants
  const loadTenants = async () => {
    if (!user) {
      setTenants([]);
      setCurrentTenant(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tenant_users')
        .select('tenant_id, tenants(*)')
        .eq('user_id', user.id);

      if (error) throw error;

      const userTenants = data.map(item => item.tenants) as Tenant[];
      setTenants(userTenants);

      // Get previously selected tenant from localStorage or use first tenant
      const savedTenantId = localStorage.getItem('currentTenantId');
      const initialTenant = savedTenantId 
        ? userTenants.find(t => t.id === savedTenantId) 
        : userTenants[0] || null;

      if (initialTenant) {
        await switchTenant(initialTenant.id);
      } else {
        setCurrentTenant(null);
      }
    } catch (error) {
      console.error("Error loading tenants:", error);
      toast.error("Error al cargar las organizaciones");
    } finally {
      setLoading(false);
    }
  };

  // Load subscription and plan limits for the current tenant
  const loadSubscriptionDetails = async (tenantId: string) => {
    try {
      // Load subscription
      const { data: subData, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('tenant_id', tenantId)
        .single();

      if (subError && subError.code !== 'PGRST116') throw subError;

      if (subData) {
        setSubscription({
          plan: subData.plan,
          status: subData.status,
          trial_ends_at: subData.trial_ends_at,
          current_period_end: subData.current_period_end
        });

        // Load plan limits
        const { data: limitData, error: limitError } = await supabase
          .from('plan_limits')
          .select('*')
          .eq('plan', subData.plan)
          .single();

        if (limitError) throw limitError;

        setPlanLimits(limitData);
      } else {
        // If no subscription is found, use basic plan limits
        const { data: defaultLimitData, error: defaultLimitError } = await supabase
          .from('plan_limits')
          .select('*')
          .eq('plan', 'basic')
          .single();

        if (defaultLimitError) throw defaultLimitError;

        setPlanLimits(defaultLimitData);
        setSubscription({
          plan: 'basic',
          status: 'trialing',
        });
      }
    } catch (error) {
      console.error("Error loading subscription details:", error);
      setPlanLimits(null);
      setSubscription(null);
    }
  };

  // Switch to a different tenant
  const switchTenant = async (tenantId: string) => {
    const tenant = tenants.find(t => t.id === tenantId);
    if (!tenant) {
      toast.error("Organización no encontrada");
      return;
    }

    // Save selected tenant to localStorage
    localStorage.setItem('currentTenantId', tenantId);
    setCurrentTenant(tenant);
    await loadSubscriptionDetails(tenantId);
  };

  // Refresh tenants list
  const refreshTenants = async () => {
    await loadTenants();
  };

  // Create a new tenant
  const createTenant = async (name: string, slug: string): Promise<Tenant | null> => {
    if (!user) {
      toast.error("Debes iniciar sesión para crear una organización");
      return null;
    }

    try {
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
      console.error("Error creating tenant:", error);
      toast.error(error.message || "Error al crear la organización");
      return null;
    }
  };

  // Load tenants when user changes
  useEffect(() => {
    loadTenants();
  }, [user]);

  return (
    <TenantContext.Provider value={{
      currentTenant,
      tenants,
      subscription,
      planLimits,
      loading,
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
