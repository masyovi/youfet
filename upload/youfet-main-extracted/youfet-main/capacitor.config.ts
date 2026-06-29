import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.youfet.app',
  appName: 'YouFet',
  webDir: 'dist',
  server: {
    url: process.env.NEXT_PUBLIC_CAPACITOR_URL || 'https://youfet.site',
    androidScheme: 'https',
    cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#030712',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#030712',
    },
    App: {
      backgroundColor: '#030712',
    },
  },
  android: {
    backgroundColor: '#030712',
    allowMixedContent: true,
  },
};

export default config;
