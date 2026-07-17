'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  FileDown,
  Send,
  Ban,
  Building2,
  QrCode,
  AlertTriangle,
  Copy,
  Check,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EstadoDianBadge } from '@/components/estado-badge';
import { mockDocumentos, mockEmpresa } from '@/lib/mock-data';
import {
  TIPO_DOCUMENTO_META,
  FORMA_PAGO_META,
  MEDIO_PAGO_META,
  AMBIENTE_META,
} from '@/lib/constants';
import { formatCOP, formatDateTime, truncateMiddle } from '@/lib/format';

export default function DocumentDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const doc = mockDocumentos.find((d) => d.id === params.id);
  const [copied, setCopied] = useState<'cufe' | 'cude' | null>(null);

  if (!doc) {
    return (
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/documents"><ArrowLeft className="mr-2 h-4 w-4" /> Volver</Link>
        </Button>
        <Card className="p-10 text-center">
          <p className="text-sm text-muted-foreground">Documento no encontrado.</p>
        </Card>
      </div>
    );
  }

  function copyCufe(label: 'cufe' | 'cude') {
    const value = doc?.[label];
    if (!value) return;
    navigator.clipboard?.writeText(value);
    setCopied(label);
    toast.success(`${label.toUpperCase()} copiado al portapapeles.`);
    setTimeout(() => setCopied(null), 1500);
  }

  function handleVoid() {
    toast.success('Solicitud de anulación enviada', {
      description: 'Se generará una nota crédito asociada para anular el documento.',
    });
  }

  function handleResend() {
    toast.success('Documento reenviado a DIAN', {
      description: 'Esperando respuesta del web service de la DIAN.',
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/documents" aria-label="Volver"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <PageHeader
          title={`${doc.numero}`}
          description={`${TIPO_DOCUMENTO_META[doc.tipoDocumento].label} · emitido ${formatDateTime(doc.fechaEmision)}`}
          className="flex-1 border-0 pb-0"
          actions={<EstadoDianBadge estado={doc.estadoDian} />}
        />
      </div>

      {doc.estadoDian === 'rechazado' && doc.motivoRechazo && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div>
            <p className="text-sm font-semibold text-destructive">Documento rechazado por DIAN</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{doc.motivoRechazo}</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Parties */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-primary" /> Emisor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p className="font-semibold">{mockEmpresa.razonSocial}</p>
                <p className="text-muted-foreground">NIT {mockEmpresa.nit}-{mockEmpresa.dv}</p>
                <p className="text-muted-foreground">{mockEmpresa.direccion}, {mockEmpresa.ciudad}</p>
                <p className="text-muted-foreground">{mockEmpresa.email}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-primary" /> Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p className="font-semibold">{doc.cliente.razonSocial}</p>
                <p className="text-muted-foreground">{doc.cliente.identificacion}{doc.cliente.dv ? '-' + doc.cliente.dv : ''}</p>
                <p className="text-muted-foreground">{doc.cliente.direccion}, {doc.cliente.ciudad}</p>
                <p className="text-muted-foreground">{doc.cliente.email}</p>
              </CardContent>
            </Card>
          </div>

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ítems facturados</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">Cant.</TableHead>
                    <TableHead className="text-right">Precio unit.</TableHead>
                    <TableHead className="text-right">IVA</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {doc.items.map((it, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-sm">{it.descripcion}</TableCell>
                      <TableCell className="text-right text-sm">{it.cantidad}</TableCell>
                      <TableCell className="text-right text-sm">{formatCOP(it.precioUnitario)}</TableCell>
                      <TableCell className="text-right text-sm">{it.iva}%</TableCell>
                      <TableCell className="text-right text-sm font-medium">{formatCOP(it.subtotal)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Totals + payment */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Pago</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Row label="Forma de pago" value={FORMA_PAGO_META[doc.formaPago].label} />
                <Row label="Medio de pago" value={MEDIO_PAGO_META[doc.medioPago].label} />
                <Row label="Ambiente" value={AMBIENTE_META[doc.ambiente].label} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Totales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Row label="Subtotal" value={formatCOP(doc.subtotal)} />
                <Row label="IVA" value={formatCOP(doc.totalIva)} />
                <Row label="INC" value={formatCOP(doc.totalInc)} />
                <Row label="Retenciones" value={formatCOP(doc.totalRetenciones)} muted />
                <Separator />
                <div className="flex items-center justify-between pt-1">
                  <span className="font-semibold">Total</span>
                  <span className="text-lg font-bold text-primary">{formatCOP(doc.total)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sidebar: CUFE / QR / actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Identificación DIAN</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {doc.cufe && (
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">CUFE</p>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => copyCufe('cufe')}
                      aria-label="Copiar CUFE"
                    >
                      {copied === 'cufe' ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                  <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                    {truncateMiddle(doc.cufe, 40)}
                  </p>
                </div>
              )}
              {doc.cude && (
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">CUDE</p>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => copyCufe('cude')}
                      aria-label="Copiar CUDE"
                    >
                      {copied === 'cude' ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                  <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                    {truncateMiddle(doc.cude, 40)}
                  </p>
                </div>
              )}
              {doc.qrCode && (
                <div className="flex flex-col items-center gap-2 rounded-md border border-border bg-muted/20 p-4">
                  <div className="flex h-32 w-32 items-center justify-center rounded-md bg-white">
                    <QrCode className="h-24 w-24 text-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">Código QR de validación DIAN</p>
                </div>
              )}
              {!doc.cufe && !doc.cude && (
                <p className="text-sm text-muted-foreground">
                  El documento aún no tiene identificador DIAN asignado.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Acciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <FileDown className="mr-2 h-4 w-4" /> Descargar PDF
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Download className="mr-2 h-4 w-4" /> Descargar XML
              </Button>
              {(doc.estadoDian === 'rechazado' || doc.estadoDian === 'pendiente_envio') && (
                <Button variant="secondary" className="w-full justify-start" onClick={handleResend}>
                  <Send className="mr-2 h-4 w-4" /> Reenviar a DIAN
                </Button>
              )}
              {doc.estadoDian !== 'anulado' && doc.estadoDian !== 'borrador' && (
                <Button
                  variant="outline"
                  className="w-full justify-start text-destructive hover:text-destructive"
                  onClick={handleVoid}
                >
                  <Ban className="mr-2 h-4 w-4" /> Anular documento
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
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
