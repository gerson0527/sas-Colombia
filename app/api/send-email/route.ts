import { NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function getEmpresaConfig() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/empresas?select=brevo_email_sender,razon_social&limit=1`, {
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
    const { to, subject, htmlContent } = await req.json();

    if (!to) {
      return NextResponse.json({ error: 'Falta el correo de destino' }, { status: 400 });
    }

    // La API key es fija (del proveedor del sistema)
    const apiKey = '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';

    // Leer configuración del cliente desde la base de datos
    const empresa = await getEmpresaConfig();

    const senderEmail = empresa?.brevo_email_sender || 'ventas@innovaandina.com';
    const senderName = empresa?.razon_social || 'INNOVA ANDINA S.A.S.';

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        sender: {
          name: senderName,
          email: senderEmail,
        },
        to: [{ email: to }],
        subject: subject || 'Factura Electrónica',
        htmlContent: htmlContent || '<p>Hola, adjunto encontrarás tu factura electrónica.</p>',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error de Brevo:', errorData);
      return NextResponse.json({ error: 'Error al enviar por Brevo', details: errorData }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Correo enviado correctamente' });
  } catch (error) {
    console.error('Error interno al enviar correo:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
