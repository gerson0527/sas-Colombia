-- ============================================================================
-- Archivo: saas_billing_and_rpc.sql
-- Propósito: Tablas de facturación SaaS (MercadoPago) y RPC de Onboarding
-- ============================================================================

-- 1. Tabla de Planes SaaS
CREATE TABLE IF NOT EXISTS public.planes_saas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  precio_mensual numeric(10,2) NOT NULL,
  limite_facturas int NOT NULL, -- -1 para ilimitado
  limite_cajas int NOT NULL,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.planes_saas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_planes_saas" ON public.planes_saas FOR SELECT TO authenticated USING (true);
CREATE POLICY "select_planes_saas_anon" ON public.planes_saas FOR SELECT TO anon USING (true);


-- 2. Tabla de Suscripciones (Tenant)
CREATE TABLE IF NOT EXISTS public.suscripciones_empresas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.planes_saas(id),
  estado text NOT NULL CHECK (estado IN ('trial', 'activa', 'past_due', 'cancelada')),
  mercadopago_subscription_id text,
  fecha_inicio timestamptz NOT NULL DEFAULT now(),
  fecha_fin timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(empresa_id)
);
ALTER TABLE public.suscripciones_empresas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_suscripcion_empresa" ON public.suscripciones_empresas FOR SELECT TO authenticated 
USING (empresa_id IN (SELECT e.empresa_id FROM public.usuarios e WHERE e.id = auth.uid()));


-- 3. Stored Procedure (RPC) para Registro (Onboarding)
-- Permite que un usuario recién registrado (auth.users) cree su empresa y se vincule como admin.
CREATE OR REPLACE FUNCTION public.crear_cuenta_empresa(
  p_razon_social text,
  p_identificacion text,
  p_nombre_usuario text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER -- Se ejecuta con permisos de bypass RLS
SET search_path = public
AS $$
DECLARE
  v_empresa_id uuid;
  v_plan_id uuid;
BEGIN
  -- Validar que el usuario auth existe y está llamando a la función
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  -- Insertar la nueva empresa
  INSERT INTO public.empresas (nit, razon_social)
  VALUES (p_identificacion, p_razon_social)
  RETURNING id INTO v_empresa_id;

  -- Insertar al usuario actual como Administrador de la empresa
  INSERT INTO public.usuarios (id, empresa_id, nombre, email, rol, estado)
  VALUES (
    auth.uid(), 
    v_empresa_id, 
    p_nombre_usuario, 
    (SELECT email FROM auth.users WHERE id = auth.uid()),
    'admin', 
    'activo'
  );

  -- Asignar el plan por defecto (Trial)
  -- Buscamos un plan gratuito o el primero disponible, si no creamos uno temporal
  SELECT id INTO v_plan_id FROM public.planes_saas LIMIT 1;
  IF v_plan_id IS NOT NULL THEN
    INSERT INTO public.suscripciones_empresas (empresa_id, plan_id, estado, fecha_fin)
    VALUES (v_empresa_id, v_plan_id, 'trial', now() + interval '14 days');
  END IF;

  RETURN v_empresa_id;
END;
$$;
