import { Roboto } from 'next/font/google';
import './globals.css';

const roboto = Roboto({ 
  subsets: ['latin'], 
  weight: ['400', '700'],
  variable: '--font-roboto' 
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${roboto.variable}`}>
      <body>{children}</body>
    </html>
  );
}