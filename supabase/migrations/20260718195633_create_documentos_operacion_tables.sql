/*
# Crear tablas de documentos electrónicos y operación (multi-tenant)

## Resumen
Crea las tablas para facturación electrónica y operación del POS:
documentos electrónicos, items de documento, proveedores, cajas, sesiones de caja,
movimientos de caja, inventario, movimientos de inventario y productos de facturación.
Todas con `empresa_id` y RLS con aislamiento por tenant.

## 1. Tabla: documentos_electronicos
Documentos electrónicos (facturas, notas crédito/débito, documentos soporte).
- `id` (uuid, PK)
- `empresa_id` (uuid, FK a empresas)
- `tipo_documento` (text: factura_venta | nota_credito | nota_debito | documento_soporte | nota_ajuste)
- `tipo_operacion` (text, código DIAN 01-49)
- `numero` (text, número del documento)
- `resolucion_id` (uuid, FK a resoluciones)
- `cliente_id` (uuid, FK a clientes)
- `forma_pago` (text: contado | credito)
- `medio_pago` (text: efectivo | tarjeta_credito | tarjeta_debito | transferencia | nequi | daviplata | bonos | canje | otros)
- `subtotal`, `total_iva`, `total_inc`, `total_retenciones`, `total_descuentos`, `total_cargos`, `total` (numeric(15,2))
- `estado_dian` (text: borrador | pendiente_envio | enviado | aceptado | rechazado | anulado)
- `cufe`, `cude` (text, nullable)
- `qr_code`, `url_xml`, `url_pdf` (text, nullable)
- `ambiente` (text: habilitacion | produccion)
- `motivo_rechazo` (text, nullable)
- `fecha_emision`, `fecha_vencimiento` (date)
- `moneda` (text, default COP)
- `observaciones` (text, nullable)
- `info_entrega` (jsonb, nullable)
- `documento_referencia` (jsonb, nullable)
- `allowances_charges` (jsonb, nullable)
- `cuotas` (jsonb, nullable)
- `created_at`, `updated_at` (timestamptz)

## 2. Tabla: items_documento
Líneas/items de cada documento electrónico.
- `id` (uuid, PK)
- `documento_id` (uuid, FK a documentos_electronicos ON DELETE CASCADE)
- `producto_id` (uuid, FK a productos)
- `descripcion` (text)
- `cantidad` (numeric(12,2))
- `precio_unitario` (numeric(15,2))
- `descuento` (numeric(15,2), nullable)
- `iva` (numeric(5,2))
- `subtotal` (numeric(15,2))
- `tributos` (jsonb, nullable)
- `unidad_medida` (text, nullable)
- `codigo_unspsc` (text, nullable)

## 3. Tabla: proveedores
Proveedores de cada empresa con campos fiscales DIAN.
- `id` (uuid, PK)
- `empresa_id` (uuid, FK a empresas)
- `tipo_identificacion`, `identificacion`, `dv`, `razon_social`, `nombre_comercial`
- `email`, `telefono`, `direccion`, `ciudad`, `departamento`
- `regimen_tributario`, `responsabilidades_fiscales` (jsonb)
- `codigo_ciiu`, `persona`
- `banco`, `tipo_cuenta`, `numero_cuenta` (text, nullable)
- `forma_pago_preferida` (text, nullable)
- `plazo_pago_dias` (integer, nullable)
- `activo` (boolean, default true)
- `created_at`, `updated_at` (timestamptz)

## 4. Tabla: cajas
Cajas registradoras de cada empresa.
- `id` (uuid, PK)
- `empresa_id` (uuid, FK a empresas)
- `nombre`, `sucursal` (text)
- `responsable_actual` (text, nullable)
- `activa` (boolean, default true)
- `saldo_base` (numeric(15,2), default 0)
- `created_at`, `updated_at` (timestamptz)

## 5. Tabla: sesiones_caja
Sesiones/turnos de caja (apertura/cierre).
- `id` (uuid, PK)
- `empresa_id` (uuid, FK a empresas)
- `caja_id` (uuid, FK a cajas)
- `usuario_id` (uuid, FK a usuarios)
- `usuario` (text, nombre del responsable)
- `fecha_apertura`, `fecha_cierre` (timestamptz)
- `saldo_inicial`, `ingresos`, `egresos`, `ventas`, `saldo_final` (numeric(15,2))
- `estado` (text: abierta | cerrada)
- `observaciones` (text, nullable)
- `created_at`, `updated_at` (timestamptz)

## 6. Tabla: movimientos_caja
Movimientos de efectivo dentro de una sesión de caja.
- `id` (uuid, PK)
- `empresa_id` (uuid, FK a empresas)
- `sesion_id` (uuid, FK a sesiones_caja ON DELETE CASCADE)
- `tipo` (text: ingreso | egreso | venta | pago | reembolso)
- `monto` (numeric(15,2))
- `concepto` (text)
- `medio_pago` (text, nullable)
- `documento_electronico_id` (uuid, FK a documentos_electronicos, nullable)
- `usuario` (text)
- `fecha` (timestamptz)

## 7. Tabla: inventario_items
Registro de inventario por producto.
- `id` (uuid, PK)
- `empresa_id` (uuid, FK a empresas)
- `producto_id` (uuid, FK a productos)
- `stock_actual`, `stock_minimo`, `stock_maximo` (integer)
- `ubicacion` (text, nullable)
- `costo_unitario` (numeric(15,2))
- `valorizado` (numeric(15,2))
- `ultimo_movimiento` (timestamptz)
- `created_at`, `updated_at` (timestamptz)

## 8. Tabla: movimientos_inventario
Historial de movimientos de inventario.
- `id` (uuid, PK)
- `empresa_id` (uuid, FK a empresas)
- `producto_id` (uuid, FK a productos)
- `tipo` (text: entrada | salida | ajuste | devolucion | transferencia)
- `cantidad` (integer)
- `stock_resultante` (integer)
- `motivo`, `referencia` (text, nullable)
- `proveedor_id` (uuid, FK a proveedores, nullable)
- `documento_electronico_id` (uuid, FK a documentos_electronicos, nullable)
- `usuario` (text)
- `fecha` (timestamptz)

## 9. Tabla: productos_facturacion
Configuración avanzada de productos para facturación DIAN.
- `id` (uuid, PK)
- `empresa_id` (uuid, FK a empresas)
- `producto_id` (uuid, FK a productos)
- `categoria` (text: servicios | bienes | combustibles | alimentos | tecnologia | papeleria | otros)
- `precio_con_impuestos` (numeric(15,2))
- `tributos` (jsonb)
- `codigo_estandar`, `codigo_unspsc` (text)
- `unidad_medida_dian` (text)
- `cuenta_contable_ventas`, `cuenta_contable_compras` (text)
- `requiere_exportacion`, `excluido_de_iva`, `bien_de_capital` (boolean)
- `activo` (boolean, default true)
- `created_at`, `updated_at` (timestamptz)

## 10. Seguridad (RLS)
- RLS habilitado en TODAS las tablas.
- Políticas CRUD separadas por tabla.
- Aislamiento por `empresa_id = empresa_del_usuario()`.
- `items_documento` se scopea vía `documentos_electronicos.empresa_id`.

## 11. Índices
- `documentos_electronicos` por `empresa_id`, `numero`, `estado_dian`.
- `items_documento` por `documento_id`.
- `proveedores` por `empresa_id`.
- `cajas` por `empresa_id`.
- `sesiones_caja` por `empresa_id`, `caja_id`, `estado`.
- `movimientos_caja` por `sesion_id`.
- `inventario_items` por `empresa_id`, `producto_id`.
- `movimientos_inventario` por `empresa_id`, `producto_id`.
- `productos_facturacion` por `empresa_id`, `producto_id`.
*/

