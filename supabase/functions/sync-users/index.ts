
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
    console.log("Starting user synchronization process");
    
    // Get request body if available
    let requestBody = {};
    try {
      if (req.body) {
        const bodyText = await req.text();
        if (bodyText) {
          requestBody = JSON.parse(bodyText);
        }
      }
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      // Continue even if body parsing fails
    }
    
    const forceUpdate = requestBody.forceUpdate === true;
    console.log(`Force update mode: ${forceUpdate}`);

    // Create Supabase admin client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase configuration");
      return new Response(
        JSON.stringify({ error: "Configuración de Supabase no disponible" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all users from auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers({
      perPage: 1000,  // Increased to handle more users
    });
    
    if (authError) {
      console.error("Error obteniendo usuarios de auth:", authError);
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${authUsers.users.length} users in auth system`);

    // Get existing profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, full_name');
      
    if (profilesError) {
      console.error("Error obteniendo perfiles:", profilesError);
      return new Response(
        JSON.stringify({ error: profilesError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${profiles?.length || 0} existing profiles`);

    // Create map of existing profiles
    const profileMap = new Map();
    profiles?.forEach(profile => {
      profileMap.set(profile.id, profile);
    });

    // Find users in auth but not in profiles
    const usersToCreate = authUsers.users.filter(user => !profileMap.has(user.id));
    
    console.log(`Found ${usersToCreate.length} users that need profiles created`);
    
    // Create profiles and default roles for each missing user
    let createdProfiles = 0;
    let updatedProfiles = 0;
    const createdProfileDetails = [];
    
    // Process users that need profiles
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
      
      console.log(`Creating profile for user: ${userData.email} (${userData.id})`);
      
      // Create profile
      const { data: insertData, error: insertError } = await supabase
        .from('profiles')
        .insert(userData)
        .select();
        
      if (insertError) {
        console.error(`Error al crear perfil para ${user.email}:`, insertError);
        continue;
      }
      
      console.log(`Profile created successfully for ${userData.email}`);
      createdProfileDetails.push(userData);
      createdProfiles++;
      
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
      
      console.log(`Default role created for ${userData.email}`);
    }
    
    // If in force update mode, update existing profiles with latest metadata
    if (forceUpdate) {
      console.log("Force update mode: Updating existing profiles with latest metadata");
      
      for (const user of authUsers.users) {
        if (profileMap.has(user.id)) {
          const existingProfile = profileMap.get(user.id);
          const newFullName = user.user_metadata?.full_name || 
                            user.user_metadata?.name || 
                            existingProfile.full_name;
          
          // Only update if there's a difference
          if (newFullName && newFullName !== existingProfile.full_name) {
            console.log(`Updating profile for user: ${user.email} (${user.id})`);
            
            const { error: updateError } = await supabase
              .from('profiles')
              .update({
                full_name: newFullName,
                email: user.email // Ensure email is updated too
              })
              .eq('id', user.id);
              
            if (updateError) {
              console.error(`Error al actualizar perfil para ${user.email}:`, updateError);
            } else {
              updatedProfiles++;
              console.log(`Profile updated successfully for ${user.email}`);
            }
          }
        }
      }
    }

    // Check for users with missing roles
    let createdRoles = 0;
    const usersWithProfiles = profiles?.map(p => p.id) || [];
    
    // Get all existing roles
    const { data: existingRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id');
      
    if (rolesError) {
      console.error("Error fetching roles:", rolesError);
    } else {
      console.log(`Found ${existingRoles?.length || 0} existing roles`);
      
      // Create map of users with roles
      const roleMap = new Map();
      existingRoles?.forEach(role => {
        roleMap.set(role.user_id, true);
      });
      
      // Find users with profiles but no roles
      const usersNeedingRoles = usersWithProfiles.filter(userId => !roleMap.has(userId));
      console.log(`Found ${usersNeedingRoles.length} users without roles`);
      
      // Create default roles
      for (const userId of usersNeedingRoles) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            role: 'viewer',
            almacen_id: null
          });
          
        if (roleError) {
          console.error(`Error creating default role for user ${userId}:`, roleError);
        } else {
          createdRoles++;
          console.log(`Created default role for user ${userId}`);
        }
      }
    }

    // Find profiles without auth users (orphaned profiles)
    const profilesWithoutAuth = [];
    
    for (const profile of profiles || []) {
      const authUser = authUsers.users.find(u => u.id === profile.id);
      if (!authUser) {
        profilesWithoutAuth.push({
          id: profile.id,
          email: profile.email
        });
      }
    }

    console.log(`Found ${profilesWithoutAuth.length} orphaned profiles without auth users`);

    // Return summary
    return new Response(
      JSON.stringify({
        success: true,
        created_profiles: createdProfiles,
        updated_profiles: updatedProfiles,
        created_roles: createdRoles,
        orphaned_profiles: profilesWithoutAuth.length,
        orphaned_profile_details: profilesWithoutAuth,
        created_profile_details: createdProfileDetails,
        message: `Created ${createdProfiles} profiles, updated ${updatedProfiles} profiles, and created ${createdRoles} roles`
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
