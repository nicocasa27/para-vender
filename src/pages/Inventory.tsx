
import { ProductTable } from "@/components/inventory/ProductTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StoreManagement } from "@/components/inventory/StoreManagement";
import { StockTransferManager } from "@/components/inventory/stock-transfer/StockTransferManager";

const Inventory = () => {
  return (
    <div className="space-y-6 animate-fade-in h-full flex flex-col">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Gestión de Inventario</h2>
        <p className="text-muted-foreground mt-2">
          Administre sus productos, realice seguimiento de niveles de stock y monitoree movimientos de inventario.
        </p>
      </div>

      <Tabs defaultValue="products" className="w-full flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-4 sm:w-fit">
          <TabsTrigger value="products">Productos</TabsTrigger>
          <TabsTrigger value="categories">Categorías</TabsTrigger>
          <TabsTrigger value="stores">Sucursales</TabsTrigger>
          <TabsTrigger value="transfers">Transferencias</TabsTrigger>
        </TabsList>
        <TabsContent value="products" className="mt-4 flex-1 flex">
          <ScrollArea className="flex-1">
            <ProductTable />
          </ScrollArea>
        </TabsContent>
        <TabsContent value="categories" className="mt-4 flex-1">
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            La gestión de categorías estará disponible en la próxima actualización.
          </div>
        </TabsContent>
        <TabsContent value="stores" className="mt-4 flex-1 flex">
          <ScrollArea className="flex-1">
            <StoreManagement />
          </ScrollArea>
        </TabsContent>
        <TabsContent value="transfers" className="mt-4 flex-1 flex">
          <ScrollArea className="flex-1">
            <StockTransferManager />
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Inventory;
