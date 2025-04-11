
// Mantengo el código original, pero corrijo las propiedades
import { useState } from "react";
import { SideNav, SideNavProps } from "./SideNav";
import { TopNav } from "./TopNav";
import { Outlet } from "react-router-dom";

export function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <div className="w-64 hidden lg:block border-r">
        <SideNav className="px-4 pt-6 pb-10" />
      </div>
      <div className="flex-1 flex flex-col">
        <TopNav onMenuButtonClick={() => setSidebarOpen(!sidebarOpen)} />
        <div className="flex-1">
          <Outlet />
        </div>
      </div>
      <div
        className={`fixed inset-0 z-50 lg:hidden ${
          sidebarOpen ? "block" : "hidden"
        }`}
      >
        <div
          className="absolute inset-0 bg-zinc-950/20"
          onClick={() => setSidebarOpen(false)}
        />
        <div className="absolute inset-y-0 left-0 w-full max-w-xs bg-white shadow-lg">
          <SideNav className="px-6 pt-6 pb-10" />
        </div>
      </div>
    </div>
  );
}
