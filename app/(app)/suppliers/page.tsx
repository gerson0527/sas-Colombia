'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  Truck,
  Pencil,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Building2,
  Landmark,
} from 'lucide-react';
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
import { EmptyState } from '@/components/empty-state';
import { mockProveedores } from '@/lib/mock-data';
import {
  TIPO_IDENTIFICACION_META,
  REGIMEN_META,
  DEPARTAMENTOS_COL,
  FORMA_PAGO_META,
  CODIGOS_CIIU_COMUNES,
} from '@/lib/constants';
import { formatDate } from '@/lib/format';
import type { Proveedor, TipoIdentificacion, RegimenTributario, FormaPago } from '@/lib/types';

function calcDv(nit: string): string {
  const clean = nit.replace(/\D/g, '');
  if (!clean) return '';
  const primes = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];
  let sum = 0;
  let j = 0;
  for (let i = clean.length - 1; i >= 0; i--) {
    sum += parseInt(clean[i], 10) * primes[j];
    j = (j + 1) % primes.length;
  }
  const mod = sum % 11;
  const dv = mod === 0 || mod === 1 ? mod : 11 - mod;
  return String(dv);
}

const empty: Omit<Proveedor, 'id' | 'createdAt'> = {
  tipoIdentificacion: 'NIT',
  identificacion: '',
  dv: '',
  razonSocial: '',
  nombreComercial: '',
  email: '',
  telefono: '',
  direccion: '',
  ciudad: '',
  departamento: 'Cundinamarca',
  regimenTributario: 'responsable_iva',
  responsabilidadesFiscales: [],
  codigoCIIU: '',
  persona: 'juridica',
  banco: '',
  tipoCuenta: 'corriente',
  numeroCuenta: '',
  formaPagoPreferida: 'contado',
  plazoPagoDias: 30,
  activo: true,
};

