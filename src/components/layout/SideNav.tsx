
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart4,
  Settings,
  ChevronLeft,
  ChevronRight,
  Store,
  Users
} from "lucide-react";

interface SideNavProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const SideNav: React.FC<SideNavProps> = ({ open, setOpen }) => {
  const location = useLocation();
  
  const navItems = [
    {
      title: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
    },
    {
      title: "Inventory",
      href: "/inventory",
      icon: Package,
    },
    {
      title: "Point of Sale",
      href: "/pos",
      icon: ShoppingCart,
    },
    {
      title: "Analytics",
      href: "/analytics",
      icon: BarChart4,
    },
    {
      title: "Configuration",
      href: "/config",
      icon: Settings,
    },
    {
      title: "User Roles",
      href: "/user-roles",
      icon: Users,
    },
  ];

  return (
    <div
      className={cn(
        "h-screen border-r bg-sidebar overflow-hidden transition-all duration-300 ease-spring",
        open ? "w-64" : "w-16"
      )}
    >
      <div className="flex h-16 items-center border-b px-4">
        <div className="flex items-center gap-2 transition-all duration-300">
          <div className={cn("flex items-center justify-center transition-all duration-300",
                           !open && "w-full")}>
            <Store className="h-8 w-8 text-primary" />
          </div>
          {open && (
            <span className="font-display text-lg font-semibold tracking-tight animate-fade-in">
              Mi-Tiendita
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className={cn("absolute right-0 mx-2 text-sidebar-foreground hover:text-foreground",
                      !open && "right-auto")}
          onClick={() => setOpen(!open)}
        >
          {open ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>
      <ScrollArea className="h-[calc(100vh-4rem)]">
        <div className="px-2 py-4">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link key={item.href} to={item.href}>
                <div
                  className={cn(
                    "flex items-center py-2 px-3 rounded-md text-sm font-medium transition-all",
                    location.pathname === item.href
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon className={cn("h-5 w-5 transition-all", 
                                         open ? "mr-2" : "mx-auto")} />
                  {open && <span>{item.title}</span>}
                </div>
              </Link>
            ))}
          </nav>
        </div>
      </ScrollArea>
    </div>
  );
};