-- ============================================================================
-- Tabla: documentos_electronicos
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.documentos_electronicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  tipo_documento text NOT NULL DEFAULT 'factura_venta',
  tipo_operacion text NOT NULL DEFAULT '01',
  numero text NOT NULL,
  resolucion_id uuid REFERENCES public.resoluciones(id) ON DELETE SET NULL,
  cliente_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL,
  forma_pago text NOT NULL DEFAULT 'contado',
  medio_pago text NOT NULL DEFAULT 'efectivo',
  subtotal numeric(15,2) NOT NULL DEFAULT 0,
  total_iva numeric(15,2) NOT NULL DEFAULT 0,
  total_inc numeric(15,2) NOT NULL DEFAULT 0,
  total_retenciones numeric(15,2) NOT NULL DEFAULT 0,
  total_descuentos numeric(15,2) NOT NULL DEFAULT 0,
  total_cargos numeric(15,2) NOT NULL DEFAULT 0,
  total numeric(15,2) NOT NULL DEFAULT 0,
  estado_dian text NOT NULL DEFAULT 'borrador',
  cufe text,
  cude text,
  qr_code text,
  url_xml text,
  url_pdf text,
  ambiente text NOT NULL DEFAULT 'habilitacion',
  motivo_rechazo text,
  fecha_emision date NOT NULL DEFAULT CURRENT_DATE,
  fecha_vencimiento date,
  moneda text NOT NULL DEFAULT 'COP',
  observaciones text,
  info_entrega jsonb,
  documento_referencia jsonb,
  allowances_charges jsonb,
  cuotas jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_docs_empresa ON public.documentos_electronicos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_docs_numero ON public.documentos_electronicos(empresa_id, numero);
