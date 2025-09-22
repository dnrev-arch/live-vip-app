'use client';

import { useState, useEffect } from 'react';
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

  // Função para carregar lives do localStorage
  const loadStreamsFromStorage = (): LiveStream[] => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('liveStreams');
      if (stored) {
        return JSON.parse(stored);
      }
    }
    // Lives padrão se não houver nada no localStorage
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
      },
      {
        id: '2',
        title: 'Show Especial Premium ✨',
        thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=600&fit=crop',
        videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4',
        viewerCount: 120,
        isLive: true,
        streamerName: 'Carla Santos',
        streamerAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
        category: 'Música'
      },
      {
        id: '3',
        title: 'Conteúdo Exclusivo VIP 💎',
        thumbnail: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=400&h=600&fit=crop',
        videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_5mb.mp4',
        viewerCount: 98,
        isLive: true,
        streamerName: 'Julia Costa',
        streamerAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face',
        category: 'Lifestyle'
      }
    ];
  };

  // Dados das lives (carregados do localStorage)
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>(() => loadStreamsFromStorage());

  // Atualizar lives quando localStorage mudar (para sincronizar com admin)
  useEffect(() => {
    const handleStorageChange = () => {
      setLiveStreams(loadStreamsFromStorage());
    };

    // Escutar mudanças no localStorage
    window.addEventListener('storage', handleStorageChange);
    
    // Verificar mudanças periodicamente (para quando admin e site estão na mesma aba)
    const interval = setInterval(() => {
      const stored = localStorage.getItem('liveStreams');
      if (stored) {
        const parsedStreams = JSON.parse(stored);
        setLiveStreams(parsedStreams);
      }
    }, 2000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Timer para usuários gratuitos (5 minutos = 300 segundos)
  useEffect(() => {
    if (currentStream && !isPremium) {
      const timer = setInterval(() => {
        setWatchTime(prev => {
          if (prev >= 300) { // 5 minutos
            setShowPremium(true);
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [currentStream, isPremium]);

  // Verificar se deve mostrar prompt de instalação
  useEffect(() => {
    const hasShownInstall = localStorage.getItem('hasShownInstall');
    if (!hasShownInstall) {
      setTimeout(() => setShowInstall(true), 3000);
    }
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const remainingTime = 300 - watchTime;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Crown className="w-6 h-6 text-yellow-400" />
            <h1 className="text-xl font-bold">LIVE VIP</h1>
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
            onClose={() => {
              setCurrentStream(null);
              setWatchTime(0);
            }}
            isPremium={isPremium}
            watchTime={watchTime}
          />
        ) : (
          <div className="p-4">
            {/* Premium Banner */}
            {!isPremium && (
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

            {/* Lives Grid */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold mb-4">🔴 Ao Vivo Agora</h2>
              {liveStreams.map((stream) => (
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

                  {/* Viewer Count */}
                  <div className="absolute top-3 right-3 bg-black/70 px-2 py-1 rounded-full text-xs flex items-center space-x-1">
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
                  </div>
                </div>
              ))}
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
