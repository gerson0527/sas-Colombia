'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Search, Package, Pencil, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/empty-state';
import { useProductos } from '@/hooks/use-supabase-data';
import { UNIDADES_MEDIDA, IVA_OPCIONES } from '@/lib/constants';
import { formatCOP } from '@/lib/format';
import type { Producto } from '@/lib/types';

const empty: Omit<Producto, 'id'> = {
  codigo: '',
  nombre: '',
  descripcion: '',
  tipoItem: 'servicio',
  precioUnitario: 0,
  unidadMedida: 'SER',
  iva: 19,
  inc: 0,
  aplicaReteFuente: false,
  aplicaReteICA: false,
  aplicaReteIVA: false,
  activo: true,
};

export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const { data: items, loading, error, create, update, remove } = useProductos();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Producto | null>(null);
  const [form, setForm] = useState(empty);

  const filtered = useMemo(() => {
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter(
      (p) => p.nombre.toLowerCase().includes(q) || p.codigo.toLowerCase().includes(q)
    );
  }, [items, search]);

  function openNew() {
    setEditing(null);
    setForm(empty);
    setSheetOpen(true);
  }

  function openEdit(p: Producto) {
    setEditing(p);
    setForm({ ...p });
    setSheetOpen(true);
  }

  async function save() {
    if (!form.nombre || !form.codigo) {
      toast.error('Completa código y nombre del producto.');
      return;
    }
    if (editing) {
      const ok = await update(editing.id, form);
      if (ok) toast.success('Producto actualizado');
      else toast.error('No se pudo actualizar el producto.');
    } else {
      const created = await create(form);
      if (created) toast.success('Producto creado');
      else toast.error('No se pudo crear el producto.');
    }
    setSheetOpen(false);
  }

  async function removeProduct(id: string) {
    const ok = await remove(id);
    if (ok) toast.success('Producto eliminado');
    else toast.error('No se pudo eliminar el producto.');
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Productos y servicios"
        description="Catálogo con configuración de impuestos por ítem (IVA, INC, retenciones)."
        actions={
          <Button onClick={openNew}>
            <Plus className="mr-2 h-4 w-4" /> Nuevo producto
          </Button>
        }
      />

      <Card className="p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o código…"
            className="pl-8"
          />
        </div>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
          Cargando productos…
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-20 text-sm text-destructive">
          Error: {error}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Sin productos"
          description="Crea tu primer producto o servicio para usarlo en facturación."
          actionLabel="Nuevo producto"
          onAction={openNew}
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Unidad</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead>IVA</TableHead>
                <TableHead>Retenciones</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs">{p.codigo}</TableCell>
                  <TableCell>
                    <p className="text-sm font-medium">{p.nombre}</p>
                    {p.descripcion && (
                      <p className="text-xs text-muted-foreground line-clamp-1">{p.descripcion}</p>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{p.unidadMedida}</TableCell>
                  <TableCell className="text-right text-sm font-medium">{formatCOP(p.precioUnitario)}</TableCell>
                  <TableCell><Badge variant="outline">{p.iva}%</Badge></TableCell>
                  <TableCell className="space-x-1">
                    {p.aplicaReteFuente && <Badge variant="outline" className="text-xs">ReteFuente</Badge>}
                    {p.aplicaReteICA && <Badge variant="outline" className="text-xs">ReteICA</Badge>}
                    {!p.aplicaReteFuente && !p.aplicaReteICA && (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
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
                            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
                            <AlertDialogDescription>
                              El producto <strong>{p.nombre}</strong> se eliminará del catálogo.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => removeProduct(p.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{editing ? 'Editar producto' : 'Nuevo producto'}</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label>Código *</Label>
              <Input value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Nombre *</Label>
              <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Descripción</Label>
              <Input value={form.descripcion || ''} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Precio unitario (COP)</Label>
                <Input
                  type="number"
                  value={form.precioUnitario}
                  onChange={(e) => setForm({ ...form, precioUnitario: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Unidad de medida</Label>
                <Select value={form.unidadMedida} onValueChange={(v) => {
                  const unidad = v as typeof form.unidadMedida;
                  const isServicio = ['SER', 'HUR', 'DIA'].includes(unidad);
                  setForm({ ...form, unidadMedida: unidad, tipoItem: isServicio ? 'servicio' : 'bien' });
                }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {UNIDADES_MEDIDA.map((u) => <SelectItem key={u.codigo} value={u.codigo}>{u.label} ({u.codigo})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>IVA (%)</Label>
                <Select value={String(form.iva)} onValueChange={(v) => setForm({ ...form, iva: Number(v) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {IVA_OPCIONES.map((v) => <SelectItem key={v} value={String(v)}>{v}%</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>INC (%)</Label>
                <Input
                  type="number"
                  value={form.inc || 0}
                  onChange={(e) => setForm({ ...form, inc: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="space-y-3 rounded-md border border-border p-4">
              <p className="text-sm font-medium">Retenciones aplicables</p>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="rf"
                  checked={form.aplicaReteFuente}
                  onCheckedChange={(v) => setForm({ ...form, aplicaReteFuente: v === true })}
                />
                <Label htmlFor="rf" className="text-sm font-normal cursor-pointer">ReteFuente</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="ri"
                  checked={form.aplicaReteICA}
                  onCheckedChange={(v) => setForm({ ...form, aplicaReteICA: v === true })}
                />
                <Label htmlFor="ri" className="text-sm font-normal cursor-pointer">ReteICA</Label>
              </div>
            </div>
          </div>
          <SheetFooter className="mt-6">
            <SheetClose asChild><Button variant="outline">Cancelar</Button></SheetClose>
            <Button onClick={save}>{editing ? 'Guardar cambios' : 'Crear producto'}</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
