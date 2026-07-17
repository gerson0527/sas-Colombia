'use client';

import Link from 'next/link';
import {
  FileText,
  Send,
  AlertOctagon,
  DollarSign,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  Plus,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { PageHeader } from '@/components/page-header';
import { KpiCard } from '@/components/kpi-card';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EstadoDianBadge } from '@/components/estado-badge';
import { mockDashboard, mockEmpresa, mockResoluciones } from '@/lib/mock-data';
import { formatCOP, formatShortDate } from '@/lib/format';
import { ESTADO_DIAN_META, TIPO_DOCUMENTO_META } from '@/lib/constants';
import { daysUntil } from '@/lib/format';

const PIE_COLORS = [
  'hsl(var(--success))',
  'hsl(var(--info))',
  'hsl(var(--warning))',
  'hsl(var(--destructive))',
  'hsl(var(--muted-foreground))',
  'hsl(var(--chart-5))',
];

export default function DashboardPage() {
  const d = mockDashboard;
  const pieData = d.distribucionEstados.map((s) => ({
    name: ESTADO_DIAN_META[s.estado].label,
    value: s.cantidad,
  }));

  const certDays = daysUntil(mockEmpresa.fechaVencimientoCertificado);
  const resolucion = mockResoluciones[0];
  const resolucionUsage =
    (resolucion.consecutivoActual / resolucion.rangoHasta) * 100;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Resumen operativo de facturación electrónica DIAN."
        actions={
          <Button asChild>
            <Link href="/invoices/new">
              <Plus className="mr-2 h-4 w-4" /> Nueva factura
            </Link>
          </Button>
        }
      />

      {/* Alerts */}
      {(d.resolucionPorAgotar || (certDays !== null && certDays < 60)) && (
        <div className="grid gap-3 md:grid-cols-2">
          {d.resolucionPorAgotar && (
            <AlertCard
              tone="warning"
              icon={ShieldAlert}
              title="Resolución próxima a agotarse"
              message={`La resolución ${resolucion.numeroResolucion} (${resolucion.prefijo}) tiene ${resolucionUsage.toFixed(0)}% de uso (${resolucion.consecutivoActual}/${resolucion.rangoHasta}).`}
              actionHref="/resolutions"
              actionLabel="Gestionar resoluciones"
            />
          )}
          {certDays !== null && certDays < 60 && (
            <AlertCard
              tone={certDays < 0 ? 'destructive' : 'info'}
              icon={AlertTriangle}
              title={
                certDays < 0
                  ? 'Certificado digital vencido'
                  : 'Certificado digital por vencer'
              }
              message={
                certDays < 0
                  ? 'El certificado digital está vencido. No se podrán enviar documentos a DIAN.'
                  : `El certificado digital vence en ${certDays} días. Renueva el .p12 a tiempo.`
              }
              actionHref="/settings"
              actionLabel="Subir certificado"
            />
          )}
        </div>
      )}

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Facturas emitidas (mes)"
          value={d.facturasMes.toString()}
          delta={{ value: '12%', positive: true }}
          icon={FileText}
          tone="primary"
        />
        <KpiCard
          label="Pendientes envío DIAN"
          value={d.pendientesEnvio.toString()}
          icon={Send}
          tone="warning"
          hint="Requieren atención"
        />
        <KpiCard
          label="Rechazadas"
          value={d.rechazadas.toString()}
          delta={{ value: '2', positive: false }}
          icon={AlertOctagon}
          tone="destructive"
        />
        <KpiCard
          label="Ingresos totales (mes)"
          value={formatCOP(d.ingresosTotales)}
          delta={{ value: '17%', positive: true }}
          icon={DollarSign}
          tone="success"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Ventas por mes</CardTitle>
            <CardDescription>Últimos 6 meses (COP)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={d.ventasPorMes} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="ventas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis
                    dataKey="mes"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 8,
                      fontSize: 12,
                      color: 'hsl(var(--foreground))',
                    }}
                    formatter={(v: number) => [formatCOP(v), 'Ventas']}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#ventas)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribución por estado</CardTitle>
            <CardDescription>Documentos del mes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 8,
                      fontSize: 12,
                      color: 'hsl(var(--foreground))',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent documents */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Últimos documentos emitidos</CardTitle>
            <CardDescription>5 más recientes</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/documents">
              Ver todos <ArrowRight className="ml-2 h-3.5 w-3.5" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {d.ultimosDocumentos.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-mono text-xs font-medium">
                    {doc.numero}
                  </TableCell>
                  <TableCell className="text-sm">
                    {TIPO_DOCUMENTO_META[doc.tipoDocumento].label}
                  </TableCell>
                  <TableCell className="text-sm">
                    {doc.cliente.razonSocial}
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function AlertCard({
  tone,
  icon: Icon,
  title,
  message,
  actionHref,
  actionLabel,
}: {
  tone: 'warning' | 'destructive' | 'info';
  icon: typeof ShieldAlert;
  title: string;
  message: string;
  actionHref: string;
  actionLabel: string;
}) {
  const toneCls =
    tone === 'warning'
      ? 'border-warning/30 bg-warning/10'
      : tone === 'destructive'
      ? 'border-destructive/30 bg-destructive/10'
      : 'border-info/30 bg-info/10';
  const iconCls =
    tone === 'warning'
      ? 'text-warning'
      : tone === 'destructive'
      ? 'text-destructive'
      : 'text-info';
  return (
    <div className={`flex items-start gap-3 rounded-lg border p-4 ${toneCls}`}>
      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${iconCls}`} />
      <div className="flex-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{message}</p>
        <Button asChild variant="link" size="sm" className="mt-1 h-auto p-0">
          <Link href={actionHref}>
            {actionLabel} <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
