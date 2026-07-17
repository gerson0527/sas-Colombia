'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, ShieldCheck, Mail, MoreHorizontal, KeyRound } from 'lucide-react';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { mockUsuarios } from '@/lib/mock-data';
import { ROL_META } from '@/lib/constants';
import { formatDateTime } from '@/lib/format';
import type { RolUsuario, Usuario } from '@/lib/types';

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

export default function UsersPage() {
  const [items, setItems] = useState<Usuario[]>(mockUsuarios);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRol, setInviteRol] = useState<RolUsuario>('cajero');
  const [invitePin, setInvitePin] = useState('');

  function invite() {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(inviteEmail)) {
      toast.error('Email no válido.');
      return;
    }
    const nuevo: Usuario = {
      id: `usr-${Date.now()}`,
      nombre: inviteEmail.split('@')[0],
      email: inviteEmail,
      rol: inviteRol,
      pin: invitePin || undefined,
      estado: 'pendiente',
      ultimoAcceso: undefined,
    };
    setItems((prev) => [nuevo, ...prev]);
    toast.success('Invitación enviada', { description: `A ${inviteEmail} como ${ROL_META[inviteRol].label}.` });
    setInviteEmail('');
    setInvitePin('');
    setSheetOpen(false);
  }

  function changeRol(id: string, rol: RolUsuario) {
    setItems((prev) => prev.map((u) => (u.id === id ? { ...u, rol } : u)));
    toast.success('Rol actualizado', { description: ROL_META[rol].label });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuarios y roles"
        description="Gestiona el equipo con acceso a la empresa (multi-tenant)."
        actions={
          <Button onClick={() => setSheetOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Invitar usuario
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>PIN</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Último acceso</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                        {initials(u.nombre)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{u.nombre}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${ROL_META[u.rol].tone}`}>
                    {ROL_META[u.rol].label}
                  </span>
                </TableCell>
                <TableCell className="text-sm">
                  {u.pin ? (
                    <span className="inline-flex items-center gap-1.5 font-mono text-xs">
                      <KeyRound className="h-3 w-3 text-muted-foreground" />
                      {'•'.repeat(u.pin.length)}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Sin PIN</span>
                  )}
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                      u.estado === 'activo'
                        ? 'text-success'
                        : u.estado === 'pendiente'
                        ? 'text-warning'
                        : 'text-muted-foreground'
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${
                      u.estado === 'activo' ? 'bg-success' : u.estado === 'pendiente' ? 'bg-warning' : 'bg-muted-foreground'
                    }`} />
                    {u.estado === 'activo' ? 'Activo' : u.estado === 'pendiente' ? 'Pendiente' : 'Inactivo'}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {u.ultimoAcceso ? formatDateTime(u.ultimoAcceso) : '—'}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Acciones">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>Cambiar rol</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {(Object.keys(ROL_META) as RolUsuario[]).map((r) => (
                        <DropdownMenuItem key={r} onClick={() => changeRol(u.id, r)}>
                          {ROL_META[r].label}
                          {u.rol === r && <span className="ml-auto text-xs text-primary">•</span>}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive focus:text-destructive">
                        Revocar acceso
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" /> Invitar usuario
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label>Email del invitado</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="nombre@empresa.co"
                  className="pl-8"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Rol inicial</Label>
              <Select value={inviteRol} onValueChange={(v) => setInviteRol(v as RolUsuario)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(ROL_META) as RolUsuario[]).map((r) => (
                    <SelectItem key={r} value={r}>{ROL_META[r].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>PIN de acceso rápido (4 dígitos)</Label>
              <Input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={invitePin}
                onChange={(e) => setInvitePin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="0000"
                className="font-mono tracking-widest"
              />
              <p className="text-xs text-muted-foreground">
                PIN para autorizaciones rápidas en el POS (descuentos, anulaciones).
              </p>
            </div>
          </div>
          <SheetFooter className="mt-6">
            <SheetClose asChild><Button variant="outline">Cancelar</Button></SheetClose>
            <Button onClick={invite}>Enviar invitación</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
