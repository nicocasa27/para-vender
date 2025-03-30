import MainLayout from "@/components/layout/MainLayout";
import SalesByCategoryChart from "@/components/analytics/SalesByCategoryChart";
import TopProductsChart from "@/components/analytics/TopProductsChart";
import RevenueOverTimeChart from "@/components/analytics/RevenueOverTimeChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Analytics() {
  return (
    <MainLayout>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in p-4">
        {/* Ingresos por día */}
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>Ingresos por Día</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueOverTimeChart />
          </CardContent>
        </Card>

        {/* Ventas por categoría */}
        <Card>
          <CardHeader>
            <CardTitle>Ventas por Categoría</CardTitle>
          </CardHeader>
          <CardContent>
            <SalesByCategoryChart />
          </CardContent>
        </Card>

        {/* Productos más vendidos */}
        <Card>
          <CardHeader>
            <CardTitle>Productos Más Vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            <TopProductsChart />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
