"use client";

import { useState, useEffect } from 'react';
import { Play, Users, Clock, LogOut, Crown, Eye, EyeOff } from 'lucide-react';
import { cn, formatViewers, formatTime, generateViewerCount, isPremiumUser, getRemainingFreeTime, storage, isValidEmail } from '@/lib/utils';
import { Live, User } from '@/lib/types';

// Mock data para demonstração
const mockLives: Live[] = [
  {
    id: '1',
    title: 'Gaming Session - Fortnite Battle Royale',
    streamer: 'ProGamer123',
    category: 'Gaming',
    thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=300&fit=crop',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    base_viewers: 1250,
    variance_percent: 15,
    status: 'live',
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: '2',
    title: 'Cooking Show - Italian Pasta Masterclass',
    streamer: 'ChefMaria',
    category: 'Cooking',
    thumbnail: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    base_viewers: 890,
    variance_percent: 20,
    status: 'live',
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: '3',
    title: 'Music Live - Acoustic Guitar Session',
    streamer: 'MusicLover',
    category: 'Music',
    thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    base_viewers: 2100,
    variance_percent: 10,
    status: 'live',
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: '4',
    title: 'Tech Talk - Latest AI Developments',
    streamer: 'TechGuru',
    category: 'Technology',
    thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    base_viewers: 1580,
    variance_percent: 25,
    status: 'live',
    created_at: new Date(),
    updated_at: new Date()
  }
];

const mockUser: User = {
  id: '1',
  email: 'user@example.com',
  free_seconds_today: 120, // 2 minutos já usados
  created_at: new Date(),
  updated_at: new Date()
};

