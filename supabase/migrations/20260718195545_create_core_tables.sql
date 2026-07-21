DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

/*
# Crear tablas core de FacturaDIAN (multi-tenant)

## Resumen
Crea las tablas fundamentales para el sistema de facturación electrónica:
empresas (tenants), perfiles de usuario, clientes, productos y resoluciones DIAN.
Diseñado como multi-tenant: cada tabla tiene `empresa_id` y las políticas RLS
aislan los datos por empresa usando auth.uid() → usuarios.empresa_id.

## 1. Tabla: empresas
Representa cada empresa (tenant) que usa el SaaS.
- `id` (uuid, PK)
- `nit` (text, unique, NIT de la empresa)
- `dv` (text, dígito de verificación)
- `razon_social` (text, razón social)
- `nombre_comercial` (text, opcional)
- `regimen_tributario` (text: responsable_iva | no_responsable | regimen_simple)
- `direccion`, `ciudad`, `departamento`, `codigo_postal` (text)
- `telefono`, `email` (text)
- `ambiente` (text: habilitacion | produccion, default habilitacion)
- `certificado_digital_cargado` (boolean, default false)
- `moneda_local` (text, default COP)
- `created_at`, `updated_at` (timestamptz)

## 2. Tabla: usuarios
Perfiles que extienden auth.users con datos del tenant y rol.
- `id` (uuid, PK, FK a auth.users ON DELETE CASCADE)
- `empresa_id` (uuid, FK a empresas)
- `nombre` (text)
- `email` (text)
- `rol` (text: admin | supervisor | cajero | contador | solo_lectura)
- `pin` (text, 4 dígitos para autorizaciones POS)
- `estado` (text: activo | pendiente | inactivo, default pendiente)
- `ultimo_acceso` (timestamptz, nullable)
- `created_at`, `updated_at` (timestamptz)

## 3. Tabla: clientes
Clientes de cada empresa con campos fiscales DIAN.
- `id` (uuid, PK)
- `empresa_id` (uuid, FK a empresas)
- `tipo_identificacion` (text: CC | NIT | CE | PASAPORTE | TI | PPT)
- `identificacion` (text)
- `dv` (text, nullable)
- `razon_social` (text)
- `email`, `telefono`, `direccion`, `ciudad`, `departamento` (text)
- `regimen_tributario` (text)
- `responsabilidades_fiscales` (jsonb, array de códigos RUT)
- `persona` (text: natural | juridica)
- `created_at`, `updated_at` (timestamptz)

## 4. Tabla: productos
Catálogo de productos/servicios de cada empresa.
- `id` (uuid, PK)
- `empresa_id` (uuid, FK a empresas)
- `codigo`, `nombre` (text)
- `precio_unitario` (numeric(15,2))
- `unidad_medida` (text, código DIAN)
- `iva` (numeric(5,2), porcentaje de IVA)
- `aplica_rete_fuente`, `aplica_rete_ica`, `aplica_rete_iva` (boolean)
- `stock`, `stock_minimo` (integer, nullable)
- `activo` (boolean, default true)
- `created_at`, `updated_at` (timestamptz)

## 5. Tabla: resoluciones
Resoluciones DIAN de numeración por empresa.
- `id` (uuid, PK)
- `empresa_id` (uuid, FK a empresas)
- `numero_resolucion`, `tipo_documento`, `prefijo` (text)
- `rango_desde`, `rango_hasta`, `consecutivo_actual` (integer)
- `fecha_vigencia_desde`, `fecha_vigencia_hasta` (date)
- `activa` (boolean, default true)
- `created_at`, `updated_at` (timestamptz)

## 6. Seguridad (RLS)
- RLS habilitado en TODAS las tablas.
- Políticas por CRUD (SELECT, INSERT, UPDATE, DELETE) separadas.
- Scope: `TO authenticated` con verificación de propiedad vía
  `usuarios.empresa_id = auth.uid()`.
- Función helper `empresa_del_usuario()` devuelve el empresa_id del usuario actual.

## 7. Índices
- `usuarios` por `empresa_id` y `email`.
- `clientes` por `empresa_id` e `identificacion`.
- `productos` por `empresa_id` y `codigo`.
- `resoluciones` por `empresa_id`.
*/