CREATE INDEX IF NOT EXISTS idx_docs_estado ON public.documentos_electronicos(empresa_id, estado_dian);

ALTER TABLE public.documentos_electronicos ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Tabla: items_documento
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.items_documento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  documento_id uuid NOT NULL REFERENCES public.documentos_electronicos(id) ON DELETE CASCADE,
  producto_id uuid REFERENCES public.productos(id) ON DELETE SET NULL,
  descripcion text NOT NULL,
  cantidad numeric(12,2) NOT NULL DEFAULT 1,
  precio_unitario numeric(15,2) NOT NULL DEFAULT 0,
  descuento numeric(15,2),
  iva numeric(5,2) NOT NULL DEFAULT 0,
  subtotal numeric(15,2) NOT NULL DEFAULT 0,
  tributos jsonb,
  unidad_medida text,
  codigo_unspsc text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_items_documento ON public.items_documento(documento_id);

ALTER TABLE public.items_documento ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Tabla: proveedores
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.proveedores (
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
  regimen_tributario text NOT NULL DEFAULT 'responsable_iva',
  responsabilidades_fiscales jsonb DEFAULT '[]'::jsonb,
  codigo_ciiu text,
  persona text NOT NULL DEFAULT 'juridica',
  banco text,
  tipo_cuenta text,
  numero_cuenta text,
  forma_pago_preferida text,
  plazo_pago_dias integer,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_proveedores_empresa ON public.proveedores(empresa_id);

ALTER TABLE public.proveedores ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Tabla: cajas
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.cajas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  sucursal text NOT NULL,
  responsable_actual text,
  activa boolean NOT NULL DEFAULT true,
  saldo_base numeric(15,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cajas_empresa ON public.cajas(empresa_id);

ALTER TABLE public.cajas ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Tabla: sesiones_caja
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.sesiones_caja (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  caja_id uuid NOT NULL REFERENCES public.cajas(id) ON DELETE CASCADE,
  usuario_id uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
  usuario text NOT NULL,
  fecha_apertura timestamptz NOT NULL DEFAULT now(),
  fecha_cierre timestamptz,
  saldo_inicial numeric(15,2) NOT NULL DEFAULT 0,
  ingresos numeric(15,2) NOT NULL DEFAULT 0,
  egresos numeric(15,2) NOT NULL DEFAULT 0,
  ventas numeric(15,2) NOT NULL DEFAULT 0,
  saldo_final numeric(15,2) NOT NULL DEFAULT 0,
  estado text NOT NULL DEFAULT 'abierta',
  observaciones text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sesiones_empresa ON public.sesiones_caja(empresa_id);
CREATE INDEX IF NOT EXISTS idx_sesiones_caja ON public.sesiones_caja(caja_id);
CREATE INDEX IF NOT EXISTS idx_sesiones_estado ON public.sesiones_caja(empresa_id, estado);

ALTER TABLE public.sesiones_caja ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Tabla: movimientos_caja
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.movimientos_caja (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  sesion_id uuid NOT NULL REFERENCES public.sesiones_caja(id) ON DELETE CASCADE,
  tipo text NOT NULL,
  monto numeric(15,2) NOT NULL DEFAULT 0,
  concepto text NOT NULL,
  medio_pago text,
  documento_electronico_id uuid REFERENCES public.documentos_electronicos(id) ON DELETE SET NULL,
  usuario text NOT NULL,
  fecha timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mov_caja_sesion ON public.movimientos_caja(sesion_id);
CREATE INDEX IF NOT EXISTS idx_mov_caja_empresa ON public.movimientos_caja(empresa_id);

ALTER TABLE public.movimientos_caja ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Tabla: inventario_items
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.inventario_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  producto_id uuid NOT NULL REFERENCES public.productos(id) ON DELETE CASCADE,
  stock_actual integer NOT NULL DEFAULT 0,
  stock_minimo integer NOT NULL DEFAULT 0,
  stock_maximo integer NOT NULL DEFAULT 0,
  ubicacion text,
  costo_unitario numeric(15,2) NOT NULL DEFAULT 0,
  valorizado numeric(15,2) NOT NULL DEFAULT 0,
  ultimo_movimiento timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventario_empresa ON public.inventario_items(empresa_id);
CREATE INDEX IF NOT EXISTS idx_inventario_producto ON public.inventario_items(producto_id);

ALTER TABLE public.inventario_items ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Tabla: movimientos_inventario
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.movimientos_inventario (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  producto_id uuid NOT NULL REFERENCES public.productos(id) ON DELETE CASCADE,
  tipo text NOT NULL,
  cantidad integer NOT NULL,
  stock_resultante integer NOT NULL DEFAULT 0,
  motivo text,
  referencia text,
  proveedor_id uuid REFERENCES public.proveedores(id) ON DELETE SET NULL,
  documento_electronico_id uuid REFERENCES public.documentos_electronicos(id) ON DELETE SET NULL,
  usuario text NOT NULL,
  fecha timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mov_inv_empresa ON public.movimientos_inventario(empresa_id);
CREATE INDEX IF NOT EXISTS idx_mov_inv_producto ON public.movimientos_inventario(producto_id);

ALTER TABLE public.movimientos_inventario ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Tabla: productos_facturacion
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.productos_facturacion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  producto_id uuid NOT NULL REFERENCES public.productos(id) ON DELETE CASCADE,
  categoria text NOT NULL DEFAULT 'otros',
  precio_con_impuestos numeric(15,2) NOT NULL DEFAULT 0,
  tributos jsonb DEFAULT '[]'::jsonb,
  codigo_estandar text,
  codigo_unspsc text,
  unidad_medida_dian text,
  cuenta_contable_ventas text,
  cuenta_contable_compras text,
  requiere_exportacion boolean DEFAULT false,
  excluido_de_iva boolean DEFAULT false,
  bien_de_capital boolean DEFAULT false,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prod_fact_empresa ON public.productos_facturacion(empresa_id);
CREATE INDEX IF NOT EXISTS idx_prod_fact_producto ON public.productos_facturacion(producto_id);

ALTER TABLE public.productos_facturacion ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Políticas RLS — documentos_electronicos
-- ============================================================================
DROP POLICY IF EXISTS "select_docs_empresa" ON public.documentos_electronicos;
CREATE POLICY "select_docs_empresa" ON public.documentos_electronicos
  FOR SELECT TO authenticated
  USING (empresa_id = public.empresa_del_usuario());

DROP POLICY IF EXISTS "insert_docs_empresa" ON public.documentos_electronicos;
CREATE POLICY "insert_docs_empresa" ON public.documentos_electronicos
  FOR INSERT TO authenticated
  WITH CHECK (empresa_id = public.empresa_del_usuario());

DROP POLICY IF EXISTS "update_docs_empresa" ON public.documentos_electronicos;
CREATE POLICY "update_docs_empresa" ON public.documentos_electronicos
  FOR UPDATE TO authenticated
  USING (empresa_id = public.empresa_del_usuario())
  WITH CHECK (empresa_id = public.empresa_del_usuario());

DROP POLICY IF EXISTS "delete_docs_empresa" ON public.documentos_electronicos;
CREATE POLICY "delete_docs_empresa" ON public.documentos_electronicos
  FOR DELETE TO authenticated
  USING (empresa_id = public.empresa_del_usuario());

-- ============================================================================
-- Políticas RLS — items_documento (scope via documentos_electronicos)
-- ============================================================================
DROP POLICY IF EXISTS "select_items_doc_empresa" ON public.items_documento;
CREATE POLICY "select_items_doc_empresa" ON public.items_documento
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.documentos_electronicos d
    WHERE d.id = items_documento.documento_id
    AND d.empresa_id = public.empresa_del_usuario()
  ));

DROP POLICY IF EXISTS "insert_items_doc_empresa" ON public.items_documento;
CREATE POLICY "insert_items_doc_empresa" ON public.items_documento
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.documentos_electronicos d
    WHERE d.id = items_documento.documento_id
    AND d.empresa_id = public.empresa_del_usuario()
  ));

DROP POLICY IF EXISTS "update_items_doc_empresa" ON public.items_documento;
CREATE POLICY "update_items_doc_empresa" ON public.items_documento
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.documentos_electronicos d
    WHERE d.id = items_documento.documento_id
    AND d.empresa_id = public.empresa_del_usuario()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.documentos_electronicos d
    WHERE d.id = items_documento.documento_id
    AND d.empresa_id = public.empresa_del_usuario()
  ));