export default function LiveVIPApp() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [lives, setLives] = useState<Live[]>(mockLives);
  const [selectedLive, setSelectedLive] = useState<Live | null>(null);
  const [showLogin, setShowLogin] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [viewerCounts, setViewerCounts] = useState<Record<string, number>>({});
  const [remainingTime, setRemainingTime] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  // Simular oscilação de espectadores
  useEffect(() => {
    const interval = setInterval(() => {
      const newCounts: Record<string, number> = {};
      lives.forEach(live => {
        newCounts[live.id] = generateViewerCount(live.base_viewers, live.variance_percent);
      });
      setViewerCounts(newCounts);
    }, 8000);

    return () => clearInterval(interval);
  }, [lives]);

  // Inicializar contadores de espectadores
  useEffect(() => {
    const initialCounts: Record<string, number> = {};
    lives.forEach(live => {
      initialCounts[live.id] = generateViewerCount(live.base_viewers, live.variance_percent);
    });
    setViewerCounts(initialCounts);
  }, []);

  // Verificar usuário logado
  useEffect(() => {
    const savedUser = storage.get('livevip_user');
    if (savedUser) {
      setUser(savedUser);
      setShowLogin(false);
      setRemainingTime(getRemainingFreeTime(savedUser));
    }
  }, []);

  const handleLogin = () => {
    if (!email.trim()) {
      setEmailError('Email é obrigatório');
      return;
    }

    if (!isValidEmail(email)) {
      setEmailError('Email inválido');
      return;
    }

    const newUser = { ...mockUser, email };
    setUser(newUser);
    storage.set('livevip_user', newUser);
    setShowLogin(false);
    setRemainingTime(getRemainingFreeTime(newUser));
    setEmailError('');
  };

  const handleLogout = () => {
    setUser(null);
    storage.remove('livevip_user');
    setShowLogin(true);
    setSelectedLive(null);
  };

  const handleLiveClick = (live: Live) => {
    if (!user) return;
    
    if (!isPremiumUser(user) && remainingTime <= 0) {
      setShowUpgradeModal(true);
      return;
    }
    
    setSelectedLive(live);
  };

  const handleSwipeUp = () => {
    if (!selectedLive) return;
    const currentIndex = lives.findIndex(l => l.id === selectedLive.id);
    const nextIndex = (currentIndex + 1) % lives.length;
    setSelectedLive(lives[nextIndex]);
  };

  const handleSwipeDown = () => {
    if (!selectedLive) return;
    const currentIndex = lives.findIndex(l => l.id === selectedLive.id);
    const prevIndex = currentIndex === 0 ? lives.length - 1 : currentIndex - 1;
    setSelectedLive(lives[prevIndex]);
  };

  // Login Screen
  if (showLogin) {
    return (
      <div className="min-h-screen bg-netflix-black flex items-center justify-center p-4">
        <div className="w-full max-w-md fade-in">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-netflix-red mb-2">LiveVIP</h1>
            <p className="text-netflix-light-gray">Entre com seu email para começar</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <input
                type="email"
                placeholder="Seu email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-4 bg-netflix-dark-gray border border-netflix-gray rounded-lg text-white placeholder-netflix-light-gray focus:border-netflix-red focus:outline-none transition-colors"
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              />
              {emailError && (
                <p className="text-netflix-red text-sm mt-2">{emailError}</p>
              )}
            </div>
            
            <button
              onClick={handleLogin}
              className="w-full btn-netflix"
            >
              Entrar
            </button>
          </div>
          
          <div className="mt-8 text-center text-netflix-light-gray text-sm">
            <p>Gratuito: 7 minutos por dia</p>
            <p>Premium: acesso ilimitado</p>
          </div>
        </div>
      </div>
    );
  }

  // Video Player
  if (selectedLive) {
    return (
      <div className="min-h-screen bg-netflix-black relative overflow-hidden">
        <div className="relative h-screen">
          <video
            src={selectedLive.video_url}
            autoPlay
            loop
            muted
            className="w-full h-full object-cover"
            onTouchStart={(e) => {
              const startY = e.touches[0].clientY;
              const handleTouchEnd = (endEvent: TouchEvent) => {
                const endY = endEvent.changedTouches[0].clientY;
                const diff = startY - endY;
                
                if (Math.abs(diff) > 50) {
                  if (diff > 0) {
                    handleSwipeUp();
                  } else {
                    handleSwipeDown();
                  }
                }
                
                document.removeEventListener('touchend', handleTouchEnd);
              };
              
              document.addEventListener('touchend', handleTouchEnd);
            }}
          />
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30">
            {/* Top Bar */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
              <button
                onClick={() => setSelectedLive(null)}
                className="p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
              >
                ←
              </button>
              
              <div className="flex items-center space-x-2 bg-black/50 rounded-full px-3 py-1">
                <div className="w-2 h-2 bg-netflix-red rounded-full animate-pulse"></div>
                <span className="text-white text-sm font-medium">AO VIVO</span>
              </div>
            </div>
            
            {/* Bottom Info */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="mb-4">
                <h2 className="text-white text-xl font-bold mb-1">{selectedLive.title}</h2>
                <p className="text-netflix-light-gray text-sm mb-2">@{selectedLive.streamer}</p>
                
                <div className="flex items-center space-x-4 text-netflix-light-gray text-sm">
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{formatViewers(viewerCounts[selectedLive.id] || selectedLive.base_viewers)}</span>
                  </div>
                  <span className="bg-netflix-gray px-2 py-1 rounded text-xs">{selectedLive.category}</span>
                </div>
              </div>
              
              {/* Time Remaining (Free Users) */}
              {!isPremiumUser(user!) && (
                <div className="glass-effect rounded-lg p-3 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-netflix-red" />
                      <span className="text-white text-sm">Tempo restante:</span>
                    </div>
                    <span className="text-netflix-red font-bold">{formatTime(remainingTime)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main App
  return (
    <div className="min-h-screen bg-netflix-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-effect border-b border-netflix-gray">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-2xl font-bold text-netflix-red">LiveVIP</h1>
          
          <div className="flex items-center space-x-4">
            {isPremiumUser(user!) && (
              <div className="flex items-center space-x-1 netflix-gradient px-3 py-1 rounded-full">
                <Crown className="w-4 h-4" />
                <span className="text-white text-sm font-bold">PREMIUM</span>
              </div>
            )}
            
            {!isPremiumUser(user!) && (
              <div className="flex items-center space-x-2 text-netflix-light-gray text-sm">
                <Clock className="w-4 h-4" />
                <span>{formatTime(remainingTime)} restantes</span>
              </div>
            )}
            
            <button
              onClick={handleLogout}
              className="p-2 text-netflix-light-gray hover:text-white transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Lives Grid */}
      <main className="p-4">
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-4">Lives em Destaque</h2>
          
          <div className="grid grid-cols-2 gap-4">
            {lives.map((live) => (
              <div
                key={live.id}
                onClick={() => handleLiveClick(live)}
                className="relative group cursor-pointer transform transition-all duration-300 hover:scale-105"
              >
                <div className="relative aspect-video rounded-lg overflow-hidden bg-netflix-dark-gray">
                  <img
                    src={live.thumbnail}
                    alt={live.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiMzMzMiLz48cGF0aCBkPSJNMTcwIDEzMEwyMzAgMTUwTDE3MCAyMDBWMTMwWiIgZmlsbD0iI0U1MDkxNCIvPjwvc3ZnPg==';
                    }}
                  />
                  
                  {/* Live Badge */}
                  <div className="absolute top-2 left-2 flex items-center space-x-1 bg-netflix-red px-2 py-1 rounded text-xs font-bold">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                    <span>AO VIVO</span>
                  </div>
                  
                  {/* Viewers Count */}
                  <div className="absolute top-2 right-2 glass-effect px-2 py-1 rounded text-xs flex items-center space-x-1">
                    <Users className="w-3 h-3" />
                    <span>{formatViewers(viewerCounts[live.id] || live.base_viewers)}</span>
                  </div>
                  
                  {/* Play Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <Play className="w-12 h-12 text-white" />
                  </div>
                </div>
                
                <div className="mt-2">
                  <h3 className="font-semibold text-sm line-clamp-2 mb-1">{live.title}</h3>
                  <p className="text-netflix-light-gray text-xs">@{live.streamer}</p>
                  <span className="inline-block bg-netflix-gray text-netflix-light-gray px-2 py-1 rounded text-xs mt-1">
                    {live.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-netflix-dark-gray rounded-lg p-6 w-full max-w-md fade-in">
            <h3 className="text-xl font-bold mb-4 text-center">Tempo Esgotado!</h3>
            <p className="text-netflix-light-gray text-center mb-6">
              Você usou seus 7 minutos gratuitos de hoje. Faça upgrade para continuar assistindo!
            </p>
            
            <div className="space-y-3 mb-6">
              <div className="bg-netflix-gray p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Semanal</span>
                  <span className="text-netflix-red font-bold">R$ 9,90</span>
                </div>
              </div>
              <div className="bg-netflix-gray p-4 rounded-lg border-2 border-netflix-red">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Mensal</span>
                  <span className="text-netflix-red font-bold">R$ 29,90</span>
                </div>
                <span className="text-xs text-green-400">Mais Popular</span>
              </div>
              <div className="bg-netflix-gray p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Anual</span>
                  <span className="text-netflix-red font-bold">R$ 299,90</span>
                </div>
                <span className="text-xs text-green-400">Economize 17%</span>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 bg-netflix-gray text-white p-3 rounded-lg font-semibold hover:bg-netflix-light-gray transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setShowUpgradeModal(false);
                  window.open(process.env.NEXT_PUBLIC_KIRVANO_CHECKOUT_URL, '_blank');
                }}
                className="flex-1 btn-netflix"
              >
                Assinar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
