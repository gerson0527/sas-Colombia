'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Building2, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('diana.gomez@innovaandina.co');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Ingresa email y contraseña.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Sesión iniciada', { description: 'Redirigiendo al dashboard…' });
      router.push('/dashboard');
    }, 600);
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left brand panel */}
      <div className="relative hidden flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
        <div className="absolute inset-0 bg-grid opacity-10" />
        <div className="relative flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground/15">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-base font-semibold tracking-tight">FacturaDIAN</span>
            <span className="text-xs text-primary-foreground/70">e-Invoicing UBL 2.1</span>
          </div>
        </div>
        <div className="relative space-y-4">
          <h2 className="text-3xl font-semibold leading-tight">
            Facturación electrónica<br />conforme a la DIAN.
          </h2>
          <p className="max-w-md text-sm text-primary-foreground/80">
            Emite, consulta y anula documentos electrónicos UBL 2.1 con gestión de CUFE/CUDE,
            resoluciones y certificado digital — todo desde un solo panel.
          </p>
          <ul className="space-y-2 text-sm text-primary-foreground/90">
            <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary-foreground/70" /> Ambientes Habilitación y Producción</li>
            <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary-foreground/70" /> Multi-tenant con roles y permisos</li>
            <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary-foreground/70" /> Reportes de ventas e impuestos</li>
          </ul>
        </div>
        <p className="relative text-xs text-primary-foreground/60">
          Cumple Resolución DIAN 000042 y 000165 · UBL 2.1
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Building2 className="h-5 w-5" />
            </div>
            <span className="text-base font-semibold">FacturaDIAN</span>
          </div>

          <Card>
            <CardHeader className="space-y-1.5">
              <CardTitle className="text-xl">Iniciar sesión</CardTitle>
              <CardDescription>Accede a tu cuenta de facturación electrónica.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-8"
                      placeholder="nombre@empresa.co"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Contraseña</Label>
                    <button
                      type="button"
                      className="text-xs text-primary hover:underline"
                      onClick={() => toast.info('Endpoint placeholder', { description: 'POST /api/v1/auth/recover' })}
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPwd ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-8 pr-9"
                      placeholder="••••••••"
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
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Ingresando…' : <>Ingresar <ArrowRight className="ml-2 h-4 w-4" /></>}
                </Button>
              </form>

              <div className="my-4 flex items-center gap-3">
                <Separator className="flex-1" />
                <span className="text-xs uppercase text-muted-foreground">o</span>
                <Separator className="flex-1" />
              </div>

              <p className="text-center text-xs text-muted-foreground">
                ¿No tienes cuenta?{' '}
                <Link href="#" className="font-medium text-primary hover:underline">
                  Solicita acceso
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