DROP POLICY IF EXISTS "delete_items_doc_empresa" ON public.items_documento;
CREATE POLICY "delete_items_doc_empresa" ON public.items_documento
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.documentos_electronicos d
    WHERE d.id = items_documento.documento_id
    AND d.empresa_id = public.empresa_del_usuario()
  ));

-- ============================================================================
-- Políticas RLS — proveedores
-- ============================================================================
DROP POLICY IF EXISTS "select_proveedores_empresa" ON public.proveedores;
CREATE POLICY "select_proveedores_empresa" ON public.proveedores
  FOR SELECT TO authenticated
  USING (empresa_id = public.empresa_del_usuario());

DROP POLICY IF EXISTS "insert_proveedores_empresa" ON public.proveedores;
CREATE POLICY "insert_proveedores_empresa" ON public.proveedores
  FOR INSERT TO authenticated
  WITH CHECK (empresa_id = public.empresa_del_usuario());

DROP POLICY IF EXISTS "update_proveedores_empresa" ON public.proveedores;
CREATE POLICY "update_proveedores_empresa" ON public.proveedores
  FOR UPDATE TO authenticated
  USING (empresa_id = public.empresa_del_usuario())
  WITH CHECK (empresa_id = public.empresa_del_usuario());

DROP POLICY IF EXISTS "delete_proveedores_empresa" ON public.proveedores;
CREATE POLICY "delete_proveedores_empresa" ON public.proveedores
  FOR DELETE TO authenticated
  USING (empresa_id = public.empresa_del_usuario());

