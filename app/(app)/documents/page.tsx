'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  FileText,
  Download,
  Eye,
  Ban,
  Search,
  Filter,
  Plus,
  FileDown,
} from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Card } from '@/components/ui/card';
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
import { EstadoDianBadge } from '@/components/estado-badge';
import { EmptyState } from '@/components/empty-state';
import { mockDocumentos } from '@/lib/mock-data';
import { formatCOP, formatShortDate } from '@/lib/format';
import {
  ESTADO_DIAN_META,
  TIPO_DOCUMENTO_META,
} from '@/lib/constants';
import type { EstadoDian, TipoDocumento } from '@/lib/types';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

const PAGE_SIZE = 8;

export default function DocumentsPage() {
  const [search, setSearch] = useState('');
  const [estado, setEstado] = useState<EstadoDian | 'all'>('all');
  const [tipo, setTipo] = useState<TipoDocumento | 'all'>('all');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return mockDocumentos.filter((doc) => {
      if (estado !== 'all' && doc.estadoDian !== estado) return false;
      if (tipo !== 'all' && doc.tipoDocumento !== tipo) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !doc.numero.toLowerCase().includes(q) &&
          !doc.cliente.razonSocial.toLowerCase().includes(q) &&
          !doc.cliente.identificacion.includes(q)
        )
          return false;
      }
      return true;
    });
  }, [search, estado, tipo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const pageItems = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documentos electrónicos"
        description="Consulta, filtra y gestiona todos los documentos emitidos ante la DIAN."
        actions={
          <Button asChild>
            <Link href="/invoices/new">
              <Plus className="mr-2 h-4 w-4" /> Nueva factura
            </Link>
          </Button>
        }
      />

      {/* Filters */}
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
              placeholder="Buscar por número, cliente o NIT/CC…"
              className="pl-8"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select
              value={estado}
              onValueChange={(v) => {
                setEstado(v as EstadoDian | 'all');
                setPage(1);
              }}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Estado" />
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
            <Select
              value={tipo}
              onValueChange={(v) => {
                setTipo(v as TipoDocumento | 'all');
                setPage(1);
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {Object.entries(TIPO_DOCUMENTO_META).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Table */}
      {pageItems.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No se encontraron documentos"
          description="Ajusta los filtros o crea un nuevo documento electrónico."
          actionLabel="Nueva factura"
          onAction={() => (window.location.href = '/invoices/new')}
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Identificación</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-mono text-xs font-medium">
                    <Link
                      href={`/documents/${doc.id}`}
                      className="text-primary hover:underline"
                    >
                      {doc.numero}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm">
                    {TIPO_DOCUMENTO_META[doc.tipoDocumento].label}
                  </TableCell>
                  <TableCell className="max-w-[220px] truncate text-sm">
                    {doc.cliente.razonSocial}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {doc.cliente.identificacion}
                    {doc.cliente.dv ? `-${doc.cliente.dv}` : ''}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatShortDate(doc.fechaEmision)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCOP(doc.total)}
                  </TableCell>
                  <TableCell>
                    <EstadoDianBadge estado={doc.estadoDian} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button asChild size="icon" variant="ghost" className="h-8 w-8">
                        <Link href={`/documents/${doc.id}`} aria-label="Ver detalle">
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Descargar PDF">
                        <FileDown className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Descargar XML">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        aria-label="Anular"
                        disabled={doc.estadoDian === 'anulado' || doc.estadoDian === 'borrador'}
                      >
                        <Ban className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className={current === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }).map((_, i) => (
              <PaginationItem key={i}>
                <PaginationLink
                  isActive={current === i + 1}
                  onClick={() => setPage(i + 1)}
                  className="cursor-pointer"
                >
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className={current === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
