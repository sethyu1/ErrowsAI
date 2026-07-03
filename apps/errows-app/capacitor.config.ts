import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ai.errows.app',
  appName: 'Errows',
  webDir: '../errows-web/dist',
  server: {
    androidScheme: 'https',
    // 允许通过原生层发送 HTTP 请求，绕过 CORS
    allowNavigation: ['errowstest.online'],
  },
  plugins: {
    CapacitorHttp: {
      enabled: true, // 启用原生 HTTP，绕过 CORS
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#000000',
      showSpinner: false,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#000000',
    },
  },
  ios: {
    contentInset: 'automatic',
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
