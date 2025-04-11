
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductsView } from "@/components/inventory/ProductsView";
import { CategoriesView } from "@/components/inventory/CategoriesView";
import { StoresView } from "@/components/inventory/StoresView";
import { TransfersView } from "@/components/inventory/TransfersView";
import { AlertCircle, Info } from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useProducts } from "@/hooks/useProducts";
import { Skeleton } from "@/components/ui/skeleton";

export function Inventory() {
  const [activeTab, setActiveTab] = useState("products");
  const { userRoles, hasRole } = useAuth();
  const { userStoreIds, loading: productsLoading } = useProducts();
  
  const isAdmin = userRoles.some(role => role.role === 'admin');
  const isManager = userRoles.some(role => role.role === 'manager');
  const isSales = userRoles.some(role => role.role === 'sales');
  const isViewer = userRoles.some(role => role.role === 'viewer');
  
  const handleRefresh = () => {
    // El componente hijo maneja su propia actualización
    console.log("Refresh triggered from parent");
  };

  return (
    <div className="container py-6 space-y-4">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Inventario</h1>
        <p className="text-muted-foreground">
          Gestione el inventario de su negocio.
        </p>
      </div>

      {productsLoading ? (
        <div className="w-full space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <>
          {!isAdmin && !isManager && (
            <Alert variant={isSales ? "default" : "destructive"}>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>
                {isSales 
                  ? "Acceso limitado a sucursales" 
                  : isViewer 
                    ? "Modo visualización" 
                    : "Sin permisos específicos"}
              </AlertTitle>
              <AlertDescription>
                {isSales && userStoreIds && userStoreIds.length > 0 && (
                  <>Usted tiene acceso a {userStoreIds.length} sucursal(es) asignada(s).</>
                )}
                {isSales && (!userStoreIds || userStoreIds.length === 0) && (
                  <>No tiene sucursales asignadas. Contacte a un administrador.</>
                )}
                {isViewer && (
                  <>Tiene permisos de solo lectura. No podrá realizar cambios.</>
                )}
                {!isSales && !isViewer && (
                  <>Su cuenta no tiene permisos asignados. Contacte a un administrador.</>
                )}
              </AlertDescription>
            </Alert>
          )}

          <Tabs 
            defaultValue="products" 
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="products">Productos</TabsTrigger>
              <TabsTrigger value="categories">Categorías</TabsTrigger>
              <TabsTrigger value="stores">Sucursales</TabsTrigger>
              <TabsTrigger value="transfers">Transferencias</TabsTrigger>
            </TabsList>

            <TabsContent value="products" className="mt-6">
              <ProductsView onRefresh={handleRefresh} />
            </TabsContent>

            <TabsContent value="categories" className="mt-6">
              <CategoriesView onRefresh={handleRefresh} />
            </TabsContent>

            <TabsContent value="stores" className="mt-6">
              <StoresView onRefresh={handleRefresh} />
            </TabsContent>

            <TabsContent value="transfers" className="mt-6">
              <TransfersView onRefresh={handleRefresh} />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}

export default Inventory;
