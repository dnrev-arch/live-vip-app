import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'LIVE VIP - Lives Exclusivas Premium',
  description: 'Acesse as melhores lives exclusivas com conteúdo premium. Entretenimento de qualidade ao vivo.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'LIVE VIP',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: '/icon-192x192.png',
    apple: '/icon-192x192.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#8B5CF6',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="LIVE VIP" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#8B5CF6" />
        
        {/* Headers para evitar cache agressivo */}
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
        
        {/* Script para gerenciar cache e sync em PWA */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Função para detectar se é PWA/mobile
                function isPWA() {
                  return window.matchMedia('(display-mode: standalone)').matches ||
                         (window.navigator && window.navigator.standalone) ||
                         document.referrer.includes('android-app://');
                }

                // Função para forçar reload se necessário
                function checkForceRefresh() {
                  try {
                    var forceRefresh = localStorage.getItem('forceRefresh');
                    var lastCheck = localStorage.getItem('lastCacheCheck');
                    
                    if (forceRefresh && (!lastCheck || parseInt(forceRefresh) > parseInt(lastCheck))) {
                      console.log('🔄 Force refresh detected, reloading...');
                      localStorage.setItem('lastCacheCheck', Date.now().toString());
                      
                      // Delay pequeno para garantir que o storage foi atualizado
                      setTimeout(function() {
                        window.location.reload(true);
                      }, 100);
                    }
                  } catch (error) {
                    console.log('Error checking force refresh:', error);
                  }
                }

                // Event listeners para diferentes situações
                function setupListeners() {
                  // Quando página fica visível (usuário volta pro app)
                  document.addEventListener('visibilitychange', function() {
                    if (!document.hidden) {
                      console.log('👀 Page visible, checking for updates...');
                      checkForceRefresh();
                    }
                  });

                  // Quando página recebe foco
                  window.addEventListener('focus', function() {
                    console.log('🎯 Page focused, checking for updates...');
                    checkForceRefresh();
                  });

                  // Para PWA, verificar mais frequentemente
                  if (isPWA()) {
                    console.log('📱 PWA detected, setting up enhanced sync');
                    setInterval(checkForceRefresh, 5000); // A cada 5 segundos
                  }
                }

                // Inicializar quando DOM estiver pronto
                if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', setupListeners);
                } else {
                  setupListeners();
                }

                // Verificação inicial
                checkForceRefresh();
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
