// src/app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import LivePlayer from '@/components/LivePlayer';
import AuthGuard from '@/components/AuthGuard';
import { apiService } from '@/lib/api'; // 🆕 ADICIONAR ESTA LINHA

// ... resto dos tipos mantidos iguais ...

export default function HomePage() {
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStream, setSelectedStream] = useState<LiveStream | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [apiStatus, setApiStatus] = useState<'connected' | 'offline' | 'checking'>('checking'); // 🆕 ADICIONAR

  // 🔄 SUBSTITUIR A FUNÇÃO fetchLiveStreams ANTIGA POR ESTA:
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

  // Função addViewerVariation mantida igual...
  const addViewerVariation = (streams: LiveStream[]): LiveStream[] => {
    return streams.map(stream => {
      const baseCount = stream.viewer_count;
      const variation = Math.floor(baseCount * 0.1);
      const randomChange = Math.floor(Math.random() * (variation * 2 + 1)) - variation;
      const newCount = Math.max(1, baseCount + randomChange);
      
      return {
        ...stream,
        viewer_count: newCount,
      };
    });
  };

  // 🔄 SUBSTITUIR refreshStreams POR ESTA:
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

  // 🔄 TROCAR O useEffect INICIAL:
  useEffect(() => {
    loadStreams(); // ← Usar loadStreams em vez de fetchLiveStreams
  }, []);

  // 🔄 ATUALIZAR O useEffect DE ATUALIZAÇÃO PERIÓDICA:
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
    }, 30000);

    return () => clearInterval(interval);
  }, [apiStatus]); // ← Adicionar apiStatus como dependência

  // useEffect dos viewers mantido igual...
  useEffect(() => {
    const viewerInterval = setInterval(() => {
      setLiveStreams(prev => addViewerVariation(prev));
    }, 5000);

    return () => clearInterval(viewerInterval);
  }, []);

  // ... resto das funções mantidas iguais ...

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white text-lg">Carregando lives...</p>
            {/* 🆕 ADICIONAR ESTA LINHA */}
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
        
        {/* 🔄 ATUALIZAR O HEADER COM STATUS DA API */}
        <header className="bg-black/20 backdrop-blur border-b border-white/10 p-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-white">🔴 LiveVIP</h1>
              <div className="bg-red-600 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                AO VIVO
              </div>
              {/* 🆕 ADICIONAR ESTE BLOCO */}
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

        {/* 🆕 ADICIONAR ALERT PARA OFFLINE */}
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

        {/* ... resto do código mantido igual ... */}
      </div>
    </AuthGuard>
  );
}
