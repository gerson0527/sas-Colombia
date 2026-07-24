'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Store, Play, Square, Eye, Wallet, Receipt, Lock, RefreshCw, Plus, Trash2 } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { formatCOP, formatDateTime } from '@/lib/format';
import { api } from '@/lib/api-client';

type Caja = {
  id: string;
  name: string;
  branchId: string;
  location?: string;
  active: boolean;
};

type SesionCaja = {
  id: string;
  cashRegisterId: string;
  branchId: string;
  openedBy: string;
  openedByUser?: { id: string; fullName: string };
  closedBy?: string;
  closedByUser?: { id: string; fullName: string };
  openingAmount: number;
  closingAmount?: number;
  expectedAmount?: number;
  difference?: number;
  status: 'open' | 'closed' | 'reconciled' | 'voided';
  openedAt: string;
  closedAt?: string;
  closeNotes?: string;
};

const statusMeta: Record<string, { label: string; tone: string }> = {
  open: { label: 'Abierta', tone: 'border-success/30 bg-success/10 text-success' },
  closed: { label: 'Cerrada', tone: 'border-muted-foreground/30 bg-muted text-muted-foreground' },
  reconciled: { label: 'Conciliada', tone: 'border-primary/30 bg-primary/10 text-primary' },
  voided: { label: 'Anulada', tone: 'border-destructive/30 bg-destructive/10 text-destructive' },
};

