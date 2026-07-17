'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Search,
  Plus,
  Trash2,
  Save,
  Send,
  Eye,
  AlertTriangle,
  Building2,
  User,
  FileText,
} from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { mockClientes, mockProductos, mockResoluciones, mockEmpresa } from '@/lib/mock-data';
import {
  FORMA_PAGO_META,
  MEDIO_PAGO_META,
  TIPO_DOCUMENTO_META,
  UNIDADES_MEDIDA,
  AMBIENTE_META,
} from '@/lib/constants';
import { formatCOP } from '@/lib/format';
import type {
  Ambiente,
  FormaPago,
  MedioPago,
  TipoDocumento,
  ItemFactura,
} from '@/lib/types';

interface LineItem {
  uid: string;
  productoId: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
  iva: number;
}

let uidCounter = 0;
const nextUid = () => `line-${++uidCounter}`;

export default function NewInvoicePage() {
  const router = useRouter();
  const [clienteId, setClienteId] = useState<string>('');
  const [resolucionId, setResolucionId] = useState<string>(mockResoluciones[0].id);
  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumento>('factura_venta');
  const [formaPago, setFormaPago] = useState<FormaPago>('contado');
  const [medioPago, setMedioPago] = useState<MedioPago>('transferencia');
  const [ambiente, setAmbiente] = useState<Ambiente>(mockEmpresa.ambiente);
  const [items, setItems] = useState<LineItem[]>([]);
  const [clientSearchOpen, setClientSearchOpen] = useState(false);
  const [productSearchOpen, setProductSearchOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const cliente = mockClientes.find((c) => c.id === clienteId);
  const resolucion = mockResoluciones.find((r) => r.id === resolucionId);

  const totals = useMemo(() => {
    const subtotal = items.reduce((s, i) => s + i.cantidad * i.precioUnitario - i.descuento, 0);
    const totalIva = items.reduce(
      (s, i) => s + ((i.cantidad * i.precioUnitario - i.descuento) * i.iva) / 100,
      0
    );
    return {
      subtotal,
      totalIva,
      totalInc: 0,
      totalRetenciones: 0,
      total: subtotal + totalIva,
    };
  }, [items]);

  function addProduct(prodId: string) {
    const prod = mockProductos.find((p) => p.id === prodId);
    if (!prod) return;
    setItems((prev) => [
      ...prev,
      {
        uid: nextUid(),
        productoId: prod.id,
        descripcion: prod.nombre,
        cantidad: 1,
        precioUnitario: prod.precioUnitario,
        descuento: 0,
        iva: prod.iva,
      },
    ]);
    setProductSearchOpen(false);
  }

  function updateItem(uid: string, patch: Partial<LineItem>) {
    setItems((prev) =>
      prev.map((i) => (i.uid === uid ? { ...i, ...patch } : i))
    );
  }

  function removeItem(uid: string) {
    setItems((prev) => prev.filter((i) => i.uid !== uid));
  }

  function handleSaveDraft() {
    if (!cliente) {
      toast.error('Selecciona un cliente antes de guardar el borrador.');
      return;
    }
    if (items.length === 0) {
      toast.error('Agrega al menos un ítem al documento.');
      return;
    }
    toast.success('Borrador guardado', {
      description: `Documento para ${cliente.razonSocial} con ${items.length} ítem(es).`,
    });
    router.push('/documents');
  }

  function handleEmit() {
    if (!cliente) {
      toast.error('Selecciona un cliente antes de emitir.');
      return;
    }
    if (items.length === 0) {
      toast.error('Agrega al menos un ítem al documento.');
      return;
    }
    toast.success('Documento enviado a DIAN', {
      description:
        ambiente === 'habilitacion'
          ? 'Enviado a ambiente de habilitación (pruebas).'
          : 'Enviado a ambiente de producción. Genera documento legalmente válido.',
    });
    router.push('/documents');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/documents" aria-label="Volver">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <PageHeader
          title="Nueva factura electrónica"
          description="Crea y emite un documento electrónico ante la DIAN (UBL 2.1)."
          className="flex-1 border-0 pb-0"
        />
      </div>

      {ambiente === 'habilitacion' && (
        <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
          <AlertTriangle className="h-4 w-4" />
          Estás en ambiente de <strong>Habilitación</strong>. Los documentos emitidos aquí no tienen validez fiscal.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: form */}
        <div className="space-y-6 lg:col-span-2">
          {/* Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4 text-primary" /> Datos del cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Buscar cliente existente</Label>
                <Popover open={clientSearchOpen} onOpenChange={setClientSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between font-normal"
                    >
                      {cliente
                        ? `${cliente.razonSocial} · ${cliente.identificacion}${cliente.dv ? '-' + cliente.dv : ''}`
                        : 'Selecciona un cliente…'}
                      <Search className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[420px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Buscar por nombre o NIT…" />
                      <CommandList>
                        <CommandEmpty>No se encontraron clientes.</CommandEmpty>
                        <CommandGroup heading="Clientes">
                          {mockClientes.map((c) => (
                            <CommandItem
                              key={c.id}
                              onSelect={() => {
                                setClienteId(c.id);
                                setClientSearchOpen(false);
                              }}
                            >
                              <div className="flex flex-col">
                                <span className="text-sm">{c.razonSocial}</span>
                                <span className="text-xs text-muted-foreground">
                                  {c.identificacion}{c.dv ? `-${c.dv}` : ''} · {c.ciudad}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {cliente && (
                <div className="grid gap-3 rounded-md border border-border bg-muted/20 p-4 sm:grid-cols-2">
                  <Info label="Razón social" value={cliente.razonSocial} />
                  <Info label="Identificación" value={`${cliente.identificacion}${cliente.dv ? '-' + cliente.dv : ''}`} />
                  <Info label="Email" value={cliente.email} />
                  <Info label="Teléfono" value={cliente.telefono || '—'} />
                  <Info label="Dirección" value={cliente.direccion} />
                  <Info label="Ciudad" value={`${cliente.ciudad}, ${cliente.departamento}`} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resolución y tipo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4 text-primary" /> Resolución DIAN
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Tipo de documento</Label>
                <Select value={tipoDocumento} onValueChange={(v) => setTipoDocumento(v as TipoDocumento)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TIPO_DOCUMENTO_META).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Resolución activa</Label>
                <Select value={resolucionId} onValueChange={setResolucionId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {mockResoluciones.filter((r) => r.activa).map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.prefijo} · {r.numeroResolucion}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {resolucion && (
                <p className="text-xs text-muted-foreground sm:col-span-2">
                  Rango {resolucion.rangoDesde}–{resolucion.rangoHasta} · Consecutivo actual: <strong>{resolucion.consecutivoActual}</strong> · Vigencia hasta {new Date(resolucion.fechaVigenciaHasta).toLocaleDateString('es-CO')}.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Ítems */}
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Ítems del documento</CardTitle>
              <Popover open={productSearchOpen} onOpenChange={setProductSearchOpen}>
                <PopoverTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="mr-2 h-4 w-4" /> Agregar ítem
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[380px] p-0" align="end">
                  <Command>
                    <CommandInput placeholder="Buscar producto…" />
                    <CommandList>
                      <CommandEmpty>No se encontraron productos.</CommandEmpty>
                      <CommandGroup heading="Productos y servicios">
                        {mockProductos.map((p) => (
                          <CommandItem key={p.id} onSelect={() => addProduct(p.id)}>
                            <div className="flex w-full items-center justify-between">
                              <div className="flex flex-col">
                                <span className="text-sm">{p.nombre}</span>
                                <span className="text-xs text-muted-foreground">{p.codigo}</span>
                              </div>
                              <span className="text-sm font-medium">{formatCOP(p.precioUnitario)}</span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <div className="rounded-md border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
                  No has agregado ítems. Usa “Agregar ítem” para buscar productos.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[220px]">Descripción</TableHead>
                        <TableHead className="w-20">Cantidad</TableHead>
                        <TableHead className="w-32">Precio unit.</TableHead>
                        <TableHead className="w-28">Descuento</TableHead>
                        <TableHead className="w-24">IVA %</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                        <TableHead className="w-10" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((it) => {
                        const sub = it.cantidad * it.precioUnitario - it.descuento;
                        return (
                          <TableRow key={it.uid}>
                            <TableCell>
                              <Input
                                value={it.descripcion}
                                onChange={(e) => updateItem(it.uid, { descripcion: e.target.value })}
                                className="h-9"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min={1}
                                value={it.cantidad}
                                onChange={(e) => updateItem(it.uid, { cantidad: Math.max(1, Number(e.target.value)) })}
                                className="h-9 w-20"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={it.precioUnitario}
                                onChange={(e) => updateItem(it.uid, { precioUnitario: Number(e.target.value) })}
                                className="h-9 w-32"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min={0}
                                value={it.descuento}
                                onChange={(e) => updateItem(it.uid, { descuento: Math.max(0, Number(e.target.value)) })}
                                className="h-9 w-28"
                              />
                            </TableCell>
                            <TableCell>
                              <Select
                                value={String(it.iva)}
                                onValueChange={(v) => updateItem(it.uid, { iva: Number(v) })}
                              >
                                <SelectTrigger className="h-9 w-24">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {[0, 5, 19].map((v) => (
                                    <SelectItem key={v} value={String(v)}>{v}%</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCOP(sub)}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => removeItem(it.uid)}
                                aria-label="Eliminar ítem"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pago */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Forma y medio de pago</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Forma de pago</Label>
                <Select value={formaPago} onValueChange={(v) => setFormaPago(v as FormaPago)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(FORMA_PAGO_META).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v.label} (código {v.codigo})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Medio de pago</Label>
                <Select value={medioPago} onValueChange={(v) => setMedioPago(v as MedioPago)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(MEDIO_PAGO_META).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: summary */}
        <div className="space-y-6">
          <Card className="lg:sticky lg:top-20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-4 w-4 text-primary" /> Resumen del documento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Ambiente</Label>
                <Select value={ambiente} onValueChange={(v) => setAmbiente(v as Ambiente)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(AMBIENTE_META).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {ambiente === 'habilitacion' && (
                  <p className="text-xs text-warning">Modo pruebas — sin validez fiscal.</p>
                )}
                {ambiente === 'produccion' && (
                  <p className="text-xs text-success">Producción — documentos legalmente válidos.</p>
                )}
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <Row label="Subtotal" value={formatCOP(totals.subtotal)} />
                <Row label="IVA" value={formatCOP(totals.totalIva)} />
                <Row label="INC" value={formatCOP(totals.totalInc)} />
                <Row label="Retenciones" value={formatCOP(totals.totalRetenciones)} muted />
                <Separator />
                <div className="flex items-center justify-between pt-1">
                  <span className="text-base font-semibold">Total</span>
                  <span className="text-base font-bold text-primary">{formatCOP(totals.total)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setPreviewOpen(true)}
                  disabled={!cliente || items.length === 0}
                >
                  <Eye className="mr-2 h-4 w-4" /> Vista previa
                </Button>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={handleSaveDraft}
                >
                  <Save className="mr-2 h-4 w-4" /> Guardar borrador
                </Button>
                <Button className="w-full" onClick={handleEmit}>
                  <Send className="mr-2 h-4 w-4" /> Emitir y enviar a DIAN
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Preview sheet */}
      <Sheet open={previewOpen} onOpenChange={setPreviewOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Vista previa del documento</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4 text-sm">
            <div className="rounded-md border border-border p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Emisor</p>
              <p className="mt-1 font-semibold">{mockEmpresa.razonSocial}</p>
              <p className="text-xs text-muted-foreground">NIT {mockEmpresa.nit}-{mockEmpresa.dv}</p>
            </div>
            <div className="rounded-md border border-border p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Cliente</p>
              <p className="mt-1 font-semibold">{cliente?.razonSocial || '—'}</p>
              <p className="text-xs text-muted-foreground">{cliente?.identificacion}{cliente?.dv ? '-' + cliente.dv : ''}</p>
            </div>
            <div className="rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">Cant.</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((it) => (
                    <TableRow key={it.uid}>
                      <TableCell className="text-xs">{it.descripcion}</TableCell>
                      <TableCell className="text-right text-xs">{it.cantidad}</TableCell>
                      <TableCell className="text-right text-xs">
                        {formatCOP(it.cantidad * it.precioUnitario - it.descuento)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="space-y-2 text-sm">
              <Row label="Subtotal" value={formatCOP(totals.subtotal)} />
              <Row label="IVA" value={formatCOP(totals.totalIva)} />
              <Separator />
              <div className="flex items-center justify-between">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-primary">{formatCOP(totals.total)}</span>
              </div>
            </div>
          </div>
          <SheetFooter className="mt-6">
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>Cerrar</Button>
            <Button onClick={handleEmit}>
              <Send className="mr-2 h-4 w-4" /> Emitir
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={muted ? 'text-muted-foreground' : 'text-foreground'}>{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
