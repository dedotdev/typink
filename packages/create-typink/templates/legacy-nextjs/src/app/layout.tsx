import './globals.css';
import { AppProvider } from '@/providers/app-provider';
import { Toaster } from '@/components/ui/sonner';
import type { Metadata } from 'next';
import { MainHeader } from '@/components/layout/main-header';
import { MainFooter } from '@/components/layout/main-footer';
import { ThemeProvider } from 'next-themes';
import { Figtree } from 'next/font/google';

export const metadata: Metadata = {
  title: 'Typink Template',
  description: 'Next.js template with ShadCN UI and Typink integration',
};

const figtree = Figtree({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-figtree',
});

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang='en' suppressHydrationWarning className={figtree.variable}>
      <body>
        <ThemeProvider attribute='class'>
          <AppProvider>
            <div className='min-h-screen flex flex-col'>
              <MainHeader />
              <main className='max-w-5xl mx-auto w-full'>{children}</main>
              <MainFooter />
            </div>
            <Toaster />
          </AppProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
