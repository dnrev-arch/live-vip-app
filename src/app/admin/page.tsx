'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Save, X, Users, Eye, Database, Wifi, WifiOff } from 'lucide-react'

interface Live {
  id: string
  title: string
  streamer: string
  thumbnail: string
  viewers: number
  category: string
  avatar?: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL

export default function AdminPanel() {
  const [lives, setLives] = useState<Live[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingLive, setEditingLive] = useState<Live | null>(null)
  const [password, setPassword] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [lastSync, setLastSync] = useState<string>('')

  // Função para verificar conexão com API
  async function checkAPIConnection(): Promise<boolean> {
    try {
      if (!API_URL) return false
      
      const response = await fetch(`${API_URL}/health`, { 
        method: 'GET',
        timeout: 5000 
      } as any)
      return response.ok
    } catch (error) {
      console.log('API não disponível:', error)
      return false
    }
  }

  // Função para buscar lives (API + fallback localStorage)
  async function fetchLives(): Promise<Live[]> {
    try {
      if (API_URL) {
        const response = await fetch(`${API_URL}/api/streams`)
        if (response.ok) {
          const data = await response.json()
          const formattedData = data.map((stream: any) => ({
            id: stream.id,
            title: stream.title,
            streamer: stream.streamer,
            thumbnail: stream.thumbnail || `https://picsum.photos/400/225?random=${stream.id}`,
            viewers: stream.viewers || Math.floor(Math.random() * 2000) + 100,
            category: stream.category || 'Geral',
            avatar: stream.avatar
          }))
          
          // Salva no localStorage como backup
          localStorage.setItem('livevip-lives', JSON.stringify(formattedData))
          setLastSync(new Date().toLocaleTimeString())
          setIsConnected(true)
          
          return formattedData
        }
      }
      
      throw new Error('API não disponível')
    } catch (error) {
      console.log('Usando dados locais:', error)
      setIsConnected(false)
      
      // Fallback para localStorage
      const savedLives = localStorage.getItem('livevip-lives')
      return savedLives ? JSON.parse(savedLives) : getDefaultLives()
    }
  }

  // Função para salvar lives (API + localStorage)
  async function saveLives(updatedLives: Live[]): Promise<boolean> {
    try {
      // Sempre salva no localStorage
      localStorage.setItem('livevip-lives', JSON.stringify(updatedLives))
      
      if (API_URL) {
        // Tenta salvar na API
        const response = await fetch(`${API_URL}/api/streams`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedLives)
        })
        
        if (response.ok) {
          setIsConnected(true)
          setLastSync(new Date().toLocaleTimeString())
          return true
        }
      }
      
      setIsConnected(false)
      return false
    } catch (error) {
      console.log('Dados salvos apenas localmente:', error)
      setIsConnected(false)
      return false
    }
  }

  function getDefaultLives(): Live[] {
    return [
      {
        id: '1',
        title: 'Gaming Session Épica',
        streamer: 'ProGamer123',
        thumbnail: 'https://picsum.photos/400/225?random=1',
        viewers: 1250,
        category: 'Games',
        avatar: 'https://ui-avatars.com/api/?name=ProGamer123&background=random'
      },
      {
        id: '2',
        title: 'Música ao Vivo',
        streamer: 'ArtistMusic',
        thumbnail: 'https://picsum.photos/400/225?random=2',
        viewers: 850,
        category: 'Música',
        avatar: 'https://ui-avatars.com/api/?name=ArtistMusic&background=random'
      },
      {
        id: '3',
        title: 'Conversa com Fãs',
        streamer: 'InfluencerTop',
        thumbnail: 'https://picsum.photos/400/225?random=3',
        viewers: 1500,
        category: 'Conversa',
        avatar: 'https://ui-avatars.com/api/?name=InfluencerTop&background=random'
      }
    ]
  }

  // Carregar dados ao iniciar
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      
      // Verificar autenticação
      const savedAuth = localStorage.getItem('livevip-admin-auth')
      if (savedAuth) {
        setIsAuthenticated(true)
      }

      // Verificar conexão API
      const apiConnected = await checkAPIConnection()
      setIsConnected(apiConnected)

      // Carregar lives
      const livesData = await fetchLives()
      setLives(livesData)
      
      setIsLoading(false)
    }

    loadData()

    // Sincronizar com API periodicamente
    const syncInterval = setInterval(async () => {
      if (isAuthenticated) {
        const updated = await fetchLives()
        setLives(updated)
      }
    }, 60000) // A cada minuto

    return () => clearInterval(syncInterval)
  }, [isAuthenticated])

  const handleLogin = () => {
    // Senha simples para demonstração
    if (password === 'admin123') {
      setIsAuthenticated(true)
      localStorage.setItem('livevip-admin-auth', 'true')
    } else {
      alert('Senha incorreta')
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem('livevip-admin-auth')
  }

  const handleAddLive = async (newLive: Omit<Live, 'id'>) => {
    const live: Live = {
      ...newLive,
      id: Date.now().toString(),
      avatar: newLive.avatar || `https://ui-avatars.com/api/?name=${newLive.streamer}&background=random`
    }
    
    const updatedLives = [...lives, live]
    setLives(updatedLives)
    
    const saved = await saveLives(updatedLives)
    if (saved) {
      alert('Live adicionada e sincronizada com sucesso!')
    } else {
      alert('Live adicionada localmente (sincronização pendente)')
    }
    
    setShowAddForm(false)
  }

  const handleEditLive = async (updatedLive: Live) => {
    const updatedLives = lives.map(live => 
      live.id === updatedLive.id ? updatedLive : live
    )
    
    setLives(updatedLives)
    
    const saved = await saveLives(updatedLives)
    if (saved) {
      alert('Live atualizada e sincronizada com sucesso!')
    } else {
      alert('Live atualizada localmente (sincronização pendente)')
    }
    
    setEditingLive(null)
  }

  const handleDeleteLive = async (id: string) => {
    if (confirm('Tem certeza que deseja deletar esta live?')) {
      const updatedLives = lives.filter(live => live.id !== id)
      setLives(updatedLives)
      
      const saved = await saveLives(updatedLives)
      if (saved) {
        alert('Live removida e sincronizada com sucesso!')
      } else {
        alert('Live removida localmente (sincronização pendente)')
      }
    }
  }

  const handleSyncNow = async () => {
    setIsLoading(true)
    const updated = await fetchLives()
    setLives(updated)
    setIsLoading(false)
  }

  if (isLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Carregando painel...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-gray-900 p-8 rounded-lg w-full max-w-md">
          <h1 className="text-2xl font-bold mb-6 text-center text-white">
            Painel Administrativo
          </h1>
          
          <div className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha de administrador"
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            />
            
            <button
              onClick={handleLogin}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg font-medium transition-colors"
            >
              Entrar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Painel Administrativo</h1>
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4" />
                <span>Lives: {lives.length}</span>
              </div>
              <div className="flex items-center space-x-2">
                {isConnected ? (
                  <>
                    <Wifi className="w-4 h-4 text-green-400" />
                    <span className="text-green-400">Conectado à API</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 text-red-400" />
                    <span className="text-red-400">Modo Local</span>
                  </>
                )}
              </div>
              {lastSync && (
                <span>Última sync: {lastSync}</span>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={handleSyncNow}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center disabled:opacity-50"
            >
              <Database className="w-4 h-4 mr-2" />
              {isLoading ? 'Sincronizando...' : 'Sincronizar'}
            </button>
            
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Live
            </button>
            
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Sair
            </button>
          </div>
        </div>

        {/* Lives Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {lives.map((live) => (
            <div key={live.id} className="bg-gray-900 rounded-lg overflow-hidden">
              <div className="relative">
                <img 
                  src={live.thumbnail} 
                  alt={live.title}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-3 left-3 bg-red-600 text-white px-2 py-1 rounded text-xs font-bold flex items-center">
                  <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></div>
                  AO VIVO
                </div>
                <div className="absolute top-3 right-3 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs flex items-center">
                  <Users className="w-3 h-3 mr-1" />
                  {live.viewers}
                </div>
              </div>

              <div className="p-4">
                <div className="flex items-center mb-2">
                  {live.avatar ? (
                    <img 
                      src={live.avatar} 
                      alt={live.streamer}
                      className="w-8 h-8 rounded-full mr-3"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gray-700 rounded-full mr-3 flex items-center justify-center">
                      <span className="text-xs">{live.streamer[0]}</span>
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-sm">{live.streamer}</h3>
                    <p className="text-xs text-gray-400">{live.category}</p>
                  </div>
                </div>
                
                <h4 className="font-medium mb-3">{live.title}</h4>
                
                <div className="flex items-center justify-end space-x-2">
                  <button
                    onClick={() => setEditingLive(live)}
                    className="text-blue-400 hover:text-blue-300 p-1"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteLive(live.id)}
                    className="text-red-400 hover:text-red-300 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Status Footer */}
        <div className="text-center text-gray-500 text-sm border-t border-gray-800 pt-4">
          {isConnected ? (
            <p className="flex items-center justify-center space-x-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span>Sistema conectado ao banco de dados • Dados sincronizados em tempo real</span>
            </p>
          ) : (
            <p className="flex items-center justify-center space-x-2">
              <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
              <span>Modo offline • Dados salvos localmente • Sincronização pendente</span>
            </p>
          )}
        </div>
      </div>

      {/* Modals */}
      {showAddForm && (
        <LiveFormModal
          onSave={handleAddLive}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {editingLive && (
        <LiveFormModal
          live={editingLive}
          onSave={handleEditLive}
          onCancel={() => setEditingLive(null)}
        />
      )}
    </div>
  )
}

interface LiveFormModalProps {
  live?: Live
  onSave: (live: Live | Omit<Live, 'id'>) => void
  onCancel: () => void
}

function LiveFormModal({ live, onSave, onCancel }: LiveFormModalProps) {
  const [formData, setFormData] = useState({
    title: live?.title || '',
    streamer: live?.streamer || '',
    thumbnail: live?.thumbnail || '',
    avatar: live?.avatar || '',
    category: live?.category || 'Geral',
    viewers: live?.viewers || Math.floor(Math.random() * 1000) + 100
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (live) {
      onSave({ ...live, ...formData })
    } else {
      onSave(formData)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">
            {live ? 'Editar Live' : 'Nova Live'}
          </h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Título</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Streamer</label>
            <input
              type="text"
              value={formData.streamer}
              onChange={(e) => setFormData({...formData, streamer: e.target.value})}
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Categoria</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
            >
              <option value="Games">Games</option>
              <option value="Música">Música</option>
              <option value="Conversa">Conversa</option>
              <option value="Arte">Arte</option>
              <option value="Culinária">Culinária</option>
              <option value="Esportes">Esportes</option>
              <option value="Geral">Geral</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Thumbnail URL (opcional)</label>
            <input
              type="url"
              value={formData.thumbnail}
              onChange={(e) => setFormData({...formData, thumbnail: e.target.value})}
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
              placeholder="https://exemplo.com/imagem.jpg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Avatar URL (opcional)</label>
            <input
              type="url"
              value={formData.avatar}
              onChange={(e) => setFormData({...formData, avatar: e.target.value})}
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
              placeholder="https://exemplo.com/avatar.jpg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Viewers</label>
            <input
              type="number"
              value={formData.viewers}
              onChange={(e) => setFormData({...formData, viewers: parseInt(e.target.value) || 0})}
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
              min="0"
            />
          </div>

          <div className="flex items-center justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center"
            >
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
