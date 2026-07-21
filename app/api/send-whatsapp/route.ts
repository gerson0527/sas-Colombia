import { NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function getEmpresaConfig() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/empresas?select=brevo_whatsapp_sender&limit=1`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
  if (!res.ok) return null;
  const rows = await res.json();
  return rows?.[0] || null;
}

export async function POST(req: Request) {
  try {
    const { to, text } = await req.json();

    if (!to) {
      return NextResponse.json({ error: 'Falta el número de destino' }, { status: 400 });
    }

    // La API key es fija (del proveedor del sistema)
    const apiKey = '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';

    // Leer configuración del cliente desde la base de datos
    const empresa = await getEmpresaConfig();
    const senderNumber = empresa?.brevo_whatsapp_sender || '573212880929';

    // Limpiar el '+' si viene con él
    const cleanTo = to.replace('+', '');

    const response = await fetch('https://api.brevo.com/v3/whatsapp/sendMessage', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        senderNumber: senderNumber,
        contactNumbers: [cleanTo],
        text: text || 'Hola, adjunto tu factura electrónica.',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error de Brevo WhatsApp:', errorData);
      return NextResponse.json({ error: 'Error al enviar por Brevo WhatsApp', details: errorData }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Mensaje de WhatsApp enviado correctamente' });
  } catch (error) {
    console.error('Error interno al enviar WhatsApp:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