export default function CashRegistersPage() {
  const { cajas, sesiones, sesionAbierta, abrirSesion, cerrarSesion, crearCaja, eliminarCaja, refrescar, loading } = useCashSession();
  const [openSheet, setOpenSheet] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newCajaName, setNewCajaName] = useState('');
  const [newCajaBranch, setNewCajaBranch] = useState('');
  const [newCajaLocation, setNewCajaLocation] = useState('');
  const [newCajaOpening, setNewCajaOpening] = useState(0);
  const [branches, setBranches] = useState<any[]>([]);
  const [closeMovements, setCloseMovements] = useState<any[]>([]);
  const [loadingMovements, setLoadingMovements] = useState(false);

  useEffect(() => {
    if (createOpen && branches.length === 0) {
      api.get('/v1/branches').then((res: any) => setBranches(res)).catch(() => {});
    }
  }, [createOpen, branches.length]);

  const [selectedCaja, setSelectedCaja] = useState<Caja | null>(null);
  const [openingAmount, setOpeningAmount] = useState(0);
  const [detailSesion, setDetailSesion] = useState<SesionCaja | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [closeSesion, setCloseSesion] = useState<SesionCaja | null>(null);
  const [closeOpen, setCloseOpen] = useState(false);
  const [closingAmount, setClosingAmount] = useState(0);
  const [closeNotes, setCloseNotes] = useState('');

  useEffect(() => {
    if (closeOpen && closeSesion) {
      setLoadingMovements(true);
      api.get(`/v1/cash-sessions/${closeSesion.id}/movements`)
        .then((res: any) => setCloseMovements(res))
        .catch(() => setCloseMovements([]))
        .finally(() => setLoadingMovements(false));
    } else {
      setCloseMovements([]);
    }
  }, [closeOpen, closeSesion]);

  const [branchesRecord, setBranchesRecord] = useState<Record<string, string>>({});

  function prepareOpening(caja: Caja) {
    setSelectedCaja(caja);
    setOpeningAmount(0);
    setOpenSheet(true);
  }

  async function confirmOpening() {
    if (!selectedCaja || openingAmount < 0) return;
    if (sesiones.some((s) => s.cashRegisterId === selectedCaja.id && s.status === 'open')) {
      toast.error('Esta caja ya tiene una sesión abierta.');
      return;
    }
    await abrirSesion(selectedCaja.id, selectedCaja.branchId, openingAmount);
    toast.success('Sesión de caja abierta', {
      description: `${selectedCaja.name} · Saldo inicial ${formatCOP(openingAmount)}`,
    });
    setOpenSheet(false);
    setSelectedCaja(null);
  }

  function prepareClosing(sesion: SesionCaja) {
    setCloseSesion(sesion);
    setClosingAmount(sesion.expectedAmount ?? sesion.openingAmount);
    setCloseNotes('');
    setCloseOpen(true);
  }

  async function confirmClosing() {
    if (!closeSesion) return;
    const difference = closingAmount - (closeSesion.expectedAmount ?? closeSesion.openingAmount);
    await cerrarSesion(closeSesion.id, closingAmount, closeNotes || undefined);
    toast.success('Sesión de caja cerrada', {
      description: difference !== 0 ? `Diferencia: ${formatCOP(difference)}` : 'Cuadre exacto',
    });
    setCloseOpen(false);
    setCloseSesion(null);
  }

  async function createMainBranch() {
    try {
      const res = await api.post('/v1/branches', { name: 'Sucursal Principal', isMain: true });
      setBranches([...branches, res as any]);
      setNewCajaBranch((res as any).id);
      toast.success('Sucursal Principal creada automáticamente');
    } catch (e: any) {
      toast.error(e.message || 'Error al crear sucursal');
    }
  }

  async function confirmCreate() {
    if (!newCajaName || !newCajaBranch) {
      toast.error('Nombre y Sucursal son obligatorios.');
      return;
    }
    try {
      await crearCaja({ name: newCajaName, branchId: newCajaBranch, location: newCajaLocation, openingBalanceDefault: newCajaOpening });
      toast.success('Caja creada correctamente');
      setCreateOpen(false);
      setNewCajaName('');
      setNewCajaBranch('');
      setNewCajaLocation('');
      setNewCajaOpening(0);
    } catch (e: any) {
      toast.error(e.message || 'Error al crear la caja');
    }
  }

  async function handleDeleteCaja(id: string, name: string) {
    if (!confirm(`¿Eliminar o desactivar la caja "${name}"?`)) return;
    try {
      const res = await eliminarCaja(id);
      if (res.deleted) {
        toast.success(`Caja "${name}" eliminada correctamente.`);
      } else {
        toast.info(res.message || `Caja "${name}" fue marcada como inactiva.`);
      }
    } catch (e: any) {
      toast.error(e.message || 'Error al eliminar la caja');
    }
  }

  const getCaja = (cashRegisterId: string) => cajas.find((c) => c.id === cashRegisterId);
  const openedSessions = sesiones.filter((s) => s.status === 'open');
  const totalExpected = openedSessions.reduce((sum, s) => sum + (s.expectedAmount ?? s.openingAmount), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cajas"
        description="Gestión de cajas registradoras y sesiones de efectivo."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={refrescar} disabled={loading}><RefreshCw className="mr-2 h-4 w-4" /> Actualizar</Button>
            <Button onClick={() => setCreateOpen(true)}><Plus className="mr-2 h-4 w-4" /> Nueva caja</Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-20 text-sm text-muted-foreground">
            Cargando cajas…
          </div>
        ) : (
          <>
            <KpiCard label="Cajas activas" value={cajas.filter((c) => c.active).length.toString()} icon={Store} tone="primary" />
            <KpiCard label="Sesiones abiertas" value={openedSessions.length.toString()} icon={Wallet} tone="info" />
            <KpiCard label="Saldo inicial abierto" value={formatCOP(openedSessions.reduce((sum, s) => sum + s.openingAmount, 0))} icon={Receipt} tone="success" />
            <KpiCard label="Saldo esperado" value={formatCOP(totalExpected)} icon={Receipt} tone="warning" />
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
            <EmptyState icon={Store} title="Sin cajas" description="No hay cajas registradas." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {cajas.map((caja) => {
                const abierta = sesiones.find((s) => s.cashRegisterId === caja.id && s.status === 'open');
                return (
                  <Card key={caja.id}>
                    <CardHeader className="flex-row items-start justify-between space-y-0">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Store className="h-4 w-4 text-primary" /> {caja.name}
                        </CardTitle>
                        <p className="mt-1 text-xs text-muted-foreground">{caja.location || caja.branchId}</p>
                      </div>
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${abierta ? statusMeta.open.tone : statusMeta.closed.tone}`}>
                        {abierta ? 'Abierta' : 'Cerrada'}
                      </span>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Estado</span>
                          <span className="font-medium">{caja.active ? 'Activa' : 'Inactiva'}</span>
                        </div>
                        {abierta && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Saldo esperado</span>
                            <span className="font-bold text-primary">{formatCOP(abierta.expectedAmount ?? abierta.openingAmount)}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {abierta ? (
                          <>
                            <Button size="sm" variant="outline" className="flex-1" onClick={() => { setDetailSesion(abierta); setDetailOpen(true); }}>
                              <Eye className="mr-1.5 h-3.5 w-3.5" /> Ver sesión
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => prepareClosing(abierta)}>
                              <Square className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button size="sm" className="flex-1" disabled={!caja.active || Boolean(sesionAbierta)} onClick={() => prepareOpening(caja)}>
                              <Play className="mr-1.5 h-3.5 w-3.5" /> Abrir sesión
                            </Button>
                            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteCaja(caja.id, caja.name)} title="Eliminar caja">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
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
                    <TableHead className="text-right">Saldo esperado</TableHead>
                    <TableHead className="text-right">Diferencia</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sesiones.map((sesion) => {
                    const caja = getCaja(sesion.cashRegisterId);
                    const meta = statusMeta[sesion.status];
                    return (
                      <TableRow key={sesion.id}>
                        <TableCell className="text-sm font-medium">{caja?.name || sesion.cashRegisterId}</TableCell>
                        <TableCell className="text-sm">{(sesion as any).openedByUser?.fullName || sesion.openedBy}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDateTime(sesion.openedAt)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{sesion.closedAt ? formatDateTime(sesion.closedAt) : '—'}</TableCell>
                        <TableCell className="text-right text-sm">{formatCOP(sesion.openingAmount)}</TableCell>
                        <TableCell className="text-right text-sm">{sesion.expectedAmount === undefined ? '—' : formatCOP(sesion.expectedAmount)}</TableCell>
                        <TableCell className="text-right text-sm">{sesion.difference === undefined ? '—' : formatCOP(sesion.difference)}</TableCell>
                        <TableCell><span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${meta.tone}`}>{meta.label}</span></TableCell>
                        <TableCell className="text-right">
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setDetailSesion(sesion); setDetailOpen(true); }} aria-label="Ver detalle">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Sheet open={openSheet} onOpenChange={setOpenSheet}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader><SheetTitle className="flex items-center gap-2"><Store className="h-4 w-4 text-primary" /> Abrir sesión</SheetTitle></SheetHeader>
          {selectedCaja && <div className="mt-4 space-y-4"><p className="text-sm text-muted-foreground">{selectedCaja.name}</p><div className="space-y-1.5"><Label>Saldo inicial (COP)</Label><Input type="number" min="0" value={openingAmount} onChange={(e) => setOpeningAmount(Number(e.target.value))} /></div></div>}
          <SheetFooter className="mt-6"><SheetClose asChild><Button variant="outline">Cancelar</Button></SheetClose><Button onClick={confirmOpening}>Abrir sesión</Button></SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg">
          <SheetHeader><SheetTitle className="flex items-center gap-2"><Wallet className="h-4 w-4 text-primary" /> Detalle de sesión</SheetTitle></SheetHeader>
          {detailSesion && <div className="mt-4 space-y-4"><div className="grid grid-cols-2 gap-3 text-sm"><div className="rounded-md border p-3"><p className="text-xs uppercase text-muted-foreground">Caja</p><p className="font-medium">{getCaja(detailSesion.cashRegisterId)?.name || detailSesion.cashRegisterId}</p></div><div className="rounded-md border p-3"><p className="text-xs uppercase text-muted-foreground">Usuario</p><p className="font-medium">{detailSesion.openedByUser?.fullName || detailSesion.openedBy}</p></div><div className="rounded-md border p-3"><p className="text-xs uppercase text-muted-foreground">Apertura</p><p className="text-xs">{formatDateTime(detailSesion.openedAt)}</p></div><div className="rounded-md border p-3"><p className="text-xs uppercase text-muted-foreground">Cierre</p><p className="text-xs">{detailSesion.closedAt ? formatDateTime(detailSesion.closedAt) : '—'}</p></div></div><div className="grid grid-cols-2 gap-3 text-sm"><div className="rounded-md border p-3"><p className="text-xs uppercase text-muted-foreground">Saldo inicial</p><p className="font-medium">{formatCOP(detailSesion.openingAmount)}</p></div><div className="rounded-md border p-3"><p className="text-xs uppercase text-muted-foreground">Saldo esperado</p><p className="font-bold text-primary">{detailSesion.expectedAmount === undefined ? '—' : formatCOP(detailSesion.expectedAmount)}</p></div><div className="rounded-md border p-3"><p className="text-xs uppercase text-muted-foreground">Saldo final</p><p className="font-bold">{detailSesion.closingAmount === undefined ? '—' : formatCOP(detailSesion.closingAmount)}</p></div><div className="rounded-md border p-3"><p className="text-xs uppercase text-muted-foreground">Diferencia</p><p className="font-medium">{detailSesion.difference === undefined ? '—' : formatCOP(detailSesion.difference)}</p></div></div></div>}
        </SheetContent>
      </Sheet>

      <Sheet open={closeOpen} onOpenChange={setCloseOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader><SheetTitle className="flex items-center gap-2"><Lock className="h-4 w-4 text-primary" /> Cierre de caja</SheetTitle></SheetHeader>
          {closeSesion && (
            <div className="mt-4 space-y-5">
              <div className="rounded-md border bg-muted/30 p-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Caja</span><span className="font-medium">{getCaja(closeSesion.cashRegisterId)?.name || closeSesion.cashRegisterId}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Responsable</span><span className="font-medium">{closeSesion.openedByUser?.fullName || closeSesion.openedBy}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Saldo inicial</span><span className="font-medium">{formatCOP(closeSesion.openingAmount)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Saldo esperado (Total)</span><span className="font-bold text-primary">{formatCOP(closeSesion.expectedAmount ?? closeSesion.openingAmount)}</span></div>
              </div>

              <div className="space-y-2">
                <Label>Resumen de ingresos por método de pago</Label>
                {loadingMovements ? (
                  <div className="text-xs text-muted-foreground py-2">Cargando movimientos...</div>
                ) : closeMovements.length === 0 ? (
                  <div className="text-xs text-muted-foreground py-2 border rounded-md px-3">No hay movimientos registrados.</div>
                ) : (
                  <div className="rounded-md border divide-y">
                    {Object.entries(
                      closeMovements.reduce((acc, mov) => {
                        const m = mov.paymentMethod || 'Efectivo';
                        if (mov.type === 'SALE' || mov.type === 'INCOME') {
                          acc[m] = (acc[m] || 0) + Number(mov.amount);
                        } else if (mov.type === 'REFUND' || mov.type === 'EXPENSE' || mov.type === 'WITHDRAWAL') {
                          acc[m] = (acc[m] || 0) - Number(mov.amount);
                        }
                        return acc;
                      }, {} as Record<string, number>)
                    ).map(([method, amount]) => (
                      <div key={method} className="flex justify-between p-2 text-sm">
                        <span className="text-muted-foreground uppercase text-xs font-semibold">{method}</span>
                        <span className="font-medium">{formatCOP(Number(amount))}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1.5"><Label>Conteo físico (Solo Efectivo en Caja)</Label><Input type="number" min="0" value={closingAmount} onChange={(e) => setClosingAmount(Number(e.target.value))} /></div>
              <div className="space-y-1.5"><Label>Observaciones</Label><Textarea value={closeNotes} onChange={(e) => setCloseNotes(e.target.value)} placeholder="Notas sobre el cierre de caja…" rows={3} /></div>
              <div className="flex justify-between rounded-md border p-3 text-sm"><span className="text-muted-foreground">Diferencia (Efectivo físico vs Esperado total)</span><span className="font-bold">{formatCOP(closingAmount - (closeSesion.expectedAmount ?? closeSesion.openingAmount))}</span></div>
              <p className="text-xs text-muted-foreground">* Nota: La diferencia se calcula restando el total esperado (incluye todos los medios de pago) del conteo físico. Asegúrate de reportar el total correcto consolidado.</p>
              <SheetFooter className="mt-2"><SheetClose asChild><Button variant="outline">Cancelar</Button></SheetClose><Button variant="destructive" onClick={confirmClosing}><Square className="mr-2 h-4 w-4" /> Cerrar sesión</Button></SheetFooter>
            </div>
          )}
        </SheetContent>
      </Sheet>
      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader><SheetTitle className="flex items-center gap-2"><Store className="h-4 w-4 text-primary" /> Crear nueva caja</SheetTitle></SheetHeader>
          <div className="mt-4 space-y-4">
            <div className="space-y-1.5"><Label>Nombre de la caja</Label><Input value={newCajaName} onChange={(e) => setNewCajaName(e.target.value)} placeholder="Ej. Caja Principal" /></div>
            <div className="space-y-1.5">
              <Label>Sucursal</Label>
              <div className="flex gap-2">
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" 
                  value={newCajaBranch} 
                  onChange={(e) => setNewCajaBranch(e.target.value)}
                >
                  <option value="">Selecciona una sucursal...</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
                {branches.length === 0 && (
                  <Button type="button" variant="secondary" onClick={createMainBranch}>Crear por defecto</Button>
                )}
              </div>
            </div>
            <div className="space-y-1.5"><Label>Ubicación (Opcional)</Label><Input value={newCajaLocation} onChange={(e) => setNewCajaLocation(e.target.value)} placeholder="Ej. Piso 1" /></div>
            <div className="space-y-1.5"><Label>Saldo inicial por defecto (COP)</Label><Input type="number" min="0" value={newCajaOpening} onChange={(e) => setNewCajaOpening(Number(e.target.value))} /></div>
          </div>
          <SheetFooter className="mt-6"><SheetClose asChild><Button variant="outline">Cancelar</Button></SheetClose><Button onClick={confirmCreate}>Guardar</Button></SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
