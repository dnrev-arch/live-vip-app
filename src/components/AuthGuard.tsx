'use client';

import { useState, useEffect } from 'react';

interface AuthGuardProps {
  children: React.ReactNode;
}

interface UserAccess {
  hasAccess: boolean;
  planType?: string;
  expiresAt?: string | null;
  message?: string;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const [userAccess, setUserAccess] = useState<UserAccess | null>(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Verificar se já tem acesso salvo no localStorage
    const savedEmail = localStorage.getItem('user_email');
    const savedAccess = localStorage.getItem('user_access');
    
    if (savedEmail && savedAccess) {
      const accessData = JSON.parse(savedAccess);
      
      // Verificar se ainda é válido
      if (accessData.expiresAt) {
        const expirationDate = new Date(accessData.expiresAt);
        const now = new Date();
        
        if (now > expirationDate) {
          // Acesso expirado
          localStorage.removeItem('user_email');
          localStorage.removeItem('user_access');
          setUserAccess({
            hasAccess: false,
            message: 'Seu acesso expirou. Faça login novamente.',
          });
          return;
        }
      }
      
      setUserAccess(accessData);
      setEmail(savedEmail);
    }
  }, []);

  const handleCheckAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/check-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setUserAccess(data);
        
        if (data.hasAccess) {
          // Salvar acesso no localStorage
          localStorage.setItem('user_email', email);
          localStorage.setItem('user_access', JSON.stringify(data));
        }
      } else {
        setError(data.error || 'Erro ao verificar acesso');
      }
    } catch (err) {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = () => {
    const checkoutUrl = process.env.NEXT_PUBLIC_KIRVANO_CHECKOUT_URL;
    if (checkoutUrl) {
      window.open(checkoutUrl, '_blank');
    } else {
      alert('Link de compra não configurado. Entre em contato com o suporte.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_access');
    setUserAccess(null);
    setEmail('');
  };

  // Se ainda não verificou o acesso ou não tem acesso
  if (!userAccess || !userAccess.hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md border border-white/20">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">🔴 LiveVIP</h1>
            <p className="text-white/80">Acesso exclusivo para membros</p>
          </div>

          {userAccess && !userAccess.hasAccess ? (
            <div className="text-center">
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6">
                <p className="text-red-200 text-sm">{userAccess.message}</p>
              </div>
              
              <div className="space-y-4">
                <button
                  onClick={handlePurchase}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
                >
                  💳 Comprar Acesso
                </button>
                
                <button
                  onClick={() => setUserAccess(null)}
                  className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200"
                >
                  Tentar outro email
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCheckAccess} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-white/80 text-sm font-medium mb-2">
                  Email de compra
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="seu@email.com"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:scale-100"
              >
                {loading ? 'Verificando...' : 'Acessar Conteúdo'}
              </button>

              <div className="text-center pt-4">
                <p className="text-white/60 text-sm mb-4">Ainda não é membro?</p>
                <button
                  type="button"
                  onClick={handlePurchase}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
                >
                  💳 Comprar Agora
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  // Usuário tem acesso - mostrar conteúdo
  return (
    <>
      {/* Header de usuário logado */}
      <div className="bg-black/20 backdrop-blur border-b border-white/10 px-4 py-2">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-white/80 text-sm">
              {email} - {userAccess.planType?.toUpperCase()}
              {userAccess.expiresAt && (
                <span className="text-white/60 ml-2">
                  até {new Date(userAccess.expiresAt).toLocaleDateString('pt-BR')}
                </span>
              )}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="text-white/60 hover:text-white text-sm transition-colors"
          >
            Sair
          </button>
        </div>
      </div>
      
      {children}
    </>
  );
}
