'use client';

import { useState, useEffect } from 'react';
import AdminPanel from '@/components/AdminPanel';

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

export default function AdminDashboard() {
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [showAdminPanel, setShowAdminPanel] = useState(true);

  // Carregar streams do localStorage
  useEffect(() => {
    const savedStreams = localStorage.getItem('liveStreams');
    if (savedStreams) {
      try {
        const parsedStreams = JSON.parse(savedStreams);
        // Converter para o formato esperado pelo AdminPanel
        const convertedStreams: LiveStream[] = parsedStreams.map((stream: any) => ({
          id: stream.id,
          title: stream.title,
          thumbnail: stream.thumbnail,
          videoUrl: stream.video_url,
          viewerCount: stream.viewer_count,
          isLive: stream.is_live,
          streamerName: stream.streamer_name,
          streamerAvatar: stream.streamer_avatar,
          category: stream.category
        }));
        setStreams(convertedStreams);
      } catch (error) {
        console.error('Error loading streams:', error);
      }
    }
  }, []);

  const handleUpdateStreams = (updatedStreams: LiveStream[]) => {
    setStreams(updatedStreams);
    
    // Converter de volta para salvar no localStorage
    const streamsToSave = updatedStreams.map(stream => ({
      id: stream.id,
      title: stream.title,
      thumbnail: stream.thumbnail,
      video_url: stream.videoUrl,
      viewer_count: stream.viewerCount,
      is_live: stream.isLive,
      streamer_name: stream.streamerName,
      streamer_avatar: stream.streamerAvatar,
      category: stream.category,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    
    localStorage.setItem('liveStreams', JSON.stringify(streamsToSave));
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_authenticated');
    window.location.href = '/admin';
  };

  if (showAdminPanel) {
    return (
      <AdminPanel 
        streams={streams}
        onUpdateStreams={handleUpdateStreams}
        onClose={() => setShowAdminPanel(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-white">Painel Admin Dashboard</h1>
          <div className="flex space-x-4">
            <button
              onClick={() => setShowAdminPanel(true)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
            >
              Gerenciar Lives
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              Sair
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Estatísticas */}
          <div className="bg-white/10 rounded-lg p-6">
            <h3 className="text-white font-semibold mb-2">Lives Ativas</h3>
            <p className="text-3xl font-bold text-purple-400">{streams.length}</p>
          </div>
          
          <div className="bg-white/10 rounded-lg p-6">
            <h3 className="text-white font-semibold mb-2">Total Viewers</h3>
            <p className="text-3xl font-bold text-green-400">
              {streams.reduce((total, stream) => total + stream.viewerCount, 0).toLocaleString()}
            </p>
          </div>
          
          <div className="bg-white/10 rounded-lg p-6">
            <h3 className="text-white font-semibold mb-2">Status</h3>
            <p className="text-3xl font-bold text-blue-400">Online</p>
          </div>
        </div>
      </div>
    </div>
  );
}