export default function SuppliersPage() {
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<Proveedor[]>(mockProveedores);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Proveedor | null>(null);
  const [form, setForm] = useState(empty);

  const filtered = useMemo(() => {
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter(
      (p) =>
        p.razonSocial.toLowerCase().includes(q) ||
        p.identificacion.includes(q) ||
        p.email.toLowerCase().includes(q)
    );
  }, [items, search]);

  function openNew() {
    setEditing(null);
    setForm(empty);
    setSheetOpen(true);
  }

  function openEdit(p: Proveedor) {
    setEditing(p);
    setForm({ ...p });
    setSheetOpen(true);
  }

  function onIdentChange(value: string, tipo: TipoIdentificacion) {
    setForm((f) => ({
      ...f,
      identificacion: value,
      dv: tipo === 'NIT' ? calcDv(value) : '',
      tipoIdentificacion: tipo,
    }));
  }

  function save() {
    if (!form.razonSocial || !form.identificacion || !form.email) {
      toast.error('Completa razón social, identificación y email.');
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) {
      toast.error('El email no es válido.');
      return;
    }
    if (editing) {
      setItems((prev) => prev.map((p) => (p.id === editing.id ? { ...p, ...form } : p)));
      toast.success('Proveedor actualizado');
    } else {
      const nuevo: Proveedor = {
        ...form,
        id: `prov-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      setItems((prev) => [nuevo, ...prev]);
      toast.success('Proveedor creado');
    }
    setSheetOpen(false);
  }

  function remove(id: string) {
    setItems((prev) => prev.filter((p) => p.id !== id));
    toast.success('Proveedor eliminado');
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Proveedores"
        description="Directorio de proveedores para compras y cuentas por pagar."
        actions={
          <Button onClick={openNew}>
            <Plus className="mr-2 h-4 w-4" /> Nuevo proveedor
          </Button>
        }
      />

      <Card className="p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, identificación o email…"
            className="pl-8"
          />
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="Sin proveedores"
          description="Crea tu primer proveedor para gestionar compras."
          actionLabel="Nuevo proveedor"
          onAction={openNew}
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Razón social</TableHead>
                <TableHead>Identificación</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead>Pago</TableHead>
                <TableHead>Régimen</TableHead>
                <TableHead>Creado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <p className="text-sm font-medium">{p.razonSocial}</p>
                    {p.nombreComercial && (
                      <p className="text-xs text-muted-foreground">{p.nombreComercial}</p>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {TIPO_IDENTIFICACION_META[p.tipoIdentificacion].label}
                    <p className="font-mono text-xs">{p.identificacion}{p.dv ? `-${p.dv}` : ''}</p>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3" /> {p.email}
                    </div>
                    {p.telefono && (
                      <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" /> {p.telefono}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5 text-xs">
                      <MapPin className="h-3 w-3" /> {p.ciudad}, {p.departamento}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="text-xs">{FORMA_PAGO_META[p.formaPagoPreferida || 'contado'].label}</div>
                    {p.plazoPagoDias ? <div className="text-xs text-muted-foreground">{p.plazoPagoDias} días</div> : null}
                  </TableCell>
                  <TableCell className="text-sm">{REGIMEN_META[p.regimenTributario].label}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(p.createdAt)}</TableCell>
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
                            <AlertDialogTitle>¿Eliminar proveedor?</AlertDialogTitle>
                            <AlertDialogDescription>
                              El proveedor <strong>{p.razonSocial}</strong> se eliminará permanentemente.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => remove(p.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary" /> {editing ? 'Editar proveedor' : 'Nuevo proveedor'}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Tipo de identificación</Label>
                <Select
                  value={form.tipoIdentificacion}
                  onValueChange={(v) => onIdentChange(form.identificacion, v as TipoIdentificacion)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TIPO_IDENTIFICACION_META).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Identificación</Label>
                <Input
                  value={form.identificacion}
                  onChange={(e) => onIdentChange(e.target.value, form.tipoIdentificacion)}
                />
              </div>
            </div>
            {form.tipoIdentificacion === 'NIT' && (
              <div className="space-y-1.5">
                <Label>Dígito de verificación</Label>
                <Input value={form.dv} readOnly className="bg-muted/40 font-mono" />
                <p className="text-xs text-muted-foreground">Calculado automáticamente.</p>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Razón social *</Label>
              <Input value={form.razonSocial} onChange={(e) => setForm({ ...form, razonSocial: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Nombre comercial</Label>
              <Input value={form.nombreComercial || ''} onChange={(e) => setForm({ ...form, nombreComercial: e.target.value })} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Email *</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Teléfono</Label>
                <Input value={form.telefono || ''} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Dirección</Label>
              <Input value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Departamento</Label>
                <Select value={form.departamento} onValueChange={(v) => setForm({ ...form, departamento: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DEPARTAMENTOS_COL.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Ciudad</Label>
                <Input value={form.ciudad} onChange={(e) => setForm({ ...form, ciudad: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Régimen tributario</Label>
                <Select value={form.regimenTributario} onValueChange={(v) => setForm({ ...form, regimenTributario: v as RegimenTributario })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(REGIMEN_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Código CIIU</Label>
                <Select value={form.codigoCIIU || ''} onValueChange={(v) => setForm({ ...form, codigoCIIU: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecciona…" /></SelectTrigger>
                  <SelectContent>
                    {CODIGOS_CIIU_COMUNES.map((c) => <SelectItem key={c.codigo} value={c.codigo}>{c.codigo} · {c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-md border border-border p-4">
              <p className="mb-3 flex items-center gap-1.5 text-sm font-medium">
                <Landmark className="h-4 w-4 text-primary" /> Datos bancarios
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Banco</Label>
                  <Input value={form.banco || ''} onChange={(e) => setForm({ ...form, banco: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Tipo de cuenta</Label>
                  <Select value={form.tipoCuenta || 'corriente'} onValueChange={(v) => setForm({ ...form, tipoCuenta: v as 'ahorros' | 'corriente' })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ahorros">Ahorros</SelectItem>
                      <SelectItem value="corriente">Corriente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Número de cuenta</Label>
                  <Input value={form.numeroCuenta || ''} onChange={(e) => setForm({ ...form, numeroCuenta: e.target.value })} />
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Forma de pago preferida</Label>
                <Select value={form.formaPagoPreferida || 'contado'} onValueChange={(v) => setForm({ ...form, formaPagoPreferida: v as FormaPago })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(FORMA_PAGO_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Plazo de pago (días)</Label>
                <Input
                  type="number"
                  value={form.plazoPagoDias || 0}
                  onChange={(e) => setForm({ ...form, plazoPagoDias: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="prov-activo"
                checked={form.activo}
                onCheckedChange={(v) => setForm({ ...form, activo: v === true })}
              />
              <Label htmlFor="prov-activo" className="text-sm font-normal cursor-pointer">Proveedor activo</Label>
            </div>
          </div>
          <SheetFooter className="mt-6">
            <SheetClose asChild><Button variant="outline">Cancelar</Button></SheetClose>
            <Button onClick={save}>{editing ? 'Guardar cambios' : 'Crear proveedor'}</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
