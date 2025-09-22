'use client';

import { useState, useEffect } from 'react';
import LivePlayer from '@/components/LivePlayer';
import AuthGuard from '@/components/AuthGuard';

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

interface ApiResponse {
  success: boolean;
  data?: LiveStream[];
  error?: string;
}

export default function HomePage() {
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStream, setSelectedStream] = useState<LiveStream | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  // Função para buscar lives da API com fallback para localStorage
  const fetchLiveStreams = async (): Promise<LiveStream[]> => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      
      if (!apiUrl) {
        throw new Error('API URL not configured');
      }

      const response = await fetch(`${apiUrl}/api/streams`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store', // Sempre buscar dados atualizados
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const streams = await response.json();
      
      // Salvar no localStorage como backup
      localStorage.setItem('liveStreams', JSON.stringify(streams));
      localStorage.setItem('lastApiUpdate', new Date().toISOString());
      
      return streams;
      
    } catch (error) {
      console.warn('API unavailable, falling back to localStorage:', error);
      
      // Fallback para localStorage
      const savedStreams = localStorage.getItem('liveStreams');
      if (savedStreams) {
        return JSON.parse(savedStreams);
      }
      
      throw new Error('No data available');
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

  // Carregar streams inicialmente
  useEffect(() => {
    const loadStreams = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const streams = await fetchLiveStreams();
        const streamsWithVariation = addViewerVariation(streams);
        
        setLiveStreams(streamsWithVariation);
        setLastUpdate(new Date().toLocaleTimeString('pt-BR'));
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar streams');
        setLiveStreams([]);
      } finally {
        setLoading(false);
      }
    };

    loadStreams();
  }, []);

  // Atualizar streams periodicamente
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const streams = await fetchLiveStreams();
        const streamsWithVariation = addViewerVariation(streams);
        setLiveStreams(streamsWithVariation);
        setLastUpdate(new Date().toLocaleTimeString('pt-BR'));
      } catch (error) {
        console.warn('Failed to refresh streams:', error);
      }
    }, 30000); // Atualizar a cada 30 segundos

    return () => clearInterval(interval);
  }, []);

  // Atualizar viewers com oscilação a cada 5 segundos
  useEffect(() => {
    const viewerInterval = setInterval(() => {
      setLiveStreams(prev => addViewerVariation(prev));
    }, 5000);

    return () => clearInterval(viewerInterval);
  }, []);

  const handleStreamClick = (stream: LiveStream) => {
    setSelectedStream(stream);
  };

  const handleClosePlayer = () => {
    setSelectedStream(null);
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white text-lg">Carregando lives...</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        
        {/* Header */}
        <header className="bg-black/20 backdrop-blur border-b border-white/10 p-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-white">🔴 LiveVIP</h1>
              <div className="bg-red-600 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                AO VIVO
              </div>
            </div>
            
            <div className="flex items-center space-x-4 text-white/60 text-sm">
              <span>📺 {liveStreams.length} streams</span>
              <span>🕒 {lastUpdate}</span>
              <button
                onClick={async () => {
                  try {
                    const streams = await fetchLiveStreams();
                    const streamsWithVariation = addViewerVariation(streams);
                    setLiveStreams(streamsWithVariation);
                    setLastUpdate(new Date().toLocaleTimeString('pt-BR'));
                  } catch (error) {
                    console.error('Refresh failed:', error);
                  }
                }}
                className="bg-white/10 hover:bg-white/20 px-3 py-1 rounded-lg transition-all duration-200"
              >
                🔄
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-6">
          {error && (
            <div className="max-w-7xl mx-auto mb-6">
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
                <p className="text-red-200">⚠️ {error}</p>
                <button
                  onClick={async () => {
                    try {
                      setError(null);
                      setLoading(true);
                      const streams = await fetchLiveStreams();
                      setLiveStreams(addViewerVariation(streams));
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'Erro desconhecido');
                    } finally {
                      setLoading(false);
                    }
                  }}
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
                  onClick={async () => {
                    try {
                      const streams = await fetchLiveStreams();
                      setLiveStreams(addViewerVariation(streams));
                    } catch (error) {
                      console.error('Refresh failed:', error);
                    }
                  }}
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
            stream={selectedStream}
            onClose={handleClosePlayer}
          />
        )}
      </div>
    </AuthGuard>
  );
}
