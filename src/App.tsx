
import React from 'react'
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "./components/layout/MainLayout";
import { AuthProvider } from "./contexts/auth/AuthContext";
import { TenantProvider } from "./contexts/tenant/TenantContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AdminInitializer } from "./components/admin/AdminInitializer";
import Dashboard from "./pages/Dashboard";
import PointOfSale from "./pages/PointOfSale";
import Analytics from "./pages/Analytics";
import Analiticas2 from "./pages/Analiticas2";
import UserRoles from "./pages/UserRoles";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import Welcome from "./pages/Welcome";
import Subscription from "./pages/Subscription";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";
import Index from "./pages/Index";
import InventoryPage from "./pages/Inventory";

// Create a client with default options
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AdminInitializer />
            <Routes>
              {/* Public route */}
              <Route path="/auth" element={<Auth />} />
              
              {/* Protected routes */}
              <Route element={<ProtectedRoute />}>
                {/* Routes that require tenant context */}
                <Route element={
                  <TenantProvider>
                    <></>
                  </TenantProvider>
                }>
                  {/* Welcome page (tenant selection) */}
                  <Route path="/welcome" element={<Welcome />} />
                  
                  {/* Routes that also require MainLayout */}
                  <Route element={<MainLayout />}>
                    <Route path="/" element={<Index />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/inventory" element={<InventoryPage />} />
                    <Route path="/pos" element={<PointOfSale />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/analiticas2" element={<Analiticas2 />} />
                    <Route path="/subscription" element={<Subscription />} />
                    
                    {/* User roles route */}
                    <Route path="/user-roles" element={<UserRoles />} />
                    
                    {/* All authenticated users */}
                    <Route path="/profile" element={<Profile />} />
                  </Route>
                </Route>
              </Route>
              
              {/* Error routes */}
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
