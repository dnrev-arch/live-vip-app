'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Edit, Trash2, Users, Eye, Save, Crown, RefreshCw, CheckCircle, Camera } from 'lucide-react';

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

export default function AdminPage() {
  const [editingStream, setEditingStream] = useState<LiveStream | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStream, setNewStream] = useState<Partial<LiveStream>>({
    title: '',
    thumbnail: '',
    videoUrl: '',
    viewerCount: 0,
    streamerName: '',
    streamerAvatar: '',
    category: ''
  });

  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<number>(Date.now());
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);

  // URLs de avatar sugeridos
  const suggestedAvatars = [
    'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face'
  ];

  const loadStreamsFromStorage = (): LiveStream[] => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('liveStreams');
      if (stored) {
        return JSON.parse(stored);
      }
    }
    return [];
  };

  const saveStreamsToStorage = (streams: LiveStream[]) => {
    if (typeof window === 'undefined') return;
    
    setSyncStatus('syncing');
    
    try {
      localStorage.setItem('liveStreams', JSON.stringify(streams));
      localStorage.setItem('forceRefresh', Date.now().toString());
      localStorage.setItem('lastUpdate', Date.now().toString());
      localStorage.setItem('adminUpdate', 'true');
      
      setTimeout(() => {
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'liveStreams',
          newValue: JSON.stringify(streams),
          storageArea: localStorage
        }));
      }, 100);
      
      setTimeout(() => {
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'forceRefresh', 
          newValue: Date.now().toString(),
          storageArea: localStorage
        }));
      }, 200);
      
      setTimeout(() => {
        const newTab = window.open('/', '_blank');
        if (newTab) {
          setTimeout(() => newTab.close(), 2000);
        }
      }, 500);
      
      setSyncStatus('success');
      setLastSyncTime(Date.now());
      
      console.log('✅ Streams saved and synced:', streams.length);
      
    } catch (error) {
      console.error('❌ Error saving streams:', error);
      setSyncStatus('error');
    }
    
    setTimeout(() => setSyncStatus('idle'), 3000);
  };

  useEffect(() => {
    const streams = loadStreamsFromStorage();
    setLiveStreams(streams);
    console.log('📊 Admin loaded streams:', streams.length);
  }, []);

  const forceSync = () => {
    setSyncStatus('syncing');
    
    setTimeout(() => {
      localStorage.setItem('forceRefresh', Date.now().toString());
      localStorage.setItem('adminForceSync', Date.now().toString());
      
      window.dispatchEvent(new CustomEvent('adminForceSync', {
        detail: { streams: liveStreams, timestamp: Date.now() }
      }));
      
      const popup = window.open('/?sync=' + Date.now(), '_blank', 'width=1,height=1');
      if (popup) {
        setTimeout(() => popup.close(), 1000);
      }
      
      setSyncStatus('success');
      console.log('🚀 Force sync triggered');
      
    }, 500);
    
    setTimeout(() => setSyncStatus('idle'), 2000);
  };

  const handleAddStream = () => {
    if (newStream.title && newStream.thumbnail && newStream.streamerName) {
      const stream: LiveStream = {
        id: Date.now().toString(),
        title: newStream.title || '',
        thumbnail: newStream.thumbnail || '',
        videoUrl: newStream.videoUrl || '',
        viewerCount: newStream.viewerCount || Math.floor(Math.random() * 200) + 50,
        isLive: true,
        streamerName: newStream.streamerName || '',
        streamerAvatar: newStream.streamerAvatar || suggestedAvatars[0],
        category: newStream.category || 'Entretenimento'
      };
      
      const updatedStreams = [...liveStreams, stream];
      setLiveStreams(updatedStreams);
      saveStreamsToStorage(updatedStreams);
      
      setNewStream({
        title: '',
        thumbnail: '',
        videoUrl: '',
        viewerCount: 0,
        streamerName: '',
        streamerAvatar: '',
        category: ''
      });
      setShowAddForm(false);
      
      alert('✅ Live adicionada! Verifique no site em nova guia.');
    }
  };

  const handleEditStream = (stream: LiveStream) => {
    setEditingStream({ ...stream });
  };

  const handleSaveEdit = () => {
    if (editingStream) {
      const updatedStreams = liveStreams.map(stream =>
        stream.id === editingStream.id ? editingStream : stream
      );
      setLiveStreams(updatedStreams);
      saveStreamsToStorage(updatedStreams);
      setEditingStream(null);
      alert('✅ Live atualizada!');
    }
  };

  const handleDeleteStream = (id: string) => {
    if (confirm('Tem certeza que deseja remover esta live?')) {
      const updatedStreams = liveStreams.filter(stream => stream.id !== id);
      setLiveStreams(updatedStreams);
      saveStreamsToStorage(updatedStreams);
      alert('✅ Live removida!');
    }
  };

  const handleViewerCountChange = (id: string, newCount: number) => {
    const updatedStreams = liveStreams.map(stream =>
      stream.id === id ? { ...stream, viewerCount: newCount } : stream
    );
    setLiveStreams(updatedStreams);
    saveStreamsToStorage(updatedStreams);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-6">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center space-x-3">
            <Crown className="w-8 h-8 text-yellow-400" />
            <div>
              <h1 className="text-2xl font-bold">PAINEL ADMINISTRATIVO</h1>
              <p className="text-white/80">LIVE VIP - Controle Total</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              {syncStatus === 'syncing' && (
                <div className="flex items-center space-x-2 text-blue-400">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Sincronizando...</span>
                </div>
              )}
              {syncStatus === 'success' && (
                <div className="flex items-center space-x-2 text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">Sincronizado!</span>
                </div>
              )}
            </div>
            
            <a 
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/20 px-4 py-2 rounded-lg hover:bg-white/30 transition-colors"
            >
              Ver Site
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        {/* Sync Status Bar */}
        <div className="mb-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white">🔄 Sincronização</h3>
              <p className="text-sm text-white/80">
                Última sincronização: {new Date(lastSyncTime).toLocaleTimeString('pt-BR')}
              </p>
              <p className="text-xs text-white/60">
                Lives no storage: {liveStreams.length}
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={forceSync}
                disabled={syncStatus === 'syncing'}
                className="bg-green-500 hover:bg-green-600 disabled:opacity-50 px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                <span>Forçar Sync</span>
              </button>
              
              <button
                onClick={() => window.open('/', '_blank')}
                className="bg-purple-500 hover:bg-purple-600 px-4 py-2 rounded-lg transition-colors"
              >
                🔗 Abrir Site
              </button>
            </div>
          </div>
        </div>

        {/* Add New Stream Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2 hover:from-purple-600 hover:to-pink-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Adicionar Nova Live</span>
          </button>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="bg-gray-900 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-bold mb-4">Nova Live</h3>
            
            {/* Primeira linha - Info básica */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                placeholder="Título da live"
                value={newStream.title}
                onChange={(e) => setNewStream(prev => ({ ...prev, title: e.target.value }))}
                className="bg-gray-800 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
              <input
                type="text"
                placeholder="Nome do streamer"
                value={newStream.streamerName}
                onChange={(e) => setNewStream(prev => ({ ...prev, streamerName: e.target.value }))}
                className="bg-gray-800 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            {/* Segunda linha - Imagens */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2">Thumbnail da Live</label>
                <input
                  type="url"
                  placeholder="URL da thumbnail (imagem de capa)"
                  value={newStream.thumbnail}
                  onChange={(e) => setNewStream(prev => ({ ...prev, thumbnail: e.target.value }))}
                  className="bg-gray-800 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:outline-none w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Avatar do Streamer</label>
                <div className="space-y-2">
                  <input
                    type="url"
                    placeholder="URL do avatar do streamer"
                    value={newStream.streamerAvatar}
                    onChange={(e) => setNewStream(prev => ({ ...prev, streamerAvatar: e.target.value }))}
                    className="bg-gray-800 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:outline-none w-full"
                  />
                  
                  {/* Preview do avatar */}
                  <div className="flex items-center space-x-2">
                    <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
                      {newStream.streamerAvatar ? (
                        <img
                          src={newStream.streamerAvatar}
                          alt="Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling!.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <Camera className="w-5 h-5 text-gray-400" />
                    </div>
                    <span className="text-xs text-gray-400">Preview do avatar</span>
                  </div>
                  
                  {/* Avatares sugeridos */}
                  <div>
                    <p className="text-xs text-gray-400 mb-2">Ou escolha um avatar:</p>
                    <div className="flex space-x-2 overflow-x-auto">
                      {suggestedAvatars.map((avatar, index) => (
                        <button
                          key={index}
                          onClick={() => setNewStream(prev => ({ ...prev, streamerAvatar: avatar }))}
                          className="w-8 h-8 rounded-full overflow-hidden hover:ring-2 hover:ring-purple-500 transition-all flex-shrink-0"
                        >
                          <img
                            src={avatar}
                            alt={`Avatar ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Terceira linha - Outros campos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <input
                type="url"
                placeholder="URL do vídeo (opcional)"
                value={newStream.videoUrl}
                onChange={(e) => setNewStream(prev => ({ ...prev, videoUrl: e.target.value }))}
                className="bg-gray-800 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
              <input
                type="number"
                placeholder="Viewers base (ex: 100)"
                value={newStream.viewerCount}
                onChange={(e) => setNewStream(prev => ({ ...prev, viewerCount: parseInt(e.target.value) || 0 }))}
                className="bg-gray-800 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
              <select
                value={newStream.category}
                onChange={(e) => setNewStream(prev => ({ ...prev, category: e.target.value }))}
                className="bg-gray-800 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              >
                <option value="">Selecione categoria</option>
                <option value="Entretenimento">Entretenimento</option>
                <option value="Música">Música</option>
                <option value="Lifestyle">Lifestyle</option>
                <option value="Fitness">Fitness</option>
                <option value="Games">Games</option>
              </select>
            </div>

            {/* Dica sobre viewers */}
            <div className="bg-blue-500/20 rounded-lg p-3 mb-4 border border-blue-500/30">
              <p className="text-sm text-blue-400">💡 Dica sobre Viewers:</p>
              <p className="text-xs text-gray-300 mt-1">
                O número inserido será a base. Durante a live, oscilará ±20% para parecer real.
                Ex: Se colocar 100, variará entre 80-120 viewers.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleAddStream}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
              >
                Adicionar
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Streams List */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold">Lives Ativas ({liveStreams.length})</h3>
          
          {liveStreams.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>Nenhuma live encontrada.</p>
              <p className="text-sm mt-2">Adicione sua primeira live usando o botão acima.</p>
            </div>
          ) : (
            liveStreams.map((stream) => (
              <div key={stream.id} className="bg-gray-900 rounded-lg p-4">
                {editingStream?.id === stream.id ? (
                  // Edit Mode
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        value={editingStream.title}
                        onChange={(e) => setEditingStream(prev => prev ? { ...prev, title: e.target.value } : null)}
                        className="bg-gray-800 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        placeholder="Título da live"
                      />
                      <input
                        type="text"
                        value={editingStream.streamerName}
                        onChange={(e) => setEditingStream(prev => prev ? { ...prev, streamerName: e.target.value } : null)}
                        className="bg-gray-800 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        placeholder="Nome do streamer"
                      />
                      <input
                        type="url"
                        value={editingStream.streamerAvatar}
                        onChange={(e) => setEditingStream(prev => prev ? { ...prev, streamerAvatar: e.target.value } : null)}
                        className="bg-gray-800 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        placeholder="URL do avatar"
                      />
                      <input
                        type="number"
                        value={editingStream.viewerCount}
                        onChange={(e) => setEditingStream(prev => prev ? { ...prev, viewerCount: parseInt(e.target.value) || 0 } : null)}
                        className="bg-gray-800 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        placeholder="Viewers base"
                      />
                      <input
                        type="url"
                        value={editingStream.thumbnail}
                        onChange={(e) => setEditingStream(prev => prev ? { ...prev, thumbnail: e.target.value } : null)}
                        className="bg-gray-800 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        placeholder="URL da thumbnail"
                      />
                      <select
                        value={editingStream.category}
                        onChange={(e) => setEditingStream(prev => prev ? { ...prev, category: e.target.value } : null)}
                        className="bg-gray-800 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      >
                        <option value="Entretenimento">Entretenimento</option>
                        <option value="Música">Música</option>
                        <option value="Lifestyle">Lifestyle</option>
                        <option value="Fitness">Fitness</option>
                        <option value="Games">Games</option>
                      </select>
                    </div>
                    
                    {/* Preview durante edição */}
                    <div className="bg-gray-800 rounded-lg p-3">
                      <p className="text-sm text-gray-400 mb-2">Preview:</p>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-700 rounded-full overflow-hidden">
                          {editingStream.streamerAvatar ? (
                            <img src={editingStream.streamerAvatar} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Camera className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold">{editingStream.streamerName || 'Nome do streamer'}</p>
                          <p className="text-sm text-gray-400">{editingStream.title || 'Título da live'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={handleSaveEdit}
                        className="bg-green-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-600 transition-colors"
                      >
                        <Save className="w-4 h-4" />
                        <span>Salvar</span>
                      </button>
                      <button
                        onClick={() => setEditingStream(null)}
                        className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <img
                        src={stream.thumbnail}
                        alt={stream.title}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div className="flex items-center space-x-3">
                        <img
                          src={stream.streamerAvatar}
                          alt={stream.streamerName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <h4 className="font-semibold">{stream.title}</h4>
                          <p className="text-sm text-gray-400">{stream.streamerName} • {stream.category}</p>
                          <div className="flex items-center space-x-4 mt-1">
                            <div className="flex items-center space-x-1 text-sm text-gray-400">
                              <Users className="w-4 h-4" />
                              <span>{stream.viewerCount} base</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Eye className="w-4 h-4 text-gray-400" />
                              <input
                                type="number"
                                value={stream.viewerCount}
                                onChange={(e) => handleViewerCountChange(stream.id, parseInt(e.target.value) || 0)}
                                className="bg-gray-800 rounded px-2 py-1 text-sm w-20 focus:ring-1 focus:ring-purple-500 focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditStream(stream)}
                        className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteStream(stream.id)}
                        className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Debug e Instruções */}
        <div className="mt-8 space-y-4">
          {/* Debug Info */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h4 className="font-semibold mb-2 text-gray-300">🔧 Debug Info:</h4>
            <div className="text-sm text-gray-400 space-y-1">
              <p>• Lives no estado: {liveStreams.length}</p>
              <p>• LocalStorage key: liveStreams</p>
              <p>• Última sync: {new Date(lastSyncTime).toLocaleString('pt-BR')}</p>
              <button 
                onClick={() => {
                  console.log('Current localStorage:', localStorage.getItem('liveStreams'));
                  alert('Veja o console para debug');
                }}
                className="mt-2 bg-gray-600 px-3 py-1 rounded text-xs hover:bg-gray-500"
              >
                Ver LocalStorage
              </button>
            </div>
          </div>

          {/* Instruções */}
          <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-500/30">
            <h4 className="font-semibold mb-2 text-blue-400">📋 Instruções:</h4>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Use URLs de imagens públicas (Unsplash recomendado)</li>
              <li>• Avatar do streamer aparece junto com o nome nas lives</li>
              <li>• Viewers oscilam ±20% do valor base automaticamente</li>
              <li>• Clique "Forçar Sync" se mudanças não aparecerem no mobile</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
