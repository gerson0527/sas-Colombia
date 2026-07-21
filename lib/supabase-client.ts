'use client';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Cliente de Supabase autenticado.
// En producción, este cliente debe usarse SIEMPRE con un usuario
// autenticado (auth.uid()) para que las policies RLS funcionen.
// La anon key sola NUNCA debe poder leer datos (gracias a RLS).

function isConfigured(): boolean {
  return Boolean(supabaseUrl) && Boolean(supabaseAnonKey);
}

function createStubClient(): SupabaseClient {
  // Stub de solo-lectura: retorna arrays vacíos cuando no hay
  // credenciales o no estamos en el navegador.
  const emptyResult = { data: [], error: null, count: 0, status: 200, statusText: 'OK' };
  const emptySingle = { data: null, error: null };
  const okWrite = { data: null, error: null };

  const builder: any = {
    select: () => builder,
    insert: () => Promise.resolve(okWrite),
    update: () => Promise.resolve(okWrite),
    delete: () => Promise.resolve(okWrite),
    eq: () => builder,
    neq: () => builder,
    gt: () => builder,
    gte: () => builder,
    lt: () => builder,
    lte: () => builder,
    like: () => builder,
    ilike: () => builder,
    in: () => builder,
    order: () => builder,
    limit: () => builder,
    range: () => builder,
    single: () => Promise.resolve(emptySingle),
    maybeSingle: () => Promise.resolve(emptySingle),
    then: (resolve: any) => resolve(emptyResult),
  };

  const stub: any = {
    from: () => builder,
    rpc: () => Promise.resolve({ data: null, error: null }),
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signInWithPassword: () =>
        Promise.resolve({ data: { user: null, session: null }, error: new Error('Supabase no configurado') }),
      signUp: () =>
        Promise.resolve({ data: { user: null, session: null }, error: new Error('Supabase no configurado') }),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: null, error: null }),
        download: () => Promise.resolve({ data: null, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
      }),
    },
    channel: () => ({
      on: () => stub.channel(),
      subscribe: () => stub.channel(),
      unsubscribe: () => {},
    }),
    removeChannel: () => {},
  };
  return stub as SupabaseClient;
}

let cachedClient: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (cachedClient) return cachedClient;
  if (!isConfigured() || typeof window === 'undefined') {
    cachedClient = createStubClient();
    return cachedClient;
  }
  cachedClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'sas.supabase.auth',
    },
  });
  return cachedClient;
}

// Proxy que inicializa el cliente de forma perezosa (solo cuando se usa).
// Esto evita errores en SSR/build cuando Supabase no está disponible.
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const client = getSupabase();
    return Reflect.get(client, prop, receiver);
  },
});

export const isSupabaseConfigured = isConfigured;
