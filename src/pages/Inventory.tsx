
import { ProductTable } from "@/components/inventory/ProductTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Inventory = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Gestión de Inventario</h2>
        <p className="text-muted-foreground mt-2">
          Administre sus productos, realice seguimiento de niveles de stock y monitoree movimientos de inventario.
        </p>
      </div>

      <Tabs defaultValue="products" className="w-full">
        <TabsList className="grid w-full grid-cols-3 sm:w-fit">
          <TabsTrigger value="products">Productos</TabsTrigger>
          <TabsTrigger value="categories">Categorías</TabsTrigger>
          <TabsTrigger value="transfers">Transferencias</TabsTrigger>
        </TabsList>
        <TabsContent value="products" className="mt-4">
          <ProductTable />
        </TabsContent>
        <TabsContent value="categories" className="mt-4">
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            La gestión de categorías estará disponible en la próxima actualización.
          </div>
        </TabsContent>
        <TabsContent value="transfers" className="mt-4">
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            La funcionalidad de transferencia de stock estará disponible en la próxima actualización.
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Inventory;
