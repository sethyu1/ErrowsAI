import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerLocalIcons } from './components/icon';
import App from './App.tsx'
import { Providers } from '@/providers';
import "@errows/design/globals.css"
import { registerSW } from 'virtual:pwa-register';
import './lib/i18n.ts';

await registerLocalIcons();

// Register Service Worker with Workbox
const updateSW = registerSW({
  onNeedRefresh() {
    console.log('New content available, please refresh.');
  },
  onOfflineReady() {
    console.log('App ready to work offline.');
  },
  onRegistered(registration) {
    console.log('SW Registered:', registration);
  },
  onRegisterError(error) {
    console.error('SW registration error:', error);
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Providers>
      <App />
    </Providers>
  </StrictMode>,
)
