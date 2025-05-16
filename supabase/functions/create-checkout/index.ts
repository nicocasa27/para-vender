
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.18.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { planId, tenantId } = await req.json();
    
    if (!planId || !tenantId) {
      return new Response(
        JSON.stringify({ error: "Se requiere planId y tenantId" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Obtener STRIPE_SECRET_KEY y URL de Supabase desde variables de entorno
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    if (!stripeKey) {
      return new Response(
        JSON.stringify({ error: "Configuración de Stripe no disponible" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Crear cliente de Supabase con clave de servicio para operaciones admin
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Autenticar al usuario desde el token de autorización
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Se requiere autorización" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Usuario no autenticado" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    // Verificar que el usuario tiene acceso al tenant
    const { data: tenantAccess, error: tenantError } = await supabaseAdmin
      .from("tenant_users")
      .select("role")
      .eq("tenant_id", tenantId)
      .eq("user_id", user.id)
      .single();

    if (tenantError || !tenantAccess) {
      return new Response(
        JSON.stringify({ error: "No tienes acceso a esta organización" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    // Obtener información del tenant
    const { data: tenant, error: tenantInfoError } = await supabaseAdmin
      .from("tenants")
      .select("*")
      .eq("id", tenantId)
      .single();

    if (tenantInfoError || !tenant) {
      return new Response(
        JSON.stringify({ error: "Organización no encontrada" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // Obtener información de suscripción existente
    const { data: subscription } = await supabaseAdmin
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("tenant_id", tenantId)
      .single();

    // Inicializar Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Definir los precios según el plan
    const prices = {
      "basic": "price_basic_monthly", // Reemplazar con ID real de Stripe
      "standard": "price_standard_monthly", // Reemplazar con ID real de Stripe
      "premium": "price_premium_monthly", // Reemplazar con ID real de Stripe
    };

    const price = prices[planId as keyof typeof prices];
    if (!price) {
      return new Response(
        JSON.stringify({ error: "Plan no válido" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    let customerId = subscription?.stripe_customer_id;

    // Si no existe cliente en Stripe, crearlo
    if (!customerId) {
      const newCustomer = await stripe.customers.create({
        email: user.email,
        name: tenant.name,
        metadata: {
          tenant_id: tenant.id,
        },
      });
      customerId = newCustomer.id;

      // Actualizar/insertar el registro de suscripción con el ID de cliente
      await supabaseAdmin
        .from("subscriptions")
        .upsert({
          tenant_id: tenantId,
          stripe_customer_id: customerId,
          plan: planId,
          status: "incomplete",
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "tenant_id"
        });
    }

    // Crear sesión de checkout
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{
        price: price,
        quantity: 1,
      }],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/dashboard?canceled=true`,
      subscription_data: {
        metadata: {
          tenant_id: tenantId,
        },
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error en create-checkout:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || "Error interno del servidor" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
