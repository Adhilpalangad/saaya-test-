import Link from 'next/link';
import { FEST } from '../lib/data';

export default function Footer() {
  return (
    <footer>
      <div className="map">
        <h3>Find Us</h3>
        <div className="map-wrap">
          <iframe
            src="https://maps.google.com/maps?q=AWH+Engineering+College,+Kuttikkattoor,+Kozhikode&t=&z=15&ie=UTF8&iwloc=&output=embed"
            title="AWH Engineering College Location Map"
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
          />
          <div className="map-info">
            <div>
              <strong>AWH Engineering College</strong>
              <span>Kuttikkattoor, Kozhikode, Kerala 673008</span>
            </div>
            <a
              href="https://maps.app.goo.gl/PRoVyUYud4p82Gq49"
              target="_blank"
              rel="noopener noreferrer"
              className="map-btn"
            >
              Open in Google Maps &rarr;
            </a>
          </div>
        </div>
      </div>
      <div className="fg">
        <div><h3>About Us</h3><p>Saaya College Art Fest brings together artists and performers from various fields to showcase their talent and creativity in a vibrant and energetic atmosphere.</p></div>
        <div><h3>Quick Links</h3>
          <ul><li><Link href="/">Home</Link></li><li><Link href="/about">About</Link></li><li><Link href="/events">Events</Link></li><li><Link href="/gallery">Gallery</Link></li><li><Link href="/results">Results</Link></li></ul>
        </div>
        <div><h3>Contact</h3>
          <p>Email: <a href="mailto:info@awhengg.org" style={{ color: 'var(--text)' }}>info@awhengg.org</a><br />
            Phone: <a href="tel:04952358747" style={{ color: 'var(--text)' }}>0495 2358747</a><br />
            Sponsorship: +91 96339 05787 &middot; +91 884-8405031 &middot; +91 85908 64665</p>
          <p>
            <a
              href="https://www.facebook.com/awhupdates/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--accent2)', fontWeight: 600, textDecoration: 'none' }}
              title="AWH Engineering College on Facebook"
            >
              Facebook
            </a>{' '}
            &middot; Twitter &middot;{' '}
            <a
              href="https://www.instagram.com/awh_engineeringcollege?utm_source=ig_web_button_share_sheet&exln=ZDNlZDc0MzIxNw=="
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--accent2)', fontWeight: 600, textDecoration: 'none' }}
              title="AWH Engineering College on Instagram"
            >
              Instagram
            </a>{' '}
            &middot; LinkedIn
          </p>
        </div>
      </div>
      <div className="copy-wrap">
        <p className="copy">&copy; 2026 Saaya. Designed &amp; Developed by <b>Team DEV</b>. All Rights Reserved.</p>
      </div>
    </footer>
  );
}
