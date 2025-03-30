import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, ShoppingCart, Users, Warehouse } from "lucide-react";

export default function Dashboard() {
  const loading = false;

  return (
    <MainLayout>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Ventas</CardTitle>
            <ShoppingCart />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-full" />
            ) : (
              <p className="text-2xl font-bold">$12,300</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Productos</CardTitle>
            <Warehouse />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-full" />
            ) : (
              <p className="text-2xl font-bold">512</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Usuarios</CardTitle>
            <Users />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-full" />
            ) : (
              <p className="text-2xl font-bold">38</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Estadísticas</CardTitle>
            <BarChart />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-full" />
            ) : (
              <p className="text-2xl font-bold">+18%</p>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
