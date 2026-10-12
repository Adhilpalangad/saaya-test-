'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Nav() {
  const [theme, setTheme] = useState('light');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme || 'light');
  }, []);

  const toggle = () => {
    const t = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = t;
    try {
      localStorage.setItem('saayaTheme', t);
    } catch (e) {}
    setTheme(t);
  };

  return (
    <>
      <nav>
        <Link href="/" className="logo" aria-label="Saaya home" title="Saaya" />
        <ul className="lk">
          <li><Link href="/">Home</Link></li>
          <li><Link href="/events">Events</Link></li>
          <li><Link href="/gallery">Gallery</Link></li>
          <li><Link href="/results">Results</Link></li>
          <li><Link href="/about">About</Link></li>
        </ul>
        <ul className="ac">
          <li className="tgl">
            <button
              id="tg"
              className="tg"
              onClick={toggle}
              aria-label="Switch light/dark theme"
              title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              {theme === 'dark' ? '\u2600' : '\u263E'}
            </button>
          </li>
          <li>
            <button
              className={`mob-btn ${menuOpen ? 'open' : ''}`}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle navigation menu"
              aria-expanded={menuOpen}
            >
              <span />
              <span />
              <span />
            </button>
          </li>
        </ul>
      </nav>

      {/* Mobile Drawer Menu */}
      <div className={`mob-drawer ${menuOpen ? 'open' : ''}`}>
        <ul>
          <li><Link href="/" onClick={() => setMenuOpen(false)}>Home</Link></li>
          <li><Link href="/events" onClick={() => setMenuOpen(false)}>Events</Link></li>
          <li><Link href="/gallery" onClick={() => setMenuOpen(false)}>Gallery</Link></li>
          <li><Link href="/results" onClick={() => setMenuOpen(false)}>Results</Link></li>
          <li><Link href="/about" onClick={() => setMenuOpen(false)}>About</Link></li>
        </ul>
      </div>
    </>
  );
}