-- ============================================================================
-- Políticas RLS — cajas
-- ============================================================================
DROP POLICY IF EXISTS "select_cajas_empresa" ON public.cajas;
CREATE POLICY "select_cajas_empresa" ON public.cajas
  FOR SELECT TO authenticated
  USING (empresa_id = public.empresa_del_usuario());

DROP POLICY IF EXISTS "insert_cajas_empresa" ON public.cajas;
CREATE POLICY "insert_cajas_empresa" ON public.cajas
  FOR INSERT TO authenticated
  WITH CHECK (empresa_id = public.empresa_del_usuario());

DROP POLICY IF EXISTS "update_cajas_empresa" ON public.cajas;
CREATE POLICY "update_cajas_empresa" ON public.cajas
  FOR UPDATE TO authenticated
  USING (empresa_id = public.empresa_del_usuario())
  WITH CHECK (empresa_id = public.empresa_del_usuario());

DROP POLICY IF EXISTS "delete_cajas_empresa" ON public.cajas;
CREATE POLICY "delete_cajas_empresa" ON public.cajas
  FOR DELETE TO authenticated
  USING (empresa_id = public.empresa_del_usuario());

-- ============================================================================
-- Políticas RLS — sesiones_caja
-- ============================================================================
DROP POLICY IF EXISTS "select_sesiones_empresa" ON public.sesiones_caja;
CREATE POLICY "select_sesiones_empresa" ON public.sesiones_caja
  FOR SELECT TO authenticated
  USING (empresa_id = public.empresa_del_usuario());

