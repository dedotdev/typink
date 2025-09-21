import './globals.css';
import { AppProvider } from '@/providers/app-provider';
import { Toaster } from '@/components/ui/sonner';
import type { Metadata } from 'next';
import { MainHeader } from '@/components/layout/main-header';
import { MainFooter } from '@/components/layout/main-footer';
import { ThemeProvider } from 'next-themes';

export const metadata: Metadata = {
  title: 'Typink Template',
  description: 'Next.js template with ShadCN UI and Typink integration',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body>
        <ThemeProvider attribute='class'>
          <AppProvider>
            <div className='min-h-screen flex flex-col'>
              <MainHeader />
              <main className='flex-1 flex flex-col'>{children}</main>
              <MainFooter />
            </div>
            <Toaster />
          </AppProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
