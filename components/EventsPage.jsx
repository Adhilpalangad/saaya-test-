'use client';
import { useState } from 'react';
import { EV, DAYS, FEST } from '../lib/data';

const Ic = ({ d }) => <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">{d}</svg>;
const cal = <Ic d={<><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>} />;
const clk = <Ic d={<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>} />;
const pin = <Ic d={<><path d="M12 21s7-6.5 7-12a7 7 0 10-14 0c0 5.5 7 12 7 12z" /><circle cx="12" cy="9" r="2.5" /></>} />;
const go = <Ic d={<path d="M5 12h14M13 6l6 6-6 6" />} />;

export default function EventsPage() {
  const [cur, setCur] = useState('On Stage');
  const list = EV[cur];
  return (
    <div id="evpage">
      <div className="evw">
        <h1>Events</h1>
        <p id="evsub">Discover the rhythm of Saaya {FEST.year}</p>
        <div className="evtabs" id="evtabs">
          {Object.keys(EV).map((k) => <button key={k} className={'evtab' + (k === cur ? ' on' : '')} onClick={() => setCur(k)}>{k}</button>)}
        </div>
        <div id="evgrid" key={cur}>
          {list.length ? list.map((e, i) => (
            <div className="ec" key={e[0]} style={{ animationDelay: i * 0.05 + 's' }}>
              <h3>{e[0]}</h3><p>{cal}{DAYS[e[1]]}</p><p>{clk}{e[2]}</p><p>{pin}{e[3] || 'Main Stage'}</p>
              <a className="rg" href="#"><span>Register</span>{go}</a>
            </div>
          )) : <p className="evempty">The schedule for this category will be announced soon.</p>}
        </div>
      </div>
    </div>
  );
}
