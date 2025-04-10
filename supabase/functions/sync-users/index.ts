
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Define CORS headers for browser access
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No se proporcionó token de autorización" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase admin client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Configuración de Supabase no disponible" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all users from auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error("Error obteniendo usuarios de auth:", authError);
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get existing profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id');
      
    if (profilesError) {
      console.error("Error obteniendo perfiles:", profilesError);
      return new Response(
        JSON.stringify({ error: profilesError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create map of existing profiles
    const profileMap = new Map();
    profiles?.forEach(profile => {
      profileMap.set(profile.id, true);
    });

    // Find users in auth but not in profiles
    const usersToCreate = authUsers.users.filter(user => !profileMap.has(user.id));
    
    console.log(`Se encontraron ${usersToCreate.length} usuarios para crear perfiles`);
    
    // Create profiles and default roles for each missing user
    let createdProfiles = 0;
    
    for (const user of usersToCreate) {
      // Prepare user data
      const userData = {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || 
                  user.user_metadata?.name || 
                  user.email?.split('@')[0] || 
                  "Usuario sin nombre"
      };
      
      // Create profile
      const { error: insertError } = await supabase
        .from('profiles')
        .insert(userData);
        
      if (insertError) {
        console.error(`Error al crear perfil para ${user.email}:`, insertError);
        continue;
      }
      
      // Create default viewer role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          role: 'viewer',
          almacen_id: null
        });
        
      if (roleError) {
        console.error(`Error al crear rol para ${user.email}:`, roleError);
        continue;
      }
      
      createdProfiles++;
    }

    // Find profiles without auth users
    const profilesWithoutAuth = [];
    
    for (const profile of profiles || []) {
      const authUser = authUsers.users.find(u => u.id === profile.id);
      if (!authUser) {
        profilesWithoutAuth.push(profile.id);
      }
    }

    // Return summary
    return new Response(
      JSON.stringify({
        success: true,
        created: createdProfiles,
        missingAuth: profilesWithoutAuth.length,
        missingAuthIds: profilesWithoutAuth
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in sync-users function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
