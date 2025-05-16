
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTenant } from "@/contexts/tenant/TenantContext";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, Crown, Shield } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/utils/format-currency";

export interface Plan {
  id: string;
  name: string;
  price: number;
  icon: React.ReactNode;
  features: string[];
  popular?: boolean;
}

const Subscription = () => {
  const navigate = useNavigate();
  const { currentTenant, subscription, refreshTenants } = useTenant();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  if (!currentTenant) {
    navigate("/welcome");
    return null;
  }

  const plans: Plan[] = [
    {
      id: "basic",
      name: "Básico",
      price: 9.99,
      icon: <Shield className="h-6 w-6 mb-2" />,
      features: [
        "1 tienda",
        "100 productos",
        "3 usuarios",
        "Dashboard básico",
        "Soporte por email"
      ]
    },
    {
      id: "standard",
      name: "Estándar",
      price: 29.99,
      icon: <Crown className="h-6 w-6 mb-2 text-amber-500" />,
      features: [
        "5 tiendas",
        "1000 productos",
        "10 usuarios", 
        "Reportes avanzados",
        "Dashboard analítico",
        "Soporte prioritario"
      ],
      popular: true
    },
    {
      id: "premium",
      name: "Premium",
      price: 79.99,
      icon: <Crown className="h-6 w-6 mb-2 text-purple-500" />,
      features: [
        "Tiendas ilimitadas",
        "Productos ilimitados",
        "100 usuarios",
        "API de acceso",
        "Dominio personalizado",
        "Soporte telefónico 24/7"
      ]
    }
  ];
  
  const handleSelectPlan = async (planId: string) => {
    if (!currentTenant) return;
    
    try {
      setIsLoading(planId);
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { planId, tenantId: currentTenant.id }
      });
      
      if (error) throw error;
      if (!data.url) throw new Error("No se recibió URL de checkout");
      
      // Redirigir al checkout de Stripe
      window.location.href = data.url;
    } catch (error: any) {
      console.error("Error creando sesión de checkout:", error);
      toast.error("Error al procesar la suscripción", { 
        description: error.message || "Por favor intenta nuevamente"
      });
    } finally {
      setIsLoading(null);
    }
  };

  const isPlanActive = (planId: string) => {
    return subscription?.plan === planId;
  };

  return (
    <div className="container py-8 max-w-6xl mx-auto">
      <div className="space-y-4 mb-8">
        <h1 className="text-3xl font-bold">Suscripción</h1>
        <p className="text-muted-foreground">
          Elige el plan que mejor se adapte a tus necesidades.
        </p>

        {subscription && (
          <div className="p-4 border rounded-lg bg-muted/30 mb-6">
            <h2 className="font-medium mb-1">Plan actual: <span className="font-bold">{subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)}</span></h2>
            <p className="text-sm text-muted-foreground">
              Estado: {subscription.status === 'active' ? 'Activo' : subscription.status === 'trialing' ? 'Periodo de prueba' : 'Inactivo'}
              {subscription.current_period_end && (
                <> · Próximo pago: {new Date(subscription.current_period_end).toLocaleDateString()}</>
              )}
            </p>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card 
            key={plan.id} 
            className={`relative ${plan.popular ? 'border-primary shadow-md' : ''}`}
          >
            {plan.popular && (
              <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-2 py-1 rounded-bl rounded-tr">
                Popular
              </div>
            )}
            <CardHeader className="text-center">
              <div className="flex justify-center">
                {plan.icon}
              </div>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>
                <span className="text-2xl font-bold">{formatCurrency(plan.price)}</span> /mes
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <ul className="space-y-2">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center justify-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" /> {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                variant={isPlanActive(plan.id) ? "outline" : "default"}
                disabled={isLoading !== null || isPlanActive(plan.id)}
                onClick={() => handleSelectPlan(plan.id)}
              >
                {isLoading === plan.id ? (
                  "Procesando..."
                ) : isPlanActive(plan.id) ? (
                  "Plan Actual"
                ) : (
                  "Seleccionar Plan"
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Subscription;
