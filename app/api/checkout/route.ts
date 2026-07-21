import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';

// MercadoPago Access Token from Environment Variable
const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN || 'TEST-0000' });

export async function POST(req: Request) {
  try {
    const { planId, planName, price, empresaId } = await req.json();

    if (!empresaId) {
      return NextResponse.json({ error: 'Falta empresaId' }, { status: 400 });
    }

    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: [
          {
            id: planId,
            title: `Suscripción SaaS: ${planName}`,
            quantity: 1,
            unit_price: Number(price),
            currency_id: 'COP',
          }
        ],
        // Metadatos para identificar a qué empresa asignarle el pago en el webhook
        metadata: {
          empresa_id: empresaId,
          plan_id: planId
        },
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/settings/billing?status=success`,
          failure: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/settings/billing?status=failure`,
          pending: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/settings/billing?status=pending`
        },
        auto_return: 'approved',
      }
    });

    return NextResponse.json({ init_point: result.init_point });
  } catch (error: any) {
    console.error('Error creating MP preference:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
