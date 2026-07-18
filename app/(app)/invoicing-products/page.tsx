'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  FileSpreadsheet,
  Search,
  Pencil,
  Plus,
  Trash2,
  Tag,
  Building2,
  Globe,
  Shield,
} from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { EmptyState } from '@/components/empty-state';
import { useProductosFacturacion, useProductos } from '@/hooks/use-supabase-data';
import {
  CATEGORIA_PRODUCTO_FACTURACION_META,
  UNIDADES_MEDIDA_DIAN,
  TIPO_TRIBUTO_META,
  IVA_OPCIONES,
} from '@/lib/constants';
import { formatCOP } from '@/lib/format';
import type {
  Producto,
  ProductoFacturacion,
  CategoriaProductoFacturacion,
  UnidadMedidaDIAN,
  TipoTributo,
  TributoInfo,
} from '@/lib/types';

function emptyTributo(): TributoInfo {
  return { tipo: 'iva', porcentaje: 19, baseImponible: 0, valor: 0, codigoDIAN: '01' };
}

const emptyForm: Omit<ProductoFacturacion, 'id'> = {
  productoId: '',
  producto: {} as Producto,
  categoria: 'servicios',
  precioConImpuestos: 0,
  tributos: [emptyTributo()],
  codigoEstandar: '',
  codigoUNSPSC: '',
  unidadMedidaDIAN: 'UND',
  cuentaContableVentas: '4135',
  cuentaContableCompras: '6135',
  requiereExportacion: false,
  excluidoDeIva: false,
  bienDeCapital: false,
  activo: true,
};

