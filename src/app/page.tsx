'use client';

import { useState, useEffect } from 'react';
import LivePlayer from '@/components/LivePlayer';
import AuthGuard from '@/components/AuthGuard';
import { apiService } from '@/lib/api';
import { LiveStream } from '@/types'; // ✅ IMPORT CORRIGIDO

export default function HomePage() {
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStream, setSelectedStream] = useState<LiveStream | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [apiStatus, setApiStatus] = useState<'connected' | 'offline' | 'checking'>('checking');

  // ✅ NOVA FUNÇÃO - Carregar streams usando API helper
  const loadStreams = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 🌐 Verificar se API está online
      const isApiOnline = await apiService.isApiAvailable();
      setApiStatus(isApiOnline ? 'connected' : 'offline');
      
      // 📋 Buscar streams usando nossa API helper
      const streams = await apiService.getStreams();
      const streamsWithVariation = addViewerVariation(streams);
      
      setLiveStreams(streamsWithVariation);
      setLastUpdate(new Date().toLocaleTimeString('pt-BR'));
      
      console.log('✅ Streams carregadas:', streams.length);
      
    } catch (err) {
      console.error('❌ Erro ao carregar streams:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar streams');
      setApiStatus('offline');
      
      // 💾 Tentar carregar do localStorage como último recurso
      const savedStreams = localStorage.getItem('liveStreams');
      if (savedStreams) {
        try {
          const localStreams = JSON.parse(savedStreams);
          setLiveStreams(localStreams);
          setLastUpdate('Offline - ' + new Date().toLocaleTimeString('pt-BR'));
        } catch (parseError) {
          console.error('Erro ao ler localStorage:', parseError);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Função para adicionar oscilação natural aos viewers
  const addViewerVariation = (streams: LiveStream[]): LiveStream[] => {
    return streams.map(stream => {
      const baseCount = stream.viewer_count;
      const variation = Math.floor(baseCount * 0.1); // ±10% variation
      const randomChange = Math.floor(Math.random() * (variation * 2 + 1)) - variation;
      const newCount = Math.max(1, baseCount + randomChange);
      
      return {
        ...stream,
        viewer_count: newCount,
      };
    });
  };

  // ✅ NOVA FUNÇÃO - Refresh com force sync
  const refreshStreams = async () => {
    try {
      setError(null);
      const streams = await apiService.forceSync();
      const streamsWithVariation = addViewerVariation(streams);
      setLiveStreams(streamsWithVariation);
      setLastUpdate('Sync - ' + new Date().toLocaleTimeString('pt-BR'));
      setApiStatus('connected');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro na sincronização');
      setApiStatus('offline');
    }
  };

  const handleStreamClick = (stream: LiveStream) => {
    setSelectedStream(stream);
  };

  const handleClosePlayer = () => {
    setSelectedStream(null);
  };

  // ✅ Carregar streams na inicialização
  useEffect(() => {
    loadStreams();
  }, []);

  // ✅ ATUALIZAÇÃO PERIÓDICA INTELIGENTE
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        // Só tentar atualizar se a API estiver online
        if (apiStatus === 'connected') {
          const streams = await apiService.getStreams();
          const streamsWithVariation = addViewerVariation(streams);
          setLiveStreams(streamsWithVariation);
          setLastUpdate(new Date().toLocaleTimeString('pt-BR'));
        } else {
          // Se offline, apenas adicionar variação aos viewers existentes
          setLiveStreams(prev => addViewerVariation(prev));
          setLastUpdate('Offline - ' + new Date().toLocaleTimeString('pt-BR'));
        }
      } catch (error) {
        console.warn('Background update failed:', error);
        setApiStatus('offline');
        setLiveStreams(prev => addViewerVariation(prev));
      }
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [apiStatus]);

  // Atualizar viewers com oscilação a cada 5 segundos
  useEffect(() => {
    const viewerInterval = setInterval(() => {
      setLiveStreams(prev => addViewerVariation(prev));
    }, 5000);

    return () => clearInterval(viewerInterval);
  }, []);

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white text-lg">Carregando lives...</p>
            <p className="text-white/60 text-sm mt-2">
              Status da API: {apiStatus === 'checking' ? 'Verificando...' : apiStatus === 'connected' ? '🟢 Online' : '🔴 Offline'}
            </p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        
        {/* ✅ HEADER COM STATUS DA API */}
        <header className="bg-black/20 backdrop-blur border-b border-white/10 p-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-white">🔴 LiveVIP</h1>
              <div className="bg-red-600 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                AO VIVO
              </div>
              {/* Status da API */}
              <div className={`text-xs px-2 py-1 rounded-full ${
                apiStatus === 'connected' ? 'bg-green-600 text-white' : 
                apiStatus === 'offline' ? 'bg-red-600 text-white' : 
                'bg-yellow-600 text-white'
              }`}>
                {apiStatus === 'connected' ? '🟢 Sincronizado' : 
                 apiStatus === 'offline' ? '🔴 Offline' : 
                 '🟡 Verificando'}
              </div>
            </div>
            
            <div className="flex items-center space-x-4 text-white/60 text-sm">
              <span>📺 {liveStreams.length} streams</span>
              <span>🕒 {lastUpdate || 'Carregando...'}</span>
              <button
                onClick={refreshStreams}
                className="bg-white/10 hover:bg-white/20 px-3 py-1 rounded-lg transition-all duration-200"
                disabled={loading}
              >
                {loading ? '⏳' : '🔄'}
              </button>
            </div>
          </div>
        </header>

        {/* ✅ ALERT PARA MODO OFFLINE */}
        {apiStatus === 'offline' && (
          <div className="bg-yellow-500/20 border-b border-yellow-500/30 p-3">
            <div className="max-w-7xl mx-auto text-center">
              <p className="text-yellow-200 text-sm">
                ⚠️ Modo offline - Alguns dados podem estar desatualizados. 
                <button 
                  onClick={refreshStreams}
                  className="underline ml-2 hover:text-white"
                >
                  Tentar reconectar
                </button>
              </p>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="p-6">
          {error && (
            <div className="max-w-7xl mx-auto mb-6">
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
                <p className="text-red-200">⚠️ {error}</p>
                <button
                  onClick={refreshStreams}
                  className="mt-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  Tentar novamente
                </button>
              </div>
            </div>
          )}

          {liveStreams.length === 0 ? (
            <div className="max-w-7xl mx-auto text-center py-20">
              <div className="bg-white/10 backdrop-blur rounded-2xl p-12 border border-white/20">
                <div className="text-6xl mb-6">📺</div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  Nenhuma live disponível no momento
                </h2>
                <p className="text-white/60 mb-6">
                  As lives aparecerão aqui assim que forem adicionadas pelo administrador.
                </p>
                <button
                  onClick={refreshStreams}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
                >
                  🔄 Atualizar
                </button>
              </div>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {liveStreams.map((stream) => (
                  <div
                    key={stream.id}
                    onClick={() => handleStreamClick(stream)}
                    className="bg-white/10 backdrop-blur rounded-2xl overflow-hidden border border-white/20 hover:border-white/40 transition-all duration-300 transform hover:scale-105 cursor-pointer group"
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
                      
                      {/* Live indicator */}
                      <div className="absolute top-3 left-3 bg-red-600 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                        🔴 AO VIVO
                      </div>
                      
                      {/* Viewers count */}
                      <div className="absolute top-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                        👁️ {stream.viewer_count.toLocaleString('pt-BR')}
                      </div>
                      
                      {/* Play overlay */}
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
                          <div className="w-0 h-0 border-l-[20px] border-l-black border-y-[12px] border-y-transparent ml-1"></div>
                        </div>
                      </div>
                    </div>

                    {/* Stream info */}
                    <div className="p-4">
                      <h3 className="text-white font-semibold text-lg mb-2 line-clamp-2 group-hover:text-blue-300 transition-colors">
                        {stream.title}
                      </h3>
                      
                      <div className="flex items-center space-x-2 mb-2">
                        <img
                          src={stream.streamer_avatar}
                          alt={stream.streamer_name}
                          className="w-6 h-6 rounded-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMiIgZmlsbD0iIzY2NjY2NiIvPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTAiIHI9IjMiIGZpbGw9IndoaXRlIi8+PHBhdGggZD0iTTcgMThDNyAxNS4yMzkgOS4yMzkgMTMgMTIgMTNTMTcgMTUuMjM5IDE3IDE4IiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjwvc3ZnPg==';
                          }}
                        />
                        <span className="text-white/80 text-sm">{stream.streamer_name}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-purple-300 text-sm bg-purple-500/20 px-2 py-1 rounded-full">
                          {stream.category}
                        </span>
                        <span className="text-white/60 text-xs">
                          {new Date(stream.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* Live Player Modal */}
        {selectedStream && (
          <LivePlayer
            stream={{
              id: selectedStream.id,
              title: selectedStream.title,
              thumbnail: selectedStream.thumbnail,
              videoUrl: selectedStream.video_url,
              viewerCount: selectedStream.viewer_count,
              streamerName: selectedStream.streamer_name,
              streamerAvatar: selectedStream.streamer_avatar
            }}
            onClose={handleClosePlayer}
          />
        )}
      </div>
    </AuthGuard>
  );
}
