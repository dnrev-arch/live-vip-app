import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

interface KirvanoWebhook {
  event: string;
  data: {
    transaction_id: string;
    customer_email: string;
    customer_name: string;
    product_id: string;
    plan_type: 'weekly' | 'monthly' | 'lifetime';
    amount: number;
    status: 'paid' | 'pending' | 'cancelled';
    expires_at?: string;
  };
}

interface UserAccess {
  email: string;
  name: string;
  plan_type: string;
  expires_at: string | null;
  transaction_id: string;
  created_at: string;
}

// Função para validar assinatura do webhook
function validateWebhookSignature(body: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}

// Função para salvar acesso do usuário
async function saveUserAccess(userData: UserAccess) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const response = await fetch(`${apiUrl}/api/user-access`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to save user access');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error saving user access:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-kirvano-signature');
    const secret = process.env.KIRVANO_WEBHOOK_SECRET;

    if (!secret) {
      console.error('KIRVANO_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    if (!signature) {
      console.error('Missing webhook signature');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    // Validar assinatura do webhook
    if (!validateWebhookSignature(body, signature, secret)) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const webhookData: KirvanoWebhook = JSON.parse(body);
    console.log('Webhook received:', webhookData);

    // Processar apenas eventos de pagamento confirmado
    if (webhookData.event === 'payment.confirmed' && webhookData.data.status === 'paid') {
      const { data } = webhookData;
      
      // Calcular data de expiração baseada no plano
      let expiresAt: string | null = null;
      if (data.plan_type === 'weekly') {
        const expDate = new Date();
        expDate.setDate(expDate.getDate() + 7);
        expiresAt = expDate.toISOString();
      } else if (data.plan_type === 'monthly') {
        const expDate = new Date();
        expDate.setMonth(expDate.getMonth() + 1);
        expiresAt = expDate.toISOString();
      }
      // lifetime não tem expiração (null)

      const userData: UserAccess = {
        email: data.customer_email,
        name: data.customer_name,
        plan_type: data.plan_type,
        expires_at: expiresAt,
        transaction_id: data.transaction_id,
        created_at: new Date().toISOString(),
      };

      // Salvar no banco de dados
      await saveUserAccess(userData);

      console.log(`Access granted for ${data.customer_email} - Plan: ${data.plan_type}`);
      
      return NextResponse.json({
        success: true,
        message: 'Payment processed successfully',
        user: {
          email: data.customer_email,
          plan: data.plan_type,
          expires_at: expiresAt,
        },
      });
    }

    // Outros eventos (pending, cancelled, etc.)
    console.log(`Webhook event ${webhookData.event} processed but no action taken`);
    
    return NextResponse.json({
      success: true,
      message: 'Webhook received',
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
