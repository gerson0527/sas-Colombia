'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  Users,
  Pencil,
  Trash2,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Card } from '@/components/ui/card';
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
import { mockClientes } from '@/lib/mock-data';
import {
  TIPO_IDENTIFICACION_META,
  REGIMEN_META,
  DEPARTAMENTOS_COL,
} from '@/lib/constants';
import { formatDate } from '@/lib/format';
import type { Cliente, TipoIdentificacion, RegimenTributario } from '@/lib/types';

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

const empty: Omit<Cliente, 'id' | 'createdAt'> = {
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
  persona: 'juridica',
};

export default function ClientsPage() {
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<Cliente[]>(mockClientes);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Cliente | null>(null);
  const [form, setForm] = useState(empty);

  const filtered = useMemo(() => {
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter(
      (c) =>
        c.razonSocial.toLowerCase().includes(q) ||
        c.identificacion.includes(q) ||
        c.email.toLowerCase().includes(q)
    );
  }, [items, search]);

  function openNew() {
    setEditing(null);
    setForm(empty);
    setSheetOpen(true);
  }

  function openEdit(c: Cliente) {
    setEditing(c);
    setForm({ ...c });
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
      setItems((prev) => prev.map((c) => (c.id === editing.id ? { ...c, ...form } : c)));
      toast.success('Cliente actualizado');
    } else {
      const newClient: Cliente = {
        ...form,
        id: `cli-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      setItems((prev) => [newClient, ...prev]);
      toast.success('Cliente creado');
    }
    setSheetOpen(false);
  }

  function remove(id: string) {
    setItems((prev) => prev.filter((c) => c.id !== id));
    toast.success('Cliente eliminado');
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        description="Administra el directorio de clientes para facturación electrónica."
        actions={
          <Button onClick={openNew}>
            <Plus className="mr-2 h-4 w-4" /> Nuevo cliente
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
          icon={Users}
          title="Sin clientes"
          description="Crea tu primer cliente para empezar a emitir documentos."
          actionLabel="Nuevo cliente"
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
                <TableHead>Régimen</TableHead>
                <TableHead>Creado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <p className="text-sm font-medium">{c.razonSocial}</p>
                    {c.nombreComercial && (
                      <p className="text-xs text-muted-foreground">{c.nombreComercial}</p>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {TIPO_IDENTIFICACION_META[c.tipoIdentificacion].label}
                    <p className="font-mono text-xs">{c.identificacion}{c.dv ? `-${c.dv}` : ''}</p>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3" /> {c.email}
                    </div>
                    {c.telefono && (
                      <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" /> {c.telefono}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5 text-xs">
                      <MapPin className="h-3 w-3" /> {c.ciudad}, {c.departamento}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {REGIMEN_META[c.regimenTributario].label}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(c.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(c)} aria-label="Editar">
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
                            <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. El cliente <strong>{c.razonSocial}</strong> se eliminará permanentemente.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => remove(c.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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
            <SheetTitle>{editing ? 'Editar cliente' : 'Nuevo cliente'}</SheetTitle>
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
                <p className="text-xs text-muted-foreground">Calculado automáticamente a partir del NIT.</p>
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
            <div className="space-y-1.5">
              <Label>Régimen tributario</Label>
              <Select value={form.regimenTributario} onValueChange={(v) => setForm({ ...form, regimenTributario: v as RegimenTributario })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(REGIMEN_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <SheetFooter className="mt-6">
            <SheetClose asChild>
              <Button variant="outline">Cancelar</Button>
            </SheetClose>
            <Button onClick={save}>{editing ? 'Guardar cambios' : 'Crear cliente'}</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
