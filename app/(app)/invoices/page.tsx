'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  FileText,
  Download,
  Eye,
  Search,
  Filter,
  Plus,
  FileDown,
  Receipt,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Send,
  FileCheck,
} from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Badge } from '@/components/ui/badge';
import { KpiCard } from '@/components/kpi-card';
import { EmptyState } from '@/components/empty-state';
import { useDocumentos, useClientes } from '@/hooks/use-supabase-data';
import { formatCOP, formatDateTime } from '@/lib/format';
import { ESTADO_DIAN_META, MEDIO_PAGO_META, medioPagoLabelByCode } from '@/lib/constants';
import type { EstadoDian, MedioPago } from '@/lib/types';
import { AppPagination } from '@/components/ui/app-pagination';

const PAGE_SIZE = 10;

export default function InvoicesHistoryPage() {
  const [search, setSearch] = useState('');
  const [estado, setEstado] = useState<EstadoDian | 'all'>('all');
  const [dianTransmitted, setDianTransmitted] = useState<'all' | 'sent' | 'local'>('all');
  const [medioPago, setMedioPago] = useState<MedioPago | 'all'>('all');
  const [page, setPage] = useState(1);

  const { data: documentos, loading, error } = useDocumentos();
  const { data: clientes } = useClientes();

  const clienteMap = useMemo(() => {
    const m = new Map<string, { razonSocial: string; identificacion: string; dv?: string }>();
    clientes.forEach((c) =>
      m.set(c.id, { razonSocial: c.razonSocial, identificacion: c.identificacion, dv: c.dv })
    );
    return m;
  }, [clientes]);

  // General metrics
  const totalFacturas = documentos.length;
  const aceptadasDian = documentos.filter((d) => d.estadoDian === 'aceptado' || d.estadoDian === 'enviado').length;
  const documentosLocales = documentos.filter((d) => d.estadoDian === 'borrador' || d.estadoDian === 'pendiente_envio').length;
  const montoTotal = documentos.reduce((sum, d) => sum + d.total, 0);

  const filtered = useMemo(() => {
    return documentos.filter((doc) => {
      // Estado DIAN filter
      if (estado !== 'all' && doc.estadoDian !== estado) return false;

      // DIAN Transmission status filter
      if (dianTransmitted === 'sent' && !(doc.estadoDian === 'aceptado' || doc.estadoDian === 'enviado')) return false;
      if (dianTransmitted === 'local' && (doc.estadoDian === 'aceptado' || doc.estadoDian === 'enviado')) return false;

      // Payment method filter
      if (medioPago !== 'all' && doc.medioPago !== medioPago) return false;

      // Text search
      if (search) {
        const q = search.toLowerCase();
        const cli = clienteMap.get(doc.clienteId);
        const matchNum = doc.numero.toLowerCase().includes(q);
        const matchCliName = cli?.razonSocial.toLowerCase().includes(q) ?? false;
        const matchCliDoc = cli?.identificacion.includes(q) ?? false;
        if (!matchNum && !matchCliName && !matchCliDoc) return false;
      }
      return true;
    });
  }, [documentos, clienteMap, search, estado, dianTransmitted, medioPago]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const pageItems = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  function renderDianBadge(estadoDian: EstadoDian) {
    switch (estadoDian) {
      case 'aceptado':
        return (
          <Badge variant="outline" className="border-success/30 bg-success/10 text-success gap-1 font-medium">
            <CheckCircle2 className="h-3 w-3" /> Aceptado DIAN
          </Badge>
        );
      case 'enviado':
        return (
          <Badge variant="outline" className="border-info/30 bg-info/10 text-info gap-1 font-medium">
            <Send className="h-3 w-3" /> Enviado DIAN
          </Badge>
        );
      case 'pendiente_envio':
        return (
          <Badge variant="outline" className="border-warning/30 bg-warning/10 text-warning gap-1 font-medium">
            <Clock className="h-3 w-3" /> Pendiente Envío DIAN
          </Badge>
        );
      case 'rechazado':
        return (
          <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-destructive gap-1 font-medium">
            <AlertTriangle className="h-3 w-3" /> Rechazado DIAN
          </Badge>
        );
      case 'anulado':
        return (
          <Badge variant="outline" className="border-border bg-muted text-muted-foreground gap-1 font-medium">
            Anulado
          </Badge>
        );
      case 'borrador':
      default:
        return (
          <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary gap-1 font-medium">
            <FileCheck className="h-3 w-3" /> Documento Local (Válido)
          </Badge>
        );
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Facturas Realizadas"
        description="Historial y consulta detallada de todas las facturas y ventas emitidas en el sistema."
        actions={
          <Button asChild>
            <Link href="/pos">
              <Plus className="mr-2 h-4 w-4" /> Nueva Venta POS
            </Link>
          </Button>
        }
      />

      {/* KPI Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total facturas" value={totalFacturas.toString()} icon={Receipt} tone="primary" />
        <KpiCard label="Aceptadas DIAN" value={aceptadasDian.toString()} icon={CheckCircle2} tone="success" />
        <KpiCard label="Locales / Pendientes DIAN" value={documentosLocales.toString()} icon={Clock} tone="warning" />
        <KpiCard label="Monto total facturado" value={formatCOP(montoTotal)} icon={FileText} tone="info" />
      </div>

      {/* Search & Filter Bar */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Buscar por número de factura, cliente o NIT/CC…"
              className="pl-8"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            
            {/* Filter Transmision DIAN */}
            <Select
              value={dianTransmitted}
              onValueChange={(v) => {
                setDianTransmitted(v as any);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Estado DIAN" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas (DIAN y Locales)</SelectItem>
                <SelectItem value="sent">Transmitidas a DIAN</SelectItem>
                <SelectItem value="local">Locales / No enviadas</SelectItem>
              </SelectContent>
            </Select>

            {/* Filter Estado DIAN */}
            <Select
              value={estado}
              onValueChange={(v) => {
                setEstado(v as EstadoDian | 'all');
                setPage(1);
              }}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Estado detallado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {Object.entries(ESTADO_DIAN_META).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filter Medio de Pago */}
            <Select
              value={medioPago}
              onValueChange={(v) => {
                setMedioPago(v as MedioPago | 'all');
                setPage(1);
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Medio de pago" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los medios</SelectItem>
                {Object.entries(MEDIO_PAGO_META).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Main Invoices Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
          Cargando historial de facturas…
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-20 text-sm text-destructive">
          Error al cargar facturas: {error}
        </div>
      ) : pageItems.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No se encontraron facturas"
          description="Ajusta los filtros de búsqueda o realiza una nueva venta."
          actionLabel="Ir al Punto de Venta"
          onAction={() => (window.location.href = '/pos')}
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Cliente / Adquirente</TableHead>
                <TableHead>Identificación</TableHead>
                <TableHead>Fecha emisión</TableHead>
                <TableHead>Medio Pago</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Estado Envío DIAN</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((doc) => {
                const cli = clienteMap.get(doc.clienteId);
                const nombreCliente = cli?.razonSocial || doc.cliente?.razonSocial || 'Consumidor Final';
                const docCliente = cli ? `${cli.identificacion}${cli.dv ? `-${cli.dv}` : ''}` : '222222222222';
                return (
                  <TableRow key={doc.id}>
                    <TableCell className="font-mono text-xs font-bold text-primary">
                      <Link href={`/documents/${doc.id}`} className="hover:underline">
                        {doc.numero}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm font-medium">
                      {nombreCliente}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {docCliente}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateTime(doc.fechaEmision)}
                    </TableCell>
                    <TableCell className="text-xs">
                      <Badge variant="outline" className="bg-muted/50 text-foreground font-normal">
                        {medioPagoLabelByCode(doc.medioPago) || doc.medioPago}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold text-foreground">
                      {formatCOP(doc.total)}
                    </TableCell>
                    <TableCell>
                      {renderDianBadge(doc.estadoDian)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button asChild size="icon" variant="ghost" className="h-8 w-8" title="Ver detalle">
                          <Link href={`/documents/${doc.id}`} aria-label="Ver detalle">
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          aria-label="Descargar PDF"
                          title="Descargar PDF"
                          onClick={() => {
                            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                            window.open(`${baseUrl}/v1/invoices/${doc.id}/pdf`, '_blank');
                          }}
                        >
                          <FileDown className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          aria-label="Descargar XML"
                          title="Descargar XML"
                          onClick={() => {
                            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                            window.open(`${baseUrl}/v1/invoices/${doc.id}/xml`, '_blank');
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {totalPages > 1 && (
        <AppPagination currentPage={current} totalPages={totalPages} onPageChange={setPage} />
      )}
    </div>
  );
}
