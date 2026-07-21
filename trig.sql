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
    EXECUTE format('
      DROP TRIGGER IF EXISTS trg_set_empresa_id_%I ON public.%I;
      CREATE TRIGGER trg_set_empresa_id_%I
      BEFORE INSERT ON public.%I
      FOR EACH ROW
      EXECUTE FUNCTION public.set_empresa_id();
    ', t, t, t, t);
  END LOOP;
END $$;
