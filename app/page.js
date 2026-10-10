import Link from 'next/link';
import Hero from '../components/Hero';
import MainEvents from '../components/MainEvents';
import { EVENT_CARDS, BOARD, FEST } from '../lib/data';

export default function Home() {
  return (
    <>
      <Hero />

      <div className="ribbon"><div id="rib">{Array.from({ length: 16 }, (_, i) => <i key={i} className="lg" />)}</div></div>

      <section id="events">
        <h2>Events</h2>
        <div className="grid" id="evg">
          {EVENT_CARDS.map(([cat, name, col]) => (
            <Link key={name} href="/events" className="ev" style={{ '--g': col }}><small>{cat}</small><h3>{name}</h3></Link>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 34 }}><Link className="btn" href="/events">View all events</Link></div>
      </section>

      <section id="about">
        <h3>AWH Engineering College Arts Day</h3>
        <p>AWH Engineering College&apos;s Arts Day is a vibrant celebration of creativity, talent, and cultural diversity within the academic community. This annual event provides a unique platform for students to showcase their artistic prowess, whether through dance, music, drama, or visual arts. The campus comes alive with a kaleidoscope of colors and a symphony of performances that reflect the rich cultural tapestry of the college. It&apos;s a day where engineering meets artistry, fostering a sense of unity and camaraderie among students and faculty. The Arts Day at AWH Engineering College is not just a showcase of talent; it&apos;s a testament to the holistic development of individuals who balance the rigors of engineering education with a passion for the arts. As the campus buzzes with creativity and enthusiasm, it&apos;s a reminder that education is not just about technical knowledge but also about nurturing the soul and unleashing the creative spirit within each student.</p>
        <h3>Our Vision</h3>
        <p>To mould competent, socially committed Engineering professionals through Quality Education.</p>
        <h3>Our Mission</h3>
        <p><b>M1</b>To provide a sound basis for engineering principles through innovative capabilities with the help of competent faculty and infrastructure.<br />
          <b>M2</b>Impart employability skills in students through training programs, extracurricular and co-curricular activities.<br />
          <b>M3</b>To inculcate human values and leadership qualities in students through social and industry outreach.</p>
        <Link className="btn" href="/about">Read More</Link>
        <div style={{ clear: 'both' }} />
      </section>

      <section id="results">
        <h2 id="lbt">{FEST.name.charAt(0) + FEST.name.slice(1).toLowerCase() + ' ' + String(FEST.year).slice(2) + ' Leaderboard'}</h2>
        <div className="lb" id="lb">
          {BOARD.map(([name, depts, pts], i) => (
            <div className="row" key={name}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span className="rank">{i < 3 ? ['\u{1F947}', '\u{1F948}', '\u{1F949}'][i] : '#' + (i + 1)}</span>
                <div><h3>{name}</h3><span>{depts}</span></div>
              </div>
              <strong>{pts} PTS</strong>
            </div>
          ))}
        </div>
      </section>

      <MainEvents />
    </>
  );
}
