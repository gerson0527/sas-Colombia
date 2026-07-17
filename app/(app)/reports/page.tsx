'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  BarChart3,
  Download,
  Calendar,
  TrendingUp,
  Receipt,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { KpiCard } from '@/components/kpi-card';
import { formatCOP } from '@/lib/format';

const ventasPorMes = [
  { mes: 'Ene', ventas: 24_500_000, iva: 4_655_000, retenciones: 2_205_000 },
  { mes: 'Feb', ventas: 28_400_000, iva: 5_396_000, retenciones: 2_556_000 },
  { mes: 'Mar', ventas: 31_900_000, iva: 6_061_000, retenciones: 2_871_000 },
  { mes: 'Abr', ventas: 35_600_000, iva: 6_764_000, retenciones: 3_204_000 },
  { mes: 'May', ventas: 33_200_000, iva: 6_308_000, retenciones: 2_988_000 },
  { mes: 'Jun', ventas: 41_800_000, iva: 7_942_000, retenciones: 3_762_000 },
  { mes: 'Jul', ventas: 48_920_000, iva: 9_294_800, retenciones: 4_402_800 },
];

const impuestosResumen = [
  { concepto: 'IVA recaudado (19%)', total: 9_294_800 },
  { concepto: 'IVA recaudado (5%)', total: 624_000 },
  { concepto: 'INC', total: 0 },
  { concepto: 'ReteFuente', total: 3_120_000 },
  { concepto: 'ReteICA', total: 1_282_800 },
];

export default function ReportsPage() {
  const [from, setFrom] = useState('2026-01-01');
  const [to, setTo] = useState('2026-07-31');

  function exportCsv() {
    toast.success('Exportación iniciada', {
      description: 'El backend generará el CSV y lo enviará al correo del usuario.',
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reportes"
        description="Reportes de ventas e impuestos recaudados por rango de fechas."
        actions={
          <Button onClick={exportCsv}>
            <Download className="mr-2 h-4 w-4" /> Exportar CSV
          </Button>
        }
      />

      {/* Date range */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Desde</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-44" />
          </div>
          <div className="space-y-1.5">
            <Label>Hasta</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-44" />
          </div>
          <Button variant="secondary" onClick={() => toast.success('Reporte actualizado')}>
            <BarChart3 className="mr-2 h-4 w-4" /> Generar
          </Button>
        </div>
      </Card>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard label="Ventas totales" value={formatCOP(244_320_000)} icon={TrendingUp} tone="primary" />
        <KpiCard label="IVA recaudado" value={formatCOP(46_425_800)} icon={Receipt} tone="info" />
        <KpiCard label="Retenciones" value={formatCOP(19_677_800)} icon={Download} tone="warning" />
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ventas e impuestos por mes</CardTitle>
          <CardDescription>Comparativo mensual (COP)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ventasPorMes} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
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
                  formatter={(v: number) => formatCOP(v)}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }} />
                <Bar dataKey="ventas" name="Ventas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="iva" name="IVA" fill="hsl(var(--info))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="retenciones" name="Retenciones" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Tax summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resumen de impuestos recaudados</CardTitle>
          <CardDescription>Rango seleccionado</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Concepto</TableHead>
                <TableHead className="text-right">Total (COP)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {impuestosResumen.map((r) => (
                <TableRow key={r.concepto}>
                  <TableCell className="text-sm">{r.concepto}</TableCell>
                  <TableCell className="text-right font-medium">{formatCOP(r.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
