
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { StockTransferForm } from "./StockTransferForm";
import { BulkTransferForm } from "./BulkTransferForm";
import { TransferHistory } from "./TransferHistory";
import { Package, Packages } from "lucide-react";

export function StockTransferManager() {
  const [refreshHistoryToggle, setRefreshHistoryToggle] = useState(false);
  const [activeTab, setActiveTab] = useState("single");

  const handleTransferComplete = () => {
    setRefreshHistoryToggle(!refreshHistoryToggle);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Tabs 
        defaultValue="single" 
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="single" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Transferencia Individual
          </TabsTrigger>
          <TabsTrigger value="bulk" className="flex items-center gap-2">
            <Packages className="h-4 w-4" />
            Transferencia Masiva
          </TabsTrigger>
        </TabsList>

        <TabsContent value="single" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Transferir Stock</CardTitle>
                <CardDescription>
                  Mueva un producto entre sucursales de manera rápida
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StockTransferForm onTransferComplete={handleTransferComplete} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Historial de Transferencias</CardTitle>
                <CardDescription>
                  Últimas 10 transferencias realizadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TransferHistory key={refreshHistoryToggle.toString()} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="bulk" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2 lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Transferencia Masiva</CardTitle>
                  <CardDescription>
                    Transfiera múltiples productos entre sucursales a la vez
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <BulkTransferForm onTransferComplete={handleTransferComplete} />
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Historial de Transferencias</CardTitle>
                <CardDescription>
                  Últimas 10 transferencias realizadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TransferHistory key={refreshHistoryToggle.toString()} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
