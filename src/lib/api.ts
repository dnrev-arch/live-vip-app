// src/lib/api.ts
// 🎯 Este arquivo é o "assistente" que cuida de todas as conversas com o banco de dados

const API_URL = process.env.NEXT_PUBLIC_API_URL;

class ApiService {
  private static instance: ApiService;
  
  // 🏗️ Padrão Singleton - garante que só existe uma instância dessa classe
  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  // 📡 BUSCAR TODAS AS STREAMS DO BANCO
  async getStreams(): Promise<LiveStream[]> {
    console.log('🔍 Buscando streams da API...');
    
    try {
      if (!API_URL) {
        console.error('❌ URL da API não configurada!');
        throw new Error('API URL not configured');
      }

      const response = await fetch(`${API_URL}/api/streams`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store', // Sempre buscar dados frescos
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const streams = await response.json();
      console.log('✅ Streams carregadas da API:', streams.length);
      
      // 💾 Salvar no localStorage como backup
      this.saveToLocalStorage(streams);
      
      return streams;
      
    } catch (error) {
      console.warn('⚠️ API indisponível, usando localStorage:', error);
      
      // 🔄 Se API falhar, usar dados salvos localmente
      return this.getFromLocalStorage();
    }
  }

  // 📝 CRIAR NOVA STREAM NO BANCO
  async createStream(data: StreamFormData): Promise<LiveStream> {
    console.log('➕ Criando nova stream...');
    
    // 🆔 Criar ID único para a stream
    const newStream: LiveStream = {
      id: `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...data,
      is_live: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      if (API_URL) {
        const response = await fetch(`${API_URL}/api/streams`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newStream),
        });

        if (response.ok) {
          const apiStream = await response.json();
          console.log('✅ Stream criada na API!');
          
          // 🔄 Recarregar todas as streams para sincronizar
          await this.getStreams();
          return apiStream;
        }
      }
    } catch (error) {
      console.warn('⚠️ Falha ao criar na API, salvando localmente');
    }

    // 💾 PLANO B: Salvar no localStorage se API falhar
    const currentStreams = this.getFromLocalStorage();
    const updatedStreams = [...currentStreams, newStream];
    this.saveToLocalStorage(updatedStreams);
    
    return newStream;
  }

  // ✏️ ATUALIZAR STREAM EXISTENTE
  async updateStream(id: string, data: Partial<StreamFormData>): Promise<LiveStream> {
    console.log('✏️ Atualizando stream:', id);
    
    const currentStreams = await this.getStreams();
    const existingStream = currentStreams.find(s => s.id === id);
    
    if (!existingStream) {
      throw new Error('Stream não encontrada');
    }

    const updatedStream: LiveStream = {
      ...existingStream,
      ...data,
      updated_at: new Date().toISOString(),
    };

    try {
      if (API_URL) {
        const response = await fetch(`${API_URL}/api/streams/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedStream),
        });

        if (response.ok) {
          console.log('✅ Stream atualizada na API!');
          // 🔄 Recarregar para sincronizar
          await this.getStreams();
          return updatedStream;
        }
      }
    } catch (error) {
      console.warn('⚠️ Falha ao atualizar na API, salvando localmente');
    }

    // 💾 PLANO B: Atualizar no localStorage
    const updatedStreams = currentStreams.map(s => 
      s.id === id ? updatedStream : s
    );
    this.saveToLocalStorage(updatedStreams);
    
    return updatedStream;
  }

  // 🗑️ DELETAR STREAM
  async deleteStream(id: string): Promise<void> {
    console.log('🗑️ Deletando stream:', id);
    
    try {
      if (API_URL) {
        const response = await fetch(`${API_URL}/api/streams/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          console.log('✅ Stream deletada da API!');
          // 🔄 Recarregar para sincronizar
          await this.getStreams();
          return;
        }
      }
    } catch (error) {
      console.warn('⚠️ Falha ao deletar da API, removendo localmente');
    }

    // 💾 PLANO B: Remover do localStorage
    const currentStreams = this.getFromLocalStorage();
    const updatedStreams = currentStreams.filter(s => s.id !== id);
    this.saveToLocalStorage(updatedStreams);
  }

  // 🔄 FORÇAR SINCRONIZAÇÃO COMPLETA
  async forceSync(): Promise<LiveStream[]> {
    console.log('🔄 Forçando sincronização completa...');
    
    try {
      // 🧹 Limpar dados locais e buscar fresh da API
      localStorage.removeItem(StorageKeys.LIVE_STREAMS);
      const freshStreams = await this.getStreams();
      console.log('✅ Sincronização completa realizada!');
      return freshStreams;
    } catch (error) {
      console.error('❌ Falha na sincronização:', error);
      return this.getFromLocalStorage();
    }
  }

  // 💾 SALVAR NO LOCALSTORAGE (gaveta local)
  private saveToLocalStorage(streams: LiveStream[]): void {
    try {
      localStorage.setItem(StorageKeys.LIVE_STREAMS, JSON.stringify(streams));
      localStorage.setItem(StorageKeys.LAST_API_UPDATE, new Date().toISOString());
      console.log('💾 Dados salvos no localStorage');
    } catch (error) {
      console.error('❌ Erro ao salvar no localStorage:', error);
    }
  }

  // 📖 LER DO LOCALSTORAGE
  private getFromLocalStorage(): LiveStream[] {
    try {
      const saved = localStorage.getItem(StorageKeys.LIVE_STREAMS);
      if (saved) {
        const streams = JSON.parse(saved);
        console.log('📖 Carregados do localStorage:', streams.length, 'streams');
        return streams;
      }
    } catch (error) {
      console.error('❌ Erro ao ler do localStorage:', error);
    }
    return [];
  }

  // 🌐 VERIFICAR SE API ESTÁ FUNCIONANDO
  async isApiAvailable(): Promise<boolean> {
    try {
      if (!API_URL) return false;
      
      const response = await fetch(`${API_URL}/health`, {
        method: 'GET',
      });
      
      const isOnline = response.ok;
      console.log(isOnline ? '🟢 API Online' : '🔴 API Offline');
      return isOnline;
    } catch {
      console.log('🔴 API Offline - Erro de conexão');
      return false;
    }
  }

  // 📊 STATUS DA API
  getApiStatus(): { 
    configured: boolean; 
    url: string | undefined; 
    lastUpdate: string | null 
  } {
    return {
      configured: !!API_URL,
      url: API_URL,
      lastUpdate: localStorage.getItem(StorageKeys.LAST_API_UPDATE)
    };
  }
}

// 📦 Exportar instância única
export const apiService = ApiService.getInstance();

// Adicionar ao final do seu types.ts existente:

export interface LiveStream {
  id: string;
  title: string;
  thumbnail: string;
  video_url: string;
  viewer_count: number;
  is_live: boolean;
  streamer_name: string;
  streamer_avatar: string;
  category: string;
  created_at: string;
  updated_at: string;
}

export interface StreamFormData {
  title: string;
  thumbnail: string;
  video_url: string;
  viewer_count: number;
  streamer_name: string;
  streamer_avatar: string;
  category: string;
}

export enum StorageKeys {
  LIVE_STREAMS = 'livevip_streams',
  LAST_API_UPDATE = 'livevip_last_update',
  USER_DATA = 'livevip_user'
}
