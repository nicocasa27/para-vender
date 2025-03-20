
import { ProductTable } from "@/components/inventory/ProductTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Inventory = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Inventory Management</h2>
        <p className="text-muted-foreground mt-2">
          Manage your products, track stock levels across stores, and monitor inventory movements.
        </p>
      </div>

      <Tabs defaultValue="products" className="w-full">
        <TabsList className="grid w-full grid-cols-3 sm:w-fit">
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="transfers">Stock Transfers</TabsTrigger>
        </TabsList>
        <TabsContent value="products" className="mt-4">
          <ProductTable />
        </TabsContent>
        <TabsContent value="categories" className="mt-4">
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Category management will be available in the next update.
          </div>
        </TabsContent>
        <TabsContent value="transfers" className="mt-4">
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Stock transfer functionality will be available in the next update.
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Inventory;
