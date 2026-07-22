'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  Bell,
  Search,
  Moon,
  Sun,
  ChevronDown,
  LogOut,
  User as UserIcon,
  Settings,
  Building2,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { SidebarNav } from '@/components/sidebar-nav';
import { useEmpresa, useDocumentos } from '@/hooks/use-supabase-data';
import { AMBIENTE_META, ROL_META } from '@/lib/constants';
import { usePermissions } from '@/hooks/use-permissions';
import { logout as logoutApi } from '@/lib/auth-service';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const themeContext = useTheme();
  const theme = themeContext.theme;
  const { sesion, rol, switchRole, can } = usePermissions();
  const { data: empresa } = useEmpresa();
  const { data: documentos } = useDocumentos();
  if (!sesion) return null;
  const ambiente = empresa?.ambiente ?? 'habilitacion';
  const isHab = ambiente === 'habilitacion';
  const rejectedCount = documentos.filter((d) => d.estadoDian === 'rechazado').length;

  const pageTitle = getPageTitle(pathname);
  const userName = sesion?.usuario?.nombre || 'Usuario';
  const initials = userName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0] || '')
    .join('')
    .toUpperCase() || 'U';
  const firstName = userName.split(' ')[0] || 'Usuario';

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {isHab && (
        <div className="flex-none flex items-center justify-center gap-2 bg-warning/15 px-4 py-1.5 text-xs font-medium text-warning">
          <AlertTriangle className="h-3.5 w-3.5" />
          Ambiente de Habilitación (pruebas) — los documentos emitidos aquí NO tienen validez fiscal.
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <aside className="hidden w-64 flex-none flex-col border-r border-border bg-card lg:flex">
          <SidebarBrand />
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            <SidebarNav />
          </div>
        </aside>

        {/* Mobile sidebar */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-3 top-3 lg:hidden"
              aria-label="Abrir menú"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetTitle className="sr-only">Navegación</SheetTitle>
            <SidebarBrand />
            <div className="h-[calc(100vh-64px)] overflow-y-auto scrollbar-thin">
              <SidebarNav />
            </div>
          </SheetContent>
        </Sheet>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top bar */}
          <header className="flex-none z-30 flex h-16 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur lg:px-6">
            <div className="flex items-center gap-2 lg:hidden">
              <span className="ml-8 text-sm font-semibold">{pageTitle}</span>
            </div>
            <div className="hidden items-center gap-2 lg:flex">
              <h2 className="text-sm font-medium text-muted-foreground">
                {empresa?.razonSocial || '—'}
              </h2>
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold',
                  AMBIENTE_META[ambiente].tone
                )}
              >
                {AMBIENTE_META[ambiente].label}
              </span>
            </div>

            <div className="ml-auto flex items-center gap-1.5">
              <div className="relative hidden md:block">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar documentos, clientes…"
                  className="h-9 w-64 rounded-md border border-input bg-background pl-8 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <Button
                variant="ghost"
                size="icon"
                aria-label="Cambiar tema"
                onClick={() => themeContext.toggleTheme()}
                title={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Cambiar tema</span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Notificaciones" className="relative">
                    <Bell className="h-4 w-4" />
                    {rejectedCount > 0 && (
                      <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                        {rejectedCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                  <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">Ventas rechazadas por DIAN</span>
                      <span className="text-xs text-muted-foreground">
                        {rejectedCount} documento(s) necesitan reenvío
                      </span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-9 gap-2 px-1.5">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden text-sm font-medium sm:inline">
                      {firstName}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{userName}</span>
                      <span className="text-xs font-normal text-muted-foreground">
                        {ROL_META[rol]?.label || rol}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {can('manage_users') && (
                    <DropdownMenuItem asChild>
                      <Link href="/users">
                        <UserIcon className="mr-2 h-4 w-4" /> Usuarios
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {can('manage_company') && (
                    <DropdownMenuItem asChild>
                      <Link href="/settings">
                        <Settings className="mr-2 h-4 w-4" /> Configuración
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {process.env.NODE_ENV !== 'production' && (
                    <>
                      {/* DEV ONLY: role switching controls are hidden in production. */}
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                        Cambiar rol (demo)
                      </DropdownMenuLabel>
                      {(['admin', 'supervisor', 'cajero', 'contador', 'solo_lectura'] as const).map((r) => (
                        <DropdownMenuItem
                          key={r}
                          onClick={() => switchRole(r)}
                          className={cn(r === rol && 'bg-primary/10')}
                        >
                          <ShieldCheck className="mr-2 h-4 w-4" />
                          {ROL_META[r].label}
                        </DropdownMenuItem>
                      ))}
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={async () => {
                      await logoutApi();
                      window.location.href = '/login';
                    }}
                    className="text-destructive focus:text-destructive cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" /> Cerrar sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <main className="flex flex-1 flex-col overflow-y-auto px-4 py-6 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

function SidebarBrand() {
  return (
    <div className="flex h-16 items-center gap-2.5 border-b border-border px-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <Building2 className="h-5 w-5" />
      </div>
      <div className="flex flex-col leading-tight">
        <span className="text-sm font-semibold tracking-tight">FacturaDIAN</span>
        <span className="text-[11px] text-muted-foreground">e-Invoicing UBL 2.1</span>
      </div>
    </div>
  );
}

function getPageTitle(pathname: string): string {
  const map: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/pos': 'Punto de venta',
    '/invoices/new': 'Nueva factura',
    '/documents': 'Documentos',
    '/credit-notes': 'Notas crédito',
    '/debit-notes': 'Notas débito',
    '/invoicing-products': 'Productos de facturación',
    '/clients': 'Clientes',
    '/suppliers': 'Proveedores',
    '/products': 'Productos',
    '/inventory': 'Inventario',
    '/resolutions': 'Resoluciones DIAN',
    '/cash-registers': 'Cajas',
    '/reports': 'Reportes',
    '/users': 'Usuarios',
    '/settings': 'Configuración',
    '/login': 'Iniciar sesión',
  };
  if (pathname.startsWith('/documents/')) return 'Detalle documento';
  return map[pathname] || 'FacturaDIAN';
}
