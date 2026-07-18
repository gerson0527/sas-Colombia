'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  CreditCard,
  Banknote,
  Smartphone,
  Building2,
  User,
  X,
  Printer,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  Keyboard,
  ScanLine,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EstadoDianBadge } from '@/components/estado-badge';
import { usePermissions } from '@/hooks/use-permissions';
import { useCashSession } from '@/hooks/use-cash-session';
import { useRouter } from 'next/navigation';
import { mockProductos, mockClientes } from '@/lib/mock-data';
import { MEDIO_PAGO_META, FORMA_PAGO_META, CATEGORIA_PRODUCTO_FACTURACION_META } from '@/lib/constants';
import { formatCOP } from '@/lib/format';
import type { CartItem, MedioPago, FormaPago, EstadoDian, Producto, Cliente } from '@/lib/types';

const CATEGORIAS_POS = [
  { key: 'all', label: 'Todos' },
  { key: 'servicios', label: 'Servicios' },
  { key: 'bienes', label: 'Bienes' },
  { key: 'tecnologia', label: 'Tecnología' },
  { key: 'papeleria', label: 'Papelería' },
];

const CONSUMIDOR_FINAL: Cliente = {
  id: 'cli-consumidor-final',
  tipoIdentificacion: 'CC',
  identificacion: '22222222',
  razonSocial: 'Consumidor Final',
  email: 'consumidor@innovaandina.co',
  direccion: '—',
  ciudad: 'Bogotá',
  departamento: 'Cundinamarca',
  regimenTributario: 'no_responsable',
  responsabilidadesFiscales: [],
  persona: 'natural',
  createdAt: new Date().toISOString(),
};

let cartUid = 0;
const nextCartUid = () => `cart-${++cartUid}`;

