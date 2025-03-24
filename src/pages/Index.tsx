
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center">
      <div className="text-center max-w-3xl mx-auto px-4">
        <Shield className="h-16 w-16 mx-auto mb-6 text-primary" />
        <h1 className="text-4xl font-bold mb-4">Sistema de Gestión de Inventario</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Gestiona tus productos, ventas y usuarios con nuestra plataforma optimizada
        </p>
        
        <div className="flex flex-wrap gap-4 justify-center">
          <Button 
            size="lg" 
            onClick={() => navigate('/dashboard')}
            className="min-w-[150px]"
          >
            Dashboard
          </Button>
          <Button 
            size="lg" 
            onClick={() => navigate('/inventory')}
            variant="outline"
            className="min-w-[150px]"
          >
            Inventario
          </Button>
          <Button 
            size="lg" 
            onClick={() => navigate('/pos')}
            variant="outline"
            className="min-w-[150px]"
          >
            Punto de Venta
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
