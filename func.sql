CREATE OR REPLACE FUNCTION public.set_empresa_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.empresa_id IS NULL THEN
    NEW.empresa_id := public.empresa_del_usuario();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
