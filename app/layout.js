import './globals.css';
import { Rye, Inter } from 'next/font/google';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import Motion from '../components/Motion';

const rye = Rye({ weight: '400', subsets: ['latin'], variable: '--f-rye', display: 'swap' });
const inter = Inter({ subsets: ['latin'], variable: '--f-inter', display: 'swap' });

export const metadata = {
  title: 'SAAYA 26',
  description: 'Saaya The Grand Arts Fiesta | AWH Engineering College | 23-24 Oct 2026',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png', sizes: '32x32' },
    ],
    apple: '/apple-touch-icon.png',
  },
};
export const viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' };

/* runs before first paint: forces dark theme */
const init = `document.documentElement.dataset.theme='dark';try{localStorage.setItem('saayaTheme','dark')}catch(e){}`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="dark" className={`${rye.variable} ${inter.variable}`} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: init }} /></head>
      <body>
        <div id="bar" />
        <Nav />
        {children}
        <Footer />
        <Motion />
      </body>
    </html>
  );
}
