import { NextRequest, NextResponse } from 'next/server';

interface KirvanoWebhookData {
  transaction_id: string;
  customer_email: string;
  customer_name: string;
  product_id: string;
  amount: number;
  status: string;
  product_name?: string;
}

interface KirvanoWebhook {
  event: string;
  data: KirvanoWebhookData;
}

// Mapeamento simples dos produtos
const PRODUCTS_MAP = {
  'e71dd7e7-c6b4-41a3-88ec-b0697b9a811e': 'weekly',
  '7a462b47-a28e-4498-a807-39653dea0d6d': 'monthly', 
  '89d11725-7f6c-4350-9422-27f683c16236': 'yearly'
};

function getPlanType(productId: string, productName: string): string {
  // Primeiro tenta pelo ID
  if (PRODUCTS_MAP[productId as keyof typeof PRODUCTS_MAP]) {
    return PRODUCTS_MAP[productId as keyof typeof PRODUCTS_MAP];
  }
  
  // Fallback pelo nome
  const name = productName?.toLowerCase() || '';
  if (name.includes('semana') || name.includes('week')) return 'weekly';
  if (name.includes('mes') || name.includes('month')) return 'monthly'; 
  if (name.includes('ano') || name.includes('year')) return 'yearly';
  
  return 'monthly'; // padrão
}

function calculateExpiration(planType: string): string | null {
  const now = new Date();
  
  switch (planType) {
    case 'weekly':
      now.setDate(now.getDate() + 7);
      return now.toISOString();
    case 'monthly':
      now.setMonth(now.getMonth() + 1);
      return now.toISOString();
    case 'yearly':
      now.setFullYear(now.getFullYear() + 1);
      return now.toISOString();
    default:
      return null; // vitalício
  }
}

async function saveUserAccess(email: string, name: string, planType: string, expiresAt: string | null, transactionId: string) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      console.error('API URL not configured');
      return false;
    }

    const userData = {
      email: email.toLowerCase(),
      name,
      plan_type: planType,
      expires_at: expiresAt,
      transaction_id: transactionId,
      created_at: new Date().toISOString()
    };

    const response = await fetch(`${apiUrl}/api/user-access`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    return response.ok;
  } catch (error) {
    console.error('Error saving user access:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    console.log('Webhook received:', body);

    let webhookData: KirvanoWebhook;
    
    try {
      webhookData = JSON.parse(body);
    } catch (parseError) {
      console.error('Invalid JSON:', parseError);
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    // Processar pagamento confirmado
    if (webhookData.event === 'payment.confirmed' || webhookData.data?.status === 'paid') {
      const { data } = webhookData;
      
      if (!data.customer_email || !data.transaction_id) {
        console.error('Missing required fields');
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }

      const planType = getPlanType(data.product_id, data.product_name || '');
      const expiresAt = calculateExpiration(planType);
      
      const success = await saveUserAccess(
        data.customer_email,
        data.customer_name || 'Cliente',
        planType,
        expiresAt,
        data.transaction_id
      );

      if (success) {
        console.log(`Access granted: ${data.customer_email} - ${planType}`);
        return NextResponse.json({
          success: true,
          message: 'Payment processed successfully',
          plan: planType,
          expires_at: expiresAt
        });
      } else {
        console.error('Failed to save user access');
        return NextResponse.json({ error: 'Failed to save user access' }, { status: 500 });
      }
    }

    // Outros eventos
    console.log(`Event ${webhookData.event} received but not processed`);
    return NextResponse.json({ success: true, message: 'Event received' });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed. Use POST.' }, { status: 405 });
}
