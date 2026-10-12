import './globals.css';
import { Rye, Inter } from 'next/font/google';
import Preloader from '../components/Preloader';
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

/* runs before first paint: sets the saved light/dark theme and the "loading" lock used by the sequence */
const init = `document.documentElement.className+=' loading';try{var t=localStorage.getItem('saayaTheme');if(!t)t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme='light'}`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${rye.variable} ${inter.variable}`} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: init }} /></head>
      <body>
        <div id="bar" />
        <Preloader />
        <Nav />
        {children}
        <Footer />
        <Motion />
      </body>
    </html>
  );
}
