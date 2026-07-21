'use client';

import { useState } from 'react';
import { usePermissions } from '@/hooks/use-permissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Zap } from 'lucide-react';
import { toast } from 'sonner';

const PLANES = [
  {
    id: 'plan-basic',
    nombre: 'Básico',
    precio: 49900,
    caracteristicas: ['Hasta 100 facturas/mes', '1 Caja registradora', 'Soporte por email'],
  },
  {
    id: 'plan-pro',
    nombre: 'Pro',
    precio: 99900,
    caracteristicas: ['Facturas ilimitadas', 'Hasta 3 Cajas registradoras', 'Soporte prioritario WhatsApp', 'Integración contable'],
  }
];

export default function BillingPage() {
  const { sesion } = usePermissions();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleSubscribe(plan: typeof PLANES[0]) {
    setLoadingId(plan.id);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          planName: plan.nombre,
          price: plan.precio,
          empresaId: sesion?.tenantId
        })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      if (data.init_point) {
        window.location.href = data.init_point;
      }
    } catch (err: any) {
      toast.error('Error al iniciar pago', { description: err.message });
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Planes y Facturación</h2>
        <p className="text-muted-foreground">Administra tu suscripción SaaS y métodos de pago (MercadoPago).</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {PLANES.map((plan) => (
          <Card key={plan.id} className="relative flex flex-col">
            {plan.id === 'plan-pro' && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground flex items-center gap-1">
                <Zap className="h-3 w-3" /> Recomendado
              </div>
            )}
            <CardHeader>
              <CardTitle className="text-xl">{plan.nombre}</CardTitle>
              <CardDescription>Para negocios en crecimiento</CardDescription>
              <div className="mt-4">
                <span className="text-3xl font-bold">${plan.precio.toLocaleString('es-CO')}</span>
                <span className="text-muted-foreground text-sm"> / mes</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-2 text-sm">
                {plan.caracteristicas.map((caracteristica, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    {caracteristica}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                variant={plan.id === 'plan-pro' ? 'default' : 'outline'}
                onClick={() => handleSubscribe(plan)}
                disabled={loadingId !== null}
              >
                {loadingId === plan.id ? 'Redirigiendo...' : 'Suscribirse con MercadoPago'}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
