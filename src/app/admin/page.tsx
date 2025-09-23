'use client';

import { useState, useEffect } from 'react';

interface LiveStream {
  id: string;
  title: string;
  thumbnail: string;
  video_url: string;
  viewer_count: number;
  is_live: boolean;
  streamer_name: string;
  streamer_avatar: string;
  category: string;
  created_at: string;
  updated_at: string;
}

const SUGGESTED_AVATARS = [
  'https://i.pravatar.cc/150?img=1',
  'https://i.pravatar.cc/150?img=2',
  'https://i.pravatar.cc/150?img=3',
  'https://i.pravatar.cc/150?img=4',
];

const CATEGORIES = ['Jogos', 'Música', 'Esportes', 'Entretenimento', 'Fitness'];

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Senha padrão - você pode mudar depois
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin_livevip_2024';
    
    if (password === adminPassword) {
      setIsAuthenticated(true);
      localStorage.setItem('admin_authenticated', 'true');
    } else {
      setError('Senha incorreta');
    }
  };

  // Verificar se já está autenticado
  useEffect(() => {
    const auth = localStorage.getItem('admin_authenticated');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md border border-white/20">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">🔒 Painel Admin</h1>
            <p className="text-white/80">Acesso restrito para administradores</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Senha de Administrador
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Digite a senha"
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
              className="w-full bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-purple-700 hover:to-violet-700 transition-colors"
            >
              Entrar
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-white/60 text-sm">
              Senha padrão: <code className="bg-black/30 px-2 py-1 rounded">admin_livevip_2024</code>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Se autenticado, redirecionar para o painel principal
  useEffect(() => {
    window.location.href = '/admin/dashboard';
  }, [isAuthenticated]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-white">Redirecionando...</p>
      </div>
    </div>
  );
}
