import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Store } from "lucide-react";
import { toast } from "sonner";

export default function Auth() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerFullName, setRegisterFullName] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const { signIn, signUp } = useAuth();

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
      await signUp(registerEmail, registerPassword, registerFullName);
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
      toast.error("Error al crear la cuenta", {
        description: error.message || "Hubo un problema al registrarse"
      });
    } finally {
      setIsRegistering(false);
    }
  };

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
                <CardFooter>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isRegistering}
                  >
                    {isRegistering ? "Registrando..." : "Registrarse"}
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