export default function InvoicingProductsPage() {
  const [search, setSearch] = useState('');
  const { data: productos } = useProductos();
  const { data: items, loading, error, create, update, remove } = useProductosFacturacion(productos);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<ProductoFacturacion | null>(null);
  const [form, setForm] = useState<Omit<ProductoFacturacion, 'id'>>(emptyForm);

  const filtered = search
    ? items.filter(
        (i) =>
          i.producto.nombre.toLowerCase().includes(search.toLowerCase()) ||
          i.codigoEstandar.toLowerCase().includes(search.toLowerCase()) ||
          i.codigoUNSPSC.toLowerCase().includes(search.toLowerCase())
      )
    : items;

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setSheetOpen(true);
  }

  function openEdit(p: ProductoFacturacion) {
    setEditing(p);
    const { id, ...rest } = p;
    setForm(rest);
    setSheetOpen(true);
  }

  function onProductoChange(productoId: string) {
    const prod = productos.find((p) => p.id === productoId);
    if (!prod) return;
    setForm((f) => ({
      ...f,
      productoId,
      producto: prod,
      codigoUNSPSC: prod.codigoUNSPSC || '',
      unidadMedidaDIAN: prod.unidadMedida,
      precioConImpuestos: prod.precioUnitario * (1 + prod.iva / 100),
    }));
  }

  function updateTributo(idx: number, patch: Partial<TributoInfo>) {
    setForm((f) => ({
      ...f,
      tributos: f.tributos.map((t, i) => (i === idx ? { ...t, ...patch } : t)),
    }));
  }

  function addTributo() {
    setForm((f) => ({ ...f, tributos: [...f.tributos, emptyTributo()] }));
  }

  function removeTributo(idx: number) {
    setForm((f) => ({ ...f, tributos: f.tributos.filter((_, i) => i !== idx) }));
  }

  async function save() {
    if (!form.productoId) {
      toast.error('Selecciona un producto.');
      return;
    }
    if (!form.codigoEstandar || !form.codigoUNSPSC) {
      toast.error('Completa código estándar y UNSPSC.');
      return;
    }
    if (editing) {
      const ok = await update(editing.id, form);
      if (ok) toast.success('Configuración actualizada');
      else toast.error('No se pudo actualizar.');
    } else {
      const created = await create(form);
      if (created) toast.success('Producto de facturación creado');
      else toast.error('No se pudo crear.');
    }
    setSheetOpen(false);
  }

  async function removeItem(id: string) {
    const ok = await remove(id);
    if (ok) toast.success('Producto de facturación eliminado');
    else toast.error('No se pudo eliminar.');
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Productos de facturación"
        description="Configuración avanzada DIAN por producto: tributos, códigos UNSPSC, cuentas contables y atributos fiscales."
        actions={
          <Button onClick={openNew}>
            <Plus className="mr-2 h-4 w-4" /> Nuevo producto de facturación
          </Button>
        }
      />

      <Card className="p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, código estándar o UNSPSC…"
            className="pl-8"
          />
        </div>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
          Cargando productos de facturación…
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-20 text-sm text-destructive">
          Error: {error}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FileSpreadsheet}
          title="Sin productos de facturación"
          description="Configura productos con sus tributos y códigos DIAN."
          actionLabel="Nuevo producto de facturación"
          onAction={openNew}
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Cód. estándar</TableHead>
                <TableHead>UNSPSC</TableHead>
                <TableHead>Unidad</TableHead>
                <TableHead>Tributos</TableHead>
                <TableHead className="text-right">Precio c/imp.</TableHead>
                <TableHead>Atributos</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <p className="text-sm font-medium">{p.producto.nombre}</p>
                    <p className="font-mono text-xs text-muted-foreground">{p.producto.codigo}</p>
                  </TableCell>
                  <TableCell className="text-sm">{CATEGORIA_PRODUCTO_FACTURACION_META[p.categoria].label}</TableCell>
                  <TableCell className="font-mono text-xs">{p.codigoEstandar}</TableCell>
                  <TableCell className="font-mono text-xs">{p.codigoUNSPSC}</TableCell>
                  <TableCell className="text-sm">{p.unidadMedidaDIAN}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {p.tributos.map((t, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {TIPO_TRIBUTO_META[t.tipo].label} {t.porcentaje}%
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">{formatCOP(p.precioConImpuestos)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {p.requiereExportacion && <Badge className="bg-info/10 text-info border-info/30 text-xs">Exportación</Badge>}
                      {p.excluidoDeIva && <Badge className="bg-warning/10 text-warning border-warning/30 text-xs">Excl. IVA</Badge>}
                      {p.bienDeCapital && <Badge className="bg-primary/10 text-primary border-primary/25 text-xs">Bien capital</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(p)} aria-label="Editar">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" aria-label="Eliminar">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar producto de facturación?</AlertDialogTitle>
                            <AlertDialogDescription>
                              La configuración DIAN de <strong>{p.producto.nombre}</strong> se eliminará.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => removeItem(p.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Form sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-primary" />
              {editing ? 'Editar producto de facturación' : 'Nuevo producto de facturación'}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-5">
            {/* Producto base */}
            <div className="space-y-3">
              <p className="flex items-center gap-1.5 text-sm font-medium"><Tag className="h-4 w-4 text-primary" /> Producto base</p>
              <div className="space-y-1.5">
                <Label>Producto del catálogo *</Label>
                <Select value={form.productoId} onValueChange={onProductoChange}>
                  <SelectTrigger><SelectValue placeholder="Selecciona…" /></SelectTrigger>
                  <SelectContent>
                    {productos.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.codigo} · {p.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Categoría</Label>
                  <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v as CategoriaProductoFacturacion })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(CATEGORIA_PRODUCTO_FACTURACION_META).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Unidad de medida DIAN</Label>
                  <Select value={form.unidadMedidaDIAN} onValueChange={(v) => setForm({ ...form, unidadMedidaDIAN: v as UnidadMedidaDIAN })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {UNIDADES_MEDIDA_DIAN.map((u) => (
                        <SelectItem key={u.codigo} value={u.codigo}>{u.label} ({u.codigo})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Código estándar *</Label>
                  <Input value={form.codigoEstandar} onChange={(e) => setForm({ ...form, codigoEstandar: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Código UNSPSC *</Label>
                  <Input value={form.codigoUNSPSC} onChange={(e) => setForm({ ...form, codigoUNSPSC: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Precio con impuestos (COP)</Label>
                <Input
                  type="number"
                  value={form.precioConImpuestos}
                  onChange={(e) => setForm({ ...form, precioConImpuestos: Number(e.target.value) })}
                />
              </div>
            </div>

            <Separator />

            {/* Tributos */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-1.5 text-sm font-medium"><Shield className="h-4 w-4 text-primary" /> Tributos DIAN</p>
                <Button size="sm" variant="outline" onClick={addTributo}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" /> Agregar tributo
                </Button>
              </div>
              <div className="space-y-3">
                {form.tributos.map((t, idx) => (
                  <div key={idx} className="rounded-md border border-border p-3">
                    <div className="grid gap-3 sm:grid-cols-4">
                      <div className="space-y-1">
                        <Label className="text-xs">Tipo</Label>
                        <Select
                          value={t.tipo}
                          onValueChange={(v) => {
                            const tipo = v as TipoTributo;
                            updateTributo(idx, { tipo, codigoDIAN: TIPO_TRIBUTO_META[tipo].codigoDIAN, esRetencion: tipo.startsWith('rete') });
                          }}
                        >
                          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(TIPO_TRIBUTO_META).map(([k, v]) => (
                              <SelectItem key={k} value={k}>{v.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Porcentaje %</Label>
                        {t.tipo === 'iva' ? (
                          <Select value={String(t.porcentaje)} onValueChange={(v) => updateTributo(idx, { porcentaje: Number(v) })}>
                            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {IVA_OPCIONES.map((v) => <SelectItem key={v} value={String(v)}>{v}%</SelectItem>)}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            type="number"
                            step="0.01"
                            value={t.porcentaje}
                            onChange={(e) => updateTributo(idx, { porcentaje: Number(e.target.value) })}
                            className="h-9"
                          />
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Base imponible</Label>
                        <Input
                          type="number"
                          value={t.baseImponible}
                          onChange={(e) => {
                            const base = Number(e.target.value);
                            updateTributo(idx, { baseImponible: base, valor: (base * t.porcentaje) / 100 });
                          }}
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Valor</Label>
                        <Input
                          type="number"
                          value={t.valor}
                          onChange={(e) => updateTributo(idx, { valor: Number(e.target.value) })}
                          className="h-9"
                        />
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="font-mono text-xs text-muted-foreground">Código DIAN: {t.codigoDIAN || TIPO_TRIBUTO_META[t.tipo].codigoDIAN}</span>
                      <Button size="sm" variant="ghost" className="h-7 text-destructive hover:text-destructive" onClick={() => removeTributo(idx)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Contabilidad */}
            <div className="space-y-3">
              <p className="flex items-center gap-1.5 text-sm font-medium"><Building2 className="h-4 w-4 text-primary" /> Cuentas contables</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Cuenta ventas</Label>
                  <Input value={form.cuentaContableVentas} onChange={(e) => setForm({ ...form, cuentaContableVentas: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Cuenta compras</Label>
                  <Input value={form.cuentaContableCompras} onChange={(e) => setForm({ ...form, cuentaContableCompras: e.target.value })} />
                </div>
              </div>
            </div>

            <Separator />

            {/* Atributos fiscales */}
            <div className="space-y-3">
              <p className="flex items-center gap-1.5 text-sm font-medium"><Globe className="h-4 w-4 text-primary" /> Atributos fiscales</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="exp"
                    checked={form.requiereExportacion}
                    onCheckedChange={(v) => setForm({ ...form, requiereExportacion: v === true })}
                  />
                  <Label htmlFor="exp" className="text-sm font-normal cursor-pointer">Requiere tratamiento de exportación</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="excl"
                    checked={form.excluidoDeIva}
                    onCheckedChange={(v) => setForm({ ...form, excluidoDeIva: v === true })}
                  />
                  <Label htmlFor="excl" className="text-sm font-normal cursor-pointer">Excluido de IVA</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="cap"
                    checked={form.bienDeCapital}
                    onCheckedChange={(v) => setForm({ ...form, bienDeCapital: v === true })}
                  />
                  <Label htmlFor="cap" className="text-sm font-normal cursor-pointer">Bien de capital</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="act"
                    checked={form.activo}
                    onCheckedChange={(v) => setForm({ ...form, activo: v === true })}
                  />
                  <Label htmlFor="act" className="text-sm font-normal cursor-pointer">Activo para facturación</Label>
                </div>
              </div>
            </div>
          </div>
          <SheetFooter className="mt-6">
            <SheetClose asChild><Button variant="outline">Cancelar</Button></SheetClose>
            <Button onClick={save}>{editing ? 'Guardar cambios' : 'Crear'}</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
