'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  Store,
  Plus,
  Play,
  Square,
  Eye,
  ArrowDownToLine,
  ArrowUpFromLine,
  Wallet,
  TrendingUp,
  TrendingDown,
  Receipt,
  Lock,
  Pencil,
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
import { Textarea } from '@/components/ui/textarea';
import { KpiCard } from '@/components/kpi-card';
import { EmptyState } from '@/components/empty-state';
import { useCashSession } from '@/hooks/use-cash-session';
import { TIPO_MOVIMIENTO_CAJA_META, ESTADO_CAJA_META, MEDIO_PAGO_META } from '@/lib/constants';
import { formatCOP, formatDateTime } from '@/lib/format';
import type { Caja, SesionCaja, TipoMovimientoCaja, MedioPago } from '@/lib/types';

export default function CashRegistersPage() {
  const { cajas, sesiones, loading, error, abrirSesion: abrirSesionCtx, cerrarSesion: cerrarSesionCtx, agregarMovimiento: agregarMovimientoCtx, crearCaja, editarCaja } = useCashSession();
  const [editingCaja, setEditingCaja] = useState<Caja | null>(null);
  const [cajaSheetOpen, setCajaSheetOpen] = useState(false);
  const [movSheetOpen, setMovSheetOpen] = useState(false);
  const [detailSesion, setDetailSesion] = useState<SesionCaja | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [closeSesion, setCloseSesion] = useState<SesionCaja | null>(null);
  const [closeOpen, setCloseOpen] = useState(false);
  const [conteoEfectivo, setConteoEfectivo] = useState(0);
  const [closeObservaciones, setCloseObservaciones] = useState('');

  const [cajaForm, setCajaForm] = useState({ nombre: '', sucursal: '', saldoBase: 100000 });
  const [movForm, setMovForm] = useState<{
    sesionId: string;
    tipo: TipoMovimientoCaja;
    monto: number;
    concepto: string;
    medioPago: MedioPago;
  }>({ sesionId: '', tipo: 'ingreso', monto: 0, concepto: '', medioPago: 'efectivo' });

  const sesionAbierta = sesiones.find((s) => s.estado === 'abierta');

  async function addCaja() {
    if (!cajaForm.nombre) {
      toast.error('El nombre es obligatorio');
      return;
    }
    if (editingCaja) {
      await editarCaja(editingCaja.id, cajaForm);
      toast.success('Caja actualizada');
    } else {
      await crearCaja(cajaForm);
      toast.success('Caja creada');
    }
    setCajaSheetOpen(false);
    setEditingCaja(null);
    setCajaForm({ nombre: '', sucursal: '', saldoBase: 100000 });
  }

  async function abrirSesion(cajaId: string) {
    const caja = cajas.find((c) => c.id === cajaId);
    if (!caja) return;
    if (sesiones.some((s) => s.cajaId === cajaId && s.estado === 'abierta')) {
      toast.error('Esta caja ya tiene una sesión abierta.');
      return;
    }
    const nueva = await abrirSesionCtx(cajaId, { id: 'usr-1', nombre: 'Diana Marcela Gómez' });
    if (!nueva) return;
    toast.success('Sesión de caja abierta', { description: `${caja.nombre} · Saldo inicial ${formatCOP(caja.saldoBase)}` });
  }

  function iniciarCierreSesion(sesion: SesionCaja) {
    setCloseSesion(sesion);
    const efectivoEsperado = sesion.saldoInicial + sesion.ingresos - sesion.egresos;
    setConteoEfectivo(efectivoEsperado);
    setCloseObservaciones('');
    setCloseOpen(true);
  }

  async function confirmarCierreSesion() {
    if (!closeSesion) return;
    const sesionId = closeSesion.id;
    const efectivoEsperado =
      closeSesion.saldoInicial + closeSesion.ingresos + closeSesion.ventas - closeSesion.egresos;
    await cerrarSesionCtx(sesionId, {
      saldoFinal: conteoEfectivo,
      observaciones: closeObservaciones || undefined,
    });
    toast.success('Sesión de caja cerrada', {
      description:
        conteoEfectivo !== efectivoEsperado
          ? `Diferencia: ${formatCOP(conteoEfectivo - efectivoEsperado)}`
          : 'Cuadre exacto',
    });
    setCloseOpen(false);
    setCloseSesion(null);
  }

  async function registrarMovimiento() {
    if (!movForm.sesionId) {
      toast.error('Selecciona la sesión de caja.');
      return;
    }
    if (movForm.monto <= 0) {
      toast.error('El monto debe ser mayor a 0.');
      return;
    }
    if (!movForm.concepto) {
      toast.error('Ingresa un concepto.');
      return;
    }
    await agregarMovimientoCtx(movForm.sesionId, {
      tipo: movForm.tipo,
      monto: movForm.monto,
      concepto: movForm.concepto,
      medioPago: movForm.medioPago,
    });
    toast.success('Movimiento registrado');
    setMovSheetOpen(false);
    setMovForm({ sesionId: '', tipo: 'ingreso', monto: 0, concepto: '', medioPago: 'efectivo' });
  }

  const totalVentasAbiertas = sesiones
    .filter((s) => s.estado === 'abierta')
    .reduce((sum, s) => sum + s.ventas, 0);
  const totalEfectivoCajas = sesiones
    .filter((s) => s.estado === 'abierta')
    .reduce((sum, s) => sum + s.saldoFinal, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cajas"
        description="Gestión de cajas registradoras, sesiones y movimientos de efectivo."
        actions={
          <>
            <Button variant="outline" onClick={() => setMovSheetOpen(true)} disabled={!sesionAbierta}>
              <Plus className="mr-2 h-4 w-4" /> Movimiento
            </Button>
            <Button onClick={() => {
              setEditingCaja(null);
              setCajaForm({ nombre: '', sucursal: '', saldoBase: 100000 });
              setCajaSheetOpen(true);
            }}>
              <Store className="mr-2 h-4 w-4" /> Nueva caja
            </Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-20 text-sm text-muted-foreground">
            Cargando cajas…
          </div>
        ) : error ? (
          <div className="col-span-full flex items-center justify-center py-20 text-sm text-destructive">
            Error: {error}
          </div>
        ) : (
          <>
        <KpiCard label="Cajas activas" value={cajas.filter((c) => c.activa).length.toString()} icon={Store} tone="primary" />
        <KpiCard label="Sesiones abiertas" value={sesiones.filter((s) => s.estado === 'abierta').length.toString()} icon={Wallet} tone="info" />
        <KpiCard label="Ventas en cajas abiertas" value={formatCOP(totalVentasAbiertas)} icon={TrendingUp} tone="success" />
        <KpiCard label="Saldo en cajas abiertas" value={formatCOP(totalEfectivoCajas)} icon={Receipt} tone="warning" />
          </>
        )}
      </div>

      <Tabs defaultValue="registers">
        <TabsList>
          <TabsTrigger value="registers">Cajas</TabsTrigger>
          <TabsTrigger value="sessions">Sesiones</TabsTrigger>
        </TabsList>

        <TabsContent value="registers" className="mt-4">
          {cajas.length === 0 ? (
            <EmptyState icon={Store} title="Sin cajas" description="Crea una caja para empezar a registrar sesiones." actionLabel="Nueva caja" onAction={() => setCajaSheetOpen(true)} />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {cajas.map((c) => {
                const sesionAbiertaCaja = sesiones.find((s) => s.cajaId === c.id && s.estado === 'abierta');
                return (
                  <Card key={c.id}>
                    <CardHeader className="flex-row items-start justify-between space-y-0">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Store className="h-4 w-4 text-primary" /> {c.nombre}
                          <Button variant="ghost" size="icon" className="h-6 w-6 ml-1" onClick={() => {
                            setEditingCaja(c);
                            setCajaForm({ nombre: c.nombre, sucursal: c.sucursal || '', saldoBase: c.saldoBase });
                            setCajaSheetOpen(true);
                          }}>
                            <Pencil className="h-3 w-3 text-muted-foreground" />
                          </Button>
                        </CardTitle>
                        <p className="mt-1 text-xs text-muted-foreground">{c.sucursal}</p>
                      </div>
                      {sesionAbiertaCaja ? (
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${ESTADO_CAJA_META.abierta.tone}`}>
                          Abierta
                        </span>
                      ) : (
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${ESTADO_CAJA_META.cerrada.tone}`}>
                          Cerrada
                        </span>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Saldo base</span>
                          <span className="font-medium">{formatCOP(c.saldoBase)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Responsable</span>
                          <span className="font-medium">{c.responsableActual || '—'}</span>
                        </div>
                        {sesionAbiertaCaja && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Saldo actual</span>
                            <span className="font-bold text-primary">{formatCOP(sesionAbiertaCaja.saldoFinal)}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {sesionAbiertaCaja ? (
                          <>
                            <Button size="sm" variant="outline" className="flex-1" onClick={() => { setDetailSesion(sesionAbiertaCaja); setDetailOpen(true); }}>
                              <Eye className="mr-1.5 h-3.5 w-3.5" /> Ver sesión
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => iniciarCierreSesion(sesionAbiertaCaja)}>
                              <Square className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        ) : (
                          <Button size="sm" className="flex-1" onClick={() => abrirSesion(c.id)}>
                            <Play className="mr-1.5 h-3.5 w-3.5" /> Abrir sesión
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sessions" className="mt-4">
          {sesiones.length === 0 ? (
            <EmptyState icon={Wallet} title="Sin sesiones" description="Abre una sesión en una caja para empezar." />
          ) : (
            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Caja</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Apertura</TableHead>
                    <TableHead>Cierre</TableHead>
                    <TableHead className="text-right">Saldo inicial</TableHead>
                    <TableHead className="text-right">Ventas</TableHead>
                    <TableHead className="text-right">Egresos</TableHead>
                    <TableHead className="text-right">Saldo final</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sesiones.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="text-sm font-medium">{s.caja.nombre}</TableCell>
                      <TableCell className="text-sm">{s.usuario}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDateTime(s.fechaApertura)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{s.fechaCierre ? formatDateTime(s.fechaCierre) : '—'}</TableCell>
                      <TableCell className="text-right text-sm">{formatCOP(s.saldoInicial)}</TableCell>
                      <TableCell className="text-right text-sm font-medium text-success">{formatCOP(s.ventas)}</TableCell>
                      <TableCell className="text-right text-sm text-destructive">{formatCOP(s.egresos)}</TableCell>
                      <TableCell className="text-right font-bold">{formatCOP(s.saldoFinal)}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${ESTADO_CAJA_META[s.estado].tone}`}>
                          {ESTADO_CAJA_META[s.estado].label}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setDetailSesion(s); setDetailOpen(true); }} aria-label="Ver detalle">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Nueva/Editar caja */}
      <Sheet open={cajaSheetOpen} onOpenChange={setCajaSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Store className="h-4 w-4 text-primary" /> {editingCaja ? 'Editar caja' : 'Nueva caja'}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label>Nombre *</Label>
              <Input value={cajaForm.nombre} onChange={(e) => setCajaForm({ ...cajaForm, nombre: e.target.value })} placeholder="Ej: Caja Principal" />
            </div>
            <div className="space-y-1.5">
              <Label>Sucursal *</Label>
              <Input value={cajaForm.sucursal} onChange={(e) => setCajaForm({ ...cajaForm, sucursal: e.target.value })} placeholder="Ej: Bogotá HQ" />
            </div>
            <div className="space-y-1.5">
              <Label>Saldo base (COP)</Label>
              <Input
                type="number"
                value={cajaForm.saldoBase}
                onChange={(e) => setCajaForm({ ...cajaForm, saldoBase: Number(e.target.value) })}
              />
            </div>
          </div>
          <SheetFooter className="mt-6">
            <SheetClose asChild><Button variant="outline">Cancelar</Button></SheetClose>
            <Button onClick={addCaja}>{editingCaja ? 'Guardar cambios' : 'Crear caja'}</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Movimiento de caja */}
      <Sheet open={movSheetOpen} onOpenChange={setMovSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" /> Movimiento de caja
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label>Sesión de caja *</Label>
              <Select value={movForm.sesionId} onValueChange={(v) => setMovForm({ ...movForm, sesionId: v })}>
                <SelectTrigger><SelectValue placeholder="Selecciona sesión…" /></SelectTrigger>
                <SelectContent>
                  {sesiones.filter((s) => s.estado === 'abierta').map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.caja.nombre} · {s.usuario}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Tipo de movimiento</Label>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { key: 'ingreso', label: 'Ingreso', icon: ArrowDownToLine },
                  { key: 'egreso', label: 'Egreso', icon: ArrowUpFromLine },
                  { key: 'venta', label: 'Venta', icon: TrendingUp },
                  { key: 'reembolso', label: 'Reembolso', icon: TrendingDown },
                ] as const).map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setMovForm({ ...movForm, tipo: t.key })}
                    className={`flex items-center gap-2 rounded-md border-2 px-3 py-2 text-sm font-medium transition-colors ${
                      movForm.tipo === t.key
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
              <Label>Monto (COP) *</Label>
              <Input
                type="number"
                value={movForm.monto}
                onChange={(e) => setMovForm({ ...movForm, monto: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Medio de pago</Label>
              <Select value={movForm.medioPago} onValueChange={(v) => setMovForm({ ...movForm, medioPago: v as MedioPago })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(MEDIO_PAGO_META).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Concepto *</Label>
              <Input value={movForm.concepto} onChange={(e) => setMovForm({ ...movForm, concepto: e.target.value })} placeholder="Ej: Pago a proveedor" />
            </div>
          </div>
          <SheetFooter className="mt-6">
            <SheetClose asChild><Button variant="outline">Cancelar</Button></SheetClose>
            <Button onClick={registrarMovimiento}>Registrar movimiento</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Detalle de sesión */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" /> Detalle de sesión
            </SheetTitle>
          </SheetHeader>
          {detailSesion && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-md border border-border p-3">
                  <p className="text-xs uppercase text-muted-foreground">Caja</p>
                  <p className="font-medium">{detailSesion.caja.nombre}</p>
                </div>
                <div className="rounded-md border border-border p-3">
                  <p className="text-xs uppercase text-muted-foreground">Usuario</p>
                  <p className="font-medium">{detailSesion.usuario}</p>
                </div>
                <div className="rounded-md border border-border p-3">
                  <p className="text-xs uppercase text-muted-foreground">Apertura</p>
                  <p className="text-xs">{formatDateTime(detailSesion.fechaApertura)}</p>
                </div>
                <div className="rounded-md border border-border p-3">
                  <p className="text-xs uppercase text-muted-foreground">Cierre</p>
                  <p className="text-xs">{detailSesion.fechaCierre ? formatDateTime(detailSesion.fechaCierre) : '—'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-md border border-border p-3">
                  <p className="text-xs uppercase text-muted-foreground">Saldo inicial</p>
                  <p className="font-medium">{formatCOP(detailSesion.saldoInicial)}</p>
                </div>
                <div className="rounded-md border border-border p-3">
                  <p className="text-xs uppercase text-muted-foreground">Saldo final</p>
                  <p className="font-bold text-primary">{formatCOP(detailSesion.saldoFinal)}</p>
                </div>
                <div className="rounded-md border border-success/30 bg-success/5 p-3">
                  <p className="text-xs uppercase text-muted-foreground">Ventas</p>
                  <p className="font-medium text-success">{formatCOP(detailSesion.ventas)}</p>
                </div>
                <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
                  <p className="text-xs uppercase text-muted-foreground">Egresos</p>
                  <p className="font-medium text-destructive">{formatCOP(detailSesion.egresos)}</p>
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">Movimientos ({detailSesion.movimientos.length})</p>
                {detailSesion.movimientos.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin movimientos registrados.</p>
                ) : (
                  <div className="space-y-2">
                    {detailSesion.movimientos.map((m) => {
                      const meta = TIPO_MOVIMIENTO_CAJA_META[m.tipo];
                      return (
                        <div key={m.id} className="flex items-center gap-3 rounded-md border border-border p-3">
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${meta.tone}`}>
                            {meta.label}
                          </span>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{m.concepto}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDateTime(m.fecha)} · {m.medioPago ? MEDIO_PAGO_META[m.medioPago].label : '—'}
                            </p>
                          </div>
                          <span className="text-sm font-bold">{formatCOP(m.monto)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Cierre de sesión (cuadre de caja) */}
      <Sheet open={closeOpen} onOpenChange={setCloseOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-primary" /> Cierre de caja
            </SheetTitle>
          </SheetHeader>
          {closeSesion && (
            <div className="mt-4 space-y-5">
              <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Caja</span>
                  <span className="font-medium">{closeSesion.caja.nombre}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Responsable</span>
                  <span className="font-medium">{closeSesion.usuario}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Apertura</span>
                  <span className="text-xs">{formatDateTime(closeSesion.fechaApertura)}</span>
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold">Resumen de ventas por medio de pago</p>
                <div className="space-y-1.5">
                  {Object.entries(
                    closeSesion.movimientos
                      .filter((m) => m.tipo === 'venta' || m.tipo === 'pago')
                      .reduce((acc, m) => {
                        const key = m.medioPago || 'otros';
                        acc[key] = (acc[key] || 0) + m.monto;
                        return acc;
                      }, {} as Record<string, number>)
                  ).map(([medio, monto]) => (
                    <div key={medio} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                      <span className="text-muted-foreground">{MEDIO_PAGO_META[medio as MedioPago]?.label || medio}</span>
                      <span className="font-medium">{formatCOP(monto)}</span>
                    </div>
                  ))}
                  {closeSesion.movimientos.filter((m) => m.tipo === 'venta' || m.tipo === 'pago').length === 0 && (
                    <p className="text-sm text-muted-foreground">Sin ventas registradas en esta sesión.</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-md border border-border p-3">
                  <p className="text-xs uppercase text-muted-foreground">Saldo inicial</p>
                  <p className="font-medium">{formatCOP(closeSesion.saldoInicial)}</p>
                </div>
                <div className="rounded-md border border-success/30 bg-success/5 p-3">
                  <p className="text-xs uppercase text-muted-foreground">Ingresos</p>
                  <p className="font-medium text-success">{formatCOP(closeSesion.ingresos)}</p>
                </div>
                <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
                  <p className="text-xs uppercase text-muted-foreground">Egresos</p>
                  <p className="font-medium text-destructive">{formatCOP(closeSesion.egresos)}</p>
                </div>
                <div className="rounded-md border border-primary/30 bg-primary/5 p-3">
                  <p className="text-xs uppercase text-muted-foreground">Ventas totales</p>
                  <p className="font-medium text-primary">{formatCOP(closeSesion.ventas)}</p>
                </div>
              </div>

              {(() => {
                const efectivoEsperado = closeSesion.saldoInicial + closeSesion.ingresos - closeSesion.egresos;
                const diferencia = conteoEfectivo - efectivoEsperado;
                const hayDiferencia = Math.abs(diferencia) > 0;
                return (
                  <div className="space-y-3">
                    <div className="rounded-md border-2 border-border p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-sm font-semibold">Cuadre de efectivo</p>
                        {hayDiferencia ? (
                          <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-semibold text-destructive">
                            Diferencia: {formatCOP(Math.abs(diferencia))}
                          </span>
                        ) : (
                          <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs font-semibold text-success">
                            Cuadrado
                          </span>
                        )}
                      </div>
                      <div className="space-y-1.5 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Efectivo esperado</span>
                          <span className="font-medium">{formatCOP(efectivoEsperado)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Efectivo contado</span>
                          <span className="font-bold">{formatCOP(conteoEfectivo)}</span>
                        </div>
                        <div className="flex justify-between border-t border-border pt-1.5">
                          <span className="text-muted-foreground">Diferencia</span>
                          <span className={hayDiferencia ? 'font-bold text-destructive' : 'font-bold text-success'}>
                            {diferencia >= 0 ? '+' : ''}{formatCOP(diferencia)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Conteo de efectivo (billetes y monedas)</Label>
                      <Input
                        type="number"
                        value={conteoEfectivo}
                        onChange={(e) => setConteoEfectivo(Number(e.target.value))}
                      />
                    </div>
                  </div>
                );
              })()}

              <div className="space-y-1.5">
                <Label>Observaciones</Label>
                <Textarea
                  value={closeObservaciones}
                  onChange={(e) => setCloseObservaciones(e.target.value)}
                  placeholder="Notas sobre el cierre de caja, diferencias, novedades…"
                  rows={3}
                />
              </div>

              <SheetFooter className="mt-2">
                <SheetClose asChild><Button variant="outline">Cancelar</Button></SheetClose>
                <Button variant="destructive" onClick={confirmarCierreSesion}>
                  <Square className="mr-2 h-4 w-4" /> Cerrar sesión
                </Button>
              </SheetFooter>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
