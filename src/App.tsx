
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/auth";
import { TenantProvider } from "@/contexts/tenant/TenantContext";
import { DebugNotifications } from "@/components/debug/DebugNotifications";

// Import pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import InventoryPage from "./pages/Inventory";
import PointOfSale from "./pages/PointOfSale";
import Analytics from "./pages/Analytics";
import Profile from "./pages/Profile";
import UserRoles from "./pages/UserRoles";
import Welcome from "./pages/Welcome";
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";
import Subscription from "./pages/Subscription";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <TenantProvider>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/inventory" element={<InventoryPage />} />
                <Route path="/pos" element={<PointOfSale />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/user-roles" element={<UserRoles />} />
                <Route path="/welcome" element={<Welcome />} />
                <Route path="/unauthorized" element={<Unauthorized />} />
                <Route path="/subscription" element={<Subscription />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <DebugNotifications />
            </TenantProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
