import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/providers/app-provider';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/providers/theme-provider';
import MainHeader from './header';
import MainFooter from './footer';
import { WalletConnectorProvider } from '@/providers/wallet-connector-provider';

export const metadata: Metadata = {
  title: 'Typink Template',
  description: 'Next.js template with ShadCN UI and Typink integration',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body>
        <WalletConnectorProvider>
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
        </WalletConnectorProvider>
      </body>
    </html>
  );
}
