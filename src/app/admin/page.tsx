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

  const loadStreams = () => {
    try {
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
    loadStreams();
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
                  </div>

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
          {streams.length === 0 ? (
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
                  </div>

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
