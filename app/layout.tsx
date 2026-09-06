import { Metadata, Viewport } from 'next';
import { Roboto } from 'next/font/google';
import './globals.css';
import AutoLogoutHandler from '@/components/AutoLogoutHandler';
import PwaRegister from '@/components/PwaRegister';
import InstallBanner from '@/components/InstallBanner';

const roboto = Roboto({ 
  subsets: ['latin'], 
  weight: ['100', '300', '400', '500', '700', '900'], // Projedeki kalınlıkları kapsamak için genişletildi
  variable: '--font-roboto' 
});

// --- PWA VE EKRAN AYARLARI ---
export const viewport: Viewport = {
  themeColor: '#ce1212',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

// --- GOOGLE VE SEO AYARLARI ---
export const metadata: Metadata = {
  title: {
    default: 'BÜ-LMS | Yapay Zeka Destekli Sınıf',
    template: '%s | BÜ-LMS'
  },
  description: 'Bingöl Üniversitesi Bilişim Teknolojileri yapay zeka destekli öğrenme yönetim sistemi. Akıllı test analizleri ve kişiselleştirilmiş eğitim.',
  keywords: ['yapay zeka', 'lms', 'eğitim', 'bingöl üniversitesi', 'akıllı sınıf', 'öğrenme yönetim sistemi'],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'BÜ LMS',
  },
  icons: {
    icon: '/favicon.ico', // public klasöründeki favicon
    apple: '/apple-touch-icon.png',
  },
  robots: 'index, follow',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${roboto.variable}`}>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="BÜ LMS" />
      </head>
      <body className="antialiased font-roboto suppressHydrationWarning">
        {children}
        <AutoLogoutHandler />
        <PwaRegister />
        <InstallBanner />
      </body>
    </html>
  );
}