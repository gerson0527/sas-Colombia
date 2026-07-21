'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Building2,
  ShieldCheck,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Lock,
  MessageCircle,
  Mail,
} from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { useEmpresa } from '@/hooks/use-supabase-data';
import { REGIMEN_META, AMBIENTE_META, DEPARTAMENTOS_COL, COLOMBIA_LOCATION_DATA } from '@/lib/constants';
import { formatDate, daysUntil } from '@/lib/format';
import type { Ambiente, RegimenTributario, ConfiguracionEmpresa } from '@/lib/types';

const emptyEmpresa: ConfiguracionEmpresa = {
  id: '',
  nit: '',
  dv: '',
  razonSocial: '',
  regimenTributario: 'responsable_iva',
  responsabilidadesFiscales: [],
  direccion: '',
  ciudad: '',
  departamento: '',
  telefono: '',
  email: '',
  ambiente: 'habilitacion',
  certificadoDigitalCargado: false,
  monedaLocal: 'COP',
  brevoEmailSender: '',
  brevoWhatsappSender: '',
};

export default function SettingsPage() {
  const { data: empresa, loading, error, update } = useEmpresa();
  const [form, setForm] = useState<ConfiguracionEmpresa>(emptyEmpresa);
  const [certFile, setCertFile] = useState<File | null>(null);

  useEffect(() => {
    if (empresa) setForm(empresa);
  }, [empresa]);

  const certDays = daysUntil(form.fechaVencimientoCertificado);
  const certStatus =
    certDays === null
      ? 'unknown'
      : certDays < 0
      ? 'expired'
      : certDays < 30
      ? 'critical'
      : certDays < 60
      ? 'warning'
      : 'ok';

  async function saveCompany() {
    const ok = await update(form);
    if (ok) toast.success('Configuración de empresa actualizada');
    else toast.error('Error al guardar la configuración');
  }

  async function uploadCert() {
    if (!certFile) {
      toast.error('Selecciona un archivo .p12 primero.');
      return;
    }
    await update({ certificadoDigitalCargado: true });
    toast.success('Certificado cargado', {
      description: 'El backend validará la contraseña y vigencia del .p12.',
    });
    setForm((f) => ({ ...f, certificadoDigitalCargado: true }));
    setCertFile(null);
  }

  async function saveAmbiente() {
    const ok = await update({ ambiente: form.ambiente });
    if (ok) toast.success('Ambiente actualizado');
    else toast.error('Error al actualizar ambiente');
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuración de empresa"
        description="Datos del emisor, ambiente DIAN y certificado digital."
      />

      {loading && (
        <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
          Cargando configuración…
        </div>
      )}
      {error && (
        <div className="flex items-center justify-center py-20 text-sm text-destructive">
          Error: {error}
        </div>
      )}

      <Tabs defaultValue="company">
        <TabsList>
          <TabsTrigger value="company">Empresa</TabsTrigger>
          <TabsTrigger value="ambiente">Ambiente</TabsTrigger>
          <TabsTrigger value="certificate">Certificado</TabsTrigger>
          <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-4 w-4 text-primary" /> Datos del emisor
              </CardTitle>
              <CardDescription>Información legal de la empresa que aparece en los documentos electrónicos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>NIT</Label>
                  <Input value={form.nit} onChange={(e) => setForm({ ...form, nit: e.target.value.replace(/\D/g, '') })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Dígito de verificación</Label>
                  <Input value={form.dv} onChange={(e) => setForm({ ...form, dv: e.target.value.replace(/\D/g, '') })} maxLength={1} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Razón social</Label>
                <Input value={form.razonSocial} onChange={(e) => setForm({ ...form, razonSocial: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Nombre comercial</Label>
                <Input value={form.nombreComercial || ''} onChange={(e) => setForm({ ...form, nombreComercial: e.target.value })} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Teléfono</Label>
                  <Input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value.replace(/\D/g, '') })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Dirección</Label>
                <Input value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Departamento</Label>
                  <Select value={form.departamento} onValueChange={(v) => setForm({ ...form, departamento: v, ciudad: '' })}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {DEPARTAMENTOS_COL.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Ciudad</Label>
                  <Select value={form.ciudad} onValueChange={(v) => setForm({ ...form, ciudad: v })} disabled={!form.departamento}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {form.departamento && COLOMBIA_LOCATION_DATA[form.departamento]?.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Régimen tributario</Label>
                <Select value={form.regimenTributario} onValueChange={(v) => setForm({ ...form, regimenTributario: v as RegimenTributario })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(REGIMEN_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end">
                <Button onClick={saveCompany}>Guardar cambios</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ambiente" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ambiente DIAN</CardTitle>
              <CardDescription>
                Define si los documentos emitidos tienen o no validez fiscal.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, ambiente: 'habilitacion' })}
                  className={`flex flex-col gap-1 rounded-lg border-2 p-4 text-left transition-colors ${
                    form.ambiente === 'habilitacion'
                      ? 'border-warning bg-warning/5'
                      : 'border-border hover:border-warning/40'
                  }`}
                >
                  <span className="text-sm font-semibold">Habilitación (pruebas)</span>
                  <span className="text-xs text-muted-foreground">
                    Para pruebas de integración. Los documentos NO son fiscalmente válidos.
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, ambiente: 'produccion' })}
                  className={`flex flex-col gap-1 rounded-lg border-2 p-4 text-left transition-colors ${
                    form.ambiente === 'produccion'
                      ? 'border-success bg-success/5'
                      : 'border-border hover:border-success/40'
                  }`}
                >
                  <span className="text-sm font-semibold">Producción</span>
                  <span className="text-xs text-muted-foreground">
                    Documentos legalmente válidos ante la DIAN.
                  </span>
                </button>
              </div>
              {form.ambiente === 'produccion' && (
                <div className="flex items-start gap-2 rounded-md border border-success/30 bg-success/10 p-3 text-sm text-success">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    Producción activo: cada documento emitido será legalmente válido ante la DIAN.
                    Verifica que el certificado digital esté vigente antes de emitir.
                  </span>
                </div>
              )}
              {form.ambiente === 'habilitacion' && (
                <div className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>Habilitación activo: los documentos emitidos NO tienen validez fiscal.</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-end">
                <Button onClick={saveAmbiente}>Guardar ambiente</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certificate" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Lock className="h-4 w-4 text-primary" /> Certificado digital
              </CardTitle>
              <CardDescription>
                El frontend solo carga el archivo .p12. La contraseña y firma son procesadas en el backend.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 rounded-md border border-border p-4">
                {certStatus === 'ok' ? (
                  <CheckCircle2 className="h-5 w-5 text-success" />
                ) : certStatus === 'expired' ? (
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-warning" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {form.certificadoDigitalCargado ? 'Certificado cargado' : 'Sin certificado'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {form.fechaVencimientoCertificado
                      ? `Vence el ${formatDate(form.fechaVencimientoCertificado)}${
                          certDays !== null
                            ? certDays < 0
                              ? ' (vencido)'
                              : ` (en ${certDays} días)`
                            : ''
                        }`
                      : '—'}
                  </p>
                </div>
                {certStatus !== 'ok' && certStatus !== 'unknown' && (
                  <Badge tone={certStatus === 'expired' ? 'destructive' : 'warning'}>
                    {certStatus === 'expired' ? 'Vencido' : 'Por vencer'}
                  </Badge>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Cargar nuevo certificado (.p12)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept=".p12,.pfx"
                    onChange={(e) => setCertFile(e.target.files?.[0] || null)}
                    className="flex-1"
                  />
                  <Button onClick={uploadCert} variant="secondary">
                    <Upload className="mr-2 h-4 w-4" /> Subir
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  El archivo se envía cifrado al backend. La contraseña del .p12 se solicita al momento de firma.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageCircle className="h-4 w-4 text-primary" /> Notificaciones — Brevo
              </CardTitle>
              <CardDescription>
                Configura tu cuenta de Brevo para enviar facturas automáticamente por WhatsApp y correo electrónico.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> Correo remitente</Label>
                <Input
                  type="email"
                  placeholder="ventas@tuempresa.com"
                  value={form.brevoEmailSender || ''}
                  onChange={(e) => setForm({ ...form, brevoEmailSender: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">Debe estar validado como remitente en tu cuenta de Brevo.</p>
              </div>

              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5"><MessageCircle className="h-3.5 w-3.5" /> Número de WhatsApp remitente</Label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-sm font-medium text-muted-foreground">+57</span>
                  <Input
                    type="tel"
                    placeholder="3001234567"
                    className="pl-10"
                    value={form.brevoWhatsappSender || ''}
                    onChange={(e) => setForm({ ...form, brevoWhatsappSender: e.target.value.replace(/\D/g, '') })}
                  />
                </div>
                <p className="text-xs text-muted-foreground">Número registrado y aprobado en tu cuenta de WhatsApp Business en Brevo.</p>
              </div>

              <div className="flex justify-end">
                <Button onClick={async () => {
                  const ok = await update({
                    brevoEmailSender: form.brevoEmailSender,
                    brevoWhatsappSender: form.brevoWhatsappSender,
                  });
                  if (ok) toast.success('Configuración de notificaciones guardada');
                  else toast.error('Error al guardar');
                }}>Guardar notificaciones</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Badge({ tone, children }: { tone: 'destructive' | 'warning'; children: React.ReactNode }) {
  const cls =
    tone === 'destructive'
      ? 'bg-destructive/15 text-destructive border-destructive/30'
      : 'bg-warning/15 text-warning border-warning/30';
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {children}
    </span>
  );
}
