DO $$
DECLARE
  table_names text[] := ARRAY[
    'usuarios', 'clientes', 'productos', 'resoluciones', 
    'documentos_electronicos', 'proveedores', 'cajas', 
    'movimientos_caja', 'inventario_items', 'productos_facturacion', 
    'movimientos_inventario', 'sesiones_caja', 'suscripciones_empresas'
  ];
  t text;
BEGIN
  FOREACH t IN ARRAY table_names
  LOOP
    EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY;', t);
  END LOOP;
END $$;
