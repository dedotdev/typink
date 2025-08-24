import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/components/app-provider";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import MainHeader from "./header";
import MainFooter from "./footer";

export const metadata: Metadata = {
  title: "Typink Template",
  description: "Next.js template with ShadCN UI and Typink integration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class">
          <AppProvider>
            <div className="min-h-screen flex flex-col">
              <MainHeader />
              <main className="flex-1 flex flex-col mt-32">
                {children}
              </main>
              <MainFooter />
            </div>
          </AppProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
