import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { CashSessionProvider } from '@/hooks/use-cash-session';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FacturaDIAN — Facturación Electrónica Colombia',
  description:
    'Plataforma SaaS multi-tenant para emisión y gestión de documentos electrónicos ante la DIAN (UBL 2.1).',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <TooltipProvider delayDuration={200}>
          <CashSessionProvider>{children}</CashSessionProvider>
        </TooltipProvider>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
