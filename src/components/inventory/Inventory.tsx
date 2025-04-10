
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductsView } from "@/components/ProductsView";
import { CategoriesView } from "@/components/inventory/CategoriesView";
import { StoresView } from "@/components/inventory/StoresView";
import { StockTransfer } from "./StockTransfer";
import { useCurrentStores } from "@/hooks/useCurrentStores";
import { useAuth } from "@/contexts/auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

export function Inventory() {
  const [activeView, setActiveView] = useState<
    "products" | "categories" | "stores" | "transfers"
  >("products");

  const { hasStores, stores: userStores } = useCurrentStores();
  const { userRoles } = useAuth();
  
  // Determinar si el usuario es administrador
  const isAdmin = userRoles.some(role => role.role === 'admin');

  return (
    <div className="container py-6 max-w-7xl mx-auto space-y-6">
      {!isAdmin && !hasStores && (
        <Alert className="mb-4">
          <Info className="h-4 w-4" />
          <AlertTitle>Sin sucursales asignadas</AlertTitle>
          <AlertDescription>
            No tienes sucursales asignadas a tu cuenta. Contacta a un administrador para que te asigne una sucursal.
          </AlertDescription>
        </Alert>
      )}
      
      {!isAdmin && hasStores && (
        <Alert variant="default" className="mb-4 bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800">Sucursales asignadas</AlertTitle>
          <AlertDescription className="text-blue-700">
            Solo puedes ver inventario de las siguientes sucursales: {userStores.map(s => s.nombre).join(", ")}
          </AlertDescription>
        </Alert>
      )}
      
      <Tabs
        defaultValue="products"
        value={activeView}
        onValueChange={(value) => setActiveView(value as any)}
      >
        <TabsList className="mb-4">
          <TabsTrigger value="products">Productos</TabsTrigger>
          <TabsTrigger value="categories">Categorías</TabsTrigger>
          <TabsTrigger value="stores">Sucursales</TabsTrigger>
          <TabsTrigger value="transfers">Transferencias</TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <ProductsView />
        </TabsContent>
        
        <TabsContent value="categories">
          <CategoriesView />
        </TabsContent>
        
        <TabsContent value="stores">
          <StoresView />
        </TabsContent>
        
        <TabsContent value="transfers">
          <StockTransfer />
        </TabsContent>
      </Tabs>
    </div>
  );
}
