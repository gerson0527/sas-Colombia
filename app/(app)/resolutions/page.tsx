'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, ScrollText, AlertTriangle, Calendar } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useResoluciones } from '@/hooks/use-supabase-data';
import { TIPO_DOCUMENTO_META } from '@/lib/constants';
import { formatShortDate, daysUntil } from '@/lib/format';
import type { ResolucionDian, TipoDocumento } from '@/lib/types';

const empty = {
  numeroResolucion: '',
  tipoDocumento: 'factura_venta' as TipoDocumento,
  prefijo: '',
  rangoDesde: 1,
  rangoHasta: 10000,
  fechaVigenciaDesde: '',
  fechaVigenciaHasta: '',
};

export default function ResolutionsPage() {
  const { data: items, loading, error, create } = useResoluciones();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [form, setForm] = useState(empty);

  async function save() {
    if (!form.numeroResolucion || !form.prefijo || !form.fechaVigenciaDesde || !form.fechaVigenciaHasta) {
      toast.error('Completa todos los campos de la resolución.');
      return;
    }
    if (form.rangoHasta <= form.rangoDesde) {
      toast.error('El rango hasta debe ser mayor al rango desde.');
      return;
    }
    const created = await create({
      numeroResolucion: form.numeroResolucion,
      tipoDocumento: form.tipoDocumento,
      prefijo: form.prefijo,
      rangoDesde: form.rangoDesde,
      rangoHasta: form.rangoHasta,
      fechaVigenciaDesde: form.fechaVigenciaDesde,
      fechaVigenciaHasta: form.fechaVigenciaHasta,
      activa: true,
    });
    if (created) {
      toast.success('Resolución registrada');
      setSheetOpen(false);
      setForm(empty);
    } else {
      toast.error('No se pudo registrar la resolución.');
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Resoluciones DIAN"
        description="Administra los rangos de numeración autorizados por la DIAN."
        actions={
          <Button onClick={() => setSheetOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nueva resolución
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-20 text-sm text-muted-foreground">
            Cargando resoluciones…
          </div>
        ) : error ? (
          <div className="col-span-full flex items-center justify-center py-20 text-sm text-destructive">
            Error: {error}
          </div>
        ) : items.map((r) => {
          const usage = (r.consecutivoActual / r.rangoHasta) * 100;
          const days = daysUntil(r.fechaVigenciaHasta);
          const nearExpiry = days !== null && days < 90;
          const nearFull = usage > 80;
          return (
            <Card key={r.id}>
              <CardHeader className="flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <span className="rounded-md bg-primary/10 px-2 py-0.5 font-mono text-sm text-primary">
                      {r.prefijo}
                    </span>
                    {TIPO_DOCUMENTO_META[r.tipoDocumento].label}
                  </CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Resolución N° {r.numeroResolucion}
                  </p>
                </div>
                {r.activa ? (
                  <Badge className="bg-success/15 text-success border-success/30">Activa</Badge>
                ) : (
                  <Badge variant="secondary">Inactiva</Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Consecutivo</span>
                    <span className="font-medium">
                      {r.consecutivoActual.toLocaleString('es-CO')} / {r.rangoHasta.toLocaleString('es-CO')}
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className={`h-full rounded-full transition-all ${nearFull ? 'bg-warning' : 'bg-primary'}`}
                      style={{ width: `${Math.min(100, usage)}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{usage.toFixed(1)}% usado</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  Vigencia: {formatShortDate(r.fechaVigenciaDesde)} — {formatShortDate(r.fechaVigenciaHasta)}
                </div>
                {(nearExpiry || nearFull) && (
                  <div className="flex items-center gap-2 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {nearExpiry && days !== null && days >= 0 && `Vence en ${days} días.`}
                    {nearExpiry && days !== null && days < 0 && 'Resolución vencida.'}
                    {nearFull && 'Rango próximo a agotarse.'}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <ScrollText className="h-4 w-4 text-primary" /> Nueva resolución DIAN
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label>Número de resolución *</Label>
              <Input value={form.numeroResolucion} onChange={(e) => setForm({ ...form, numeroResolucion: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Tipo de documento</Label>
              <Select value={form.tipoDocumento} onValueChange={(v) => setForm({ ...form, tipoDocumento: v as TipoDocumento })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TIPO_DOCUMENTO_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Prefijo *</Label>
              <Input value={form.prefijo} onChange={(e) => setForm({ ...form, prefijo: e.target.value.toUpperCase() })} maxLength={4} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Rango desde</Label>
                <Input type="number" value={form.rangoDesde} onChange={(e) => setForm({ ...form, rangoDesde: Number(e.target.value) })} />
              </div>
              <div className="space-y-1.5">
                <Label>Rango hasta</Label>
                <Input type="number" value={form.rangoHasta} onChange={(e) => setForm({ ...form, rangoHasta: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Vigencia desde</Label>
                <Input type="date" value={form.fechaVigenciaDesde} onChange={(e) => setForm({ ...form, fechaVigenciaDesde: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Vigencia hasta</Label>
                <Input type="date" value={form.fechaVigenciaHasta} onChange={(e) => setForm({ ...form, fechaVigenciaHasta: e.target.value })} />
              </div>
            </div>
          </div>
          <SheetFooter className="mt-6">
            <SheetClose asChild><Button variant="outline">Cancelar</Button></SheetClose>
            <Button onClick={save}>Registrar resolución</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
