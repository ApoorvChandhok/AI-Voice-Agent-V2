import React from "react";
import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="h-full flex flex-col items-center justify-center space-y-4">
      <div className="relative">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full" />
        
        <div className="w-16 h-16 bg-white/50 dark:bg-[#161b22]/50 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 rounded-2xl flex items-center justify-center relative shadow-lg">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      </div>
      
      <div className="text-center">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-[#e6edf3]">
          Loading Wallet Data...
        </h3>
        <p className="text-xs text-gray-500 dark:text-[#8b949e] mt-1">
          Fetching recent transactions and balance
        </p>
      </div>
    </div>
  );
}