DROP POLICY IF EXISTS "insert_sesiones_empresa" ON public.sesiones_caja;
CREATE POLICY "insert_sesiones_empresa" ON public.sesiones_caja
  FOR INSERT TO authenticated
  WITH CHECK (empresa_id = public.empresa_del_usuario());

DROP POLICY IF EXISTS "update_sesiones_empresa" ON public.sesiones_caja;
CREATE POLICY "update_sesiones_empresa" ON public.sesiones_caja
  FOR UPDATE TO authenticated
  USING (empresa_id = public.empresa_del_usuario())
  WITH CHECK (empresa_id = public.empresa_del_usuario());

DROP POLICY IF EXISTS "delete_sesiones_empresa" ON public.sesiones_caja;
CREATE POLICY "delete_sesiones_empresa" ON public.sesiones_caja
  FOR DELETE TO authenticated
  USING (empresa_id = public.empresa_del_usuario());

-- ============================================================================
-- Políticas RLS — movimientos_caja
-- ============================================================================
DROP POLICY IF EXISTS "select_mov_caja_empresa" ON public.movimientos_caja;
CREATE POLICY "select_mov_caja_empresa" ON public.movimientos_caja
  FOR SELECT TO authenticated
  USING (empresa_id = public.empresa_del_usuario());

DROP POLICY IF EXISTS "insert_mov_caja_empresa" ON public.movimientos_caja;
CREATE POLICY "insert_mov_caja_empresa" ON public.movimientos_caja
  FOR INSERT TO authenticated
  WITH CHECK (empresa_id = public.empresa_del_usuario());

DROP POLICY IF EXISTS "update_mov_caja_empresa" ON public.movimientos_caja;
CREATE POLICY "update_mov_caja_empresa" ON public.movimientos_caja
  FOR UPDATE TO authenticated
  USING (empresa_id = public.empresa_del_usuario())
  WITH CHECK (empresa_id = public.empresa_del_usuario());

DROP POLICY IF EXISTS "delete_mov_caja_empresa" ON public.movimientos_caja;
CREATE POLICY "delete_mov_caja_empresa" ON public.movimientos_caja
  FOR DELETE TO authenticated
  USING (empresa_id = public.empresa_del_usuario());

-- ============================================================================
-- Políticas RLS — inventario_items
-- ============================================================================
DROP POLICY IF EXISTS "select_inventario_empresa" ON public.inventario_items;
CREATE POLICY "select_inventario_empresa" ON public.inventario_items
  FOR SELECT TO authenticated
  USING (empresa_id = public.empresa_del_usuario());

DROP POLICY IF EXISTS "insert_inventario_empresa" ON public.inventario_items;
CREATE POLICY "insert_inventario_empresa" ON public.inventario_items
  FOR INSERT TO authenticated
  WITH CHECK (empresa_id = public.empresa_del_usuario());

DROP POLICY IF EXISTS "update_inventario_empresa" ON public.inventario_items;
CREATE POLICY "update_inventario_empresa" ON public.inventario_items
  FOR UPDATE TO authenticated
  USING (empresa_id = public.empresa_del_usuario())
  WITH CHECK (empresa_id = public.empresa_del_usuario());

