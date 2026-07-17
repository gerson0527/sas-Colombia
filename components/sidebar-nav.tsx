'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FilePlus2,
  FileText,
  FileMinus2,
  FilePlus,
  Users,
  Package,
  ScrollText,
  Settings,
  BarChart3,
  ShieldCheck,
  ChevronDown,
  Boxes,
  Truck,
  Store,
  FileSpreadsheet,
  ShoppingCart,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useState } from 'react';
import { usePermissions } from '@/hooks/use-permissions';
import { SIDEBAR_ROUTES_BY_ROLE } from '@/lib/constants';

interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  badge?: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const groups: NavGroup[] = [
  {
    label: 'General',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Punto de venta',
    items: [
      { label: 'Nueva venta', href: '/pos', icon: ShoppingCart },
      { label: 'Nueva factura', href: '/invoices/new', icon: FilePlus2 },
      { label: 'Documentos', href: '/documents', icon: FileText },
      { label: 'Notas crédito', href: '/credit-notes', icon: FileMinus2 },
      { label: 'Notas débito', href: '/debit-notes', icon: FilePlus },
      { label: 'Productos de facturación', href: '/invoicing-products', icon: FileSpreadsheet },
    ],
  },
  {
    label: 'Maestros',
    items: [
      { label: 'Clientes', href: '/clients', icon: Users },
      { label: 'Proveedores', href: '/suppliers', icon: Truck },
      { label: 'Productos', href: '/products', icon: Package },
      { label: 'Inventario', href: '/inventory', icon: Boxes },
      { label: 'Resoluciones DIAN', href: '/resolutions', icon: ScrollText },
    ],
  },
  {
    label: 'Operación',
    items: [
      { label: 'Cajas', href: '/cash-registers', icon: Store },
    ],
  },
  {
    label: 'Gestión',
    items: [
      { label: 'Reportes', href: '/reports', icon: BarChart3 },
      { label: 'Usuarios', href: '/users', icon: ShieldCheck },
      { label: 'Configuración', href: '/settings', icon: Settings },
    ],
  },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { rol } = usePermissions();
  const allowedRoutes = SIDEBAR_ROUTES_BY_ROLE[rol] ?? [];
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    General: true,
    'Punto de venta': true,
    Maestros: true,
    Operación: true,
    Gestión: true,
  });

  const visibleGroups = groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => allowedRoutes.includes(item.href)),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <nav className="flex flex-col gap-4 px-3 py-4">
      {visibleGroups.map((group) => (
        <Collapsible
          key={group.label}
          open={openGroups[group.label]}
          onOpenChange={(open) =>
            setOpenGroups((prev) => ({ ...prev, [group.label]: open }))
          }
        >
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground">
            {group.label}
            <ChevronDown
              className={cn(
                'h-3.5 w-3.5 transition-transform',
                openGroups[group.label] && 'rotate-180'
              )}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-1 space-y-0.5">
            {group.items.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'group flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-4 w-4 shrink-0',
                      active
                        ? 'text-primary'
                        : 'text-muted-foreground group-hover:text-foreground'
                    )}
                  />
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </CollapsibleContent>
        </Collapsible>
      ))}
    </nav>
  );
}
