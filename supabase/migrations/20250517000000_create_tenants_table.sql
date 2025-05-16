
-- Create tenants table to manage different organizations using our SaaS
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#0f172a',
  secondary_color TEXT DEFAULT '#6366f1',
  active BOOLEAN DEFAULT true,
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add tenant_id to all existing tables
ALTER TABLE public.almacenes 
  ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);

ALTER TABLE public.categorias 
  ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);

ALTER TABLE public.unidades 
  ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);

ALTER TABLE public.productos 
  ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);

ALTER TABLE public.inventario 
  ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);

ALTER TABLE public.ventas 
  ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);

ALTER TABLE public.detalles_venta 
  ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);

ALTER TABLE public.movimientos 
  ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);

-- Add tenant_id column to user_roles to connect users to tenants
ALTER TABLE public.user_roles
  ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);

-- Create a table to store tenant memberships (which users belong to which tenants)
CREATE TABLE public.tenant_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member', -- admin, member
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, user_id)
);

-- Create subscriptions table to track tenant plans
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan TEXT NOT NULL DEFAULT 'basic', -- basic, standard, premium
  status TEXT NOT NULL DEFAULT 'active', -- active, past_due, canceled, trialing
  trial_ends_at TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create plan limits table to store limits based on plan
CREATE TABLE public.plan_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan TEXT NOT NULL UNIQUE,
  max_products INTEGER NOT NULL,
  max_users INTEGER NOT NULL,
  max_stores INTEGER NOT NULL,
  allow_analytics BOOLEAN NOT NULL DEFAULT false,
  allow_api_access BOOLEAN NOT NULL DEFAULT false,
  allow_custom_domain BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default plan limits
INSERT INTO public.plan_limits (plan, max_products, max_users, max_stores, allow_analytics, allow_api_access, allow_custom_domain)
VALUES 
  ('basic', 100, 3, 1, false, false, false),
  ('standard', 1000, 10, 5, true, false, false),
  ('premium', 10000, 100, 50, true, true, true);

-- Update RLS policies
-- Enable RLS on tenants table
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Tenants can be read by members
CREATE POLICY "tenants_select_for_members" ON public.tenants
  FOR SELECT USING (
    id IN (
      SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()
    )
  );

-- Only tenant admins can update their tenant
CREATE POLICY "tenants_update_for_admins" ON public.tenants
  FOR UPDATE USING (
    id IN (
      SELECT tenant_id FROM public.tenant_users 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Enable RLS on tenant_users
ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;

-- Users can see memberships that involve them
CREATE POLICY "tenant_users_select_policy" ON public.tenant_users
  FOR SELECT USING (
    user_id = auth.uid() OR
    tenant_id IN (
      SELECT tenant_id FROM public.tenant_users 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Only tenant admins can insert/update/delete memberships
CREATE POLICY "tenant_users_insert_for_admins" ON public.tenant_users
  FOR INSERT WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.tenant_users 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "tenant_users_update_for_admins" ON public.tenant_users
  FOR UPDATE USING (
    tenant_id IN (
      SELECT tenant_id FROM public.tenant_users 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "tenant_users_delete_for_admins" ON public.tenant_users
  FOR DELETE USING (
    tenant_id IN (
      SELECT tenant_id FROM public.tenant_users 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
