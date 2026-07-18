import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { CashSessionProvider } from '@/hooks/use-cash-session';
import { ThemeProvider } from '@/components/theme-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FacturaDIAN — Facturación Electrónica Colombia',
  description:
    'Plataforma SaaS multi-tenant para emisión y gestión de documentos electrónicos ante la DIAN (UBL 2.1).',
};

// Script inline para evitar FOUC: aplica el tema antes de que React hidrate
const themeBootstrapScript = `
(function() {
  try {
    var t = localStorage.getItem('sas.theme');
    if (t !== 'light' && t !== 'dark') {
      t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    var c = document.documentElement.classList;
    if (t === 'dark') c.add('dark'); else c.remove('dark');
    document.documentElement.style.colorScheme = t;
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <TooltipProvider delayDuration={200}>
            <CashSessionProvider>{children}</CashSessionProvider>
          </TooltipProvider>
          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
