'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ArrowLeft, Store, User, Mail, Building2,
  CheckCircle2, Send, Shield, Lock, CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<'form' | 'sent'>('form');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    password: '',
    identificacion: '',
    empresa: '',
  });

  const supabase = createClient();

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre || !form.email || !form.empresa || !form.password || !form.identificacion) {
      toast.error('Completa los campos obligatorios.');
      return;
    }
    if (form.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);

    try {
      // 1. Crear usuario en Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { name: form.nombre }
        }
      });

      if (authError) throw authError;

      // 2. Ejecutar RPC para crear el tenant en base de datos
      const { error: rpcError } = await supabase.rpc('crear_cuenta_empresa', {
        p_razon_social: form.empresa,
        p_identificacion: form.identificacion,
        p_nombre_usuario: form.nombre
      });

      if (rpcError) {
        // En un caso real, deberíamos manejar el rollback si el RPC falla, 
        // pero por ahora mostraremos el error.
        throw rpcError;
      }

      setStep('sent');
    } catch (err: any) {
      toast.error('Ocurrió un error', { description: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Top bar */}
      <header className="shrink-0 border-b border-border/60 bg-card/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Store className="h-5 w-5" />
            </div>
            <span className="text-base font-bold tracking-tight">POS System</span>
          </Link>
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Volver al login
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-6 py-4">
        {step === 'form' ? (
          <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            {/* Left side - hero */}
            <div className="flex flex-col justify-center space-y-6">
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Shield className="h-3 w-3" />
                Creación de cuenta · Demo gratuita de 14 días
              </div>

              <h1 className="text-4xl font-bold leading-tight tracking-tight lg:text-5xl">
                Empieza a vender<br />
                <span className="text-primary">en menos de 5 minutos.</span>
              </h1>

              <p className="max-w-md text-base text-muted-foreground">
                Crea tu cuenta de empresa para activar tu punto de venta web. Sin tarjeta de crédito, sin permanencia.
              </p>

              <ul className="space-y-2.5 pt-2">
                {[
                  'Punto de venta completo con control de caja',
                  'Facturación electrónica DIAN integrada',
                  'Inventario en tiempo real con alertas de stock',
                  'Reportes de ventas, impuestos y utilidades',
                  'Soporte 24/7 vía WhatsApp',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                    <span className="text-foreground/85">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right side - form */}
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="space-y-1.5 pb-4">
                <CardTitle className="text-xl">Crea tu cuenta</CardTitle>
                <CardDescription>
                  Ingresa tus datos y los de tu negocio para comenzar.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={submit} className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="nombre">
                        Tu nombre <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <User className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="nombre"
                          value={form.nombre}
                          onChange={(e) => update('nombre', e.target.value)}
                          className="pl-8"
                          placeholder="María Pérez"
                          autoComplete="name"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="email">
                        Correo electrónico <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          value={form.email}
                          onChange={(e) => update('email', e.target.value)}
                          className="pl-8"
                          placeholder="tu@correo.com"
                          autoComplete="email"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="password">
                      Contraseña <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        value={form.password}
                        onChange={(e) => update('password', e.target.value)}
                        className="pl-8"
                        placeholder="••••••••"
                        autoComplete="new-password"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="identificacion">
                        NIT o Cédula Negocio <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <CreditCard className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="identificacion"
                          value={form.identificacion}
                          onChange={(e) => update('identificacion', e.target.value)}
                          className="pl-8"
                          placeholder="900000000"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="empresa">
                        Razón Social / Tienda <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <Building2 className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="empresa"
                          value={form.empresa}
                          onChange={(e) => update('empresa', e.target.value)}
                          className="pl-8"
                          placeholder="Mi Negocio S.A.S"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <Button type="submit" className="w-full mt-2" size="lg" disabled={loading}>
                    {loading ? (
                      'Creando cuenta...'
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Comenzar 14 días gratis
                      </>
                    )}
                  </Button>

                  <p className="text-center text-[11px] text-muted-foreground">
                    Al registrarte aceptas nuestros términos y condiciones.
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="mx-auto max-w-md border-border/60 shadow-sm">
            <CardContent className="flex flex-col items-center px-6 py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">¡Cuenta Creada!</h2>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Tu empresa <strong className="text-foreground">{form.empresa}</strong> ha sido registrada exitosamente.
                Ya puedes iniciar sesión y comenzar a configurar tu punto de venta.
              </p>

              <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                <Button asChild>
                  <Link href="/login">Ir a iniciar sesión</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
