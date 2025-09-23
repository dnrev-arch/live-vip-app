import { NextRequest, NextResponse } from 'next/server';

interface UserAccessResponse {
  hasAccess: boolean;
  planType?: string;
  expiresAt?: string | null;
  message?: string;
}

async function checkUserAccessInAPI(email: string): Promise<UserAccessResponse> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const response = await fetch(`${apiUrl}/api/user-access/${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 404) {
      return {
        hasAccess: false,
        message: 'Usuário não encontrado. Faça sua compra para ter acesso.',
      };
    }

    if (!response.ok) {
      throw new Error('Failed to check user access');
    }

    const userData = await response.json();
    
    // Verificar se o acesso ainda é válido
    if (userData.expires_at) {
      const expirationDate = new Date(userData.expires_at);
      const now = new Date();
      
      if (now > expirationDate) {
        return {
          hasAccess: false,
          message: 'Seu acesso expirou. Renove sua assinatura para continuar.',
        };
      }
    }

    return {
      hasAccess: true,
      planType: userData.plan_type,
      expiresAt: userData.expires_at,
      message: 'Acesso liberado',
    };

  } catch (error) {
    console.error('Error checking user access:', error);
    return {
      hasAccess: false,
      message: 'Erro ao verificar acesso. Tente novamente.',
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      );
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Formato de email inválido' },
        { status: 400 }
      );
    }

    const accessInfo = await checkUserAccessInAPI(email);
    
    return NextResponse.json(accessInfo);

  } catch (error) {
    console.error('Check access error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Método não permitido. Use POST.' },
    { status: 405 }
  );
}
