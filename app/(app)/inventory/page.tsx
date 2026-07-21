'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  Boxes,
  Search,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  RotateCcw,
  Sliders,
} from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { KpiCard } from '@/components/kpi-card';
import { EmptyState } from '@/components/empty-state';
import {
  useInventario,
  useMovimientosInventario,
  useProductos,
  useProveedores,
} from '@/hooks/use-supabase-data';
import { TIPO_MOVIMIENTO_INVENTARIO_META } from '@/lib/constants';
import { formatCOP, formatDateTime } from '@/lib/format';
import type { TipoMovimientoInventario, Producto } from '@/lib/types';

export default function InventoryPage() {
  const [search, setSearch] = useState('');
  const [movSearch, setMovSearch] = useState('');
  const [movFilter, setMovFilter] = useState<TipoMovimientoInventario | 'all'>('all');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [movTipo, setMovTipo] = useState<TipoMovimientoInventario>('entrada');
  const [movProducto, setMovProducto] = useState<string>('');
  const [movCantidad, setMovCantidad] = useState<number>(1);
  const [movMotivo, setMovMotivo] = useState('');
  const [movProveedor, setMovProveedor] = useState<string>('none');

  const { data: productos } = useProductos();
  const { data: proveedores } = useProveedores();
  const { data: inventario, loading: invLoading, error: invError, registrarMovimiento: registrarMovimientoDB } = useInventario(productos);
  const { data: movimientos, loading: movLoading } = useMovimientosInventario(productos);

  const filtered = inventario.filter(
    (i) =>
      (i.producto?.nombre || '').toLowerCase().includes(search.toLowerCase()) ||
      (i.producto?.codigo || '').toLowerCase().includes(search.toLowerCase())
  );

  const movsFiltrados = movimientos.filter((m) => {
    if (movFilter !== 'all' && m.tipo !== movFilter) return false;
    if (movSearch) {
      const q = movSearch.toLowerCase();
      return (
        (m.producto?.nombre || '').toLowerCase().includes(q) ||
        m.referencia?.toLowerCase().includes(q) ||
        m.motivo?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalValorizado = inventario.reduce((s, i) => s + i.valorizado, 0);
  const lowStock = inventario.filter((i) => i.stockActual <= i.stockMinimo);

  async function registrarMovimiento() {
    if (!movProducto) {
      toast.error('Selecciona un producto.');
      return;
    }
    if (movCantidad <= 0) {
      toast.error('La cantidad debe ser mayor a 0.');
      return;
    }
    const ok = await registrarMovimientoDB({
      productoId: movProducto,
      tipo: movTipo,
      cantidad: movCantidad,
      motivo: movMotivo,
      proveedorId: movProveedor !== 'none' ? movProveedor : undefined,
    });
    
    if (ok) {
      toast.success('Movimiento registrado', {
        description: `${TIPO_MOVIMIENTO_INVENTARIO_META[movTipo].label} de ${movCantidad} unidades.`,
      });
      setSheetOpen(false);
      setMovProducto('');
      setMovCantidad(1);
      setMovMotivo('');
      setMovProveedor('none');
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventario"
        description="Control de existencias, valorización y movimientos de stock."
        actions={
          <Button onClick={() => setSheetOpen(true)}>
            <ArrowDownToLine className="mr-2 h-4 w-4" /> Nuevo movimiento
          </Button>
        }
      />

      {lowStock.length > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/10 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
          <div>
            <p className="text-sm font-semibold text-warning">Productos con stock bajo</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {lowStock.map((i) => i.producto?.nombre || 'Desconocido').join(', ')} — están en o por debajo del mínimo.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Productos en stock" value={inventario.length.toString()} icon={Boxes} tone="primary" />
        <KpiCard label="Valorizado total" value={formatCOP(totalValorizado)} icon={Package} tone="success" />
        <KpiCard label="Stock bajo" value={lowStock.length.toString()} icon={AlertTriangle} tone="warning" />
        <KpiCard label="Movimientos (30 días)" value={movimientos.length.toString()} icon={TrendingUp} tone="info" />
      </div>

      <Tabs defaultValue="stock">
        <TabsList>
          <TabsTrigger value="stock">Existencias</TabsTrigger>
          <TabsTrigger value="movements">Movimientos</TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="mt-4 space-y-4">
          <Card className="p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar producto por nombre o código…"
                className="pl-8"
              />
            </div>
          </Card>

          {invLoading ? (
            <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
              Cargando inventario…
            </div>
          ) : invError ? (
            <div className="flex items-center justify-center py-20 text-sm text-destructive">
              Error: {invError}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={Boxes} title="Sin productos en inventario" description="Agrega productos con stock para verlos aquí." />
          ) : (
            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Ubicación</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-right">Mínimo</TableHead>
                    <TableHead className="text-right">Costo unit.</TableHead>
                    <TableHead className="text-right">Valorizado</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((i) => {
                    const low = i.stockActual <= i.stockMinimo;
                    return (
                      <TableRow key={i.id}>
                        <TableCell className="text-sm font-medium">{i.producto?.nombre || '—'}</TableCell>
                        <TableCell className="font-mono text-xs">{i.producto?.codigo || '—'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{i.ubicacion || '—'}</TableCell>
                        <TableCell className="text-right font-semibold">{i.stockActual}</TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">{i.stockMinimo}</TableCell>
                        <TableCell className="text-right text-sm">{formatCOP(i.costoUnitario)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCOP(i.valorizado)}</TableCell>
                        <TableCell>
                          {low ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/30 bg-warning/15 px-2.5 py-0.5 text-xs font-semibold text-warning">
                              <AlertTriangle className="h-3 w-3" /> Stock bajo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/15 px-2.5 py-0.5 text-xs font-semibold text-success">
                              <Package className="h-3 w-3" /> Disponible
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="movements" className="mt-4 space-y-4">
          <Card className="p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={movSearch}
                  onChange={(e) => setMovSearch(e.target.value)}
                  placeholder="Buscar por producto, referencia o motivo…"
                  className="pl-8"
                />
              </div>
              <Select value={movFilter} onValueChange={(v) => setMovFilter(v as TipoMovimientoInventario | 'all')}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Tipo de movimiento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  {Object.entries(TIPO_MOVIMIENTO_INVENTARIO_META).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Card>

          {movLoading ? (
            <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
              Cargando movimientos…
            </div>
          ) : movsFiltrados.length === 0 ? (
            <EmptyState icon={TrendingDown} title="Sin movimientos" description="Registra entradas, salidas o ajustes de inventario." />
          ) : (
            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead className="text-right">Stock resultante</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Referencia</TableHead>
                    <TableHead>Usuario</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movsFiltrados.map((m) => {
                    const meta = TIPO_MOVIMIENTO_INVENTARIO_META[m.tipo];
                    return (
                      <TableRow key={m.id}>
                        <TableCell className="text-sm text-muted-foreground">{formatDateTime(m.fecha)}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${meta.tone}`}>
                            {meta.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm font-medium">{m.producto?.nombre || '—'}</TableCell>
                        <TableCell className={`text-right font-semibold ${m.tipo === 'salida' || m.tipo === 'ajuste' && m.cantidad < 0 ? 'text-destructive' : 'text-success'}`}>
                          {m.tipo === 'salida' || (m.tipo === 'ajuste' && m.cantidad < 0) ? '-' : '+'}{Math.abs(m.cantidad)}
                        </TableCell>
                        <TableCell className="text-right text-sm">{m.stockResultante}</TableCell>
                        <TableCell className="max-w-[220px] truncate text-sm text-muted-foreground">{m.motivo || '—'}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{m.referencia || '—'}</TableCell>
                        <TableCell className="text-sm">{m.usuario}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Movimiento sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Boxes className="h-4 w-4 text-primary" /> Nuevo movimiento de inventario
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label>Tipo de movimiento</Label>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { key: 'entrada', label: 'Entrada', icon: ArrowDownToLine },
                  { key: 'salida', label: 'Salida', icon: ArrowUpFromLine },
                  { key: 'ajuste', label: 'Ajuste', icon: Sliders },
                  { key: 'devolucion', label: 'Devolución', icon: RotateCcw },
                ] as const).map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setMovTipo(t.key)}
                    className={`flex items-center gap-2 rounded-md border-2 px-3 py-2 text-sm font-medium transition-colors ${
                      movTipo === t.key
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <t.icon className="h-4 w-4" /> {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Producto *</Label>
              <Select value={movProducto} onValueChange={setMovProducto}>
                <SelectTrigger><SelectValue placeholder="Selecciona producto…" /></SelectTrigger>
                <SelectContent>
                  {productos.map((p: Producto) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.codigo} · {p.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Cantidad *</Label>
              <Input
                type="number"
                min={1}
                value={movCantidad}
                onChange={(e) => setMovCantidad(Math.max(1, Number(e.target.value)))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Motivo</Label>
              <Input value={movMotivo} onChange={(e) => setMovMotivo(e.target.value)} placeholder="Ej: Compra a proveedor X" />
            </div>
            {movTipo === 'entrada' && (
              <div className="space-y-1.5">
                <Label>Proveedor (Opcional)</Label>
                <Select value={movProveedor} onValueChange={setMovProveedor}>
                  <SelectTrigger><SelectValue placeholder="Selecciona proveedor…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Ninguno</SelectItem>
                    {proveedores.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.razonSocial || p.nombreComercial || p.identificacion}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <SheetFooter className="mt-6">
            <SheetClose asChild><Button variant="outline">Cancelar</Button></SheetClose>
            <Button onClick={registrarMovimiento}>Registrar movimiento</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
