'use client'

import { useState, useEffect } from 'react'
import { Heart, Users, Clock, Shield, Play, Pause, User } from 'lucide-react'

interface Live {
  id: string
  title: string
  streamer: string
  thumbnail: string
  viewers: number
  category: string
  avatar?: string
}

interface User {
  email: string
  timeLeft: number
  isPremium: boolean
}

const API_URL = process.env.NEXT_PUBLIC_API_URL

// Função para buscar lives da API com fallback para localStorage
async function fetchLives(): Promise<Live[]> {
  try {
    if (API_URL) {
      const response = await fetch(`${API_URL}/api/streams`)
      if (response.ok) {
        const data = await response.json()
        return data.map((stream: any) => ({
          id: stream.id,
          title: stream.title,
          streamer: stream.streamer,
          thumbnail: stream.thumbnail || `https://picsum.photos/400/225?random=${stream.id}`,
          viewers: stream.viewers || Math.floor(Math.random() * 2000) + 100,
          category: stream.category || 'Geral',
          avatar: stream.avatar
        }))
      }
    }
    
    // Fallback para localStorage se API não funcionar
    const savedLives = localStorage.getItem('livevip-lives')
    return savedLives ? JSON.parse(savedLives) : getDefaultLives()
  } catch (error) {
    console.log('API não disponível, usando dados locais:', error)
    const savedLives = localStorage.getItem('livevip-lives')
    return savedLives ? JSON.parse(savedLives) : getDefaultLives()
  }
}

