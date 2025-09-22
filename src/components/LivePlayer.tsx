'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Play, Pause, Volume2, VolumeX, MessageCircle, Heart, Share2, Users, Crown, Maximize2, Minimize2 } from 'lucide-react';

interface LivePlayerProps {
  stream: {
    id: string;
    title: string;
    videoUrl: string;
    viewerCount: number;
    streamerName: string;
    streamerAvatar: string;
    thumbnail: string;
  };
  onClose: () => void;
  isPremium: boolean;
  watchTime: number;
}

interface Comment {
  id: string;
  user: string;
  message: string;
  timestamp: number;
  avatar: string;
}

export default function LivePlayer({ stream, onClose, isPremium, watchTime }: LivePlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [likes, setLikes] = useState(Math.floor(Math.random() * 500) + 100);
  const [hasLiked, setHasLiked] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasVideoError, setHasVideoError] = useState(false);

  // Comentários simulados
  const simulatedComments = [
    { user: 'João123', message: 'Que show incrível! 🔥', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face' },
    { user: 'Maria_VIP', message: 'Melhor live da semana!', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=50&h=50&fit=crop&crop=face' },
    { user: 'Pedro_Fan', message: 'Quando vai ser a próxima?', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face' },
    { user: 'Ana_Live', message: 'Conteúdo premium mesmo! 💎', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop&crop=face' },
    { user: 'Carlos_VIP', message: 'Vale muito a pena ser premium', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=50&h=50&fit=crop&crop=face' }
  ];

  // Adicionar comentários simulados periodicamente
  useEffect(() => {
    const interval = setInterval(() => {
      const randomComment = simulatedComments[Math.floor(Math.random() * simulatedComments.length)];
      const newComment: Comment = {
        id: Date.now().toString(),
        user: randomComment.user,
        message: randomComment.message,
        timestamp: Date.now(),
        avatar: randomComment.avatar
      };
      
      setComments(prev => [...prev.slice(-20), newComment]);
    }, Math.random() * 10000 + 5000);

    return () => clearInterval(interval);
  }, []);

  // Configurar vídeo quando componente montar
  useEffect(() => {
    const video = videoRef.current;
    if (video && stream.videoUrl) {
      // Configurações do vídeo
      video.muted = isMuted;
      video.volume = volume;
      video.playsInline = true;
      video.controls = false;
      
      // Event listeners do vídeo
      const handleLoadedData = () => {
        console.log('✅ Video loaded successfully');
        setHasVideoError(false);
      };
      
      const handleError = (e: any) => {
        console.error('❌ Video error:', e);
        setHasVideoError(true);
      };
      
      const handlePlay = () => setIsPlaying(true);
      const handlePause = () => setIsPlaying(false);
      
      video.addEventListener('loadeddata', handleLoadedData);
      video.addEventListener('error', handleError);
      video.addEventListener('play', handlePlay);
      video.addEventListener('pause', handlePause);
      
      // Tentar reproduzir automaticamente
      setTimeout(() => {
        video.play().catch(error => {
          console.log('Autoplay prevented:', error);
          setIsPlaying(false);
        });
      }, 500);
      
      return () => {
        video.removeEventListener('loadeddata', handleLoadedData);
        video.removeEventListener('error', handleError);
        video.removeEventListener('play', handlePlay);
        video.removeEventListener('pause', handlePause);
      };
    }
  }, [stream.videoUrl, isMuted, volume]);

  // Auto-hide controls
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (showControls) {
      timeout = setTimeout(() => setShowControls(false), 3000);
    }
    return () => clearTimeout(timeout);
  }, [showControls]);

  const togglePlay = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (isPlaying) {
        await video.pause();
      } else {
        await video.play();
      }
    } catch (error) {
      console.error('Error toggling play:', error);
      setHasVideoError(true);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (video) {
      video.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    const video = videoRef.current;
    if (video) {
      video.volume = newVolume;
      if (newVolume === 0) {
        setIsMuted(true);
        video.muted = true;
      } else if (isMuted) {
        setIsMuted(false);
        video.muted = false;
      }
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleLike = () => {
    if (!hasLiked) {
      setLikes(prev => prev + 1);
      setHasLiked(true);
    }
  };

  const handleAddComment = () => {
    if (newComment.trim() && !isPremium) {
      alert('Upgrade para Premium para comentar sem limites!');
      return;
    }
    
    if (newComment.trim()) {
      const comment: Comment = {
        id: Date.now().toString(),
        user: 'Você',
        message: newComment,
        timestamp: Date.now(),
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=50&h=50&fit=crop&crop=face'
      };
      setComments(prev => [...prev, comment]);
      setNewComment('');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const remainingTime = 300 - watchTime;

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Video Container */}
      <div 
        className="relative w-full h-full"
        onClick={() => setShowControls(true)}
      >
        {/* Video Element ou Fallback */}
        {stream.videoUrl && !hasVideoError ? (
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            src={stream.videoUrl}
            poster={stream.thumbnail}
            playsInline
            muted={isMuted}
            loop
          />
        ) : (
          // Fallback: mostrar thumbnail como imagem
          <div 
            className="w-full h-full bg-cover bg-center relative"
            style={{ backgroundImage: `url(${stream.thumbnail})` }}
          >
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <Play className="w-8 h-8 text-white ml-1" />
                </div>
                <p className="text-white/80">Live Stream</p>
                <p className="text-sm text-white/60 mt-2">{stream.title}</p>
                {hasVideoError && (
                  <p className="text-xs text-yellow-400 mt-2">
                    Vídeo indisponível - Mostrando preview
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Live Indicator */}
        <div className="absolute top-4 left-4 bg-red-500 px-3 py-1 rounded-full text-sm font-bold flex items-center space-x-2">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span>AO VIVO</span>
        </div>

        {/* Viewer Count */}
        <div className="absolute top-4 right-16 bg-black/70 px-3 py-1 rounded-full text-sm flex items-center space-x-2">
          <Users className="w-4 h-4" />
          <span>{stream.viewerCount}</span>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 bg-black/70 rounded-full flex items-center justify-center hover:bg-black/90 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Timer for Free Users */}
        {!isPremium && (
          <div className="absolute top-16 right-4 bg-red-500 px-3 py-1 rounded-full text-sm font-bold">
            {formatTime(remainingTime)} restantes
          </div>
        )}

        {/* Controls Overlay */}
        {showControls && (
          <div className="absolute inset-0 bg-black/30">
            {/* Center Play Button */}
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                onClick={togglePlay}
                className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-white/30 transition-colors"
              >
                {isPlaying ? (
                  <Pause className="w-8 h-8 text-white" />
                ) : (
                  <Play className="w-8 h-8 text-white ml-1" />
                )}
              </button>
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <img
                    src={stream.streamerAvatar}
                    alt={stream.streamerName}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <p className="font-semibold">{stream.streamerName}</p>
                    <p className="text-sm text-gray-300">{stream.title}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  {/* Volume Controls */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={toggleMute}
                      className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                    >
                      {isMuted || volume === 0 ? (
                        <VolumeX className="w-4 h-4" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={volume}
                      onChange={handleVolumeChange}
                      className="w-16 accent-purple-500"
                    />
                  </div>

                  {/* Fullscreen Button */}
                  <button
                    onClick={toggleFullscreen}
                    className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                  >
                    {isFullscreen ? (
                      <Minimize2 className="w-4 h-4" />
                    ) : (
                      <Maximize2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Side Actions */}
        <div className="absolute right-4 bottom-32 flex flex-col space-y-4">
          <button
            onClick={handleLike}
            className={`w-12 h-12 rounded-full flex flex-col items-center justify-center transition-all ${
              hasLiked ? 'bg-red-500' : 'bg-white/20 hover:bg-white/30'
            }`}
          >
            <Heart className={`w-6 h-6 ${hasLiked ? 'fill-white' : ''}`} />
            <span className="text-xs mt-1">{likes}</span>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className="w-12 h-12 bg-white/20 rounded-full flex flex-col items-center justify-center hover:bg-white/30 transition-colors"
          >
            <MessageCircle className="w-6 h-6" />
            <span className="text-xs mt-1">{comments.length}</span>
          </button>

          <button className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
            <Share2 className="w-6 h-6" />
          </button>

          {!isPremium && (
            <button 
              onClick={() => alert('Upgrade para Premium para recursos exclusivos!')}
              className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center hover:scale-110 transition-transform"
            >
              <Crown className="w-6 h-6 text-black" />
            </button>
          )}
        </div>

        {/* Comments Panel */}
        {showComments && (
          <div className="absolute bottom-0 left-0 right-0 h-80 bg-black/90 backdrop-blur-sm">
            <div className="p-4 h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold">Chat ao Vivo ({comments.length})</h3>
                <button
                  onClick={() => setShowComments(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Comments List */}
              <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex items-start space-x-2">
                    <img
                      src={comment.avatar}
                      alt={comment.user}
                      className="w-6 h-6 rounded-full"
                    />
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-semibold text-purple-400">{comment.user}</span>
                        <span className="ml-2">{comment.message}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Comment Input */}
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={isPremium ? "Digite seu comentário..." : "Upgrade para comentar"}
                  disabled={!isPremium}
                  className="flex-1 bg-gray-800 rounded-full px-4 py-2 text-sm disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                />
                <button
                  onClick={handleAddComment}
                  disabled={!isPremium}
                  className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center disabled:opacity-50 hover:bg-purple-600 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
