
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "./components/layout/MainLayout";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AdminInitializer } from "./components/admin/AdminInitializer";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import PointOfSale from "./pages/PointOfSale";
import Analytics from "./pages/Analytics";
import Configuration from "./pages/Configuration";
import UserManagement from "./pages/UserManagement";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";
import Index from "./pages/Index";
import { useEffect } from "react";

// Create a client with default options
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // Reduce retries to prevent looping
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false, // Disable refetch on window focus
    },
  },
});

const App = () => {
  useEffect(() => {
    console.log("App mounted");
  }, []);

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
                <Route element={<MainLayout />}>
                  <Route path="/" element={<Index />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/inventory" element={<Inventory />} />
                  <Route path="/pos" element={<PointOfSale />} />
                  <Route path="/analytics" element={<Analytics />} />
                  
                  {/* These two routes will use the effectiveRequiredRole logic in ProtectedRoute */}
                  <Route path="/users" element={<UserManagement />} />
                  <Route path="/config" element={<Configuration />} />
                  
                  {/* All authenticated users */}
                  <Route path="/profile" element={<Profile />} />
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