DROP POLICY IF EXISTS "delete_inventario_empresa" ON public.inventario_items;
CREATE POLICY "delete_inventario_empresa" ON public.inventario_items
  FOR DELETE TO authenticated
  USING (empresa_id = public.empresa_del_usuario());

-- ============================================================================
-- Políticas RLS — movimientos_inventario
-- ============================================================================
DROP POLICY IF EXISTS "select_mov_inv_empresa" ON public.movimientos_inventario;
CREATE POLICY "select_mov_inv_empresa" ON public.movimientos_inventario
  FOR SELECT TO authenticated
  USING (empresa_id = public.empresa_del_usuario());

DROP POLICY IF EXISTS "insert_mov_inv_empresa" ON public.movimientos_inventario;
CREATE POLICY "insert_mov_inv_empresa" ON public.movimientos_inventario
  FOR INSERT TO authenticated
  WITH CHECK (empresa_id = public.empresa_del_usuario());

DROP POLICY IF EXISTS "update_mov_inv_empresa" ON public.movimientos_inventario;
CREATE POLICY "update_mov_inv_empresa" ON public.movimientos_inventario
  FOR UPDATE TO authenticated
  USING (empresa_id = public.empresa_del_usuario())
  WITH CHECK (empresa_id = public.empresa_del_usuario());

DROP POLICY IF EXISTS "delete_mov_inv_empresa" ON public.movimientos_inventario;
CREATE POLICY "delete_mov_inv_empresa" ON public.movimientos_inventario
  FOR DELETE TO authenticated
  USING (empresa_id = public.empresa_del_usuario());

-- ============================================================================
-- Políticas RLS — productos_facturacion
-- ============================================================================
DROP POLICY IF EXISTS "select_prod_fact_empresa" ON public.productos_facturacion;
CREATE POLICY "select_prod_fact_empresa" ON public.productos_facturacion
  FOR SELECT TO authenticated
  USING (empresa_id = public.empresa_del_usuario());

DROP POLICY IF EXISTS "insert_prod_fact_empresa" ON public.productos_facturacion;
CREATE POLICY "insert_prod_fact_empresa" ON public.productos_facturacion
  FOR INSERT TO authenticated
  WITH CHECK (empresa_id = public.empresa_del_usuario());

DROP POLICY IF EXISTS "update_prod_fact_empresa" ON public.productos_facturacion;
CREATE POLICY "update_prod_fact_empresa" ON public.productos_facturacion
  FOR UPDATE TO authenticated
  USING (empresa_id = public.empresa_del_usuario())
  WITH CHECK (empresa_id = public.empresa_del_usuario());

DROP POLICY IF EXISTS "delete_prod_fact_empresa" ON public.productos_facturacion;
CREATE POLICY "delete_prod_fact_empresa" ON public.productos_facturacion
  FOR DELETE TO authenticated
  USING (empresa_id = public.empresa_del_usuario());

-- ============================================================================
-- Triggers: updated_at en tablas nuevas
-- ============================================================================
DROP TRIGGER IF EXISTS trg_docs_updated ON public.documentos_electronicos;
CREATE TRIGGER trg_docs_updated BEFORE UPDATE ON public.documentos_electronicos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_proveedores_updated ON public.proveedores;
CREATE TRIGGER trg_proveedores_updated BEFORE UPDATE ON public.proveedores
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_cajas_updated ON public.cajas;
CREATE TRIGGER trg_cajas_updated BEFORE UPDATE ON public.cajas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_sesiones_updated ON public.sesiones_caja;
CREATE TRIGGER trg_sesiones_updated BEFORE UPDATE ON public.sesiones_caja
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_inventario_updated ON public.inventario_items;
CREATE TRIGGER trg_inventario_updated BEFORE UPDATE ON public.inventario_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_prod_fact_updated ON public.productos_facturacion;
CREATE TRIGGER trg_prod_fact_updated BEFORE UPDATE ON public.productos_facturacion
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
