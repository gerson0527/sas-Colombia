import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function test() {
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: 'demo@tienda.com',
    password: 'Demo123456!'
  });
  if (authError) {
    console.error('Auth error:', authError);
    return;
  }
  
  const insertRow = {
    tipo_identificacion: "CC",
    identificacion: "999999",
    dv: null,
    razon_social: "Browser Simulation",
    nombre_comercial: null,
    email: null,
    telefono: null,
    direccion: null,
    ciudad: null,
    departamento: null,
    codigo_postal: null,
    regimen_tributario: "responsable_iva",
    responsabilidades_fiscales: [],
    codigo_ciiu: null,
    persona: "juridica",
    regimen_simple: false
  };
  
  console.log('Inserting with exact fields:', Object.keys(insertRow));
  
  const { data, error } = await supabase
    .from('clientes')
    .insert(insertRow)
    .select()
    .single();
    
  if (error) {
    console.error('Insert error:', error);
  } else {
    console.log('Inserted:', data);
  }
}

test();
