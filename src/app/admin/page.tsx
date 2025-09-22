'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Edit, Trash2, Users, Eye, Save, Crown, RefreshCw, CheckCircle } from 'lucide-react';

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

  // Novos states para melhorar sync
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<number>(Date.now());

  // Função para carregar lives do localStorage
  const loadStreamsFromStorage = (): LiveStream[] => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('liveStreams');
      if (stored) {
        return JSON.parse(stored);
      }
    }
    // Lives padrão se não houver nada salvo
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

  // Função melhorada para salvar no localStorage
  const saveStreamsToStorage = (streams: LiveStream[]) => {
    if (typeof window !== 'undefined') {
      try {
        // Salvar streams
        localStorage.setItem('liveStreams', JSON.stringify(streams));
        
        // Criar um timestamp de força de sync
        localStorage.setItem('forceRefresh', Date.now().toString());
        
        // Trigger do storage event manualmente para mesma aba
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'liveStreams',
          newValue: JSON.stringify(streams),
          oldValue: null,
          storageArea: localStorage
        }));

        setSyncStatus('success');
        setLastSyncTime(Date.now());
        
        // Reset status após 2 segundos
        setTimeout(() => setSyncStatus('idle'), 2000);
        
        console.log('✅ Streams saved successfully:', streams.length);
        
      } catch (error) {
        console.error('❌ Error saving streams:', error);
        setSyncStatus('error');
        setTimeout(() => setSyncStatus('idle'), 2000);
      }
    }
  };

  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);

  // Carregar streams quando componente montar
  useEffect(() => {
    setLiveStreams(loadStreamsFromStorage());
  }, []);

  // Função para forçar sincronização
  const forceSync = () => {
    setSyncStatus('syncing');
    
    // Simular delay para feedback visual
    setTimeout(() => {
      localStorage.setItem('forceRefresh', Date.now().toString());
      
      // Trigger multiple events para garantir
      ['storage', 'liveStreamsUpdate'].forEach(eventType => {
        window.dispatchEvent(new CustomEvent(eventType, {
          detail: { streams: liveStreams, timestamp: Date.now() }
        }));
      });
      
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 2000);
    }, 500);
  };

  // Função melhorada para adicionar stream
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
        streamerAvatar: newStream.streamerAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face',
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
      
      // Feedback melhorado
      alert('✅ Live adicionada com sucesso! Sincronizando com o site...');
    }
  };

  const handleEditStream = (stream: LiveStream) => {
    setEditingStream({ ...stream });
  };

  // Função melhorada para salvar edição
  const handleSaveEdit = () => {
    if (editingStream) {
      const updatedStreams = liveStreams.map(stream =>
        stream.id === editingStream.id ? editingStream : stream
      );
      setLiveStreams(updatedStreams);
      saveStreamsToStorage(updatedStreams);
      setEditingStream(null);
      alert('✅ Live atualizada e sincronizada!');
    }
  };

  // Função melhorada para deletar stream
  const handleDeleteStream = (id: string) => {
    if (confirm('Tem certeza que deseja remover esta live?')) {
      const updatedStreams = liveStreams.filter(stream => stream.id !== id);
      setLiveStreams(updatedStreams);
      saveStreamsToStorage(updatedStreams);
      alert('✅ Live removida e sincronizada!');
    }
  };

  // Função melhorada para alterar viewer count
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
            {/* Status de Sync */}
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
              {syncStatus === 'error' && (
                <div className="flex items-center space-x-2 text-red-400">
                  <X className="w-4 h-4" />
                  <span className="text-sm">Erro na sync</span>
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
        <div className="mb-6 bg-gray-900 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-green-400">Status de Sincronização</h3>
              <p className="text-sm text-gray-400">
                Última sincronização: {new Date(lastSyncTime).toLocaleTimeString('pt-BR')}
              </p>
            </div>
            <button
              onClick={forceSync}
              disabled={syncStatus === 'syncing'}
              className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
              <span>Forçar Sync</span>
            </button>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <input
                type="url"
                placeholder="URL da thumbnail (imagem de capa)"
                value={newStream.thumbnail}
                onChange={(e) => setNewStream(prev => ({ ...prev, thumbnail: e.target.value }))}
                className="bg-gray-800 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
              <input
                type="url"
                placeholder="URL do seu vídeo (opcional)"
                value={newStream.videoUrl}
                onChange={(e) => setNewStream(prev => ({ ...prev, videoUrl: e.target.value }))}
                className="bg-gray-800 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
              <input
                type="number"
                placeholder="Número de viewers"
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
            <div className="flex space-x-3 mt-4">
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
          
          {liveStreams.map((stream) => (
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
                    />
                    <input
                      type="text"
                      value={editingStream.streamerName}
                      onChange={(e) => setEditingStream(prev => prev ? { ...prev, streamerName: e.target.value } : null)}
                      className="bg-gray-800 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                    <input
                      type="number"
                      value={editingStream.viewerCount}
                      onChange={(e) => setEditingStream(prev => prev ? { ...prev, viewerCount: parseInt(e.target.value) || 0 } : null)}
                      className="bg-gray-800 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
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
                    <div>
                      <h4 className="font-semibold">{stream.title}</h4>
                      <p className="text-sm text-gray-400">{stream.streamerName} • {stream.category}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <div className="flex items-center space-x-1 text-sm text-gray-400">
                          <Users className="w-4 h-4" />
                          <span>{stream.viewerCount}</span>
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
          ))}
        </div>

        {/* Instructions melhoradas */}
        <div className="mt-8 bg-blue-500/20 rounded-lg p-4 border border-blue-500/30">
          <h4 className="font-semibold mb-2 text-blue-400">Instruções de Uso:</h4>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• Use URLs de imagens públicas para thumbnails (Unsplash, Pexels, etc.)</li>
            <li>• O número de viewers pode ser editado em tempo real</li>
            <li>• URLs de vídeo são opcionais (para simulação de live)</li>
            <li>• Todas as alterações são aplicadas imediatamente</li>
            <li>• Para voltar ao site público, clique em "Ver Site"</li>
            <li>• Use "Forçar Sync" se as mudanças não aparecerem no mobile</li>
          </ul>
          
          {/* Instruções para mobile */}
          <div className="mt-4 p-3 bg-yellow-500/20 rounded border border-yellow-500/30">
            <h5 className="font-semibold text-yellow-400 mb-1">📱 Para Mobile:</h5>
            <ul className="text-xs text-gray-300 space-y-1">
              <li>1. Faça as alterações aqui no admin</li>
              <li>2. Clique em "Forçar Sync" se necessário</li>
              <li>3. No mobile, puxe a tela para baixo para atualizar</li>
              <li>4. Se ainda não funcionar, feche e reabra o app</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
