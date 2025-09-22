// Adicione este código ao seu src/app/layout.tsx

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
  // Adicionar headers para evitar cache agressivo
  other: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#8B5CF6',
};

// Componente para gerenciar cache e PWA
function PWACacheManager() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          // Detectar se é PWA
          const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                       window.navigator.standalone || 
                       document.referrer.includes('android-app://');

          // Função para limpar cache do PWA
          function clearPWACache() {
            if ('caches' in window) {
              caches.keys().then(names => {
                names.forEach(name => {
                  caches.delete(name);
                });
              });
            }
          }

          // Função para atualizar service worker
          function updateServiceWorker() {
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.getRegistrations().then(registrations => {
                registrations.forEach(registration => {
                  registration.update();
                });
              });
            }
          }

          // Forçar atualização a cada 30 segundos se for PWA
          if (isPWA) {
            console.log('🔄 PWA detected, setting up cache management');
            
            setInterval(() => {
              // Verificar se há mudanças no localStorage
              const lastCheck = localStorage.getItem('lastCacheCheck');
              const forceRefresh = localStorage.getItem('forceRefresh');
              
              if (!lastCheck || (forceRefresh && parseInt(forceRefresh) > parseInt(lastCheck || '0'))) {
                console.log('🧹 Clearing PWA cache for fresh data');
                clearPWACache();
                updateServiceWorker();
                localStorage.setItem('lastCacheCheck', Date.now().toString());
                
                // Recarregar se necessário
                if (forceRefresh && parseInt(forceRefresh) > parseInt(lastCheck || '0')) {
                  setTimeout(() => window.location.reload(), 1000);
                }
              }
            }, 30000); // 30 segundos
            
            // Event listener para mudanças de visibilidade
            document.addEventListener('visibilitychange', () => {
              if (!document.hidden) {
                console.log('👀 PWA became visible, checking cache');
                const forceRefresh = localStorage.getItem('forceRefresh');
                const lastCheck = localStorage.getItem('lastCacheCheck');
                
                if (forceRefresh && (!lastCheck || parseInt(forceRefresh) > parseInt(lastCheck))) {
                  clearPWACache();
                  updateServiceWorker();
                  localStorage.setItem('lastCacheCheck', Date.now().toString());
                  setTimeout(() => window.location.reload(), 500);
                }
              }
            });
          }

          // Adicionar um botão de debug no canto (apenas em desenvolvimento)
          if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            const debugBtn = document.createElement('div');
            debugBtn.innerHTML = '🔄';
            debugBtn.style.cssText = \`
              position: fixed;
              top: 10px;
              left: 10px;
              z-index: 9999;
              background: red;
              color: white;
              padding: 10px;
              border-radius: 50%;
              cursor: pointer;
              font-size: 12px;
            \`;
            debugBtn.onclick = () => {
              clearPWACache();
              localStorage.setItem('forceRefresh', Date.now().toString());
              window.location.reload();
            };
            document.body.appendChild(debugBtn);
          }
        `,
      }}
    />
  );
}

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
        
        {/* Headers para evitar cache */}
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
        
        <PWACacheManager />
      </head>
      <body className={`${inter.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
