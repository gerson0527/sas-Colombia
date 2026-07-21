import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lrcjiuprwecmxbesyxke.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyY2ppdXByd2VjbXhiZXN5eGtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzOTkxNDAsImV4cCI6MjA5OTk3NTE0MH0.WA35kEJL_7ZoFPsRdnr7O90cDjLqMirsUfAWQpg-5hE';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const ADJETIVOS = ['Premium', 'Pro', 'Básico', 'Avanzado', 'Económico', 'Industrial', 'Compacto', 'Ultra', 'Max', 'Lite'];
const NOMBRES = ['Teclado', 'Monitor', 'Cable', 'Cargador', 'Soporte', 'Adaptador', 'Funda', 'Maletín', 'Memoria', 'Disco Duro'];
const CATEGORIAS = ['bien', 'servicio'];

async function run() {
  console.log('Obteniendo empresa...');
  const { data: empresas, error: empError } = await supabase.from('empresas').select('id').limit(1);
  
  if (empError || !empresas || empresas.length === 0) {
    console.error('Error o no se encontraron empresas', empError);
    return;
  }
  
  const empresaId = empresas[0].id;
  console.log('Empresa ID:', empresaId);
  
  const productos = [];
  
  for (let i = 1; i <= 50; i++) {
    const nombre = `${NOMBRES[Math.floor(Math.random() * NOMBRES.length)]} ${ADJETIVOS[Math.floor(Math.random() * ADJETIVOS.length)]} ${i}`;
    const tipo = CATEGORIAS[Math.floor(Math.random() * CATEGORIAS.length)];
    const precio = Math.floor(Math.random() * 50) * 5000 + 10000; // Entre 10k y 260k
    
    productos.push({
      empresa_id: empresaId,
      codigo: `GEN-${1000 + i}`,
      nombre: nombre,
      descripcion: `Descripción generada automáticamente para ${nombre}`,
      precio_venta: precio,
      costo: precio * 0.6, // 40% margen
      tipo_producto: tipo,
      unidad_medida: tipo === 'bien' ? 'UND' : 'SER',
      tributos: ['01'],
      estado: 'activo'
    });
  }

  console.log(`Insertando ${productos.length} productos...`);
  const { data, error } = await supabase.from('productos').insert(productos).select();
  
  if (error) {
    console.error('Error insertando productos:', error);
    return;
  }
  
  console.log(`✅ ${data.length} productos insertados exitosamente!`);
  
  // Agregar inventario para los bienes
  const bienes = data.filter(p => p.tipo_producto === 'bien');
  if (bienes.length > 0) {
    const inventarioData = bienes.map(b => ({
      empresa_id: empresaId,
      producto_id: b.id,
      cantidad_actual: Math.floor(Math.random() * 100) + 10,
      cantidad_minima: 5,
      cantidad_maxima: 200
    }));
    
    console.log(`Creando inventario para ${inventarioData.length} bienes...`);
    const { error: invError } = await supabase.from('inventario_items').insert(inventarioData);
    
    if (invError) {
      console.error('Error insertando inventario:', invError);
    } else {
      console.log('✅ Inventario creado exitosamente!');
    }
  }
}

run();
