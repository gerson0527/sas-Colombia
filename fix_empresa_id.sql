DO $$
DECLARE
  table_names text[] := ARRAY[
    'usuarios', 'clientes', 'productos', 'resoluciones', 
    'documentos_electronicos', 'proveedores', 'cajas', 
    'movimientos_caja', 'inventario_items', 'productos_facturacion', 
    'movimientos_inventario', 'sesiones_caja'
  ];
  t text;
BEGIN
  FOREACH t IN ARRAY table_names
  LOOP
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN empresa_id SET DEFAULT public.empresa_del_usuario();', t);
  END LOOP;
END $$;
