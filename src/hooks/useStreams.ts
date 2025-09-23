import { useState, useEffect, useCallback } from 'react';
import { LiveStream, StreamFormData, UseStreamsReturn, StorageKeys } from '@/types';

export function useStreams(): UseStreamsReturn {
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  // Função para buscar streams da API com fallback
  const loadStreams = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!apiUrl) {
        throw new Error('API URL not configured');
      }

      const response = await fetch(`${apiUrl}/api/streams`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const apiStreams = await response.json();
      
      // Validar estrutura dos dados
      if (!Array.isArray(apiStreams)) {
        throw new Error('Invalid API response format');
      }

      setStreams(apiStreams);
      
      // Backup no localStorage
      localStorage.setItem(StorageKeys.LIVE_STREAMS, JSON.stringify(apiStreams));
      localStorage.setItem(StorageKeys.LAST_API_UPDATE, new Date().toISOString());
      
    } catch (err) {
      console.warn('API unavailable, using localStorage:', err);
      
      // Fallback para localStorage
      const savedStreams = localStorage.getItem(StorageKeys.LIVE_STREAMS);
      if (savedStreams) {
        try {
          const localStreams = JSON.parse(savedStreams);
          setStreams(Array.isArray(localStreams) ? localStreams : []);
        } catch (parseError) {
          console.error('Error parsing localStorage data:', parseError);
          setStreams([]);
        }
      } else {
        setStreams([]);
      }
      
      setError(err instanceof Error ? err.message : 'Failed to load streams');
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  // Função para criar stream
  const createStream = useCallback(async (data: StreamFormData): Promise<LiveStream> => {
    const newStream: LiveStream = {
      id: `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...data,
      is_live: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    let apiSuccess = false;

    // Tentar salvar na API
    try {
      if (apiUrl) {
        const response = await fetch(`${apiUrl}/api/streams`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newStream),
        });

        if (response.ok) {
          const apiStream = await response.json();
          apiSuccess = true;
          
          // Usar dados da API se disponível
          const finalStream = apiStream.id ? apiStream : newStream;
          setStreams(prev => [...prev, finalStream]);
          
          // Backup no localStorage
          const updatedStreams = [...streams, finalStream];
          localStorage.setItem(StorageKeys.LIVE_STREAMS, JSON.stringify(updatedStreams));
          
          return finalStream;
        }
      }
    } catch (error) {
      console.warn('Failed to create stream in API:', error);
    }

    // Fallback para localStorage
    if (!apiSuccess) {
      setStreams(prev => [...prev, newStream]);
      const updatedStreams = [...streams, newStream];
      localStorage.setItem(StorageKeys.LIVE_STREAMS, JSON.stringify(updatedStreams));
    }

    return newStream;
  }, [apiUrl, streams]);

  // Função para atualizar stream
  const updateStream = useCallback(async (id: string, data: Partial<StreamFormData>): Promise<LiveStream> => {
    const existingStream = streams.find(s => s.id === id);
    if (!existingStream) {
      throw new Error('Stream not found');
    }

    const updatedStream: LiveStream = {
      ...existingStream,
      ...data,
      updated_at: new Date().toISOString(),
    };

    let apiSuccess = false;

    // Tentar atualizar na API
    try {
      if (apiUrl) {
        const response = await fetch(`${apiUrl}/api/streams/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedStream),
        });

        if (response.ok) {
          apiSuccess = true;
        }
      }
    } catch (error) {
      console.warn('Failed to update stream in API:', error);
    }

    // Atualizar localmente
    const newStreams = streams.map(s => s.id === id ? updatedStream : s);
    setStreams(newStreams);
    localStorage.setItem(StorageKeys.LIVE_STREAMS, JSON.stringify(newStreams));

    return updatedStream;
  }, [apiUrl, streams]);

  // Função para deletar stream
  const deleteStream = useCallback(async (id: string): Promise<void> => {
    // Tentar deletar da API
    try {
      if (apiUrl) {
        await fetch(`${apiUrl}/api/streams/${id}`, {
          method: 'DELETE',
        });
      }
    } catch (error) {
      console.warn('Failed to delete stream from API:', error);
    }

    // Deletar localmente
    const newStreams = streams.filter(s => s.id !== id);
    setStreams(newStreams);
    localStorage.setItem(StorageKeys.LIVE_STREAMS, JSON.stringify(newStreams));
  }, [apiUrl, streams]);

  // Função para atualizar com variação de viewers
  const refreshStreams = useCallback(async () => {
    const addViewerVariation = (streamList: LiveStream[]): LiveStream[] => {
      return streamList.map(stream => {
        const baseCount = stream.viewer_count;
        const variation = Math.floor(baseCount * 0.1); // ±10% variation
        const randomChange = Math.floor(Math.random() * (variation * 2 + 1)) - variation;
        const newCount = Math.max(1, baseCount + randomChange);
        
        return {
          ...stream,
          viewer_count: newCount,
        };
      });
    };

    const streamsWithVariation = addViewerVariation(streams);
    setStreams(streamsWithVariation);
  }, [streams]);

  // Carregar streams na inicialização
  useEffect(() => {
    loadStreams();
  }, [loadStreams]);

  return {
    streams,
    loading,
    error,
    loadStreams,
    createStream,
    updateStream,
    deleteStream,
    refreshStreams,
  };
}
