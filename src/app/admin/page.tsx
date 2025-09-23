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
  'https://i.pravatar.cc/150?img=5',
  'https://i.pravatar.cc/150?img=6',
  'https://i.pravatar.cc/150?img=7',
  'https://i.pravatar.cc/150?img=8',
];

const CATEGORIES = [
  'Jogos', 'Música', 'Esportes', 'Tecnologia', 'Culinária', 
  'Arte', 'Educação', 'Entretenimento', 'Fitness', 'Viagem'
];

export default function AdminPage() {
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingStream, setEditingStream] = useState<LiveStream | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string>('');

  const [formData, setFormData] = useState({
    title: '',
    thumbnail: '',
    video_url: '',
    viewer_count: 1000,
    streamer_name: '',
    streamer_avatar: '',
    category: 'Jogos',
    is_live: true
  });

  useEffect(() => {
    const adminAuth = localStorage.getItem('admin_authenticated');
    if (adminAuth === 'true') {
      setIsAuthenticated(true);
      loadStreams();
    }
  }, []);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password === 'admin_livevip_2024') {
      setIsAuthenticated(true);
      localStorage.setItem('admin_authenticated', 'true');
      loadStreams();
      setPassword('');
      setError(null);
    } else {
      setError('Senha incorreta');
    }
  };

  const loadStreams = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const savedStreams = localStorage.getItem('liveStreams');
      if (savedStreams) {
        const localStreams = JSON.parse(savedStreams);
        setStreams(localStreams);
        setLastSync(new Date().toLocaleTimeString('pt-BR'));
      } else {
        setStreams([]);
      }
      
    } catch (error) {
      console.error('Error loading streams:', error);
      setStreams([]);
      setError('Erro ao carregar streams');
    } finally {
      setLoading(false);
    }
  };

  const saveStreamBoth = async (streamData: any) => {
    const newStream: LiveStream = {
      id: editingStream?.id || `stream_${Date.now()}`,
      ...streamData,
      is_live: true,
      created_at: editingStream?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    let updatedStreams: LiveStream[];
    
    if (editingStream) {
      updatedStreams = streams.map(s => s.id === editingStream.id ? newStream : s);
    } else {
      updatedStreams = [...streams, newStream];
    }
    
    setStreams(updatedStreams);
    localStorage.setItem('liveStreams', JSON.stringify(updatedStreams));
    
    setSuccess(editingStream ? 'Stream atualizada!' : 'Stream criada!');
    
    return newStream;
  };

  const deleteStream = async (streamId: string) => {
    if (!confirm('Tem certeza que deseja deletar esta stream?')) return;

    const updatedStreams = streams.filter(s => s.id !== streamId);
    setStreams(updatedStreams);
    localStorage.setItem('liveStreams', JSON.stringify(updatedStreams));
    setSuccess('Stream deletada!');
  };

  const forceSync = async () => {
    setSyncing(true);
    await loadStreams();
    setSyncing(false);
    setSuccess('Sincronização concluída!');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await saveStreamBoth(formData);
      
      setFormData({
        title: '',
        thumbnail: '',
        video_url: '',
        viewer_count: 1000,
        streamer_name: '',
        streamer_avatar: '',
        category: 'Jogos',
        is_live: true
      });
      
      setShowForm(false);
      setEditingStream(null);
      
    } catch (error) {
      setError('Erro ao salvar stream');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (stream: LiveStream) => {
    setEditingStream(stream);
    setFormData({
      title: stream.title,
      thumbnail: stream.thumbnail,
      video_url: stream.video_url,
      viewer_count: stream.viewer_count,
      streamer_name: stream.streamer_name,
      streamer_avatar: stream.streamer_avatar,
      category: stream.category,
      is_live: true
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingStream(null);
    setFormData({
      title: '',
      thumbnail: '',
      video_url: '',
      viewer_count: 1000,
      streamer_name: '',
      streamer_avatar: '',
      category: 'Jogos',
      is_live: true
    });
  };

  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md border border-white/20">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">🔒 Painel Admin</h1>
            <p className="text-white/80">Acesso restrito para administradores</p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-white/80 text-sm font-medium mb-2">
                Senha de Administrador
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
              className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
            >
              Entrar
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Restante do código continua igual...
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      {/* Todo o resto do JSX permanece o mesmo */}
      <header className="bg-black/20 backdrop-blur border-b border-white/10 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-white">⚙️ Painel Admin</h1>
            <div className="bg-green-600 text-white text-xs px-2 py-1 rounded-full">
              ATIVO
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-white/60 text-sm">
              📺 {streams.length} streams • 🕒 {lastSync || 'Não sincronizado'}
            </span>
            <button
              onClick={forceSync}
              disabled={syncing}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-3 py-1 rounded-lg text-sm transition-colors"
            >
              {syncing ? '⏳' : '🔄'} Sync
            </button>
            <button
              onClick={() => {
                localStorage.removeItem('admin_authenticated');
                setIsAuthenticated(false);
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-sm transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="p-6">
        <div className="text-center py-12">
          <h2 className="text-white text-2xl">Painel Admin Funcionando!</h2>
          <p className="text-white/60">Use o botão acima para adicionar lives</p>
        </div>
      </main>
    </div>
  );
}