export default function POSPage() {
  const { can, limiteDescuento, sesion } = usePermissions();
  const { sesionAbierta, sesionAnteriorAbierta, isYesterday } = useCashSession();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [categoria, setCategoria] = useState('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cliente, setCliente] = useState<Cliente>(CONSUMIDOR_FINAL);
  const [clienteSearchOpen, setClienteSearchOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [ticketVenta, setTicketVenta] = useState<{
    numero: string;
    total: number;
    estadoDian: EstadoDian;
    cufe?: string;
    qrCode?: string;
    motivoRechazo?: string;
    items: CartItem[];
    medioPago: MedioPago;
    efectivoRecibido?: number;
    vueltas?: number;
  } | null>(null);

  const [formaPago, setFormaPago] = useState<FormaPago>('contado');
  const [medioPago, setMedioPago] = useState<MedioPago>('efectivo');
  const [efectivoRecibido, setEfectivoRecibido] = useState<number>(0);
  const [descuentoGeneral, setDescuentoGeneral] = useState<number>(0);
  const [requiereAuth, setRequiereAuth] = useState(false);
  const [procesando, setProcesando] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // F2 enfoca buscador
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'F4') {
        e.preventDefault();
        if (cart.length > 0 && sesionAbierta && !sesionAnteriorAbierta) {
          iniciarCobro();
        } else if (cart.length > 0) {
          cobrar();
        }
      } else if (e.key === 'Escape') {
        if (checkoutOpen || authOpen) return;
        setCart([]);
        toast.info('Venta cancelada');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [cart.length, checkoutOpen, authOpen]);

  // Autofocus inicial
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  const productosFiltrados = useMemo(() => {
    let list = mockProductos.filter((p) => p.activo !== false);
    if (categoria !== 'all') {
      if (categoria === 'bienes') list = list.filter((p) => p.tipoItem === 'bien');
      else if (categoria === 'servicios') list = list.filter((p) => p.tipoItem === 'servicio');
      else list = list.filter((p) => (p.codigoUNSPSC || '').startsWith(categoria.slice(0, 4)));
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) => p.nombre.toLowerCase().includes(q) || p.codigo.toLowerCase().includes(q)
      );
    }
    return list;
  }, [categoria, search]);

  // Enter en buscador con match exacto = agregar al carrito
  const onSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const q = search.trim().toLowerCase();
      if (!q) return;
      const exact = mockProductos.find(
        (p) => p.codigo.toLowerCase() === q || p.codigo.toLowerCase() === q.replace(/\s/g, '')
      );
      if (exact) {
        addToCart(exact);
        setSearch('');
      } else if (productosFiltrados.length === 1) {
        addToCart(productosFiltrados[0]);
        setSearch('');
      }
    }
  };

  const addToCart = useCallback((producto: Producto) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productoId === producto.id);
      if (existing) {
        return prev.map((i) =>
          i.productoId === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i
        );
      }
      return [
        ...prev,
        {
          uid: nextCartUid(),
          productoId: producto.id,
          nombre: producto.nombre,
          precioUnitario: producto.precioUnitario,
          cantidad: 1,
          descuento: 0,
          iva: producto.iva,
          inc: producto.inc || 0,
        },
      ];
    });
  }, []);

  const updateQty = (uid: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => (i.uid === uid ? { ...i, cantidad: Math.max(0, i.cantidad + delta) } : i))
        .filter((i) => i.cantidad > 0)
    );
  };

  const removeItem = (uid: string) => {
    setCart((prev) => prev.filter((i) => i.uid !== uid));
  };

  const totals = useMemo(() => {
    const subtotal = cart.reduce((s, i) => s + i.precioUnitario * i.cantidad - i.descuento, 0);
    const descuentoTotal = cart.reduce((s, i) => s + i.descuento, 0) + descuentoGeneral;
    const baseImponible = cart.reduce(
      (s, i) => s + (i.precioUnitario * i.cantidad - i.descuento),
      0
    ) - descuentoGeneral;
    const totalIva = cart.reduce(
      (s, i) => s + ((i.precioUnitario * i.cantidad - i.descuento) * i.iva) / 100,
      0
    );
    const totalInc = cart.reduce(
      (s, i) => s + ((i.precioUnitario * i.cantidad - i.descuento) * (i.inc || 0)) / 100,
      0
    );
    return {
      subtotal,
      descuentoTotal,
      totalIva,
      totalInc,
      total: baseImponible + totalIva + totalInc,
    };
  }, [cart, descuentoGeneral]);

  const descuentoPorcentaje = totals.subtotal > 0 ? (descuentoGeneral / totals.subtotal) * 100 : 0;
  const excedeLimite = descuentoPorcentaje > limiteDescuento && !can('discount_beyond_limit');

  function iniciarCobro() {
    if (cart.length === 0) return;
    if (excedeLimite) {
      setRequiereAuth(true);
      setAuthOpen(true);
      return;
    }
    setCheckoutOpen(true);
  }

  function onAuthSuccess() {
    setAuthOpen(false);
    setRequiereAuth(false);
    toast.success('Autorización concedida', {
      description: 'Descuento fuera de límite aprobado por supervisor.',
    });
    setCheckoutOpen(true);
  }

  function cobrar() {
    if (!sesionAbierta) {
      toast.error('No hay una caja abierta', {
        description: 'Debes abrir una sesión de caja antes de poder facturar.',
      });
      return;
    }
    if (sesionAnteriorAbierta) {
      toast.error('Hay una caja abierta de un día anterior', {
        description: 'Cierra la sesión anterior en /cash-registers antes de continuar.',
      });
      return;
    }
    setProcesando(true);
    const numero = `FE-${Math.floor(18000 + Math.random() * 9999)}`;
    setTimeout(() => {
      setProcesando(false);
      setCheckoutOpen(false);
      setTicketVenta({
        numero,
        total: totals.total,
        estadoDian: 'pendiente_envio',
        items: [...cart],
        medioPago,
        efectivoRecibido: medioPago === 'efectivo' ? efectivoRecibido : undefined,
        vueltas: medioPago === 'efectivo' ? Math.max(0, efectivoRecibido - totals.total) : 0,
      });
      // Simular polling DIAN
      setTimeout(() => {
        setTicketVenta((prev) =>
          prev
            ? {
                ...prev,
                estadoDian: 'aceptado',
                cufe: 'abc73d8e1f9a04c219b7e3d6f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9',
                qrCode: 'https://catalogo-vpfe-hab.dian.gov.co/document/qr?abc73d8e1f9a',
              }
            : prev
        );
      }, 2500);
      setCart([]);
      setDescuentoGeneral(0);
      setEfectivoRecibido(0);
      setCliente(CONSUMIDOR_FINAL);
    }, 800);
  }

  function nuevaVenta() {
    setTicketVenta(null);
    setSearch('');
    searchInputRef.current?.focus();
  }

  const vueltas = medioPago === 'efectivo' ? Math.max(0, efectivoRecibido - totals.total) : 0;

  return (
    <div className="flex flex-col gap-4">
      {/* ===== Alertas de sesión de caja ===== */}
      {sesionAnteriorAbierta && (
        <div className="flex items-start gap-3 rounded-lg border-2 border-warning/40 bg-warning/10 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
          <div className="flex-1">
            <p className="font-semibold text-warning">
              Tienes una caja abierta de un día anterior
            </p>
            <p className="mt-1 text-sm text-foreground/80">
              La caja <strong>{sesionAnteriorAbierta.caja.nombre}</strong> quedó abierta desde{' '}
              {new Date(sesionAnteriorAbierta.fechaApertura).toLocaleString('es-CO')}.
              Para facturar hoy debes <strong>cerrarla</strong> primero y luego abrir una nueva sesión del día de hoy.
            </p>
            <div className="mt-2 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push('/cash-registers')}
              >
                Ir a Cajas
              </Button>
            </div>
          </div>
        </div>
      )}
      {!sesionAbierta && !sesionAnteriorAbierta && (
        <div className="flex items-start gap-3 rounded-lg border-2 border-warning/40 bg-warning/10 p-4">
          <Lock className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
          <div className="flex-1">
            <p className="font-semibold text-warning">
              No hay una caja abierta
            </p>
            <p className="mt-1 text-sm text-foreground/80">
              Para poder facturar, primero debes <strong>abrir una sesión de caja</strong> del día de hoy.
              Cada día de operación debes abrir y cerrar tu caja para mantener el control del efectivo.
            </p>
            <div className="mt-2 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push('/cash-registers')}
              >
                Abrir caja
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex h-[calc(100vh-64px-1.5rem)] flex-col gap-4 lg:flex-row">
      {/* Left: product grid + search */}
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        {/* Search bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={onSearchKeyDown}
              placeholder="Buscar por nombre o código de barras (Enter = agregar)…"
              className="h-11 pl-9 text-sm"
            />
          </div>
          <div className="hidden items-center gap-1 rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground sm:flex">
            <Keyboard className="h-3.5 w-3.5" />
            <span><kbd className="rounded bg-background px-1 font-mono">F2</kbd> buscar</span>
            <span className="mx-1">·</span>
            <span><kbd className="rounded bg-background px-1 font-mono">F4</kbd> cobrar</span>
            <span className="mx-1">·</span>
            <span><kbd className="rounded bg-background px-1 font-mono">Esc</kbd> cancelar</span>
          </div>
        </div>

        {/* Category chips */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIAS_POS.map((c) => (
            <button
              key={c.key}
              onClick={() => setCategoria(c.key)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                categoria === c.key
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card hover:bg-muted'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Product grid */}
        <div className="grid flex-1 grid-cols-2 gap-3 overflow-y-auto pb-4 sm:grid-cols-3 xl:grid-cols-4 scrollbar-thin">
          {productosFiltrados.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
              <ScanLine className="h-10 w-10 text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">Sin resultados. Escanea o busca un producto.</p>
            </div>
          ) : (
            productosFiltrados.map((p) => (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                className="group flex flex-col rounded-lg border border-border bg-card p-3 text-left transition-all hover:border-primary hover:shadow-md active:scale-[0.98]"
              >
                <div className="mb-2 flex aspect-square items-center justify-center rounded-md bg-muted/40">
                  {p.tipoItem === 'bien' ? (
                    <Building2 className="h-8 w-8 text-muted-foreground" />
                  ) : (
                    <CreditCard className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <p className="line-clamp-2 text-sm font-medium leading-tight">{p.nombre}</p>
                <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{p.codigo}</p>
                <p className="mt-1.5 text-sm font-bold text-primary">{formatCOP(p.precioUnitario)}</p>
                <div className="mt-1 flex items-center gap-1">
                  <Badge variant="outline" className="text-[10px]">IVA {p.iva}%</Badge>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right: cart (sticky) */}
      <div className="flex w-full shrink-0 flex-col rounded-lg border border-border bg-card lg:w-96">
        {/* Cart header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Venta actual</h2>
            {cart.length > 0 && (
              <Badge className="bg-primary/10 text-primary border-primary/25">{cart.length}</Badge>
            )}
          </div>
          {cart.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setCart([])} className="h-7 text-xs text-muted-foreground">
              Vaciar
            </Button>
          )}
        </div>

        {/* Cliente */}
        <div className="border-b border-border p-3">
          <button
            onClick={() => setClienteSearchOpen(true)}
            className="flex w-full items-center gap-2 rounded-md border border-border bg-muted/20 px-3 py-2 text-left text-sm hover:bg-muted/40"
          >
            <User className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium">{cliente.razonSocial}</p>
              <p className="text-xs text-muted-foreground">{cliente.identificacion}</p>
            </div>
            <span className="text-xs text-primary">Cambiar</span>
          </button>
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {cart.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center py-16 text-center">
              <ShoppingCart className="h-10 w-10 text-muted-foreground/40" />
              <p className="mt-3 text-sm text-muted-foreground">Carrito vacío</p>
              <p className="text-xs text-muted-foreground">Toca un producto para agregarlo</p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {cart.map((item) => (
                <div key={item.uid} className="flex items-center gap-2 rounded-md p-2 hover:bg-muted/30">
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">{item.nombre}</p>
                    <p className="text-xs text-muted-foreground">{formatCOP(item.precioUnitario)} c/u</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQty(item.uid, -1)}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-semibold">{item.cantidad}</span>
                    <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQty(item.uid, 1)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="w-20 text-right text-sm font-medium">
                    {formatCOP(item.precioUnitario * item.cantidad)}
                  </div>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => removeItem(item.uid)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totals + cobrar */}
        <div className="border-t border-border p-4 space-y-3">
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCOP(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Descuento</span>
              <span className="text-destructive">- {formatCOP(totals.descuentoTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">IVA</span>
              <span>{formatCOP(totals.totalIva)}</span>
            </div>
            {totals.totalInc > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">INC</span>
                <span>{formatCOP(totals.totalInc)}</span>
              </div>
            )}
            <Separator />
            <div className="flex items-center justify-between text-base">
              <span className="font-semibold">Total</span>
              <span className="text-xl font-bold text-primary">{formatCOP(totals.total)}</span>
            </div>
          </div>

          {/* Descuento general */}
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Desc. general:</Label>
            <Input
              type="number"
              min={0}
              value={descuentoGeneral}
              onChange={(e) => setDescuentoGeneral(Math.max(0, Number(e.target.value)))}
              className="h-8 flex-1 text-sm"
            />
            {excedeLimite && (
              <span className="flex items-center gap-1 text-xs text-warning">
                <Lock className="h-3 w-3" /> Requiere PIN
              </span>
            )}
          </div>

          <Button
            className="h-12 w-full text-base font-semibold"
            onClick={iniciarCobro}
            disabled={cart.length === 0 || procesando || !sesionAbierta || !!sesionAnteriorAbierta}
          >
            {procesando ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CreditCard className="mr-2 h-5 w-5" />}
            {!sesionAbierta
              ? 'Caja cerrada'
              : sesionAnteriorAbierta
                ? 'Caja anterior abierta'
                : <>Cobrar <span className="ml-2 opacity-70">(F4)</span></>}
          </Button>
        </div>
      </div>

      {/* Cliente search dialog */}
      <Dialog open={clienteSearchOpen} onOpenChange={setClienteSearchOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Seleccionar cliente</DialogTitle>
            <DialogDescription>Busca un cliente o usa "Consumidor Final" para venta rápida.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                setCliente(CONSUMIDOR_FINAL);
                setClienteSearchOpen(false);
              }}
            >
              <User className="mr-2 h-4 w-4" /> Consumidor Final (venta rápida)
            </Button>
            <Separator />
            <div className="max-h-60 space-y-1 overflow-y-auto scrollbar-thin">
              {mockClientes.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setCliente(c);
                    setClienteSearchOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-md p-2 text-left hover:bg-muted"
                >
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">{c.razonSocial}</p>
                    <p className="text-xs text-muted-foreground">{c.identificacion}{c.dv ? `-${c.dv}` : ''}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Checkout sheet */}
      <Sheet open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Cobrar venta</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            <div className="rounded-lg border border-border bg-muted/20 p-4 text-center">
              <p className="text-xs uppercase text-muted-foreground">Total a cobrar</p>
              <p className="mt-1 text-3xl font-bold text-primary">{formatCOP(totals.total)}</p>
            </div>

            <div className="space-y-1.5">
              <Label>Forma de pago</Label>
              <Select value={formaPago} onValueChange={(v) => setFormaPago(v as FormaPago)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(FORMA_PAGO_META).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Medio de pago</Label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { key: 'efectivo', label: 'Efectivo', icon: Banknote },
                  { key: 'tarjeta_credito', label: 'T. Crédito', icon: CreditCard },
                  { key: 'tarjeta_debito', label: 'T. Débito', icon: CreditCard },
                  { key: 'transferencia', label: 'Transfer.', icon: Building2 },
                  { key: 'nequi', label: 'Nequi', icon: Smartphone },
                  { key: 'daviplata', label: 'Daviplata', icon: Smartphone },
                ] as const).map((m) => (
                  <button
                    key={m.key}
                    onClick={() => setMedioPago(m.key)}
                    className={`flex flex-col items-center gap-1 rounded-md border-2 px-2 py-3 text-xs font-medium transition-colors ${
                      medioPago === m.key
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <m.icon className="h-4 w-4" />
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {medioPago === 'efectivo' && (
              <div className="space-y-2">
                <div className="space-y-1.5">
                  <Label>Efectivo recibido</Label>
                  <Input
                    type="number"
                    value={efectivoRecibido}
                    onChange={(e) => setEfectivoRecibido(Number(e.target.value))}
                    placeholder="0"
                    className="text-lg"
                  />
                </div>
                {efectivoRecibido >= totals.total && (
                  <div className="flex items-center justify-between rounded-md border border-success/30 bg-success/10 p-3">
                    <span className="text-sm font-medium text-success">Vueltas</span>
                    <span className="text-lg font-bold text-success">{formatCOP(vueltas)}</span>
                  </div>
                )}
                {efectivoRecibido > 0 && efectivoRecibido < totals.total && (
                  <p className="text-sm text-destructive">
                    Falta {formatCOP(totals.total - efectivoRecibido)}
                  </p>
                )}
              </div>
            )}

            <Separator />

            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Cliente</span><span className="font-medium">{cliente.razonSocial}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Ítems</span><span className="font-medium">{cart.length}</span></div>
            </div>
          </div>
          <SheetFooter className="mt-6">
            <SheetClose asChild><Button variant="outline">Cancelar</Button></SheetClose>
            <Button
              onClick={cobrar}
              disabled={procesando || (medioPago === 'efectivo' && efectivoRecibido < totals.total)}
              className="h-12 text-base font-semibold"
            >
              {procesando ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CheckCircle2 className="mr-2 h-5 w-5" />}
              Confirmar cobro
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Authorization dialog (PIN supervisor) */}
      <AuthDialog
        open={authOpen}
        onOpenChange={setAuthOpen}
        onSuccess={onAuthSuccess}
        motivo={`Descuento de ${descuentoPorcentaje.toFixed(1)}% excede el límite de ${limiteDescuento}% para el rol ${sesion.usuario.rol}.`}
      />

      {/* Ticket / receipt */}
      <TicketDialog
        ticket={ticketVenta}
        onClose={nuevaVenta}
      />
      </div>
    </div>
  );
}

// --- Auth PIN dialog ---

function AuthDialog({
  open,
  onOpenChange,
  onSuccess,
  motivo,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess: () => void;
  motivo: string;
}) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (open) {
      setPin('');
      setError(false);
    }
  }, [open]);

  function validar() {
    // Mock: acepta PINs de admin (1234) o supervisor (2468)
    if (pin === '1234' || pin === '2468') {
      onSuccess();
    } else {
      setError(true);
      toast.error('PIN incorrecto. Solicita autorización a un supervisor.');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-warning" /> Autorización requerida
          </DialogTitle>
          <DialogDescription>{motivo}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>PIN de supervisor (4 dígitos)</Label>
            <Input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.replace(/\D/g, ''));
                setError(false);
              }}
              onKeyDown={(e) => e.key === 'Enter' && validar()}
              className={`text-center text-2xl tracking-[0.5em] ${error ? 'border-destructive' : ''}`}
              placeholder="••••"
              autoFocus
            />
          </div>
          {error && <p className="text-sm text-destructive">PIN incorrecto.</p>}
          <p className="text-xs text-muted-foreground">
            Ingresa el PIN de un usuario con rol admin o supervisor para autorizar esta operación.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={validar}>Autorizar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- Ticket / receipt dialog ---

function TicketDialog({
  ticket,
  onClose,
}: {
  ticket: {
    numero: string;
    total: number;
    estadoDian: EstadoDian;
    cufe?: string;
    qrCode?: string;
    motivoRechazo?: string;
    items: CartItem[];
    medioPago: MedioPago;
    efectivoRecibido?: number;
    vueltas?: number;
  } | null;
  onClose: () => void;
}) {
  if (!ticket) return null;

  return (
    <Dialog open={!!ticket} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[400px] p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Recibo de venta</DialogTitle>
          <DialogDescription>Estado del documento electrónico DIAN</DialogDescription>
        </DialogHeader>
        {/* 80mm thermal-style receipt */}
        <div className="mx-auto max-w-[320px] p-6 font-mono text-xs text-foreground">
          {/* Header */}
          <div className="text-center">
            <div className="mb-2 flex justify-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Building2 className="h-5 w-5" />
              </div>
            </div>
            <p className="font-bold">Innova Andina S.A.S.</p>
            <p>NIT 901.548.326-7</p>
            <p>Cra. 13 # 82-12, Of. 401</p>
            <p>Bogotá, Colombia</p>
            <p className="mt-1">facturacion@innovaandina.co</p>
          </div>

          <Separator className="my-3" />

          {/* Doc info */}
          <div className="space-y-0.5">
            <div className="flex justify-between"><span>Documento:</span><span className="font-bold">{ticket.numero}</span></div>
            <div className="flex justify-between"><span>Fecha:</span><span>{new Date().toLocaleString('es-CO')}</span></div>
            <div className="flex justify-between"><span>Medio pago:</span><span>{MEDIO_PAGO_META[ticket.medioPago].label}</span></div>
          </div>

          <Separator className="my-3" />

          {/* Items */}
          <div className="space-y-2">
            {ticket.items.map((item) => (
              <div key={item.uid}>
                <div className="flex justify-between">
                  <span className="flex-1 pr-2">{item.nombre}</span>
                  <span className="font-bold">{formatCOP(item.precioUnitario * item.cantidad)}</span>
                </div>
                <div className="text-muted-foreground">
                  {item.cantidad} x {formatCOP(item.precioUnitario)}
                  {item.descuento > 0 && `  (-${formatCOP(item.descuento)})`}
                </div>
              </div>
            ))}
          </div>

          <Separator className="my-3" />

          {/* Totals */}
          <div className="space-y-0.5">
            <div className="flex justify-between font-bold text-sm">
              <span>TOTAL</span>
              <span>{formatCOP(ticket.total)}</span>
            </div>
            {ticket.efectivoRecibido !== undefined && (
              <>
                <div className="flex justify-between"><span>Recibido:</span><span>{formatCOP(ticket.efectivoRecibido)}</span></div>
                <div className="flex justify-between"><span>Vueltas:</span><span>{formatCOP(ticket.vueltas || 0)}</span></div>
              </>
            )}
          </div>

          <Separator className="my-3" />

          {/* DIAN status */}
          <div className="text-center">
            {ticket.estadoDian === 'pendiente_envio' && (
              <div className="flex items-center justify-center gap-1.5 text-warning">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="font-bold">Enviando a DIAN...</span>
              </div>
            )}
            {ticket.estadoDian === 'aceptado' && (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-1.5 text-success">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="font-bold">Aceptado DIAN</span>
                </div>
                {ticket.cufe && (
                  <p className="break-all text-[10px] text-muted-foreground">
                    CUFE: {ticket.cufe}
                  </p>
                )}
                {ticket.qrCode && (
                  <div className="flex justify-center py-1">
                    <div className="flex h-20 w-20 items-center justify-center rounded bg-white border">
                      <ScanLine className="h-16 w-16 text-foreground" />
                    </div>
                  </div>
                )}
              </div>
            )}
            {ticket.estadoDian === 'rechazado' && (
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1.5 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-bold">Rechazado DIAN</span>
                </div>
                {ticket.motivoRechazo && (
                  <p className="text-[10px] text-destructive">{ticket.motivoRechazo}</p>
                )}
              </div>
            )}
          </div>

          <Separator className="my-3" />

          <p className="text-center text-[10px] text-muted-foreground">
            Gracias por su compra
          </p>
        </div>

        <DialogFooter className="border-t px-6 py-4 sm:justify-center">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" /> Imprimir
          </Button>
          <Button onClick={onClose}>
            Nueva venta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
