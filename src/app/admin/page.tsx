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

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    thumbnail: '',
    video_url: '',
    viewer_count: 1000,
    streamer_name: '',
    streamer_avatar: '',
    category: 'Jogos',
  });

  // Verificar autenticação admin ao carregar
  useEffect(() => {
    const adminAuth = localStorage.getItem('admin_authenticated');
    if (adminAuth === 'true') {
      setIsAuthenticated(true);
      loadStreams();
    }
  }, []);

  // Função para fazer login admin
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'; // Fallback para desenvolvimento
    
    if (password === adminPassword) {
      setIsAuthenticated(true);
      localStorage.setItem('admin_authenticated', 'true');
      loadStreams();
      setPassword('');
      setError(null);
    } else {
      setError('Senha incorreta');
    }
  };

  // Função para carregar streams da API com fallback
  const loadStreams = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      
      if (!apiUrl) {
        throw new Error('API URL not configured');
      }

      const response = await fetch(`${apiUrl}/api/streams`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const apiStreams = await response.json();
      setStreams(apiStreams);
      
      // Sincronizar com localStorage
      localStorage.setItem('liveStreams', JSON.stringify(apiStreams));
      localStorage.setItem('lastApiSync', new Date().toISOString());
      setLastSync(new Date().toLocaleTimeString('pt-BR'));
      
    } catch (error) {
      console.warn('API unavailable, using localStorage:', error);
      
      // Fallback para localStorage
      const savedStreams = localStorage.getItem('liveStreams');
      if (savedStreams) {
        const localStreams = JSON.parse(savedStreams);
        setStreams(localStreams);
        setError('Usando dados locais - API indisponível');
      } else {
        setStreams([]);
        setError('Nenhum dado disponível');
      }
    } finally {
      setLoading(false);
    }
  };

  // Função para salvar stream (API + localStorage)
  const saveStreamBoth = async (streamData: Omit<LiveStream, 'id' | 'created_at' | 'updated_at'>) => {
    const newStream: LiveStream = {
      id: editingStream?.id || `stream_${Date.now()}`,
      ...streamData,
      is_live: true,
      created_at: editingStream?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    let apiSuccess = false;

    // Tentar salvar na API primeiro
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      
      if (apiUrl) {
        const endpoint = editingStream 
          ? `${apiUrl}/api/streams/${editingStream.id}`
          : `${apiUrl}/api/streams`;
        
        const method = editingStream ? 'PUT' : 'POST';
        
        const response = await fetch(endpoint, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newStream),
        });

        if (response.ok) {
          apiSuccess = true;
          setSuccess(editingStream ? 'Stream atualizada na API!' : 'Stream criada na API!');
        }
      }
    } catch (error) {
      console.warn('Failed to save to API:', error);
    }

    // Sempre salvar no localStorage como backup
    let updatedStreams: LiveStream[];
    
    if (editingStream) {
      updatedStreams = streams.map(s => s.id === editingStream.id ? newStream : s);
    } else {
      updatedStreams = [...streams, newStream];
    }
    
    setStreams(updatedStreams);
    localStorage.setItem('liveStreams', JSON.stringify(updatedStreams));
    
    if (!apiSuccess) {
      setSuccess(editingStream ? 'Stream atualizada localmente!' : 'Stream criada localmente!');
    }
    
    return newStream;
  };

  // Função para deletar stream
  const deleteStream = async (streamId: string) => {
    if (!confirm('Tem certeza que deseja deletar esta stream?')) return;

    try {
      // Tentar deletar da API
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      
      if (apiUrl) {
        await fetch(`${apiUrl}/api/streams/${streamId}`, {
          method: 'DELETE',
        });
      }
    } catch (error) {
      console.warn('Failed to delete from API:', error);
    }

    // Sempre deletar do localStorage
    const updatedStreams = streams.filter(s => s.id !== streamId);
    setStreams(updatedStreams);
    localStorage.setItem('liveStreams', JSON.stringify(updatedStreams));
    setSuccess('Stream deletada!');
  };

  // Função para sincronização forçada
  const forceSync = async () => {
    setSyncing(true);
    await loadStreams();
    setSyncing(false);
    setSuccess('Sincronização concluída!');
  };

  // Handlers do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await saveStreamBoth(formData);
      
      // Reset form
      setFormData({
        title: '',
        thumbnail: '',
        video_url: '',
        viewer_count: 1000,
        streamer_name: '',
        streamer_avatar: '',
        category: 'Jogos',
      });
      
      setShowForm(false);
      setEditingStream(null);
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao salvar stream');
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
    });
  };

  // Limpar mensagens após 3 segundos
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  // Tela de login admin
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

  // Painel admin principal
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      
      {/* Header */}
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
              📺 {streams.length} streams • 🕒 {lastSync}
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

      {/* Messages */}
      {(success || error) && (
        <div className="max-w-7xl mx-auto p-4">
          {success && (
            <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3 mb-4">
              <p className="text-green-200 text-sm">✅ {success}</p>
            </div>
          )}
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-4">
              <p className="text-red-200 text-sm">⚠️ {error}</p>
            </div>
          )}
        </div>
      )}

      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          
          {/* Actions */}
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-semibold text-white">
              Gerenciar Lives ({streams.length})
            </h2>
            <button
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105"
            >
              ➕ Nova Live
            </button>
          </div>

          {/* Form Modal */}
          {showForm && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-white/20">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-white">
                    {editingStream ? 'Editar Live' : 'Nova Live'}
                  </h3>
                  <button
                    onClick={handleCancel}
                    className="text-white/60 hover:text-white text-2xl"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">
                      Título da Live
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Ex: Live de Games Épica!"
                      required
                    />
                  </div>

                  {/* Streamer Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">
                        Nome do Streamer
                      </label>
                      <input
                        type="text"
                        value={formData.streamer_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, streamer_name: e.target.value }))}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Nome do streamer"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">
                        Categoria
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat} value={cat} className="bg-gray-800 text-white">
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Avatar */}
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">
                      Avatar do Streamer
                    </label>
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      {SUGGESTED_AVATARS.map((avatar, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, streamer_avatar: avatar }))}
                          className={`w-16 h-16 rounded-full border-2 overflow-hidden transition-all ${
                            formData.streamer_avatar === avatar 
                              ? 'border-purple-500 ring-2 ring-purple-300' 
                              : 'border-white/20 hover:border-white/40'
                          }`}
                        >
                          <img src={avatar} alt={`Avatar ${index + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                    <input
                      type="url"
                      value={formData.streamer_avatar}
                      onChange={(e) => setFormData(prev => ({ ...prev, streamer_avatar: e.target.value }))}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Ou cole URL do avatar"
                    />
                  </div>

                  {/* URLs */}
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">
                      Thumbnail da Live
                    </label>
                    <input
                      type="url"
                      value={formData.thumbnail}
                      onChange={(e) => setFormData(prev => ({ ...prev, thumbnail: e.target.value }))}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="https://exemplo.com/imagem.jpg"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">
                      URL do Vídeo
                    </label>
                    <input
                      type="url"
                      value={formData.video_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, video_url: e.target.value }))}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="https://exemplo.com/video.mp4"
                      required
                    />
                  </div>

                  {/* Viewer Count */}
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">
                      Número Base de Viewers
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.viewer_count}
                      onChange={(e) => setFormData(prev => ({ ...prev, viewer_count: parseInt(e.target.value) }))}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <p className="text-white/60 text-xs mt-1">
                      O número real irá oscilar ±10% automaticamente
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
                    >
                      {loading ? 'Salvando...' : editingStream ? 'Atualizar' : 'Criar Live'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="bg-white/10 hover:bg-white/20 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Streams List */}
          {loading && !showForm ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-white">Carregando streams...</p>
            </div>
          ) : streams.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📺</div>
              <h3 className="text-xl font-semibold text-white mb-2">Nenhuma live criada</h3>
              <p className="text-white/60 mb-6">Clique em "Nova Live" para começar.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {streams.map((stream) => (
                <div
                  key={stream.id}
                  className="bg-white/10 backdrop-blur rounded-2xl overflow-hidden border border-white/20 hover:border-white/40 transition-all duration-300"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video">
                    <img
                      src={stream.thumbnail}
                      alt={stream.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjMyMCIgaGVpZ2h0PSIxODAiIGZpbGw9IiMyMzIzMjMiLz48cGF0aCBkPSJNMTQ0IDc2TDE3NiA5NEwxNDQgMTEyVjc2WiIgZmlsbD0iIzY2NjY2NiIvPjwvc3ZnPg==';
                      }}
                    />
                    <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                      🔴 LIVE
                    </div>
                    <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                      👁️ {stream.viewer_count.toLocaleString('pt-BR')}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="text-white font-semibold text-lg mb-2 line-clamp-2">
                      {stream.title}
                    </h3>
                    
                    <div className="flex items-center space-x-2 mb-3">
                      <img
                        src={stream.streamer_avatar}
                        alt={stream.streamer_name}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                      <span className="text-white/80 text-sm">{stream.streamer_name}</span>
                    </div>
                    
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-purple-300 text-sm bg-purple-500/20 px-2 py-1 rounded-full">
                        {stream.category}
                      </span>
                      <span className="text-white/60 text-xs">
                        {new Date(stream.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(stream)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-3 rounded-lg transition-colors"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => deleteStream(stream.id)}
                        className="bg-red-600 hover:bg-red-700 text-white text-sm py-2 px-3 rounded-lg transition-colors"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
