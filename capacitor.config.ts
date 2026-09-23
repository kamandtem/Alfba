import type { CapacitorConfig } from '@capacitor/cli';
const config: CapacitorConfig = {
  appId: 'ir.alfba.magicboard',
  appName: 'دهکده الفبا',
  webDir: 'dist',
  backgroundColor: '#F6C43B',
  server: { androidScheme: 'https' },
  android: {
    // در اندروید ۱۵ به بعد، محتوا زیر نوار ساعت/باتری و نوار دکمه‌های پایین نمی‌رود
    adjustMarginsForEdgeToEdge: 'auto',
  },
  plugins: {
    StatusBar: { overlaysWebView: false, style: 'DARK', backgroundColor: '#F6C43B' },
  },
};
export default config;
