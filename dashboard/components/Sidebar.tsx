"use client";

import React from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, PhoneOutgoing, Activity, Users, Settings, Database, Moon, Sun, DollarSign, Wallet } from "lucide-react";
import { useTheme } from "next-themes";
import { useAppContext } from "./app-provider";

export default function Sidebar() {
  const pathname = usePathname();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { currency, setCurrency } = useAppContext();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const routes = [
    { name: "Overview", path: "/", icon: LayoutDashboard },
    { name: "Outbound Dialer", path: "/dialer", icon: PhoneOutgoing },
    { name: "Call Logs", path: "/logs", icon: Activity },
    { name: "Leads / CRM", path: "/leads", icon: Users },
    { name: "Wallet", path: "/wallet", icon: Wallet },
  ];

  const currentTheme = mounted ? resolvedTheme : 'light';

  return (
    <div className="w-64 h-full bg-white dark:bg-[#161b22] border-r border-gray-200 dark:border-[#30363d] flex flex-col hidden md:flex transition-colors duration-200">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-[#2f81f7] rounded-md flex items-center justify-center shadow-[0_0_15px_rgba(47,129,247,0.4)]">
          <Database className="w-4 h-4 text-white" />
        </div>
        <span className="text-xl font-bold text-gray-900 dark:text-[#e6edf3] tracking-tight">Rapid X AI</span>
      </div>

      <div className="flex-1 px-4 space-y-1 mt-4">
        <div className="px-3 mb-2 text-xs font-semibold text-gray-500 dark:text-[#8b949e] uppercase tracking-wider">Menu</div>
        {routes.map((route) => {
          const isActive = pathname === route.path;
          const Icon = route.icon;
          return (
            <Link
              key={route.path}
              href={route.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-all text-sm font-medium ${
                isActive
                   ? "bg-[#2f81f7]/10 text-[#2f81f7] border border-[#2f81f7]/20 dark:border-[#2f81f7]/20"
                   : "text-gray-600 dark:text-[#8b949e] hover:bg-gray-100 dark:hover:bg-[#21262d] hover:text-gray-900 dark:hover:text-[#e6edf3] border border-transparent"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-[#2f81f7]" : "text-gray-500 dark:text-[#8b949e]"}`} />
              {route.name}
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-[#30363d] space-y-2">
        <div className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-[#8b949e]">
          <DollarSign className="w-4 h-4" />
          <select 
            value={currency}
            onChange={(e) => setCurrency(e.target.value as any)}
          className="bg-transparent outline-none flex-1 cursor-pointer text-gray-600 dark:text-[#8b949e]"
          >
            <option value="INR">INR (₹)</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
          </select>
        </div>

        <button 
          onClick={() => setTheme(currentTheme === 'dark' ? 'light' : 'dark')}
          className="flex items-center gap-3 px-3 py-2.5 rounded-md text-gray-600 dark:text-[#8b949e] hover:bg-gray-100 dark:hover:bg-[#21262d] hover:text-gray-900 dark:hover:text-[#e6edf3] transition-all w-full text-sm font-medium border border-transparent"
        >
          {currentTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          {currentTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>
        
        <button className="flex items-center gap-3 px-3 py-2.5 rounded-md text-gray-600 dark:text-[#8b949e] hover:bg-gray-100 dark:hover:bg-[#21262d] hover:text-gray-900 dark:hover:text-[#e6edf3] transition-all w-full text-sm font-medium border border-transparent">
          <Settings className="w-4 h-4" />
          Settings
        </button>
      </div>
    </div>
  );
}
