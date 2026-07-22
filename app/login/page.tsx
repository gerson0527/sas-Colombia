'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { login } from '@/lib/auth-service';
import type { ApiError } from '@/lib/api-client';
import {
  Store, Mail, Lock, ArrowRight, Eye, EyeOff,
  ShoppingCart, Receipt, Wallet, Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Ingresa tu usuario y contraseña.');
      return;
    }
    setLoading(true);

    try {
      await login(email, password);
      toast.success('Bienvenido al sistema', { description: 'Abriendo punto de venta…' });
      router.push('/pos');
    } catch (err) {
      const apiErr = err as ApiError;
      setLoading(false);
      if (apiErr.status === 429) {
        toast.error('Demasiados intentos', { description: 'Espera un minuto antes de intentar de nuevo.' });
      } else {
        toast.error('Credenciales incorrectas', { description: apiErr.message || 'Verifica tu usuario y contraseña.' });
      }
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left brand panel - POS System */}
      <div className="relative hidden flex-col justify-between bg-gradient-to-br from-primary via-primary to-primary/80 p-8 text-primary-foreground lg:flex overflow-hidden">
        {/* Subtle pattern */}
        <div className="absolute inset-0 bg-grid opacity-[0.07]" />
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-primary-foreground/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-primary-foreground/5 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/15 backdrop-blur">
            <Store className="h-5 w-5" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-base font-bold tracking-tight">POS System</span>
            <span className="text-[11px] text-primary-foreground/70">Punto de venta & gestión comercial</span>
          </div>
        </div>

        <div className="relative space-y-4">
          <div className="space-y-1.5">
            <h2 className="text-3xl font-bold leading-tight">
              Vende más.<br />
              <span className="text-primary-foreground/85">Cobra mejor.</span>
            </h2>
            <p className="max-w-md text-sm text-primary-foreground/75">
              Sistema de punto de venta para tiendas y comercios.
              Controla caja, inventario y ventas en un solo lugar.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <FeatureChip icon={ShoppingCart} label="Punto de venta" />
            <FeatureChip icon={Receipt} label="Facturación" />
            <FeatureChip icon={Wallet} label="Cajas y turnos" />
            <FeatureChip icon={Package} label="Inventario" />
          </div>

          <ul className="space-y-1 pt-2 text-sm text-primary-foreground/85">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground/60" />
              Efectivo, Nequi, Daviplata y tarjeta
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground/60" />
              Cierre de caja con cuadre automático
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground/60" />
              Inventario en tiempo real
            </li>
          </ul>
        </div>

        <p className="relative text-[11px] text-primary-foreground/50">
          Compatible con facturación electrónica DIAN · Multi-tienda
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm">
          {/* Mobile brand */}
          <div className="mb-4 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Store className="h-5 w-5" />
            </div>
            <span className="text-base font-bold">POS System</span>
          </div>

          <Card className="border-border/60 shadow-sm">
            <CardHeader className="space-y-1 pb-3">
              <CardTitle className="text-xl">Iniciar sesión</CardTitle>
              <CardDescription>
                Accede a tu punto de venta para empezar a vender.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <form onSubmit={submit} className="space-y-3" suppressHydrationWarning>
                <div className="space-y-1">
                  <Label htmlFor="email">Usuario o correo</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-8 h-9"
                      placeholder="cajero@mitienda.co"
                      autoComplete="email"
                      suppressHydrationWarning
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Contraseña</Label>
                    <button
                      type="button"
                      className="text-[11px] text-primary hover:underline"
                      onClick={() => toast.info('Recuperación de contraseña', { description: 'Próximamente: recuperación por correo' })}
                    >
                      ¿Olvidaste?
                    </button>
                  </div>
                  <div className="relative" suppressHydrationWarning>
                    <Lock className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPwd ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-8 pr-9 h-9"
                      placeholder="••••••••"
                      autoComplete="current-password"
                      suppressHydrationWarning
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd((s) => !s)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showPwd ? 'Ocultar' : 'Mostrar'}
                    >
                      {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full" size="default" disabled={loading}>
                  {loading ? (
                    'Ingresando…'
                  ) : (
                    <>
                      Abrir punto de venta
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>

              <div className="my-3 flex items-center gap-3">
                <Separator className="flex-1" />
                <span className="text-[10px] uppercase text-muted-foreground">o</span>
                <Separator className="flex-1" />
              </div>

              <div className="text-center">
                <p className="text-[11px] text-muted-foreground">
                  ¿Tu tienda aún no está registrada?
                </p>
                <Link
                  href="/request-access"
                  className="mt-1.5 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                >
                  Solicita acceso
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </CardContent>
          </Card>

          <p className="mt-3 text-center text-[10px] text-muted-foreground/70">
            Sesión segura · Conexión cifrada · Soporte 24/7
          </p>
        </div>
      </div>
    </div>
  );
}

function FeatureChip({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-primary-foreground/10 px-3 py-2 backdrop-blur">
      <Icon className="h-4 w-4 text-primary-foreground/80" />
      <span className="text-xs font-medium text-primary-foreground/90">{label}</span>
    </div>
  );
}