// Função para salvar lives (API + localStorage backup)
async function saveLives(lives: Live[]): Promise<void> {
  try {
    // Sempre salva no localStorage como backup
    localStorage.setItem('livevip-lives', JSON.stringify(lives))
    
    if (API_URL) {
      // Tenta salvar na API também
      await fetch(`${API_URL}/api/streams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lives)
      })
    }
  } catch (error) {
    console.log('Dados salvos localmente (API não disponível)')
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
      category: 'Games'
    },
    {
      id: '2', 
      title: 'Música ao Vivo',
      streamer: 'ArtistMusic',
      thumbnail: 'https://picsum.photos/400/225?random=2',
      viewers: 850,
      category: 'Música'
    },
    {
      id: '3',
      title: 'Conversa com Fãs',
      streamer: 'InfluencerTop',
      thumbnail: 'https://picsum.photos/400/225?random=3',
      viewers: 1500,
      category: 'Conversa'
    }
  ]
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [lives, setLives] = useState<Live[]>([])
  const [showLogin, setShowLogin] = useState(true)
  const [isLoading, setIsLoading] = useState(true)

  // Carregar dados ao iniciar
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      
      // Carregar usuário do localStorage
      const savedUser = localStorage.getItem('livevip-user')
      if (savedUser) {
        setUser(JSON.parse(savedUser))
        setShowLogin(false)
      }

      // Carregar lives (API + fallback)
      const livesData = await fetchLives()
      setLives(livesData)
      
      setIsLoading(false)
    }

    loadData()
    
    // Atualizar viewers a cada 5 segundos
    const interval = setInterval(() => {
      setLives(prevLives => 
        prevLives.map(live => ({
          ...live,
          viewers: Math.max(1, live.viewers + Math.floor(Math.random() * 21) - 10)
        }))
      )
    }, 5000)

    // Sincronizar com API a cada 30 segundos
    const syncInterval = setInterval(async () => {
      const updatedLives = await fetchLives()
      setLives(updatedLives)
    }, 30000)

    return () => {
      clearInterval(interval)
      clearInterval(syncInterval)
    }
  }, [])

  const handleLogin = (email: string) => {
    const newUser: User = {
      email,
      timeLeft: 30 * 24 * 60, // 30 dias em minutos
      isPremium: true
    }
    
    setUser(newUser)
    setShowLogin(false)
    localStorage.setItem('livevip-user', JSON.stringify(newUser))
  }

  const handleLogout = () => {
    setUser(null)
    setShowLogin(true)
    localStorage.removeItem('livevip-user')
  }

  const formatTimeLeft = (minutes: number) => {
    const days = Math.floor(minutes / (24 * 60))
    const hours = Math.floor((minutes % (24 * 60)) / 60)
    return `${days}d ${hours}h`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    )
  }

  if (showLogin) {
    return <LoginScreen onLogin={handleLogin} />
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-gray-900 p-4 sticky top-0 z-50">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
              <Play className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-bold">LiveVIP</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {user && (
              <div className="flex items-center space-x-2 text-sm">
                <Shield className="w-4 h-4 text-green-400" />
                <span className="text-green-400">{formatTimeLeft(user.timeLeft)}</span>
              </div>
            )}
            <button 
              onClick={handleLogout}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <User className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Lives em Destaque</h2>
          <p className="text-gray-400">Conteúdo exclusivo para membros VIP</p>
        </div>

        {/* Lives Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lives.map((live) => (
            <LiveCard key={live.id} live={live} />
          ))}
        </div>

        {/* Status Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          {API_URL ? (
            <p>✅ Conectado ao banco de dados • Dados sincronizados</p>
          ) : (
            <p>📱 Dados locais • Configure API para sincronização</p>
          )}
        </div>
      </main>
    </div>
  )
}

function LiveCard({ live }: { live: Live }) {
  const [isLiked, setIsLiked] = useState(false)
  const [likes, setLikes] = useState(Math.floor(Math.random() * 500) + 50)

  const handleLike = () => {
    if (isLiked) {
      setLikes(prev => prev - 1)
    } else {
      setLikes(prev => prev + 1)
    }
    setIsLiked(!isLiked)
  }

  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden hover:bg-gray-800 transition-all duration-300">
      <div className="relative">
        <img 
          src={live.thumbnail} 
          alt={live.title}
          className="w-full h-48 object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://picsum.photos/400/225?random=${live.id}`
          }}
        />
        <div className="absolute top-3 left-3 bg-red-600 text-white px-2 py-1 rounded text-xs font-bold flex items-center">
          <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></div>
          AO VIVO
        </div>
        <div className="absolute top-3 right-3 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs flex items-center">
          <Users className="w-3 h-3 mr-1" />
          {live.viewers.toLocaleString()}
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center mb-2">
          {live.avatar ? (
            <img 
              src={live.avatar} 
              alt={live.streamer}
              className="w-8 h-8 rounded-full mr-3"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${live.streamer}&background=random`
              }}
            />
          ) : (
            <div className="w-8 h-8 bg-gray-700 rounded-full mr-3 flex items-center justify-center">
              <User className="w-4 h-4 text-gray-400" />
            </div>
          )}
          <div>
            <h3 className="font-semibold text-sm">{live.streamer}</h3>
            <p className="text-xs text-gray-400">{live.category}</p>
          </div>
        </div>
        
        <h4 className="font-medium mb-3 line-clamp-2">{live.title}</h4>
        
        <div className="flex items-center justify-between">
          <button 
            onClick={handleLike}
            className={`flex items-center space-x-1 transition-colors ${
              isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            <span className="text-sm">{likes}</span>
          </button>
          
          <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors flex items-center">
            <Play className="w-4 h-4 mr-1" />
            Assistir
          </button>
        </div>
      </div>
    </div>
  )
}

function LoginScreen({ onLogin }: { onLogin: (email: string) => void }) {
  const [email, setEmail] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      onLogin(email)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="bg-gray-900 p-8 rounded-lg w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Play className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-2">LiveVIP</h1>
          <p className="text-gray-400">Acesso exclusivo para membros</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Email de acesso
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
              placeholder="seu@email.com"
              required
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-700 text-white p-3 rounded-lg font-medium transition-colors"
          >
            Acessar Plataforma
          </button>
        </form>

        <div className="mt-6 text-center text-gray-500 text-xs">
          <p>🔒 Conteúdo protegido para membros VIP</p>
        </div>
      </div>
    </div>
  )
}
