'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Nav() {
  const [theme, setTheme] = useState('light');
  useEffect(() => { setTheme(document.documentElement.dataset.theme || 'light'); }, []);
  const toggle = () => {
    const t = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem('saayaTheme', t); } catch (e) {}
    setTheme(t);
  };
  return (
    <nav>
      <Link href="/" className="logo" aria-label="Saaya home" title="Saaya" />
      <ul className="lk">
        <li><Link href="/">Home</Link></li><li><Link href="/events">Events</Link></li><li><Link href="/gallery">Gallery</Link></li>
        <li><Link href="/results">Results</Link></li><li><Link href="/about">About</Link></li>
      </ul>
      <ul className="ac">
        <li className="tgl">
          <button id="tg" className="tg" onClick={toggle} aria-label="Switch light/dark theme" title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}>{theme === 'dark' ? '\u2600' : '\u263E'}</button>
        </li>
        <li><a className="btn" href="#">Register</a></li>
      </ul>
    </nav>
  );
}
