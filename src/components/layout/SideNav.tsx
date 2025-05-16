
import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  BarChart2, 
  PieChart, 
  Package, 
  Users, 
  User,
  CreditCard
} from 'lucide-react';
import { useAuth } from '../../hooks/auth/useAuth';
import { useTenant } from '@/contexts/tenant/TenantContext';

interface NavItemProps {
  to: string;
  label: string;
  icon: React.ReactNode;
}

const NavItem: React.FC<NavItemProps> = ({ to, label, icon }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary ${
          isActive ? 'bg-muted font-medium text-primary' : 'text-muted-foreground'
        }`
      }
    >
      {icon}
      {label}
    </NavLink>
  );
};

export const SideNav: React.FC = () => {
  const { hasRole } = useAuth();
  const { subscription } = useTenant();

  const isAdmin = hasRole('admin');
  const isPremium = subscription?.plan === 'premium' || subscription?.plan === 'standard';

  return (
    <div className="pb-12 w-64 border-r min-h-screen">
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Navegación
          </h2>
          <div className="space-y-1">
            <NavItem to="/dashboard" label="Dashboard" icon={<LayoutDashboard size={20} />} />
            <NavItem to="/inventory" label="Inventario" icon={<Package size={20} />} />
            <NavItem to="/pos" label="Punto de Venta" icon={<ShoppingCart size={20} />} />
            
            {/* Analytics section - only for premium */}
            {isPremium && (
              <>
                <h2 className="mt-6 px-4 text-lg font-semibold tracking-tight">
                  Analíticas
                </h2>
                <div className="space-y-1">
                  <NavItem to="/analytics" label="Vista General" icon={<BarChart2 size={20} />} />
                  <NavItem to="/analiticas2" label="Reportes" icon={<PieChart size={20} />} />
                </div>
              </>
            )}
            
            {/* Admin section */}
            <h2 className="mt-6 px-4 text-lg font-semibold tracking-tight">
              Administración
            </h2>
            <div className="space-y-1">
              <NavItem to="/subscription" label="Suscripción" icon={<CreditCard size={20} />} />
              {isAdmin && (
                <NavItem to="/user-roles" label="Usuarios y Roles" icon={<Users size={20} />} />
              )}
              <NavItem to="/profile" label="Mi Perfil" icon={<User size={20} />} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
