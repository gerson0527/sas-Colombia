-- Archivo: seed.sql
-- Ejecutar vía: npx supabase db query -f seed.sql --db-url "postgresql://postgres:cOTgr7XwfjhJQ2CM@db.lrcjiuprwecmxbesyxke.supabase.co:5432/postgres"

DO $$
DECLARE
  v_user_id uuid := gen_random_uuid();
  v_empresa_id uuid;
  v_plan_id uuid;
BEGIN
  -- 1. Crear el usuario en auth.users
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, 
    recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, 
    created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
  ) VALUES (
    v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'demo@tienda.com', 
    crypt('Demo123456!', gen_salt('bf')), now(), now(), now(), 
    '{"provider":"email","providers":["email"]}', '{"name":"Admin Demo"}', 
    now(), now(), '', '', '', ''
  );

  INSERT INTO auth.identities (
    id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), v_user_id, v_user_id::text, format('{"sub":"%s","email":"%s"}', v_user_id::text, 'demo@tienda.com')::jsonb, 'email', now(), now(), now()
  );

  -- 2. Crear empresa
  INSERT INTO public.empresas (nit, razon_social)
  VALUES ('900999999', 'Tienda Demo S.A.S')
  RETURNING id INTO v_empresa_id;

  -- 3. Asignar usuario a empresa (usuarios)
  INSERT INTO public.usuarios (id, empresa_id, nombre, email, rol, estado)
  VALUES (v_user_id, v_empresa_id, 'Admin Demo', 'demo@tienda.com', 'admin', 'activo');

  -- 4. Asignar plan trial
  SELECT id INTO v_plan_id FROM public.planes_saas LIMIT 1;
  IF v_plan_id IS NOT NULL THEN
    INSERT INTO public.suscripciones_empresas (empresa_id, plan_id, estado, fecha_fin)
    VALUES (v_empresa_id, v_plan_id, 'trial', now() + interval '14 days');
  END IF;

  -- 5. Crear proveedores
  INSERT INTO public.proveedores (empresa_id, tipo_identificacion, identificacion, razon_social, email, telefono, direccion, ciudad) VALUES
  (v_empresa_id, 'NIT', '800111111', 'Distribuidora Mayorista S.A.', 'ventas@mayorista.com', '3001111111', 'Calle 1', 'Bogotá'),
  (v_empresa_id, 'NIT', '800222222', 'Importaciones Tech SAS', 'contacto@importech.com', '3102222222', 'Carrera 15', 'Medellín');

  -- 6. Crear productos (bienes y servicios) y luego inventario
  WITH inserted_productos AS (
    INSERT INTO public.productos (empresa_id, codigo, nombre, descripcion, precio_unitario, costo_unitario, tipo_item, unidad_medida, iva, activo)
    VALUES
    (v_empresa_id, 'TEC-001', 'Smartphone XYZ 128GB', 'Teléfono móvil inteligente', 1200000, 900000, 'bien', 'UND', 19, true),
    (v_empresa_id, 'TEC-002', 'Monitor 24 pulgadas LED', 'Monitor de oficina', 650000, 480000, 'bien', 'UND', 19, true),
    (v_empresa_id, 'SRV-001', 'Mantenimiento Preventivo', 'Servicio técnico de PC', 150000, 0, 'servicio', 'SER', 19, true)
    RETURNING id, tipo_item
  )
  INSERT INTO public.inventario_items (empresa_id, producto_id, stock_actual, stock_minimo, stock_maximo)
  SELECT v_empresa_id, id, 50, 10, 100
  FROM inserted_productos
  WHERE tipo_item = 'bien';

END $$;
