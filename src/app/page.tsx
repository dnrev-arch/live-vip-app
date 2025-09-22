'use client';

import { useState, useEffect, useCallback } from 'react';
import { Play, Users, MessageCircle, Heart, Share2, Crown, User, Home, Search } from 'lucide-react';
import LivePlayer from '@/components/LivePlayer';
import ProfileModal from '@/components/ProfileModal';
import PremiumModal from '@/components/PremiumModal';
import InstallPrompt from '@/components/InstallPrompt';

interface LiveStream {
  id: string;
  title: string;
  thumbnail: string;
  videoUrl: string;
  viewerCount: number;
  isLive: boolean;
  streamerName: string;
  streamerAvatar: string;
  category: string;
}

export default function HomePage() {
  const [currentStream, setCurrentStream] = useState<LiveStream | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showPremium, setShowPremium] = useState(false);
  const [showInstall, setShowInstall] = useState(false);
  const [watchTime, setWatchTime] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [lastStorageCheck, setLastStorageCheck] = useState(Date.now());

  // Função para carregar lives do localStorage
  const loadStreamsFromStorage = useCallback((): LiveStream[] => {
    if (typeof window === 'undefined') return [];
    
    try {
      const possibleKeys = ['liveStreams', 'streams', 'adminStreams'];
      
      for (const key of possibleKeys) {
        const stored = localStorage.getItem(key);
        if (stored && stored !== '[]' && stored !== 'null') {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            console.log(`📱 Found ${parsed.length} streams in key: ${key}`);
            return parsed;
          }
        }
      }
      
      console.log('📱 No streams found. All localStorage keys:', Object.keys(localStorage));
      
    } catch (error) {
      console.error('❌ Error loading streams:', error);
    }
    
    return [];
  }, []);

  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);

  // Função para verificar mudanças no localStorage
  const forceCheckStorage = useCallback(() => {
    try {
      const newStreams = loadStreamsFromStorage();
      const currentCount = liveStreams.length;
      const newCount = newStreams.length;
      
      console.log(`🔍 Force check: Current=${currentCount}, New=${newCount}`);
      
      if (newCount !== currentCount || JSON.stringify(liveStreams) !== JSON.stringify(newStreams)) {
        console.log('🔄 UPDATING STREAMS!', newStreams);
        setLiveStreams(newStreams);
        setLastStorageCheck(Date.now());
        
        // Se a stream atual foi removida, fechar o player
        if (currentStream && !newStreams.find(s => s.id === currentStream.id)) {
          setCurrentStream(null);
          setWatchTime(0);
        }
      }
      
      const triggers = ['forceRefresh', 'adminUpdate', 'adminForceSync', 'lastUpdate'];
      triggers.forEach(trigger => {
        const value = localStorage.getItem(trigger);
        if (value) {
          console.log(`🚨 Trigger found: ${trigger} = ${value}`);
          setLiveStreams(newStreams);
        }
      });
      
    } catch (error) {
      console.error('Error in force check:', error);
    }
  }, [liveStreams, loadStreamsFromStorage, currentStream]);

  // Inicialização
  useEffect(() => {
    console.log('🚀 HomePage initializing...');
    const initialStreams = loadStreamsFromStorage();
    setLiveStreams(initialStreams);
    console.log('📊 Initial streams:', initialStreams.length);
  }, [loadStreamsFromStorage]);

  // Sistema de monitoramento para mobile
  useEffect(() => {
    console.log('🔧 Setting up monitoring');

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const checkInterval = isMobile ? 200 : 1000;
    
    const ultraCheck = setInterval(forceCheckStorage, checkInterval);

    const events = [
      'storage', 'focus', 'visibilitychange', 'pageshow', 'load', 
      'beforeunload', 'hashchange', 'popstate'
    ];
    
    const handlers: { [key: string]: () => void } = {};
    
    events.forEach(eventName => {
      handlers[eventName] = () => {
        console.log(`📡 Event triggered: ${eventName}`);
        setTimeout(forceCheckStorage, 100);
      };
      
      if (eventName === 'visibilitychange') {
        document.addEventListener(eventName, handlers[eventName]);
      } else {
        window.addEventListener(eventName, handlers[eventName]);
      }
    });

    if (isMobile) {
      const orientationHandler = () => {
        console.log('📱 Orientation changed');
        setTimeout(forceCheckStorage, 500);
      };
      window.addEventListener('orientationchange', orientationHandler);
      handlers['orientationchange'] = orientationHandler;
    }

    let lastStorageContent = JSON.stringify(localStorage);
    const storagePoller = setInterval(() => {
      const currentStorageContent = JSON.stringify(localStorage);
      if (currentStorageContent !== lastStorageContent) {
        console.log('🗄️ LocalStorage content changed!');
        lastStorageContent = currentStorageContent;
        forceCheckStorage();
      }
    }, 500);

    return () => {
      clearInterval(ultraCheck);
      clearInterval(storagePoller);
      
      Object.entries(handlers).forEach(([eventName, handler]) => {
        if (eventName === 'visibilitychange') {
          document.removeEventListener(eventName, handler);
        } else {
          window.removeEventListener(eventName, handler);
        }
      });
    };
  }, [forceCheckStorage]);

  // Timer para usuários gratuitos
  useEffect(() => {
    if (currentStream && !isPremium) {
      const timer = setInterval(() => {
        setWatchTime(prev => {
          if (prev >= 300) {
            setShowPremium(true);
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [currentStream, isPremium]);

  // Verificar prompt de instalação
  useEffect(() => {
    const hasShownInstall = localStorage.getItem('hasShownInstall');
    if (!hasShownInstall) {
      setTimeout(() => setShowInstall(true), 3000);
    }
  }, []);

  // Função para trocar de stream (usada pelo swipe)
  const handleStreamChange = (newStream: LiveStream) => {
    setCurrentStream(newStream);
    setWatchTime(0); // Reset timer quando trocar
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const remainingTime = 300 - watchTime;

  // Função debug
  const debugInfo = () => {
    const storageData = localStorage.getItem('liveStreams');
    const allKeys = Object.keys(localStorage);
    
    console.log('🐛 DEBUG INFO:');
    console.log('- State streams:', liveStreams.length);
    console.log('- Storage liveStreams:', storageData ? JSON.parse(storageData).length : 0);
    console.log('- All localStorage keys:', allKeys);
    console.log('- Current stream:', currentStream?.title || 'None');
    console.log('- Last check:', new Date(lastStorageCheck).toLocaleTimeString());
    
    forceCheckStorage();
    
    const info = `
Estado: ${liveStreams.length} lives
Storage: ${storageData ? JSON.parse(storageData).length : 0} lives
Stream Atual: ${currentStream?.title || 'Nenhuma'}
Última verificação: ${new Date(lastStorageCheck).toLocaleTimeString()}
    `.trim();
    
    alert(info);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Crown className="w-6 h-6 text-yellow-400" />
            <h1 className="text-xl font-bold">LIVE VIP</h1>
            {(typeof window !== 'undefined' && 
              (window.location.hostname === 'localhost' || 
               window.location.search.includes('debug'))) && (
              <button 
                onClick={debugInfo}
                className="ml-2 text-xs bg-red-500 px-2 py-1 rounded opacity-70 hover:opacity-100"
                title="Debug - clique para verificar sync"
              >
                🔄 {liveStreams.length}
              </button>
            )}
          </div>
          <div className="flex items-center space-x-3">
            {!isPremium && currentStream && (
              <div className="bg-red-500 px-2 py-1 rounded-full text-xs font-bold">
                {formatTime(remainingTime)} restantes
              </div>
            )}
            <button
              onClick={() => setShowProfile(true)}
              className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center"
            >
              <User className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-16 pb-20">
        {currentStream ? (
          <LivePlayer
            stream={currentStream}
            allStreams={liveStreams}
            onClose={() => {
              setCurrentStream(null);
              setWatchTime(0);
            }}
            onStreamChange={handleStreamChange}
            isPremium={isPremium}
            watchTime={watchTime}
          />
        ) : (
          <div className="p-4">
            {/* Premium Banner */}
            {!isPremium && liveStreams.length > 0 && (
              <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-black">Seja Premium!</h3>
                    <p className="text-sm text-black/80">Acesso ilimitado a todas as lives</p>
                  </div>
                  <button
                    onClick={() => setShowPremium(true)}
                    className="bg-black text-white px-4 py-2 rounded-full font-bold"
                  >
                    Upgrade
                  </button>
                </div>
              </div>
            )}

            {/* Lives Grid ou Empty State */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">🔴 Ao Vivo Agora</h2>
                <div className="text-sm text-gray-400 flex items-center space-x-2">
                  <span>{liveStreams.length} lives ativas</span>
                  <button 
                    onClick={forceCheckStorage}
                    className="text-blue-400 hover:text-blue-300"
                    title="Atualizar"
                  >
                    🔄
                  </button>
                </div>
              </div>
              
              {liveStreams.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mb-4 text-6xl">📺</div>
                  <h3 className="text-xl font-bold mb-2">Nenhuma live ativa</h3>
                  <p className="text-gray-400 mb-6">
                    Em breve teremos lives exclusivas para você!
                  </p>
                  <div className="bg-gray-800 rounded-lg p-4 max-w-sm mx-auto">
                    <p className="text-sm text-gray-300 mb-2">🔔 Fique ligado!</p>
                    <p className="text-xs text-gray-400">
                      Novas lives podem aparecer a qualquer momento.
                    </p>
                    <p className="text-xs text-gray-500 mt-3">
                      Última verificação: {new Date(lastStorageCheck).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Instruções de navegação */}
                  <div className="bg-blue-500/20 rounded-lg p-3 border border-blue-500/30">
                    <p className="text-sm text-blue-400 font-medium">💡 Dica:</p>
                    <p className="text-xs text-gray-300 mt-1">
                      Ao abrir uma live, deslize para cima/baixo para navegar entre lives!
                    </p>
                  </div>

                  {/* Lives List */}
                  {liveStreams.map((stream, index) => (
                    <div
                      key={stream.id}
                      onClick={() => setCurrentStream(stream)}
                      className="relative rounded-lg overflow-hidden cursor-pointer transform transition-transform hover:scale-105"
                    >
                      <img
                        src={stream.thumbnail}
                        alt={stream.title}
                        className="w-full h-48 object-cover"
                      />
                      
                      {/* Live Badge */}
                      <div className="absolute top-3 left-3 bg-red-500 px-2 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        <span>AO VIVO</span>
                      </div>

                      {/* Position Indicator */}
                      <div className="absolute top-3 right-3 bg-black/70 px-2 py-1 rounded-full text-xs flex items-center space-x-1">
                        <span>{index + 1}</span>
                        <Users className="w-3 h-3" />
                        <span>{stream.viewerCount}</span>
                      </div>

                      {/* Stream Info */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
                        <div className="flex items-center space-x-3 mb-2">
                          <img
                            src={stream.streamerAvatar}
                            alt={stream.streamerName}
                            className="w-8 h-8 rounded-full"
                          />
                          <div>
                            <p className="font-semibold text-sm">{stream.streamerName}</p>
                            <p className="text-xs text-gray-300">{stream.category}</p>
                          </div>
                        </div>
                        <h3 className="font-bold">{stream.title}</h3>
                        
                        {/* Preview do que vem depois/antes */}
                        <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                          <span>
                            {index > 0 && `👆 ${liveStreams[index - 1].streamerName}`}
                          </span>
                          <span>
                            {index < liveStreams.length - 1 && `👇 ${liveStreams[index + 1].streamerName}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700">
        <div className="flex items-center justify-around py-2">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center p-2 ${activeTab === 'home' ? 'text-purple-400' : 'text-gray-400'}`}
          >
            <Home className="w-5 h-5" />
            <span className="text-xs mt-1">Início</span>
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`flex flex-col items-center p-2 ${activeTab === 'search' ? 'text-purple-400' : 'text-gray-400'}`}
          >
            <Search className="w-5 h-5" />
            <span className="text-xs mt-1">Buscar</span>
          </button>
          <button
            onClick={() => setShowPremium(true)}
            className="flex flex-col items-center p-2 text-yellow-400"
          >
            <Crown className="w-5 h-5" />
            <span className="text-xs mt-1">Premium</span>
          </button>
          <button
            onClick={() => setShowProfile(true)}
            className={`flex flex-col items-center p-2 ${activeTab === 'profile' ? 'text-purple-400' : 'text-gray-400'}`}
          >
            <User className="w-5 h-5" />
            <span className="text-xs mt-1">Perfil</span>
          </button>
        </div>
      </nav>

      {/* Modals */}
      {showProfile && (
        <ProfileModal onClose={() => setShowProfile(false)} />
      )}

      {showPremium && (
        <PremiumModal
          onClose={() => setShowPremium(false)}
          onUpgrade={() => {
            setIsPremium(true);
            setShowPremium(false);
            setWatchTime(0);
          }}
        />
      )}

      {showInstall && (
        <InstallPrompt onClose={() => setShowInstall(false)} />
      )}
    </div>
  );
}