-- ============================================================================
-- Tabla: empresas
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.empresas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nit text UNIQUE NOT NULL,
  dv text,
  razon_social text NOT NULL,
  nombre_comercial text,
  regimen_tributario text NOT NULL DEFAULT 'responsable_iva',
  responsabilidades_fiscales jsonb DEFAULT '[]'::jsonb,
  codigo_ciiu text,
  direccion text,
  ciudad text,
  departamento text,
  codigo_postal text,
  telefono text,
  email text,
  logo_url text,
  ambiente text NOT NULL DEFAULT 'habilitacion',
  certificado_digital_cargado boolean NOT NULL DEFAULT false,
  fecha_vencimiento_certificado date,
  moneda_local text NOT NULL DEFAULT 'COP',
  cuenta_contable_ventas text,
  retenedor boolean DEFAULT false,
  gran_contribuyente boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Tabla: usuarios (perfiles que extienden auth.users)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.usuarios (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  email text NOT NULL,
  rol text NOT NULL DEFAULT 'cajero',
  pin text,
  estado text NOT NULL DEFAULT 'pendiente',
  ultimo_acceso timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_usuarios_empresa ON public.usuarios(empresa_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON public.usuarios(email);

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Tabla: clientes
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  tipo_identificacion text NOT NULL,
  identificacion text NOT NULL,
  dv text,
  razon_social text NOT NULL,
  nombre_comercial text,
  email text,
  telefono text,
  direccion text,
  ciudad text,
  departamento text,
  codigo_postal text,
  regimen_tributario text NOT NULL DEFAULT 'responsable_iva',
  responsabilidades_fiscales jsonb DEFAULT '[]'::jsonb,
  codigo_ciiu text,
  persona text NOT NULL DEFAULT 'juridica',
  regimen_simple boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clientes_empresa ON public.clientes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_clientes_identificacion ON public.clientes(empresa_id, identificacion);

ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Tabla: productos
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.productos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  codigo text NOT NULL,
  codigo_unspsc text,
  nombre text NOT NULL,
  descripcion text,
  tipo_item text NOT NULL DEFAULT 'bien',
  precio_unitario numeric(15,2) NOT NULL DEFAULT 0,
  unidad_medida text NOT NULL DEFAULT 'UND',
  iva numeric(5,2) NOT NULL DEFAULT 0,
  inc numeric(5,2),
  aplica_rete_fuente boolean DEFAULT false,
  aplica_rete_ica boolean DEFAULT false,
  aplica_rete_iva boolean DEFAULT false,
  tasa_rete_fuente numeric(5,2),
  tasa_rete_ica numeric(5,2),
  tasa_rete_iva numeric(5,2),
  stock integer,
  stock_minimo integer,
  costo_unitario numeric(15,2),
  cuenta_contable text,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_productos_empresa ON public.productos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_productos_codigo ON public.productos(empresa_id, codigo);

ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Tabla: resoluciones
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.resoluciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  numero_resolucion text NOT NULL,
  tipo_documento text NOT NULL DEFAULT 'factura_venta',
  prefijo text NOT NULL,
  rango_desde integer NOT NULL,
  rango_hasta integer NOT NULL,
  consecutivo_actual integer NOT NULL,
  fecha_vigencia_desde date NOT NULL,
  fecha_vigencia_hasta date NOT NULL,
  activa boolean NOT NULL DEFAULT true,
  clave_tecnica text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_resoluciones_empresa ON public.resoluciones(empresa_id);

ALTER TABLE public.resoluciones ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Helper function: empresa_id del usuario autenticado
-- ============================================================================
CREATE OR REPLACE FUNCTION public.empresa_del_usuario()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT empresa_id FROM public.usuarios WHERE id = auth.uid();
$$;

-- ============================================================================
-- Políticas RLS — empresas
-- ============================================================================
DROP POLICY IF EXISTS "select_own_empresa" ON public.empresas;
CREATE POLICY "select_own_empresa" ON public.empresas
  FOR SELECT TO authenticated
  USING (id = public.empresa_del_usuario());

DROP POLICY IF EXISTS "update_own_empresa" ON public.empresas;
CREATE POLICY "update_own_empresa" ON public.empresas
  FOR UPDATE TO authenticated
  USING (id = public.empresa_del_usuario())
  WITH CHECK (id = public.empresa_del_usuario());

-- ============================================================================
-- Políticas RLS — usuarios
-- ============================================================================
DROP POLICY IF EXISTS "select_usuarios_empresa" ON public.usuarios;
CREATE POLICY "select_usuarios_empresa" ON public.usuarios
  FOR SELECT TO authenticated
  USING (empresa_id = public.empresa_del_usuario());

DROP POLICY IF EXISTS "insert_usuarios_empresa" ON public.usuarios;
CREATE POLICY "insert_usuarios_empresa" ON public.usuarios
  FOR INSERT TO authenticated
  WITH CHECK (empresa_id = public.empresa_del_usuario());

DROP POLICY IF EXISTS "update_usuarios_empresa" ON public.usuarios;
CREATE POLICY "update_usuarios_empresa" ON public.usuarios
  FOR UPDATE TO authenticated
  USING (empresa_id = public.empresa_del_usuario())
  WITH CHECK (empresa_id = public.empresa_del_usuario());

DROP POLICY IF EXISTS "delete_usuarios_empresa" ON public.usuarios;
CREATE POLICY "delete_usuarios_empresa" ON public.usuarios
  FOR DELETE TO authenticated
  USING (empresa_id = public.empresa_del_usuario());

-- ============================================================================
-- Políticas RLS — clientes
-- ============================================================================
DROP POLICY IF EXISTS "select_clientes_empresa" ON public.clientes;
CREATE POLICY "select_clientes_empresa" ON public.clientes
  FOR SELECT TO authenticated
  USING (empresa_id = public.empresa_del_usuario());

DROP POLICY IF EXISTS "insert_clientes_empresa" ON public.clientes;
CREATE POLICY "insert_clientes_empresa" ON public.clientes
  FOR INSERT TO authenticated
  WITH CHECK (empresa_id = public.empresa_del_usuario());

DROP POLICY IF EXISTS "update_clientes_empresa" ON public.clientes;
CREATE POLICY "update_clientes_empresa" ON public.clientes
  FOR UPDATE TO authenticated
  USING (empresa_id = public.empresa_del_usuario())
  WITH CHECK (empresa_id = public.empresa_del_usuario());

DROP POLICY IF EXISTS "delete_clientes_empresa" ON public.clientes;
CREATE POLICY "delete_clientes_empresa" ON public.clientes
  FOR DELETE TO authenticated
  USING (empresa_id = public.empresa_del_usuario());

-- ============================================================================
-- Políticas RLS — productos
-- ============================================================================
DROP POLICY IF EXISTS "select_productos_empresa" ON public.productos;
CREATE POLICY "select_productos_empresa" ON public.productos
  FOR SELECT TO authenticated
  USING (empresa_id = public.empresa_del_usuario());

DROP POLICY IF EXISTS "insert_productos_empresa" ON public.productos;
CREATE POLICY "insert_productos_empresa" ON public.productos
  FOR INSERT TO authenticated
  WITH CHECK (empresa_id = public.empresa_del_usuario());

DROP POLICY IF EXISTS "update_productos_empresa" ON public.productos;
CREATE POLICY "update_productos_empresa" ON public.productos
  FOR UPDATE TO authenticated
  USING (empresa_id = public.empresa_del_usuario())
  WITH CHECK (empresa_id = public.empresa_del_usuario());

DROP POLICY IF EXISTS "delete_productos_empresa" ON public.productos;
CREATE POLICY "delete_productos_empresa" ON public.productos
  FOR DELETE TO authenticated
  USING (empresa_id = public.empresa_del_usuario());

-- ============================================================================
-- Políticas RLS — resoluciones
-- ============================================================================
DROP POLICY IF EXISTS "select_resoluciones_empresa" ON public.resoluciones;
CREATE POLICY "select_resoluciones_empresa" ON public.resoluciones
  FOR SELECT TO authenticated
  USING (empresa_id = public.empresa_del_usuario());

DROP POLICY IF EXISTS "insert_resoluciones_empresa" ON public.resoluciones;
CREATE POLICY "insert_resoluciones_empresa" ON public.resoluciones
  FOR INSERT TO authenticated
  WITH CHECK (empresa_id = public.empresa_del_usuario());

DROP POLICY IF EXISTS "update_resoluciones_empresa" ON public.resoluciones;
CREATE POLICY "update_resoluciones_empresa" ON public.resoluciones
  FOR UPDATE TO authenticated
  USING (empresa_id = public.empresa_del_usuario())
  WITH CHECK (empresa_id = public.empresa_del_usuario());

DROP POLICY IF EXISTS "delete_resoluciones_empresa" ON public.resoluciones;
CREATE POLICY "delete_resoluciones_empresa" ON public.resoluciones
  FOR DELETE TO authenticated
  USING (empresa_id = public.empresa_del_usuario());

-- ============================================================================
-- Trigger: updated_at automático
-- ============================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_empresas_updated ON public.empresas;
CREATE TRIGGER trg_empresas_updated BEFORE UPDATE ON public.empresas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_usuarios_updated ON public.usuarios;
CREATE TRIGGER trg_usuarios_updated BEFORE UPDATE ON public.usuarios
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_clientes_updated ON public.clientes;
CREATE TRIGGER trg_clientes_updated BEFORE UPDATE ON public.clientes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_productos_updated ON public.productos;
CREATE TRIGGER trg_productos_updated BEFORE UPDATE ON public.productos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_resoluciones_updated ON public.resoluciones;
CREATE TRIGGER trg_resoluciones_updated BEFORE UPDATE ON public.resoluciones
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
