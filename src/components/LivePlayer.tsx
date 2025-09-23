'use client';

import { useState, useEffect } from 'react';
import { X, Users, Heart, Share, AlertCircle } from 'lucide-react';

interface LivePlayerProps {
  stream: {
    id: string;
    title: string;
    thumbnail: string;
    videoUrl: string;
    viewerCount: number;
    streamerName: string;
    streamerAvatar: string;
  };
  onClose: () => void;
}

export default function LivePlayer({ stream, onClose }: LivePlayerProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [viewerCount, setViewerCount] = useState(stream.viewerCount);
  const [showError, setShowError] = useState(false);

  // Simular oscilação de viewers
  useEffect(() => {
    const interval = setInterval(() => {
      setViewerCount(prev => {
        const variation = Math.floor(Math.random() * 20) - 10;
        return Math.max(1, prev + variation);
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: stream.title,
        text: `Assistindo: ${stream.title}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copiado!');
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-4 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src={stream.streamerAvatar}
              alt={stream.streamerName}
              className="w-10 h-10 rounded-full border-2 border-white/20"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMiIgZmlsbD0iIzY2NjY2NiIvPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTAiIHI9IjMiIGZpbGw9IndoaXRlIi8+PHBhdGggZD0iTTcgMThDNyAxNS4yMzkgOS4yMzkgMTMgMTIgMTNTMTcgMTUuMjM5IDE3IDE4IiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjwvc3ZnPg==';
              }}
            />
            <div>
              <h3 className="text-white font-semibold">{stream.streamerName}</h3>
              <p className="text-white/60 text-sm">{stream.title}</p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="w-10 h-10 bg-white/10 backdrop-blur rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Video Player */}
      <div className="absolute inset-0 flex items-center justify-center">
        {stream.videoUrl && !showError ? (
          <video
            src={stream.videoUrl}
            className="w-full h-full object-contain"
            controls
            autoPlay
            onError={() => setShowError(true)}
          />
        ) : (
          <div className="text-center">
            <img
              src={stream.thumbnail}
              alt={stream.title}
              className="max-w-full max-h-[60vh] rounded-lg mb-4"
            />
            <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4 max-w-sm mx-auto">
              <AlertCircle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-white text-sm">
                Live em modo preview. Conteúdo completo disponível para assinantes premium.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsLiked(!isLiked)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-colors ${
                isLiked 
                  ? 'bg-red-500 text-white' 
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              <span className="text-sm font-medium">Curtir</span>
            </button>
            
            <button
              onClick={handleShare}
              className="flex items-center space-x-2 px-4 py-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <Share className="w-5 h-5" />
              <span className="text-sm font-medium">Compartilhar</span>
            </button>
          </div>
          
          <div className="flex items-center space-x-2 bg-black/50 px-3 py-2 rounded-full">
            <Users className="w-4 h-4 text-white/60" />
            <span className="text-white text-sm font-medium">
              {viewerCount.toLocaleString('pt-BR')} assistindo
            </span>
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
