import { Metadata } from 'next';
import { Roboto } from 'next/font/google';
import './globals.css';

const roboto = Roboto({ 
  subsets: ['latin'], 
  weight: ['100', '300', '400', '500', '700', '900'], // Projedeki kalınlıkları kapsamak için genişletildi
  variable: '--font-roboto' 
});

// --- GOOGLE VE SEO AYARLARI ---
export const metadata: Metadata = {
  title: {
    default: 'BÜ-LMS | Yapay Zeka Destekli Sınıf',
    template: '%s | BÜ-LMS'
  },
  description: 'Bingöl Üniversitesi Bilişim Teknolojileri yapay zeka destekli öğrenme yönetim sistemi. Akıllı test analizleri ve kişiselleştirilmiş eğitim.',
  keywords: ['yapay zeka', 'lms', 'eğitim', 'bingöl üniversitesi', 'akıllı sınıf', 'öğrenme yönetim sistemi'],
  icons: {
    icon: '/favicon.ico', // public klasöründeki favicon
  },
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${roboto.variable}`}>
      <body className="antialiased font-roboto">
        {children}
      </body>
    </html>
  );
}