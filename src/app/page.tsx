'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
// ... outros imports

export default function HomePage() {
  // ... outros states
  const [lastSync, setLastSync] = useState(Date.now());
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const visibilityChangeRef = useRef<(() => void) | null>(null);

  // Função melhorada para carregar streams
  const loadStreamsFromStorage = useCallback((): LiveStream[] => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('liveStreams');
        const forceRefresh = localStorage.getItem('forceRefresh');
        
        // Se há um forceRefresh, limpar e forçar reload
        if (forceRefresh && parseInt(forceRefresh) > lastSync) {
          console.log('🔄 Force refresh detected');
          setLastSync(Date.now());
        }
        
        if (stored) {
          const parsed = JSON.parse(stored);
          console.log('📱 Streams loaded:', parsed.length);
          return parsed;
        }
      } catch (error) {
        console.error('❌ Error loading streams:', error);
      }
    }
    
    // Streams padrão
    return [
      {
        id: '1',
        title: 'Live Exclusiva VIP 🔥',
        thumbnail: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=600&fit=crop',
        videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
        viewerCount: 139,
        isLive: true,
        streamerName: 'Ana Silva',
        streamerAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
        category: 'Entretenimento'
      }
      // ... outros streams padrão
    ];
  }, [lastSync]);

  const [liveStreams, setLiveStreams] = useState<LiveStream[]>(() => loadStreamsFromStorage());

  // Função para sincronização forçada
  const forceSyncCheck = useCallback(() => {
    const newStreams = loadStreamsFromStorage();
    const currentIds = liveStreams.map(s => s.id).sort().join(',');
    const newIds = newStreams.map(s => s.id).sort().join(',');
    
    // Comparar não apenas IDs, mas também conteúdo
    const currentHash = JSON.stringify(liveStreams);
    const newHash = JSON.stringify(newStreams);
    
    if (currentHash !== newHash) {
      console.log('🔄 Updating streams from storage');
      setLiveStreams(newStreams);
      setLastSync(Date.now());
      
      // Feedback visual para debug
      if (typeof window !== 'undefined' && window.location.search.includes('debug')) {
        alert(`Streams atualizados! ${newStreams.length} lives carregadas`);
      }
    }
  }, [liveStreams, loadStreamsFromStorage]);

  // Setup de sincronização melhorado
  useEffect(() => {
    console.log('🚀 Setting up sync system');
    
    // Sincronização inicial
    forceSyncCheck();
    
    // Listener para storage changes (outras abas)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'liveStreams' || e.key === 'forceRefresh' || e.key === null) {
        console.log('📡 Storage change detected:', e.key);
        forceSyncCheck();
      }
    };

    // Listener para visibility change (app volta do background)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('👀 App became visible, checking for updates');
        forceSyncCheck();
      }
    };

    // Listener para focus (usuário volta para o app)
    const handleFocus = () => {
      console.log('🎯 App focused, syncing');
      forceSyncCheck();
    };

    // Registrar listeners
    window.addEventListener('storage', handleStorageChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    // Salvar referência para cleanup
    visibilityChangeRef.current = handleVisibilityChange;
    
    // Intervalo mais robusto para mobile
    let syncCount = 0;
    syncIntervalRef.current = setInterval(() => {
      syncCount++;
      
      // Sync mais frequente nos primeiros minutos
      if (syncCount <= 60) { // Primeiros 60 segundos
        forceSyncCheck();
      } else if (syncCount % 5 === 0) { // Depois a cada 5 segundos
        forceSyncCheck();
      }
    }, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, []); // Dependências vazias para executar apenas uma vez

  // Função para debug (adicione temporariamente)
  const debugSync = () => {
    console.log('🐛 Debug Info:');
    console.log('Current streams:', liveStreams.length);
    console.log('Storage streams:', JSON.parse(localStorage.getItem('liveStreams') || '[]').length);
    console.log('Last sync:', new Date(lastSync).toLocaleTimeString());
    forceSyncCheck();
  };

  // ... resto do componente

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header com debug button (remova em produção) */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Crown className="w-6 h-6 text-yellow-400" />
            <h1 className="text-xl font-bold">LIVE VIP</h1>
            {/* Botão de debug - remova em produção */}
            {process.env.NODE_ENV === 'development' && (
              <button 
                onClick={debugSync}
                className="ml-2 text-xs bg-red-500 px-2 py-1 rounded"
              >
                🔄
              </button>
            )}
          </div>
          {/* ... resto do header */}
        </div>
      </header>

      {/* ... resto do componente permanece igual */}
    </div>
  );
}
