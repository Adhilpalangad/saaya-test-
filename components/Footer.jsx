import Link from 'next/link';
import { FEST } from '../lib/data';

export default function Footer() {
  return (
    <footer>
      <div className="fg">
        <div><h3>About Us</h3><p>Saaya College Art Fest brings together artists and performers from various fields to showcase their talent and creativity in a vibrant and energetic atmosphere.</p></div>
        <div><h3>Quick Links</h3>
          <ul><li><Link href="/">Home</Link></li><li><Link href="/about">About</Link></li><li><Link href="/events">Events</Link></li><li><Link href="/gallery">Gallery</Link></li><li><Link href="/results">Results</Link></li></ul>
        </div>
        <div><h3>Contact</h3>
          <p>Email: <a href="mailto:info@awhengg.org" style={{ color: 'var(--text)' }}>info@awhengg.org</a><br />
            Phone: <a href="tel:04952358747" style={{ color: 'var(--text)' }}>0495 2358747</a><br />
            Sponsorship: +91 96339 05787 &middot; +91 884-8405031 &middot; +91 85908 64665</p>
          <p>Facebook &middot; Twitter &middot; Instagram &middot; LinkedIn</p>
        </div>
      </div>
      <div className="map"><h3>Find Us</h3>
        <a href="https://www.google.com/maps/search/?api=1&query=AWH+Engineering+College+Kuttikkattoor+Kozhikode" target="_blank" rel="noopener noreferrer">
          AWH Engineering College<br /><small style={{ fontWeight: 400 }}>Kuttikkattoor, Kozhikode, Kerala 673008 &mdash; tap to open in Google Maps</small>
        </a>
      </div>
      <p className="copy">&copy; {FEST.year} Saaya. Designed &amp; Developed by <b>Team Shinobi</b>. All Rights Reserved.</p>
    </footer>
  );
}
