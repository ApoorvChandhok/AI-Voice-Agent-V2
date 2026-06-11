"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

type Currency = "INR" | "USD" | "EUR" | "GBP";

/**
 * VoBiz stores costs in INR (the account's base currency).
 * All costs in our system are stored as INR values.
 * These rates convert FROM INR → target currency.
 *
 * Exchange rates as of May 19, 2026 (update periodically):
 *   USD: 1 INR = 1/96.41 USD
 *   EUR: 1 INR = 1/112.14 EUR
 *   GBP: 1 INR = 1/129.19 GBP
 */
const INR_TO_CURRENCY: Record<Currency, number> = {
  INR: 1,
  USD: 1 / 96.41,   // 1 USD = ₹96.41
  EUR: 1 / 112.14,  // 1 EUR = ₹112.14
  GBP: 1 / 129.19,  // 1 GBP = ₹129.19
};

const currencySymbols: Record<Currency, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
};

interface AppContextType {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  /**
   * Formats an amount stored in INR into the selected display currency.
   * Pass the raw cost value exactly as returned by VoBiz (already in INR).
   */
  formatCurrency: (amountInINR: number) => string;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
}

export const AppContext = React.createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrency] = React.useState<Currency>("INR");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);

  React.useEffect(() => {
    const saved = localStorage.getItem("app-currency") as Currency;
    if (saved && INR_TO_CURRENCY[saved] !== undefined) {
      setCurrency(saved);
    }
    const savedSidebar = localStorage.getItem("app-sidebar-collapsed");
    if (savedSidebar === "true") {
      setIsSidebarCollapsed(true);
    }
  }, []);

  const handleSetCurrency = (c: Currency) => {
    setCurrency(c);
    localStorage.setItem("app-currency", c);
  };

  const handleSetSidebarCollapsed = (collapsed: boolean) => {
    setIsSidebarCollapsed(collapsed);
    localStorage.setItem("app-sidebar-collapsed", String(collapsed));
  };

  const formatCurrency = (amountInINR: number) => {
    const converted = amountInINR * INR_TO_CURRENCY[currency];
    // Show 2 decimal places for most currencies, but INR often needs 2 as well
    return `${currencySymbols[currency]}${converted.toFixed(2)}`;
  };

  return (
    <AppContext.Provider value={{ 
      currency, 
      setCurrency: handleSetCurrency, 
      formatCurrency,
      isSidebarCollapsed,
      setIsSidebarCollapsed: handleSetSidebarCollapsed
    }}>
      <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
        {children}
      </NextThemesProvider>
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = React.useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within AppProvider");
  return context;
}
