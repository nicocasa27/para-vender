
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "./components/layout/MainLayout";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public route */}
            <Route path="/auth" element={<Auth />} />
            
            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/pos" element={<PointOfSale />} />
                <Route path="/analytics" element={<Analytics />} />
                
                {/* Admin-only routes */}
                <Route element={<ProtectedRoute requiredRole="admin" />}>
                  <Route path="/users" element={<UserManagement />} />
                </Route>
                
                {/* Manager/Admin routes */}
                <Route element={<ProtectedRoute requiredRole="manager" />}>
                  <Route path="/config" element={<Configuration />} />
                </Route>
                
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

export default App;
