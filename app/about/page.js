import Link from 'next/link';
import { ED, TEAM, EVENT_COUNT } from '../../lib/data';

export const metadata = { title: 'About | SAAYA 26' };

const COL = [['#7a1c1c', '#240c0a'], ['#2a1a18', '#6e1616'], ['#5e1414', '#1c1412'], ['#3a1210', '#8b2a1e'], ['#1c1412', '#5c1512']];
const ini = (n) => n.replace(/^(Mr|Ms)\.?\s+/, '').replace(/[^\w\s]/g, '').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

export default function AboutPage() {
  let k = 0;
  return (
    <div id="abtpage">
      <div className="abw">
        <header className="abh">
          <small className="abr">AWH ENGINEERING COLLEGE &middot; ARTS FEST</small>
          <h1 className="abr">Where Creativity<br /><em>Knows No Bounds</em></h1>
          <p className="abr">Saaya is the vibrant cultural fest of AWH Engineering College, a two-day celebration of art, music, and creativity. Scheduled for <b>February 5-6, 2026</b>, this fest brings together talented students from diverse backgrounds to showcase their talents. With a perfect blend of music, dance, drama, and fine arts, Saaya is more than just a festival &mdash; it&rsquo;s a platform for innovation, self-expression, and unforgettable memories.</p>
          <Link className="btn abr" href="/events">Explore Events &rarr;</Link>
          <div className="abs abr">
            {[['2', 'Days'], [EVENT_COUNT, 'Events'], ['3', 'Squads'], [ED.length, 'Editions']].map(([v, l]) => <div key={l}><b>{v}</b><span>{l}</span></div>)}
          </div>
        </header>

        <section className="abx abr">
          <div>
            <h2>AWH Engineering College Arts Day</h2>
            <p>AWH Engineering College&rsquo;s Arts Day is a vibrant celebration of creativity, talent, and cultural diversity within the academic community. It is a day where engineering meets artistry, fostering a sense of unity and camaraderie among students and faculty, and a reminder that education is not just about technical knowledge but also about nurturing the soul and unleashing the creative spirit within each student.</p>
          </div>
          <div className="abv">
            <h3>Our Vision</h3><p>To mould competent, socially committed Engineering professionals through Quality Education.</p>
            <h3>Our Mission</h3>
            <p><b>M1</b> To provide a sound basis for engineering principles through innovative capabilities with the help of competent faculty and infrastructure.<br />
              <b>M2</b> Impart employability skills in students through training programs, extracurricular and co-curricular activities.<br />
              <b>M3</b> To inculcate human values and leadership qualities in students through social and industry outreach.</p>
          </div>
        </section>

        <section className="abx2">
          <h2 className="abr">Previous Editions</h2>
          <p className="abl abr">LEGACY OF ART</p>
          <div className="tl" id="abtl">
            {ED.map((ed, i) => (
              <div className="te abr" key={ed.year + '-' + i}>
                <div className="tc">
                  <div className="ed-thumb">
                    <img src={ed.img} alt={ed.title} />
                  </div>
                  <div className="ed-info">
                    <span className="ed-yr">{ed.year}</span>
                    <h3 className="ed-title">{ed.title}</h3>
                    <small className="ed-date">{ed.date}</small>
                    <p className="ed-desc">{ed.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="abx2" id="coordinators">
          <h2 className="abr">Coordination Team</h2>
          {TEAM && TEAM.length > 0 ? (
            <div id="abtm">
              {TEAM.map(([group, people]) => (
                <div className="tg0" key={group}>
                  <h3>{group}</h3>
                  <div className="tm">
                    {people.map((person) => {
                      let [name, dept, img] = person;
                      if (!img && dept && (dept.startsWith('/') || dept.startsWith('http') || /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(dept))) {
                        img = dept;
                        dept = '';
                      }
                      const c = COL[k++ % COL.length];
                      const src = typeof img === 'object' ? img?.src : img;
                      const isPaapi = src && src.includes('paapi');
                      const isHridhya = src && (src.includes('Image to PDF') || src.includes('page-0001'));
                      const isAleesha = src && src.includes('Aleesha');
                      const isRamzi = src && src.includes('Ramzi');
                      const imgStyle = typeof img === 'object'
                        ? img?.style
                        : isPaapi
                        ? { transform: 'scale(1.75)', transformOrigin: '50% 36%' }
                        : isHridhya
                        ? { transform: 'scale(1.35)', transformOrigin: 'center 35%' }
                        : isAleesha
                        ? { transform: 'scale(1.25)', transformOrigin: 'center 20%' }
                        : isRamzi
                        ? { transform: 'scale(1.15)', transformOrigin: '45% 22%' }
                        : undefined;
                      return (
                        <div className="pc abr" key={group + name} style={{ '--a': c[0], '--b': c[1] }}>
                          <div className="av">
                            {src ? <img src={encodeURI(src)} alt={name} loading="lazy" style={imgStyle} /> : ini(name)}
                          </div>
                          <h4>{name}</h4>
                          {dept ? <p>{dept}</p> : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="rempty" role="status">No coordination team members listed.</p>
          )}
        </section>
      </div>
    </div>
  );
}
