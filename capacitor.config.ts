import type { CapacitorConfig } from '@capacitor/cli';
const config: CapacitorConfig = {
  appId: 'ir.alfba.magicboard',
  appName: 'دهکده الفبا',
  webDir: 'dist',
  backgroundColor: '#57C3F1',
  server: { androidScheme: 'https' },
  android: {
    // در اندروید ۱۵ به بعد، محتوا زیر نوار ساعت/باتری و نوار دکمه‌های پایین نمی‌رود
    adjustMarginsForEdgeToEdge: 'auto',
  },
  plugins: {
    StatusBar: { overlaysWebView: false, style: 'LIGHT', backgroundColor: '#57C3F1' },
  },
};
export default config;
