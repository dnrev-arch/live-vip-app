'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Edit, Trash2, Users, Eye, Save, Crown, RefreshCw, CheckCircle } from 'lucide-react';

// ... interfaces permanecem iguais

export default function AdminPage() {
  // ... states existentes
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<number>(Date.now());

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

  // ... resto das funções permanecem iguais

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

        {/* ... resto do código permanece igual, apenas as funções de salvar foram melhoradas ... */}

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
