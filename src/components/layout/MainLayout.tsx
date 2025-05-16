
import React from "react";
import { Outlet } from "react-router-dom";
import { SideNav } from "./SideNav";
import { TopNav } from "./TopNav";
import { ScrollArea } from "@/components/ui/scroll-area";

export const MainLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Pass props using correct prop names from the SideNav component definition */}
      <SideNav isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <main className="flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-spring">
        {/* Pass props using correct prop names from the TopNav component definition */}
        <TopNav isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        <ScrollArea className="flex-1 overflow-auto p-4 md:p-6 animate-fade-in">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </ScrollArea>
      </main>
    </div>
  );
};
