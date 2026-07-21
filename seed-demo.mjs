import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lrcjiuprwecmxbesyxke.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyY2ppdXByd2VjbXhiZXN5eGtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzOTkxNDAsImV4cCI6MjA5OTk3NTE0MH0.WA35kEJL_7ZoFPsRdnr7O90cDjLqMirsUfAWQpg-5hE';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function seed() {
  console.log('Iniciando creación de usuario demo...');
  const email = `demo@tienda.com`;
  const password = 'Demo123456!';

  // 1. Crear usuario
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name: 'Admin Demo' }
    }
  });

  if (authError) {
    console.error('Error creando auth user:', authError);
    return;
  }

  console.log('Usuario creado:', email);

  // 2. Ejecutar RPC para crear empresa
  const { data: empresaId, error: rpcError } = await supabase.rpc('crear_cuenta_empresa', {
    p_razon_social: 'Empresa Demo S.A.S',
    p_identificacion: '900123456',
    p_nombre_usuario: 'Admin Demo'
  });

  if (rpcError) {
    console.error('Error ejecutando RPC:', rpcError);
    return;
  }

  console.log('Empresa creada con ID:', empresaId);

  // 3. Crear Proveedores
  console.log('Creando proveedores...');
  const { data: proveedores, error: provError } = await supabase.from('proveedores').insert([
    {
      empresa_id: empresaId,
      tipo_identificacion: 'NIT',
      identificacion: '800123456',
      razon_social: 'Distribuidora Central S.A.',
      email: 'ventas@districentral.com',
      telefono: '3001234567',
      direccion: 'Calle 100 # 15-20',
      ciudad: 'Bogotá'
    },
    {
      empresa_id: empresaId,
      tipo_identificacion: 'NIT',
      identificacion: '900987654',
      razon_social: 'Tecnología y Más Ltda.',
      email: 'contacto@tecnomas.co',
      telefono: '3109876543',
      direccion: 'Carrera 15 # 80-11',
      ciudad: 'Medellín'
    }
  ]).select();

  if (provError) console.error('Error insertando proveedores:', provError);

  // 4. Crear Productos
  console.log('Creando productos...');
  const { data: productos, error: prodError } = await supabase.from('productos').insert([
    {
      empresa_id: empresaId,
      codigo: 'PROD-001',
      nombre: 'Computador Portátil Core i7',
      descripcion: 'Portátil de alto rendimiento',
      precio_venta: 2500000,
      costo: 1800000,
      tipo_producto: 'bien',
      unidad_medida: 'UND',
      tributos: ['01'],
      estado: 'activo'
    },
    {
      empresa_id: empresaId,
      codigo: 'PROD-002',
      nombre: 'Mouse Inalámbrico',
      descripcion: 'Mouse ergonómico Bluetooth',
      precio_venta: 85000,
      costo: 45000,
      tipo_producto: 'bien',
      unidad_medida: 'UND',
      tributos: ['01'],
      estado: 'activo'
    },
    {
      empresa_id: empresaId,
      codigo: 'SERV-001',
      nombre: 'Mantenimiento Preventivo',
      descripcion: 'Mantenimiento general de equipos',
      precio_venta: 150000,
      costo: 0,
      tipo_producto: 'servicio',
      unidad_medida: 'SER',
      tributos: ['01'],
      estado: 'activo'
    }
  ]).select();

  if (prodError) console.error('Error insertando productos:', prodError);

  // 5. Crear Inventario (solo para bienes)
  console.log('Creando inventario...');
  if (productos && productos.length > 0) {
    const bienes = productos.filter(p => p.tipo_producto === 'bien');
    const inventarioData = bienes.map(b => ({
      empresa_id: empresaId,
      producto_id: b.id,
      cantidad_actual: 50,
      cantidad_minima: 5,
      cantidad_maxima: 100
    }));

    const { error: invError } = await supabase.from('inventario_items').insert(inventarioData);
    if (invError) console.error('Error insertando inventario:', invError);
  }

  console.log('====================================');
  console.log('✅ DEMO CREADA EXITOSAMENTE');
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log('====================================');
}

seed();
