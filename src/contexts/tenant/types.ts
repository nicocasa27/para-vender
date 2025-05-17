
// Define tenant types

export type TenantPlan = "basic" | "standard" | "premium";
export type SubscriptionStatus = "active" | "past_due" | "canceled" | "trialing";

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  subscription?: {
    id: string;
    tenant_id: string;
    status: SubscriptionStatus;
    plan: TenantPlan;
    trial_ends_at?: string | null;
    current_period_end?: string | null;
    stripe_customer_id?: string | null;
    stripe_subscription_id?: string | null;
  } | null;
}
