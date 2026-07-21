'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import { Loader2, Check, X } from 'lucide-react';

interface Plan {
  id: string;
  code: string;
  name: string;
  description: string;
  priceMonthly: string;
  priceYearly: string;
  maxUsers: number;
  maxBranches: number;
  maxCashRegisters: number;
  maxProducts: number;
  maxInvoicesPerMonth: number;
}

interface Subscription {
  id: string;
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'suspended';
  period: 'monthly' | 'yearly';
  trialEndsAt: string;
  currentPeriodEnd: string;
  plan: Plan;
}

interface BillingEvent {
  id: string;
  type: string;
  status: string;
  createdAt: string;
  payload: any;
}

const formatCOP = (n: string) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(n));

const formatDate = (s: string) => new Date(s).toLocaleDateString('es-CO');

export default function BillingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [events, setEvents] = useState<BillingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const [p, s] = await Promise.all([
        api.get<Plan[]>('/v1/billing/plans'),
        api.get<Subscription>('/v1/billing/subscription').catch(() => null),
      ]);
      setPlans(p as any);
      setSubscription(s as any);
    } catch (e: any) {
      toast.error(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const startTrial = async () => {
    try {
      setProcessing(true);
      await api.post('/v1/billing/subscription/start-trial', {});
      toast.success('Período de prueba iniciado (14 días)');
      await load();
    } catch (e: any) {
      toast.error(`Error: ${e.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const changePlan = async (planCode: string) => {
    try {
      setProcessing(true);
      await api.post('/v1/billing/subscription/change-plan', { planCode });
      toast.success(`Plan cambiado a ${planCode}`);
      await load();
    } catch (e: any) {
      toast.error(`Error: ${e.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const checkout = async (planCode: string, period: 'monthly' | 'yearly') => {
    try {
      setProcessing(true);
      const pref = await api.post<any>('/v1/billing/checkout', { planCode, period });
      if (pref.init_point) {
        window.location.href = pref.init_point;
      }
    } catch (e: any) {
      toast.error(`Error: ${e.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const cancel = async () => {
    if (!confirm('¿Cancelar suscripción?')) return;
    try {
      setProcessing(true);
      await api.post('/v1/billing/subscription/cancel', {});
      toast.success('Suscripción cancelada');
      await load();
    } catch (e: any) {
      toast.error(`Error: ${e.message}`);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Suscripción y facturación</h1>
        <p className="text-muted-foreground">Gestiona tu plan y método de pago</p>
      </div>

      {subscription && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Plan actual
              <Badge variant={subscription.status === 'active' ? 'default' : subscription.status === 'trialing' ? 'secondary' : 'destructive'}>
                {subscription.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-2xl font-bold">{subscription.plan.name}</p>
            <p className="text-muted-foreground">
              {subscription.status === 'trialing' && subscription.trialEndsAt && `Prueba hasta: ${formatDate(subscription.trialEndsAt)}`}
              {subscription.status === 'active' && subscription.currentPeriodEnd && `Próximo cobro: ${formatDate(subscription.currentPeriodEnd)}`}
              {subscription.status === 'canceled' && 'Cancelada'}
            </p>
            {subscription.status !== 'canceled' && (
              <Button variant="destructive" onClick={cancel} disabled={processing}>
                Cancelar suscripción
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {!subscription && (
        <Card>
          <CardContent className="p-6">
            <p className="mb-4">No tienes una suscripción activa. Inicia tu prueba gratuita de 14 días.</p>
            <Button onClick={startTrial} disabled={processing}>
              Iniciar prueba gratis
            </Button>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="text-2xl font-bold mb-4">Planes disponibles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan) => (
            <Card key={plan.id} className={subscription?.plan?.code === plan.code ? 'border-primary' : ''}>
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-3xl font-bold">{formatCOP(plan.priceMonthly)}</p>
                  <p className="text-sm text-muted-foreground">/ mes</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Anual: {formatCOP(plan.priceYearly)}
                  </p>
                </div>

                <ul className="space-y-1 text-sm">
                  <li className="flex items-center gap-2">
                    {plan.maxUsers < 999 ? <Check className="h-4 w-4 text-green-500" /> : <Check className="h-4 w-4 text-blue-500" />}
                    {plan.maxUsers < 999 ? `${plan.maxUsers} usuario(s)` : 'Usuarios ilimitados'}
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    {plan.maxBranches < 999 ? `${plan.maxBranches} sucursal(es)` : 'Sucursales ilimitadas'}
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    {plan.maxCashRegisters < 999 ? `${plan.maxCashRegisters} caja(s)` : 'Cajas ilimitadas'}
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    {plan.maxInvoicesPerMonth < 999999 ? `${plan.maxInvoicesPerMonth} facturas/mes` : 'Facturas ilimitadas'}
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    {plan.maxProducts < 999999 ? `${plan.maxProducts} productos` : 'Productos ilimitados'}
                  </li>
                </ul>

                {plan.code === 'free' ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={processing || subscription?.plan?.code === 'free'}
                    onClick={() => changePlan('free')}
                  >
                    {subscription?.plan?.code === 'free' ? 'Plan actual' : 'Cambiar a Free'}
                  </Button>
                ) : (
                  <>
                    <Button
                      className="w-full"
                      disabled={processing}
                      onClick={() => checkout(plan.code, 'monthly')}
                    >
                      Pagar mensual
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      disabled={processing}
                      onClick={() => checkout(plan.code, 'yearly')}
                    >
                      Pagar anual (ahorra 17%)
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
