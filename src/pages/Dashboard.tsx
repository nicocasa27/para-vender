
import { LayoutDashboard, DollarSign, Package, Store, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { RecentSalesTable } from "@/components/dashboard/RecentSalesTable";
import { InventorySummary } from "@/components/dashboard/InventorySummary";

const Dashboard = () => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground mt-2">
          Welcome to Mi-Tiendita, your complete inventory and point-of-sale system.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Sales"
          value="$24,780.00"
          icon={DollarSign}
          description="Last 30 days"
          trend={12}
        />
        <StatCard
          title="Product Count"
          value="328"
          icon={Package}
          description="Across all categories"
          trend={4}
        />
        <StatCard
          title="Store Count"
          value="3"
          icon={Store}
          description="All locations"
        />
        <StatCard
          title="Profit"
          value="$8,293.00"
          icon={TrendingUp}
          description="Last 30 days"
          trend={-2}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SalesChart />
        <InventorySummary />
      </div>

      <RecentSalesTable />
    </div>
  );
};

export default Dashboard;
