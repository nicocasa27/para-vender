
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/auth";
import { ProfitabilityView } from "@/components/analytics/ProfitabilityView";
import { BarChart3, LineChart, PieChart } from "lucide-react";

export default function Analiticas2() {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('admin');
  const [activeTab, setActiveTab] = useState<string>("profitability");
  
  // Safe array access examples
  const safeGetName = (array: any[] | null | undefined) => {
    return array && array.length > 0 ? array[0].nombre : "Sin nombre";
  };
  
  const safeGetId = (array: any[] | null | undefined) => {
    return array && array.length > 0 ? array[0].id : "default-id";
  };
  
  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Analíticas Avanzadas</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="profitability" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <span>Rentabilidad</span>
              </TabsTrigger>
              <TabsTrigger value="trends" className="flex items-center gap-2">
                <LineChart className="h-4 w-4" />
                <span>Tendencias</span>
              </TabsTrigger>
              <TabsTrigger value="categories" className="flex items-center gap-2">
                <PieChart className="h-4 w-4" />
                <span>Categorías</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="profitability">
              <ProfitabilityView />
            </TabsContent>
            
            <TabsContent value="trends">
              <div className="p-6 text-center">
                <h2 className="text-xl font-semibold mb-4">Análisis de Tendencias</h2>
                <p className="text-muted-foreground">
                  Esta sección está actualmente en desarrollo. Estamos trabajando para 
                  proporcionar análisis de tendencias para su negocio.
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="categories">
              <div className="p-6 text-center">
                <h2 className="text-xl font-semibold mb-4">Análisis por Categorías</h2>
                <p className="text-muted-foreground">
                  Esta sección está actualmente en desarrollo. Estamos trabajando para 
                  proporcionar análisis detallado por categorías para su negocio.
                </p>
              </div>
            </TabsContent>
          </Tabs>
          
          {isAdmin && (
            <p className="mt-4 text-sm text-blue-600">
              Como administrador, tendrás acceso a todas las analíticas cuando 
              estén disponibles.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
