import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../styles/globals.css";
import Sidebar from "@/components/Sidebar";
import { AppProvider } from "@/components/app-provider";
import { CopilotProvider } from "@/components/copilot/CopilotContext";
import CopilotWidget from "@/components/copilot/CopilotWidget";
import TopHeader from "@/components/TopHeader";
import MainWrapper from "@/components/MainWrapper";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "RapidX Dashboard",
  description: "AI Voice Agent and Workflow Builder",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${inter.variable} font-sans text-gray-900 dark:text-[#e6edf3] h-screen w-screen overflow-hidden antialiased bg-white dark:bg-[#111111] flex`}
      >
        <CopilotProvider>
          <AppProvider>
            <Sidebar />

            <div className="flex-1 flex flex-col h-full overflow-y-auto relative z-[1] bg-white/40 dark:bg-transparent">
              <TopHeader />
              <MainWrapper>{children}</MainWrapper>
            </div>
            
            <CopilotWidget />
          </AppProvider>
        </CopilotProvider>
      </body>
    </html>
  );
}
