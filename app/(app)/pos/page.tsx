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
  Mail,
  MessageCircle,
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
import { AppPagination } from '@/components/ui/app-pagination';
import { EstadoDianBadge } from '@/components/estado-badge';
import { usePermissions } from '@/hooks/use-permissions';
import { useCashSession } from '@/hooks/use-cash-session';
import { useResoluciones, useProductos, useClientes } from '@/hooks/use-supabase-data';
import { api } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import { MEDIO_PAGO_META, FORMA_PAGO_META, CATEGORIA_PRODUCTO_FACTURACION_META, medioPagoLabelByCode } from '@/lib/constants';
import { formatCOP } from '@/lib/format';
import type { CartItem, MedioPago, FormaPago, EstadoDian, Producto, Cliente } from '@/lib/types';

interface SalePayment {
  paymentMethodCode: string;
  amount: number;
  reference?: string;
}

const CATEGORIAS_POS = [
  { key: 'all', label: 'Todos' },
  { key: 'servicios', label: 'Servicios' },
  { key: 'bienes', label: 'Bienes' },
  { key: 'tecnologia', label: 'Tecnología' },
  { key: 'papeleria', label: 'Papelería' },
];

// DIAN codes for medios de pago
const PAYMENT_OPTIONS: Array<{ code: string; label: string; icon: any }> = [
  { code: '10', label: 'Efectivo', icon: Banknote },
  { code: '20', label: 'Tarjeta Crédito', icon: CreditCard },
  { code: '21', label: 'Tarjeta Débito', icon: CreditCard },
  { code: '40', label: 'Transferencia', icon: Building2 },
  { code: '41', label: 'Nequi', icon: Smartphone },
  { code: '42', label: 'Daviplata', icon: Smartphone },
  { code: '13', label: 'Transferencia Bancaria', icon: Building2 },
  { code: 'ZZ', label: 'Otros', icon: Banknote },
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
  const { sesionAbierta, sesionAnteriorAbierta, isYesterday } = useCashSession() as any;
  const router = useRouter();
  const { data: resoluciones } = useResoluciones();
  const { data: productosBase, loading: loadingProd } = useProductos();
  const productos = productosBase || [];
  const { data: clientes, loading: loadingClientes } = useClientes();
  const [search, setSearch] = useState('');
  const [categoria, setCategoria] = useState('all');
  const [page, setPage] = useState(1);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cliente, setCliente] = useState<Cliente>(CONSUMIDOR_FINAL);
  const [clienteSearchOpen, setClienteSearchOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [dismissedWarning, setDismissedWarning] = useState(false);
  const [ticketVenta, setTicketVenta] = useState<{
    numero: string;
    total: number;
    estadoDian: EstadoDian;
    cufe?: string;
    qrCode?: string;
    motivoRechazo?: string;
    items: CartItem[];
    pagos: SalePayment[];
    efectivoRecibido?: number;
    vueltas?: number;
  } | null>(null);

  const [formaPago, setFormaPago] = useState<FormaPago>('contado');
  // Multiple payments: starts with one "efectivo" line; user can add more.
  const [payments, setPayments] = useState<SalePayment[]>([
    { paymentMethodCode: '10', amount: 0 },
  ]);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.length, checkoutOpen, authOpen]);

  // Autofocus inicial
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  const productosFiltrados = useMemo(() => {
    let list = productos.filter((p) => p.activo !== false);
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
  }, [productos, categoria, search]);

  const ITEMS_PER_PAGE = 36; // 6 rows of 6 max
  const paginatedProductos = useMemo(() => {
    return productosFiltrados.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  }, [productosFiltrados, page]);

  useEffect(() => {
    setPage(1);
  }, [search, categoria]);

  // Enter en buscador con match exacto = agregar al carrito
  const onSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const q = search.trim().toLowerCase();
      if (!q) return;
      const exact = productos.find(
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
    const descGenEfectivo = Math.min(descuentoGeneral, Math.max(0, subtotal));
    const descuentoTotal = cart.reduce((s, i) => s + i.descuento, 0) + descGenEfectivo;
    const baseImponible = subtotal - descGenEfectivo;
    const ratio = subtotal > 0 ? baseImponible / subtotal : 1;
    const totalIvaBruto = cart.reduce(
      (s, i) => s + ((i.precioUnitario * i.cantidad - i.descuento) * i.iva) / 100,
      0
    );
    const totalIncBruto = cart.reduce(
      (s, i) => s + ((i.precioUnitario * i.cantidad - i.descuento) * (i.inc || 0)) / 100,
      0
    );

    const totalIva = totalIvaBruto * ratio;
    const totalInc = totalIncBruto * ratio;

    return {
      subtotal,
      descuentoTotal,
      totalIva,
      totalInc,
      total: baseImponible + totalIva + totalInc,
      descGenEfectivo,
    };
  }, [cart, descuentoGeneral]);

  const descuentoPorcentaje = totals.subtotal > 0 ? (totals.descGenEfectivo / totals.subtotal) * 100 : 0;
  const excedeLimite = descuentoPorcentaje > limiteDescuento && !can('discount_beyond_limit');

  function iniciarCobro() {
    if (cart.length === 0) return;
    if (excedeLimite) {
      setRequiereAuth(true);
      setAuthOpen(true);
      return;
    }
    setEfectivoRecibido(totals.total);
    setCheckoutOpen(true);
  }

  function onAuthSuccess() {
    setAuthOpen(false);
    setRequiereAuth(false);
    toast.success('Autorización concedida', {
      description: 'Descuento fuera de límite aprobado por supervisor.',
    });
    setEfectivoRecibido(totals.total);
    setCheckoutOpen(true);
  }

  async function cobrar() {
    if (!sesionAbierta) {
      toast.error('No hay caja abierta');
      return;
    }
    if (cart.length === 0) return;

    setProcesando(true);
    try {
      const res = await api.post<any>(
        '/v1/pos/sales',
        {
          sessionId: sesionAbierta.id,
          branchId: sesionAbierta.branchId,
          customerId: cliente?.id && cliente.id.length === 36 && cliente.id.includes('-') ? cliente.id : undefined,
          paymentFormCode: formaPago === 'contado' ? '1' : '2',
          payments: payments.filter(p => p.amount > 0).map(p => ({
            paymentMethodCode: p.paymentMethodCode,
            amount: p.amount,
            reference: p.reference || undefined,
          })),
          lines: cart.map(item => ({
            productId: item.productoId,
            quantity: item.cantidad,
            unitPrice: item.precioUnitario,
            discount: item.descuento || 0,
          })),
          discount: descuentoGeneral,
          idempotencyKey: crypto.randomUUID(),
        },
      );
      const invoiceNumber = res?.number || res?.data?.number || 'POS';
      const hasCash = payments.some(p => p.paymentMethodCode === '10');
      const cashPayment = payments.find(p => p.paymentMethodCode === '10');
      setTicketVenta({
        numero: invoiceNumber,
        total: totals.total,
        estadoDian: 'pendiente_envio',
        items: [...cart],
        pagos: [...payments.filter(p => p.amount > 0)],
        efectivoRecibido: hasCash && cashPayment ? Number(cashPayment.amount) : undefined,
        vueltas: hasCash && cashPayment
          ? Math.max(0, Number(cashPayment.amount) - totals.total)
          : 0,
      });
      toast.success(`Venta ${invoiceNumber} registrada`);
      setCheckoutOpen(false);
      setPayments([{ paymentMethodCode: '10', amount: 0 }]);
      setEfectivoRecibido(0);
      setCart([]);
    } catch (e: any) {
      toast.error(`Error al cobrar: ${e.message}`);
    } finally {
      setProcesando(false);
    }
  }

  function nuevaVenta() {
    setTicketVenta(null);
    setSearch('');
    searchInputRef.current?.focus();
  }

  const vueltas = (() => {
    const cash = payments.find(p => p.paymentMethodCode === '10');
    if (!cash) return 0;
    return Math.max(0, (Number(cash.amount) || 0) - totals.total);
  })();

  return (
    <div className="flex h-full flex-col overflow-hidden gap-4">
      {/* ===== Alertas de sesión de caja (Popup) ===== */}
      <Dialog 
        open={(!sesionAbierta || !!sesionAnteriorAbierta) && !dismissedWarning} 
        onOpenChange={(v) => !v && setDismissedWarning(true)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-warning">
              {sesionAnteriorAbierta ? <AlertCircle className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
              {sesionAnteriorAbierta ? 'Tienes una caja abierta de un día anterior' : 'No hay una caja abierta'}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Advertencia sobre el estado de la sesión de caja actual.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 text-sm text-foreground/80">
            {sesionAnteriorAbierta ? (
              <p>
                La caja <strong>{sesionAnteriorAbierta.caja.nombre}</strong> quedó abierta desde{' '}
                {new Date(sesionAnteriorAbierta.fechaApertura).toLocaleString('es-CO')}.
                Para facturar hoy debes <strong>cerrarla</strong> primero y luego abrir una nueva sesión del día de hoy.
              </p>
            ) : (
              <p>
                Para poder facturar, primero debes <strong>abrir una sesión de caja</strong> del día de hoy.
                Cada día de operación debes abrir y cerrar tu caja para mantener el control del efectivo.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDismissedWarning(true)}>Cerrar</Button>
            <Button onClick={() => router.push('/cash-registers')}>Ir a Cajas</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-1 overflow-hidden flex-col gap-4 lg:flex-row">
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
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${categoria === c.key
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card hover:bg-muted'
                  }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Product grid */}
          <div className="grid flex-1 grid-cols-3 gap-2 overflow-y-auto pb-4 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 scrollbar-thin content-start">
            {productosFiltrados.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
                <ScanLine className="h-10 w-10 text-muted-foreground" />
                <p className="mt-3 text-sm text-muted-foreground">Sin resultados. Escanea o busca un producto.</p>
              </div>
            ) : (
              paginatedProductos.map((p) => (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  title={p.nombre}
                  className="group flex flex-col justify-between rounded-lg border border-border bg-card p-2.5 text-left transition-all hover:border-primary hover:shadow-md active:scale-[0.98] min-h-[115px] overflow-hidden"
                >
                  <div>
                    <p className="line-clamp-2 text-xs font-semibold leading-tight">{p.nombre}</p>
                    <p className="mt-0.5 font-mono text-[9px] text-muted-foreground">{p.codigo}</p>
                  </div>
                  <div>
                    <p className="mt-1.5 text-xs font-bold text-primary">{formatCOP(p.precioUnitario)}</p>
                    <div className="mt-0.5 flex items-center gap-1">
                      <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">IVA {p.iva}%</Badge>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Pagination controls */}
          {productosFiltrados.length > ITEMS_PER_PAGE && (
            <div className="border-t border-border bg-card p-2">
              <AppPagination 
                currentPage={page} 
                totalPages={Math.ceil(productosFiltrados.length / ITEMS_PER_PAGE)}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>

        {/* Right: cart (sticky) */}
        <div className="flex w-full shrink-0 flex-col rounded-lg border border-border bg-card lg:w-80">
          {/* Cart header */}
          <div className="flex items-center justify-between border-b border-border py-2 px-3">
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
          <div className="border-b border-border p-2">
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
              <div className="flex h-full flex-col items-center justify-center py-8 text-center">
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
          <div className="border-t border-border p-2.5 space-y-2">
            <div className="space-y-0 text-xs">
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
              <Separator className="my-1.5" />
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold">Total</span>
                <span className="text-lg font-bold text-primary">{formatCOP(totals.total)}</span>
              </div>
            </div>

            {/* Descuento general */}
            <div className="flex items-center gap-2">
              <Label className="text-[11px] text-muted-foreground">Desc. general:</Label>
              <Input
                type="number"
                min={0}
                value={descuentoGeneral}
                onChange={(e) => setDescuentoGeneral(Math.max(0, Number(e.target.value)))}
                className="h-7 flex-1 text-xs"
              />
              {excedeLimite && (
                <span className="flex items-center gap-1 text-xs text-warning">
                  <Lock className="h-3 w-3" /> Requiere PIN
                </span>
              )}
            </div>

            <Button
              className="h-9 w-full text-sm font-semibold"
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
              <DialogDescription className="sr-only">Busca un cliente o usa &quot;Consumidor Final&quot; para venta rápida.</DialogDescription>
              <DialogDescription>Busca un cliente o usa &quot;Consumidor Final&quot; para venta rápida.</DialogDescription>
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
                {clientes.map((c) => (
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

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Medios de pago</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      const available = PAYMENT_OPTIONS.filter(
                        o => !payments.some(p => p.paymentMethodCode === o.code),
                      );
                      const next = available[0]?.code || '20';
                      setPayments([...payments, { paymentMethodCode: next, amount: 0 }]);
                    }}
                    disabled={payments.length >= PAYMENT_OPTIONS.length}
                  >
                    <Plus className="mr-1 h-3 w-3" /> Agregar medio
                  </Button>
                </div>

                <div className="space-y-2">
                  {payments.map((p, idx) => {
                    const opt = PAYMENT_OPTIONS.find(o => o.code === p.paymentMethodCode);
                    const Icon = opt?.icon || Banknote;
                    return (
                      <div key={idx} className="flex items-center gap-2 rounded-md border border-border bg-card p-2">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                          <Icon className="h-4 w-4" />
                        </div>
                        <Select
                          value={p.paymentMethodCode}
                          onValueChange={(v) => {
                            const next = [...payments];
                            next[idx] = { ...p, paymentMethodCode: v };
                            setPayments(next);
                          }}
                        >
                          <SelectTrigger className="h-9 flex-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PAYMENT_OPTIONS.map(o => (
                              <SelectItem key={o.code} value={o.code} disabled={
                                payments.some((q, i) => i !== idx && q.paymentMethodCode === o.code)
                              }>
                                {o.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          value={p.amount || ''}
                          onChange={(e) => {
                            const next = [...payments];
                            next[idx] = { ...p, amount: Number(e.target.value) || 0 };
                            setPayments(next);
                          }}
                          placeholder="0"
                          className="h-9 w-32 text-right"
                        />
                        {payments.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 shrink-0 text-destructive"
                            onClick={() => {
                              const next = payments.filter((_, i) => i !== idx);
                              setPayments(next);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Summary: how much is left */}
                <div className="flex items-center justify-between rounded-md border border-dashed border-border bg-muted/30 px-3 py-2 text-sm">
                  <span className="text-muted-foreground">
                    Cobrado: <span className="font-medium text-foreground">{formatCOP(payments.reduce((s, p) => s + (p.amount || 0), 0))}</span>
                    {' / '}
                    <span className="font-medium text-foreground">{formatCOP(totals.total)}</span>
                  </span>
                  {(() => {
                    const cobrado = payments.reduce((s, p) => s + (p.amount || 0), 0);
                    const diff = totals.total - cobrado;
                    if (Math.abs(diff) < 0.5) return <span className="text-xs font-medium text-success">Completo</span>;
                    if (diff > 0) return <span className="text-xs font-medium text-destructive">Falta {formatCOP(diff)}</span>;
                    return <span className="text-xs font-medium text-success">Cambio {formatCOP(Math.abs(diff))}</span>;
                  })()}
                </div>

                {/* Show change when there's overpayment in cash */}
                {(() => {
                  const cash = payments.find(p => p.paymentMethodCode === '10');
                  if (!cash) return null;
                  const totalCash = Number(cash.amount) || 0;
                  if (totalCash <= totals.total) return null;
                  return (
                    <div className="flex items-center justify-between rounded-md border border-success/30 bg-success/10 px-3 py-2">
                      <span className="text-sm font-medium text-success">Vueltas (efectivo)</span>
                      <span className="text-base font-bold text-success">{formatCOP(totalCash - totals.total)}</span>
                    </div>
                  );
                })()}
              </div>

              <Separator />

              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Cliente</span><span className="font-medium">{cliente.razonSocial}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Ítems</span><span className="font-medium">{cart.length}</span></div>
              </div>
            </div>
            <SheetFooter className="mt-6">
              <SheetClose asChild><Button variant="outline" className="h-12 text-base">Cancelar</Button></SheetClose>
              <Button
                onClick={cobrar}
                disabled={(() => {
                  if (procesando) return true;
                  const total = payments.reduce((s, p) => s + (p.amount || 0), 0);
                  if (total < totals.total - 0.5) return true;
                  if (payments.every(p => (p.amount || 0) <= 0)) return true;
                  return false;
                })()}
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
          cliente={cliente}
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
  descuentoId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess: () => void;
  motivo: string;
  descuentoId?: string;
}) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (open) {
      setPin('');
      setError(false);
    }
  }, [open]);

  async function validar() {
    const resourceId = descuentoId || `discount-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    try {
      const res = await api.post<{ ok: boolean }>('/v1/auth/pin/verify', {
        pin,
        action: 'discount_authorization',
        resourceId,
      });
      if (res.ok) {
        onSuccess();
      } else {
        setError(true);
        toast.error('PIN incorrecto');
      }
    } catch (e: any) {
      setError(true);
      toast.error(e.message || 'Error al verificar PIN');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-warning" /> Autorización requerida
          </DialogTitle>
          <DialogDescription className="sr-only">Validación de PIN de supervisor.</DialogDescription>
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
  cliente,
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
    pagos?: SalePayment[];
    efectivoRecibido?: number;
    vueltas?: number;
  } | null;
  cliente: Cliente;
  onClose: () => void;
}) {
  const { resoluciones } = useResoluciones();
  const [promptOpen, setPromptOpen] = useState(false);
  const [promptType, setPromptType] = useState<'whatsapp' | 'email' | null>(null);
  const [promptValue, setPromptValue] = useState('');

  const handleShare = (type: 'whatsapp' | 'email') => {
    if (type === 'whatsapp') {
      let tel = cliente.telefono;
      if (!tel) {
        setPromptType('whatsapp');
        setPromptValue('');
        setPromptOpen(true);
      } else {
        simulateSend('whatsapp', tel);
      }
    } else {
      let email = cliente.email;
      if (!email || email.includes('consumidor@') || email.includes('222222222222')) {
        setPromptType('email');
        setPromptValue('');
        setPromptOpen(true);
      } else {
        simulateSend('email', email);
      }
    }
  };

  const [isSending, setIsSending] = useState(false);

  const simulateSend = async (type: 'whatsapp' | 'email', destination: string) => {
    setPromptOpen(false);
    setIsSending(true);
    
    let finalDest = destination.trim();
    if (type === 'whatsapp') {
      let tel = finalDest.replace(/\D/g, '');
      if (tel.length === 10) {
        tel = `57${tel}`;
      }
      finalDest = `+${tel}`;
    }

    const sendAction = type === 'whatsapp'
      ? fetch('/api/send-whatsapp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: finalDest,
            text: `¡Hola! Gracias por tu compra en INNOVA ANDINA S.A.S.\n\u00c1quí tienes los detalles de tu Factura Electrónica ${ticket?.numero}.\n\nTotal Pagado: $${ticket?.total.toLocaleString('es-CO')}\n\n¡Vuelve pronto!`
          })
        }).then(async res => {
          if (!res.ok) {
            // Si la API de WA no está disponible, abrir wa.me como respaldo
            const cleanNum = finalDest.replace('+', '');
            const msgText = encodeURIComponent(`Hola, aquí tienes tu Factura ${ticket?.numero} por $${ticket?.total.toLocaleString('es-CO')}. ¡Gracias por tu compra!`);
            window.open(`https://wa.me/${cleanNum}?text=${msgText}`, '_blank');
            return { fallback: true };
          }
          return res.json();
        })
      : type === 'email' 
      ? fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: finalDest,
            subject: `Factura Electrónica ${ticket?.numero} - Innova Andina`,
            htmlContent: `<div style="font-family:sans-serif; max-width:600px; margin:auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
              <h2 style="color: #333;">INNOVA ANDINA S.A.S.</h2>
              <p>Hola,</p>
              <p>Adjunto encontrarás los detalles de tu <b>Factura Electrónica ${ticket?.numero}</b>.</p>
              <p style="font-size: 18px;">Total Pagado: <b>$ ${ticket?.total.toLocaleString('es-CO')}</b></p>
              <br/>
              <p>Gracias por tu compra.</p>
            </div>`
          })
        }).then(async res => {
          if (!res.ok) throw new Error('Error al enviar correo');
          return res.json();
        })
      : new Promise((resolve) => setTimeout(resolve, 1500));

    toast.promise(
      sendAction,
      {
        loading: type === 'whatsapp' ? 'Enviando WhatsApp...' : 'Enviando correo...',
        success: () => {
          setIsSending(false);
          onClose(); // Cerrar el modal y limpiar la venta automáticamente
          return type === 'whatsapp' 
            ? `Factura enviada exitosamente por WhatsApp al ${finalDest}`
            : `Factura enviada exitosamente al correo ${finalDest}`;
        },
        error: () => {
          setIsSending(false);
          return 'Ocurrió un error al enviar';
        },
      }
    );
  };

  const submitPrompt = () => {
    if (!promptValue.trim() || isSending) return;
    simulateSend(promptType!, promptValue.trim());
  };

  if (!ticket) return null;

  return (
    <>
      <Dialog open={!!ticket} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[400px] p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Recibo de venta</DialogTitle>
          <DialogDescription className="sr-only">Recibo detallado de la venta.</DialogDescription>
          <DialogDescription>Estado del documento electrónico DIAN</DialogDescription>
        </DialogHeader>
        {/* 80mm thermal-style receipt */}
        <div className="mx-auto w-full max-h-[85vh] overflow-y-auto p-4 sm:p-6 font-mono text-[10px] sm:text-xs text-foreground uppercase tracking-tight">
          <div className="text-center leading-tight">
            <p className="font-bold">INNOVA ANDINA S.A.S.</p>
            <p>RESPONSABLE DE IVA NIT: 901.548.326-7</p>
            <p>Actividad principal 1040</p>
            {(resoluciones || []).find((r: any) => r.activa || r.isActive) ? (
              <p>RESOLUCION NO {(resoluciones || []).find((r: any) => r.activa || r.isActive)!.numeroResolucion || (resoluciones || []).find((r: any) => r.activa || r.isActive)!.number}</p>
            ) : (
              <p>SIN RESOLUCIÓN (Borrador)</p>
            )}
            <p>CRA. 13 # 82-12, OF. 401 BOGOTÁ</p>
            <p>Factura de Venta Electrónica</p>
            <p>FECHA: {new Date().toLocaleString('es-CO')}  PREFIJO: FE  {ticket.numero.replace('FE-', '')}</p>
          </div>

          <div className="text-center my-1.5 opacity-60">========================================</div>
          <div className="flex justify-between font-bold text-[9px] sm:text-[11px]">
            <span className="w-1/2">DESCRIPCION</span>
            <span className="w-1/6 text-right">CANT</span>
            <span className="w-1/4 text-right">PVP</span>
            <span className="w-1/4 text-right">VALOR</span>
          </div>
          <div className="text-center my-1.5 opacity-60">========================================</div>

          <div className="space-y-1">
            {ticket.items.map((item) => (
              <div key={item.uid} className="flex justify-between items-start">
                <span className="w-1/2 pr-1 line-clamp-2">{item.nombre}</span>
                <span className="w-1/6 text-right">{item.cantidad}</span>
                <span className="w-1/4 text-right">{formatCOP(item.precioUnitario).replace('$', '').trim()}</span>
                <span className="w-1/4 text-right">{formatCOP(item.precioUnitario * item.cantidad).replace('$', '').trim()}</span>
              </div>
            ))}
          </div>

          <div className="text-center my-1.5 opacity-60">========================================</div>

          <div className="space-y-0.5 text-right">
            <div className="flex justify-end gap-4 font-bold text-sm">
              <span>TOTAL $</span>
              <span>{formatCOP(ticket.total).replace('$', '').trim()}</span>
            </div>
            {ticket.efectivoRecibido !== undefined && (
              <div className="flex justify-end gap-4">
                <span>ENTREGADO (EFECTIVO) $</span>
                <span>{formatCOP(ticket.efectivoRecibido).replace('$', '').trim()}</span>
              </div>
            )}
            {ticket.pagos && ticket.pagos.length > 1 && (
              <div className="flex flex-col items-end gap-0.5 pt-1 border-t border-dashed border-border mt-1">
                {ticket.pagos.map((p, i) => (
                  <div key={i} className="flex justify-end gap-4 text-[10px]">
                    <span className="text-muted-foreground">{medioPagoLabelByCode(p.paymentMethodCode)}</span>
                    <span>{formatCOP(p.amount).replace('$', '').trim()}</span>
                  </div>
                ))}
              </div>
            )}
            {ticket.vueltas !== undefined && ticket.vueltas > 0 && (
              <div className="flex justify-end gap-4">
                <span>CAMBIO $</span>
                <span>{formatCOP(ticket.vueltas).replace('$', '').trim()}</span>
              </div>
            )}
          </div>

          <div className="text-center my-1.5 opacity-60">========================================</div>

          <div className="leading-tight">
            <p>Cliente: CONSUMIDOR FINAL</p>
            <p>NIT/C.C: 222222222222</p>
          </div>

          <div className="text-center my-1.5 opacity-60">========================================</div>

          <div className="text-center leading-tight space-y-2">
            {ticket.estadoDian === 'pendiente_envio' && (
              <div className="flex items-center justify-center gap-1.5 text-warning">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="font-bold lowercase">Enviando a DIAN...</span>
              </div>
            )}

            {ticket.estadoDian === 'aceptado' && (
              <>
                {ticket.qrCode && (
                  <div className="flex justify-center py-2">
                    <div className="flex h-24 w-24 items-center justify-center bg-white border border-border p-1">
                      {/* Placeholder for real QR Image */}
                      <ScanLine className="h-20 w-20 text-black" />
                    </div>
                  </div>
                )}
                {ticket.cufe && (
                  <div className="text-[9px] leading-[1.1] text-muted-foreground break-all text-left">
                    CUFE:<br />
                    {ticket.cufe}<br />
                  </div>
                )}
                <div className="mt-3 text-[10px] normal-case text-muted-foreground">
                  Sistema P.O.S, Razón Social Soluciones<br />
                  Fourgen S.A.S, Nit 800135441-7<br />
                  SOFTWARE PROPIO<br />
                  INNOVA ANDINA SAS NIT. 901.548.326-7<br />
                  <br />
                </div>
              </>
            )}

            {ticket.estadoDian === 'rechazado' && (
              <div className="text-destructive font-bold">
                RECHAZADO DIAN: {ticket.motivoRechazo}
              </div>
            )}
          </div>

          <div className="text-center my-1.5 opacity-60">----------------------------------------</div>
          {/* <div className="text-center normal-case text-[11px] leading-snug">
            ¡Que el antojo no se termine aquí!<br />
            Llevamos lo mejor de nuestra tienda<br />
            directo a tu casa, Pide ahora en:<br /><br />
            <span className="font-bold">www.innovaandina.com</span>
          </div> */}
        </div>

        <div className="border-t p-4 flex flex-col gap-3">
          <div className="grid grid-cols-3 gap-2">
            <Button 
              variant="outline" 
              className="w-full px-2 text-xs sm:text-sm"
              onClick={() => handleShare('whatsapp')}
            >
              <MessageCircle className="mr-1.5 h-4 w-4 text-green-500" /> WhatsApp
            </Button>
            <Button 
              variant="outline" 
              className="w-full px-2 text-xs sm:text-sm"
              onClick={() => handleShare('email')}
            >
              <Mail className="mr-1.5 h-4 w-4 text-blue-500" /> Correo
            </Button>
            <Button variant="outline" className="w-full px-2 text-xs sm:text-sm" onClick={() => {
              window.print();
              onClose();
            }}>
              <Printer className="mr-1.5 h-4 w-4" /> Imprimir
            </Button>
          </div>
          <Button onClick={onClose} className="w-full" size="lg">
            Nueva Venta
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    <Dialog open={promptOpen} onOpenChange={setPromptOpen}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle>
            {promptType === 'whatsapp' ? 'Enviar por WhatsApp' : 'Enviar por Correo'}
          </DialogTitle>
          <DialogDescription>
            {promptType === 'whatsapp' 
              ? 'Ingresa el número de teléfono del cliente.' 
              : 'Ingresa el correo electrónico del cliente.'}
          </DialogDescription>
        </DialogHeader>
        <div className="py-2">
          {promptType === 'whatsapp' ? (
            <div className="relative flex items-center">
              <span className="absolute left-3 text-sm font-medium text-muted-foreground">+57</span>
              <Input 
                type="tel"
                placeholder="300 123 4567"
                className="pl-10"
                value={promptValue}
                onChange={(e) => setPromptValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitPrompt()}
                autoFocus
              />
            </div>
          ) : (
            <Input 
              type="email"
              placeholder="cliente@correo.com"
              value={promptValue}
              onChange={(e) => setPromptValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitPrompt()}
              autoFocus
            />
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setPromptOpen(false)}>Cancelar</Button>
          <Button onClick={submitPrompt} disabled={isSending}>
            {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
