
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Auth() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerFullName, setRegisterFullName] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCleaningSession, setIsCleaningSession] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  // Clean any existing session when loading the authentication page
  useEffect(() => {
    const cleanSession = async () => {
      try {
        setIsCleaningSession(true);
        setErrorMessage(null);
        
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
    setErrorMessage(null);
    
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
      // Extraer y mostrar el mensaje de error específico
      setErrorMessage(error.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Función reforzada para sincronizar el usuario después del registro
  const syncNewUser = async (userId: string) => {
    if (!userId) return;
    
    try {
      setIsSyncing(true);
      
      console.log("Auth: Realizando llamada directa a la API de Supabase para sincronizar usuario:", userId);
      
      // Primera sincronización: intentar crear el perfil directamente
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: registerEmail,
          full_name: registerFullName
        });
        
      if (profileError) {
        console.error("Error creando/actualizando perfil:", profileError);
      } else {
        console.log("Perfil creado/actualizado correctamente");
      }
      
      // Segunda sincronización: intentar crear rol por defecto
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: 'viewer',
          almacen_id: null
        });
        
      if (roleError) {
        console.error("Error creando rol por defecto:", roleError);
      } else {
        console.log("Rol por defecto creado correctamente");
      }
      
      // Tercera sincronización: llamar a la función edge para asegurar la sincronización
      const { data, error } = await supabase.functions.invoke("sync-users", {
        body: { 
          forceUpdate: true,
          forceSyncAll: false,
          specificUserId: userId
        },
      });
      
      if (error) {
        console.error("Error llamando a la función sync-users:", error);
        throw error;
      }
      
      console.log("Resultado de sincronización para nuevo usuario:", data);
    } catch (error) {
      console.error("Error al sincronizar nuevo usuario:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    
    if (!registerEmail || !registerPassword || !registerFullName) {
      toast.error("Por favor, complete todos los campos");
      return;
    }
    
    try {
      setIsRegistering(true);
      const result = await signUp(registerEmail, registerPassword, registerFullName);
      
      if (result?.user?.id) {
        // Forzar sincronización del usuario recién creado
        await syncNewUser(result.user.id);
      }
      
      toast.success("Cuenta creada exitosamente", {
        description: "Ya puedes iniciar sesión con tus credenciales."
      });
      setActiveTab("login");
      
      // Limpiar los campos del formulario de registro
      setRegisterEmail("");
      setRegisterPassword("");
      setRegisterFullName("");
    } catch (error: any) {
      console.error("Error al registrarse:", error);
      setErrorMessage(error.message);
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
        </div>

        <Tabs 
          defaultValue="login" 
          value={activeTab}
          onValueChange={(value) => {
            setActiveTab(value);
            setErrorMessage(null);
          }}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="login">Iniciar sesión</TabsTrigger>
            <TabsTrigger value="register">Registrarse</TabsTrigger>
          </TabsList>

          {errorMessage && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {errorMessage}
              </AlertDescription>
            </Alert>
          )}

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
                    <Label htmlFor="email">Correo electrónico</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="correo@ejemplo.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Contraseña</Label>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
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
                    {isLoggingIn ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Iniciando sesión...
                      </>
                    ) : (
                      "Iniciar sesión"
                    )}
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
                  Complete el formulario para registrarse en el sistema
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleRegister}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nombre completo</Label>
                    <Input
                      id="fullName"
                      placeholder="Nombre completo"
                      value={registerFullName}
                      onChange={(e) => setRegisterFullName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="registerEmail">Correo electrónico</Label>
                    <Input
                      id="registerEmail"
                      type="email"
                      placeholder="correo@ejemplo.com"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="registerPassword">Contraseña</Label>
                    <Input
                      id="registerPassword"
                      type="password"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                    <p className="text-xs text-muted-foreground">
                      La contraseña debe tener al menos 6 caracteres
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isRegistering || isSyncing}
                  >
                    {isRegistering || isSyncing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {isRegistering ? "Registrando..." : "Sincronizando usuario..."}
                      </>
                    ) : (
                      "Registrarse"
                    )}
                  </Button>
                  {isSyncing && (
                    <p className="text-xs text-muted-foreground">
                      Esto puede tomar unos segundos. Estamos preparando tu cuenta...
                    </p>
                  )}
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
