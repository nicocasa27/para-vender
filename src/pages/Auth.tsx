
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { syncUserToTables } from "@/contexts/auth/utils/user-sync";
import { AuthRepairButton } from "@/components/auth/AuthRepairButton";

export default function Auth() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerFullName, setRegisterFullName] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isCleaningSession, setIsCleaningSession] = useState(true);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  // Clean any existing session when loading the authentication page
  useEffect(() => {
    const cleanSession = async () => {
      try {
        setIsCleaningSession(true);
        
        // Clean localStorage and sessionStorage data
        localStorage.removeItem('supabase.auth.token');
        sessionStorage.removeItem('supabase.auth.token');
        
        // Also clear any other potential Supabase related storage items
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('supabase.')) {
            localStorage.removeItem(key);
          }
        }
        
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key && key.startsWith('supabase.')) {
            sessionStorage.removeItem(key);
          }
        }
        
        // Sign out from Supabase
        await supabase.auth.signOut();
        
        console.log("Auth page: Session cleaned on load");
      } catch (error) {
        console.error("Error cleaning session:", error);
      } finally {
        setIsCleaningSession(false);
      }
    };
    
    cleanSession();
  }, []);
  
  // Redirect to dashboard if already authenticated
  useEffect(() => {
    const checkSession = async () => {
      if (isCleaningSession) return;
      
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        // Verify that the user exists in profiles table before redirecting
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', data.session.user.id)
            .maybeSingle();
            
          if (profileError || !profile) {
            console.error("Auth page: User found in session but not in profiles");
            await supabase.auth.signOut();
            localStorage.removeItem('supabase.auth.token');
            sessionStorage.removeItem('supabase.auth.token');
            return;
          }
          
          // Only redirect if the user exists in the profiles table
          navigate('/dashboard');
        } catch (error) {
          console.error("Error checking profile:", error);
          // If there's an error, don't redirect and clean the session
          await supabase.auth.signOut();
          localStorage.removeItem('supabase.auth.token');
          sessionStorage.removeItem('supabase.auth.token');
        }
      }
    };
    
    checkSession();
  }, [navigate, isCleaningSession]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginEmail || !loginPassword) {
      toast.error("Por favor, complete todos los campos");
      return;
    }
    
    try {
      setIsLoggingIn(true);
      await signIn(loginEmail, loginPassword);
      // Navigate is handled in the signIn method
    } catch (error: any) {
      console.error("Error al iniciar sesión:", error);
      // Error handling is done in the signIn method
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!registerEmail || !registerPassword || !registerFullName) {
      toast.error("Por favor, complete todos los campos");
      return;
    }
    
    try {
      setIsRegistering(true);
      
      // Primero registrar en Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: registerEmail,
        password: registerPassword,
        options: {
          data: {
            full_name: registerFullName,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        console.log("Usuario registrado en Auth:", data.user.id);
        
        // Sincronizar inmediatamente con las tablas de la aplicación
        await syncUserToTables(data.user.id, registerEmail, registerFullName);
        
        toast.success("Cuenta creada exitosamente", {
          description: "Ya puedes iniciar sesión con tus credenciales."
        });
        
        setActiveTab("login");
        
        // Limpiar los campos del formulario de registro
        setRegisterEmail("");
        setRegisterPassword("");
        setRegisterFullName("");
      }
    } catch (error: any) {
      console.error("Error al registrarse:", error);
      toast.error("Error al crear la cuenta", {
        description: error.message || "Hubo un problema al registrarse"
      });
    } finally {
      setIsRegistering(false);
    }
  };

  if (isCleaningSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Store className="h-12 w-12 text-primary mx-auto animate-pulse mb-4" />
          <p className="text-sm text-muted-foreground">
            Preparando página de autenticación...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Store className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Mi-Tiendita</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sistema de gestión para tu negocio
          </p>
          {user && (
            <div className="mt-4 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                Usuario detectado pero puede tener problemas de sincronización
              </p>
              <AuthRepairButton />
            </div>
          )}
        </div>

        <Tabs 
          defaultValue="login" 
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="login">Iniciar sesión</TabsTrigger>
            <TabsTrigger value="register">Registrarse</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Iniciar sesión</CardTitle>
                <CardDescription>
                  Ingrese sus credenciales para acceder al sistema
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleLogin}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="usuario@ejemplo.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      disabled={isLoggingIn}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      disabled={isLoggingIn}
                      required
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoggingIn}
                  >
                    {isLoggingIn && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {isLoggingIn ? "Iniciando sesión..." : "Iniciar sesión"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="register">
            <Card>
              <CardHeader>
                <CardTitle>Crear cuenta</CardTitle>
                <CardDescription>
                  Ingrese sus datos para crear una nueva cuenta
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleRegister}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nombre completo</Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Juan Pérez"
                      value={registerFullName}
                      onChange={(e) => setRegisterFullName(e.target.value)}
                      disabled={isRegistering}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="registerEmail">Email</Label>
                    <Input
                      id="registerEmail"
                      type="email"
                      placeholder="usuario@ejemplo.com"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      disabled={isRegistering}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="registerPassword">Contraseña</Label>
                    <Input
                      id="registerPassword"
                      type="password"
                      placeholder="••••••••"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      disabled={isRegistering}
                      required
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isRegistering}
                  >
                    {isRegistering && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {isRegistering ? "Creando cuenta..." : "Crear cuenta"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
