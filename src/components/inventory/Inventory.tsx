
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductsView } from "@/components/inventory/ProductsView";
import { CategoriesView } from "@/components/inventory/CategoriesView";
import { StoresView } from "@/components/inventory/StoresView";
import { StockTransferManager } from "@/components/inventory/stock-transfer/StockTransferManager";
import { AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useProducts } from "@/hooks/useProducts";
import { Skeleton } from "@/components/ui/skeleton";
import { DebugLogger } from "@/utils/debugLogger";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function Inventory() {
  DebugLogger.log("📦 Inventory: Component initialization started");
  
  const [activeTab, setActiveTab] = useState("products");
  const [showDebugLogs, setShowDebugLogs] = useState(false);
  
  try {
    const { userRoles, hasRole } = useAuth();
    const { userStoreIds, loading: productsLoading } = useProducts();
    
    DebugLogger.log("🔐 Inventory: Auth data loaded", {
      userRoles,
      userStoreIds,
      productsLoading
    });
    
    const isAdmin = userRoles.some(role => role.role === 'admin');
    const isManager = userRoles.some(role => role.role === 'manager');
    const isSales = userRoles.some(role => role.role === 'sales');
    const isViewer = userRoles.some(role => role.role === 'viewer');
    
    const handleRefresh = () => {
      DebugLogger.log("🔄 Inventory: Refresh triggered from parent");
    };

    const renderDebugSection = () => {
      if (!showDebugLogs) return null;
      
      const logs = DebugLogger.getStoredLogs();
      
      return (
        <Card className="mb-4 border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-sm">🐛 Debug Logs</CardTitle>
            <CardDescription>
              Últimos logs del sistema para debugging
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-40 overflow-y-auto bg-black text-green-400 p-2 rounded text-xs font-mono">
              {logs.slice(-20).map((log: any, index: number) => (
                <div key={index} className="mb-1">
                  <span className="text-gray-400">[{new Date(log.timestamp).toLocaleTimeString()}]</span> 
                  <span className="ml-2">{log.message}</span>
                  {log.data && <pre className="text-blue-300 ml-4">{JSON.stringify(log.data, null, 2)}</pre>}
                </div>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => DebugLogger.clearLogs()}
              >
                Limpiar Logs
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  const allLogs = DebugLogger.getStoredLogs();
                  navigator.clipboard.writeText(JSON.stringify(allLogs, null, 2));
                }}
              >
                Copiar Logs
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    };

    return (
      <div className="container py-6 space-y-4">
        <div className="flex flex-col space-y-2">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Inventario</h1>
              <p className="text-muted-foreground">
                Gestione el inventario de su negocio.
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowDebugLogs(!showDebugLogs)}
            >
              🐛 Debug {showDebugLogs ? 'OFF' : 'ON'}
            </Button>
          </div>
        </div>

        {renderDebugSection()}

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
                <StockTransferManager />
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    );
  } catch (error) {
    DebugLogger.log("💥 Inventory: CRITICAL ERROR in component:", error);
    
    return (
      <div className="container py-6 space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error en Inventario</AlertTitle>
          <AlertDescription>
            Ha ocurrido un error al cargar el inventario. Revisa los logs de debug.
          </AlertDescription>
        </Alert>
        <Button onClick={() => window.location.reload()}>
          Recargar Página
        </Button>
      </div>
    );
  }
}

export default Inventory;
