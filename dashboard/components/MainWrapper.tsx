"use client";

import React from "react";
import { usePathname } from "next/navigation";

import PageTransition from "./PageTransition";

export default function MainWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Remove padding for workflow builder to allow edge-to-edge canvas
  const isBuilder = pathname === "/workflows/builder";
  
  return (
    <main className={`${isBuilder ? "p-0 overflow-hidden" : "p-8"} flex-1 relative flex flex-col`}>
      <PageTransition>{children}</PageTransition>
    </main>
  );
}
