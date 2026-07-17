'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Plus, FileMinus2, Search, Eye } from 'lucide-react';
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
import { EstadoDianBadge } from '@/components/estado-badge';
import { EmptyState } from '@/components/empty-state';
import { mockDocumentos } from '@/lib/mock-data';
import { formatCOP, formatShortDate } from '@/lib/format';

const motivos = [
  'Anulación total',
  'Descuento comercial',
  'Corrección de ítem',
  'Devolución de producto',
  'Ajuste de precio',
];

export default function CreditNotesPage() {
  const [search, setSearch] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [facturaOrigen, setFacturaOrigen] = useState('');
  const [motivo, setMotivo] = useState(motivos[0]);

  const notas = mockDocumentos.filter((d) => d.tipoDocumento === 'nota_credito');
  const facturas = mockDocumentos.filter((d) => d.tipoDocumento === 'factura_venta');

  const filtered = search
    ? notas.filter(
        (n) =>
          n.numero.toLowerCase().includes(search.toLowerCase()) ||
          n.cliente.razonSocial.toLowerCase().includes(search.toLowerCase())
      )
    : notas;

  function create() {
    if (!facturaOrigen) {
      toast.error('Selecciona la factura origen.');
      return;
    }
    toast.success('Nota crédito creada', {
      description: `Asociada a ${facturaOrigen} · ${motivo}.`,
    });
    setSheetOpen(false);
    setFacturaOrigen('');
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notas crédito"
        description="Notas crédito asociadas a facturas de venta existentes."
        actions={
          <Button onClick={() => setSheetOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nueva nota crédito
          </Button>
        }
      />

      <Card className="p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por número o cliente…"
            className="pl-8"
          />
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          icon={FileMinus2}
          title="Sin notas crédito"
          description="Crea una nota crédito asociada a una factura existente."
          actionLabel="Nueva nota crédito"
          onAction={() => setSheetOpen(true)}
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((n) => (
                <TableRow key={n.id}>
                  <TableCell className="font-mono text-xs font-medium">{n.numero}</TableCell>
                  <TableCell className="text-sm">{n.cliente.razonSocial}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatShortDate(n.fechaEmision)}</TableCell>
                  <TableCell className="text-right font-medium">{formatCOP(n.total)}</TableCell>
                  <TableCell><EstadoDianBadge estado={n.estadoDian} /></TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="icon" variant="ghost" className="h-8 w-8" aria-label="Ver">
                      <Link href={`/documents/${n.id}`}><Eye className="h-4 w-4" /></Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <FileMinus2 className="h-4 w-4 text-primary" /> Nueva nota crédito
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label>Factura origen *</Label>
              <Select value={facturaOrigen} onValueChange={setFacturaOrigen}>
                <SelectTrigger><SelectValue placeholder="Selecciona factura…" /></SelectTrigger>
                <SelectContent>
                  {facturas.map((f) => (
                    <SelectItem key={f.id} value={f.numero}>
                      {f.numero} · {f.cliente.razonSocial} · {formatCOP(f.total)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Motivo</Label>
              <Select value={motivo} onValueChange={setMotivo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {motivos.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              El backend calculará el CUDE y enviará la nota a DIAN asociada a la factura origen.
            </p>
          </div>
          <SheetFooter className="mt-6">
            <SheetClose asChild><Button variant="outline">Cancelar</Button></SheetClose>
            <Button onClick={create}>Crear nota crédito</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
