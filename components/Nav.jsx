'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function Nav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  if (pathname?.startsWith('/screen') || pathname?.startsWith('/leaderboard')) {
    return null;
  }

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
