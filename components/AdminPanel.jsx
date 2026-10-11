'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getSupabase } from '../lib/supabase';
import { adminFetch } from '../lib/admin-fetch';
import { galleryImage } from '../lib/images';
import { EV, SQ, SQN } from '../lib/data';

const DEPTS = ['ME', 'AD', 'ECE', 'EEE', 'CE', 'MCA', 'CSE'];
const DEPT_TO_SQUAD = {
  ME: 'Targaryen', AD: 'Targaryen', ECE: 'Targaryen',
  EEE: 'Stark', CE: 'Stark', MCA: 'Stark',
  CSE: 'Lannister',
};

export default function AdminPanel() {
  const [auth, setAuth] = useState(false);
  const [pass, setPass] = useState('');
  const [email, setEmail] = useState('');
  const [signingIn, setSigningIn] = useState(false);
  const [authError, setAuthError] = useState('');
  const [tab, setTab] = useState('events'); // 'events' | 'gallery' | 'results' | 'leaderboard'
  const [toast, setToast] = useState('');

  // Events state
  const [statuses, setStatuses] = useState({});
  const [eventFilter, setEventFilter] = useState('All');

  // Gallery state
  const [gallery, setGallery] = useState([]);
  const [uploadFile, setUploadFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [year, setYear] = useState('2026');
  const [uploading, setUploading] = useState(false);

  // Results state
  const [results, setResults] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('Thiruvathirakali');
  const [winners, setWinners] = useState([
    { n: '', s: 4, d: 'CSE', q: 'Lannister' },
    { n: '', s: 4, d: 'ME', q: 'Targaryen' },
    { n: '', s: 4, d: 'EEE', q: 'Stark' },
  ]);
  const [board, setBoard] = useState([]);
  const [points, setPoints] = useState({});
  const [manualScores, setManualScores] = useState({ Targaryen: 0, Stark: 0, Lannister: 0 });
  const [autoPoints, setAutoPoints] = useState({ Targaryen: 0, Stark: 0, Lannister: 0 });
  const [isManual, setIsManual] = useState(false);
  const [savingLb, setSavingLb] = useState(false);

  useEffect(() => {
    let active = true;
    const db = getSupabase();
    const verify = async (session) => {
      if (!session) { if (active) setAuth(false); return; }
      try {
        const res = await fetch('/api/auth', { headers: { Authorization: 'Bearer ' + session.access_token } });
        const body = await res.json();
        if (active) { setAuth(res.ok); if (!res.ok) setAuthError(body.error); }
      } catch { if (active) { setAuth(false); setAuthError('Unable to verify administrator access.'); } }
    };
    db.auth.getSession().then(({ data }) => verify(data.session)).catch(() => { if (active) setAuthError('Unable to restore your session.'); });
    const { data: { subscription } } = db.auth.onAuthStateChange((_event, session) => { setTimeout(() => { if (active) verify(session); }, 0); });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  // Fetch initial data
  const fetchData = async () => {
    try {
      const [evRes, galRes, resRes] = await Promise.all([
        adminFetch('/api/events'),
        adminFetch('/api/gallery'),
        adminFetch('/api/results'),
      ]);

      if (evRes.ok) {
        const d = await evRes.json();
        if (d.eventStatuses) setStatuses(d.eventStatuses);
      }
      if (galRes.ok) {
        const d = await galRes.json();
        if (d.gallery) setGallery(d.gallery);
      }
      if (resRes.ok) {
        const d = await resRes.json();
        if (d.results) setResults(d.results);
        if (d.board) setBoard(d.board);
        if (d.points) setPoints(d.points);
        if (d.isManual !== undefined) setIsManual(d.isManual);
        if (d.manualPoints) setManualScores(d.manualPoints);
        else if (d.points) setManualScores(d.points);
        if (d.autoPoints) setAutoPoints(d.autoPoints);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
      showToast(err.message || 'Unable to load admin data.');
    }
  };

  useEffect(() => {
    if (auth) fetchData();
  }, [auth]);

  // When event changes in results tab, populate existing winners if any
  useEffect(() => {
    if (!results.length) return;
    const found = results.find((r) => r.n === selectedEvent);
    if (found && Array.isArray(found.p) && found.p.length === 3) {
      setWinners(found.p.map((p) => ({ ...p })));
    } else {
      setWinners([
        { n: '', s: 4, d: 'CSE', q: 'Lannister' },
        { n: '', s: 4, d: 'ME', q: 'Targaryen' },
        { n: '', s: 4, d: 'EEE', q: 'Stark' },
      ]);
    }
  }, [selectedEvent, results]);

  const handleLogin = async (e) => {
    e.preventDefault(); setAuthError(''); setSigningIn(true);
    try {
      const { data, error } = await getSupabase().auth.signInWithPassword({ email: email.trim(), password: pass });
      if (error) throw new Error('Invalid email or password.');
      const res = await fetch('/api/auth', { headers: { Authorization: 'Bearer ' + data.session.access_token } });
      const body = await res.json();
      if (!res.ok) { await getSupabase().auth.signOut(); throw new Error(body.error); }
      setAuth(true); setPass('');
    } catch (error) { setAuthError(error.message); }
    finally { setSigningIn(false); }
  };
  const handleLogout = async () => {
    await getSupabase().auth.signOut(); setAuth(false); setPass('');
  };

  // Event status toggle
  const handleEventStatus = async (eventName, status) => {
    const newStatus = status === 'reset' ? 'upcoming' : status;


    try {
      const res = await adminFetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventName, status }),
      });
      if (res.ok) {
        const data = await res.json();
        setStatuses(data.eventStatuses);
        showToast(`${eventName} is now ${newStatus.toUpperCase()}`);
      }
    } catch (err) {
      showToast(err.message || 'Failed to update event status');
    }
  };

  // Gallery file select
  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) {
      setUploadFile(f);
      setPreviewUrl(URL.createObjectURL(f));
    }
  };

  // Upload gallery photo
  const handleUploadGallery = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      showToast('Please select an image file first');
      return;
    }

    setUploading(true);
    try {
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/heic'].includes(uploadFile.type) || uploadFile.size > 10000000) throw new Error('Choose a JPEG, PNG, WebP, AVIF, or HEIC photo under 10 MB.');
      const signature = await (await adminFetch('/api/gallery/sign', { method: 'POST' })).json();
      const fd = new FormData();
      fd.append('file', uploadFile);
      for (const field of ['timestamp', 'public_id', 'overwrite', 'allowed_formats', 'signature', 'api_key']) fd.append(field, String(signature[field]));
      const uploaded = await fetch('https://api.cloudinary.com/v1_1/' + signature.cloud_name + '/image/upload', { method: 'POST', body: fd });
      const asset = await uploaded.json();
      if (!uploaded.ok) throw new Error('Photo upload failed. Please try again.');
      const res = await adminFetch('/api/gallery', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ public_id: asset.public_id, cap: caption || 'Saaya Art Fest', y: year }),
      });
      const data = await res.json();
      if (res.ok && data.gallery) {
        setGallery(data.gallery);
        setUploadFile(null);
        setPreviewUrl('');
        setCaption('');
        showToast('Photo uploaded to Gallery successfully!');
      } else {
        showToast(data.error || 'Upload failed');
      }
    } catch (err) {
      showToast(err.message || 'Error uploading image');
    } finally {
      setUploading(false);
    }
  };

  // Delete gallery item
  const handleDeleteGallery = async (id) => {
    if (!confirm('Are you sure you want to delete this photo from the gallery?')) return;
    try {
      const res = await adminFetch('/api/gallery', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (res.ok && data.gallery) {
        setGallery(data.gallery);
        showToast('Photo removed from Gallery');
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete photo');
    }
  };

  // Winner field change
  const handleWinnerChange = (idx, field, val) => {
    setWinners((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      if (field === 'd') {
        copy[idx].q = DEPT_TO_SQUAD[val] || 'Targaryen';
        // If MCA, clamp semester to 4
        if (val === 'MCA' && copy[idx].s > 4) {
          copy[idx].s = 4;
        }
      }
      return copy;
    });
  };

  // Save event winners
  const handleSaveWinners = async (e) => {
    e.preventDefault();
    try {
      const res = await adminFetch('/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventName: selectedEvent,
          winners,
        }),
      });
      const data = await res.json();
      if (res.ok && data.results) {
        setResults(data.results);
        if (data.board) setBoard(data.board);
        if (data.points) setPoints(data.points);
        if (data.autoPoints) setAutoPoints(data.autoPoints);
        if (data.isManual !== undefined) setIsManual(data.isManual);
        if (!data.isManual && data.points) setManualScores(data.points);
        showToast(
          data.isManual
            ? `Results saved for ${selectedEvent}! (Leaderboard is currently in Manual Mode)`
            : `Results updated for ${selectedEvent}! Leaderboard auto-refreshed.`
        );
      }
    } catch (err) {
      showToast(err.message || 'Failed to save results');
    }
  };

  // Manual score input change
  const handleManualScoreChange = (squad, val) => {
    const num = Math.max(0, parseInt(val, 10) || 0);
    setManualScores((prev) => ({ ...prev, [squad]: num }));
  };

  // Quick point stepper (+1, +5, +10, -1, -5)
  const adjustSquadPoints = (squad, delta) => {
    setManualScores((prev) => {
      const current = prev[squad] ?? (points[squad] || 0);
      return { ...prev, [squad]: Math.max(0, current + delta) };
    });
  };

  // Save manual points to server
  const handleSaveManualPoints = async () => {
    setSavingLb(true);
    try {
      const res = await adminFetch('/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'set_manual_points',
          points: manualScores,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.points) setPoints(data.points);
        if (data.board) setBoard(data.board);
        if (data.manualPoints) setManualScores(data.manualPoints);
        if (data.autoPoints) setAutoPoints(data.autoPoints);
        if (data.isManual !== undefined) setIsManual(data.isManual);
        showToast('Leaderboard points manually marked and broadcasted live!');
      } else {
        showToast(data.error || 'Failed to save points');
      }
    } catch (err) {
      showToast(err.message || 'Error saving manual points');
    } finally {
      setSavingLb(false);
    }
  };

  // Reset to auto-calculated from results
  const handleResetToAuto = async () => {
    if (!confirm('Recalculate leaderboard points automatically from all 1st, 2nd, and 3rd place event winners?')) return;
    setSavingLb(true);
    try {
      const res = await adminFetch('/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_to_auto' }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.points) setPoints(data.points);
        if (data.board) setBoard(data.board);
        if (data.manualPoints) setManualScores(data.manualPoints);
        if (data.autoPoints) setAutoPoints(data.autoPoints);
        if (data.isManual !== undefined) setIsManual(data.isManual);
        showToast('Leaderboard reset to auto-calculated results!');
      } else {
        showToast(data.error || 'Failed to recalculate');
      }
    } catch (err) {
      showToast(err.message || 'Error recalculating points');
    } finally {
      setSavingLb(false);
    }
  };

  // All event names across categories
  const allEvents = [];
  Object.entries(EV).forEach(([cat, list]) => {
    list.forEach((e) => allEvents.push({ name: e[0], cat, time: e[2], venue: e[3] || 'Main Stage' }));
  });

  const displayedEvents = allEvents.filter((e) => eventFilter === 'All' || e.cat === eventFilter);

  // If not logged in, show passcode screen
  if (!auth) {
    return (
      <div className="adm-wrap">
        <div className="adm-login-card">
          <div className="adm-shield-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h2>SAAYA 26 &middot; Admin Portal</h2>
          <p>Sign in with your administrator email and password to access event live status, gallery uploads, results, and leaderboard controls.</p>
          <form onSubmit={handleLogin} className="adm-form">
            <input type="email" aria-label="Admin email" placeholder="Admin Email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required className="adm-input" />
            <input
              type="password"
              placeholder="Password"
              aria-label="Password"
              autoComplete="current-password"
              required
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              autoFocus
              className="adm-input"
            />
            {authError && <p className="adm-err">{authError}</p>}
            <button type="submit" className="adm-btn" disabled={signingIn}>{signingIn ? 'Signing in...' : 'Sign In to Admin'}</button>
            <div style={{ marginTop: 14 }}>
              <Link href="/" className="adm-back-link">&larr; Back to Public Website</Link>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="adm-wrap">
      <div className="adm-header">
        <div>
          <h1>SAAYA 26 &middot; Admin Portal</h1>
          <p>Real-time control panel for Live Events, Gallery Uploads, Results, and Leaderboard.</p>
        </div>
        <div className="adm-head-actions">
          <Link href="/events" className="adm-view-btn" target="_blank">View Live Events &rarr;</Link>
          <button onClick={handleLogout} className="adm-logout-btn">Log Out</button>
        </div>
      </div>

      {toast && <div className="adm-toast">{toast}</div>}

      {/* Tabs */}
      <div className="adm-nav-tabs">
        <button className={tab === 'events' ? 'on' : ''} onClick={() => setTab('events')}>
          🔴 Live Events Controller
        </button>
        <button className={tab === 'gallery' ? 'on' : ''} onClick={() => setTab('gallery')}>
          🖼️ Gallery Manager
        </button>
        <button className={tab === 'results' ? 'on' : ''} onClick={() => setTab('results')}>
          🏆 Results &amp; Winners
        </button>
        <button className={tab === 'leaderboard' ? 'on' : ''} onClick={() => setTab('leaderboard')}>
          📊 Leaderboard &amp; Points
        </button>
      </div>

      {/* TAB 1: LIVE EVENTS CONTROLLER */}
      {tab === 'events' && (
        <div className="adm-section">
          <div className="adm-section-head">
            <div>
              <h2>Event Live Status Controller</h2>
              <p>Set any event to <b>LIVE</b> (triggers the Live Now banner card on /events), <b>DONE</b>, or <b>RESET</b>.</p>
            </div>
            <div className="adm-cat-filters">
              {['All', 'On Stage', 'Off Stage', 'Pre Stage'].map((c) => (
                <button
                  key={c}
                  className={eventFilter === c ? 'on' : ''}
                  onClick={() => setEventFilter(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="adm-event-grid">
            {displayedEvents.map((ev) => {
              const st = statuses[ev.name] || 'upcoming';
              return (
                <div key={ev.name} className={`adm-event-card ${st}`}>
                  <div className="adm-event-top">
                    <span className="adm-ev-cat">{ev.cat}</span>
                    <span className={`adm-ev-badge ${st}`}>
                      {st === 'live' ? '● LIVE NOW' : st === 'done' ? '✓ DONE' : 'UPCOMING'}
                    </span>
                  </div>
                  <h3>{ev.name}</h3>
                  <div className="adm-ev-meta">
                    <span>{ev.time}</span> &middot; <span>{ev.venue}</span>
                  </div>
                  <div className="adm-ev-actions">
                    <button
                      className={`act-live ${st === 'live' ? 'active' : ''}`}
                      onClick={() => handleEventStatus(ev.name, 'live')}
                    >
                      Live
                    </button>
                    <button
                      className={`act-done ${st === 'done' ? 'active' : ''}`}
                      onClick={() => handleEventStatus(ev.name, 'done')}
                    >
                      Done
                    </button>
                    <button
                      className={`act-reset ${st === 'upcoming' ? 'active' : ''}`}
                      onClick={() => handleEventStatus(ev.name, 'reset')}
                    >
                      Reset
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: GALLERY MANAGER */}
      {tab === 'gallery' && (
        <div className="adm-section">
          <div className="adm-section-head">
            <div>
              <h2>Gallery Photo Manager</h2>
              <p>Upload photos directly to the Saaya Archive with customized captions and year tags.</p>
            </div>
          </div>

          <form onSubmit={handleUploadGallery} className="adm-upload-box">
            <div className="adm-upload-grid">
              <div>
                <label className="adm-label">Select Photo to Upload</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="adm-file-input"
                />
                {previewUrl && (
                  <div className="adm-preview">
                    <img src={previewUrl} alt="Preview" />
                  </div>
                )}
              </div>
              <div>
                <label className="adm-label">Caption / Event Title</label>
                <input
                  type="text"
                  placeholder="e.g. Oppana Group Performance"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="adm-input"
                />

                <label className="adm-label" style={{ marginTop: 14 }}>Edition / Year</label>
                <select value={year} onChange={(e) => setYear(e.target.value)} className="adm-select">
                  <option value="2026">2026 (Current Edition)</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                  <option value="2022">2022</option>
                </select>

                <button
                  type="submit"
                  disabled={uploading || !uploadFile}
                  className="adm-btn"
                  style={{ marginTop: 20 }}
                >
                  {uploading ? 'Uploading...' : 'Upload Photo to Gallery'}
                </button>
              </div>
            </div>
          </form>

          <h3 style={{ marginTop: 36, marginBottom: 16 }}>Current Gallery Photos ({gallery.length})</h3>
          <div className="adm-gal-grid">
            {gallery.map((g) => (
              <div key={g.id || g.src} className="adm-gal-card">
                <div className="adm-gal-thumb">
                  {g.src ? <img src={galleryImage(g, 400)} alt={g.cap} /> : <div className="adm-gal-empty">No Image</div>}
                  <span className="adm-gal-yr">{g.y}</span>
                </div>
                <div className="adm-gal-meta">
                  <p title={g.cap}>{g.cap}</p>
                  <button onClick={() => handleDeleteGallery(g.id)} className="adm-del-btn" title="Delete photo">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: RESULTS & WINNERS */}
      {tab === 'results' && (
        <div className="adm-section">
          <div className="adm-section-head">
            <div>
              <h2>Results &amp; Hall of Fame Manager</h2>
              <p>Record 1st, 2nd, and 3rd place winners for each event. Squad points update automatically!</p>
            </div>
          </div>

          <div className="adm-results-form-card">
            <label className="adm-label">Select Event</label>
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="adm-select"
              style={{ fontSize: '1.1rem', marginBottom: 20 }}
            >
              {allEvents.map((e) => (
                <option key={e.name} value={e.name}>
                  {e.name} ({e.cat})
                </option>
              ))}
            </select>

            <form onSubmit={handleSaveWinners}>
              <div className="adm-winners-inputs">
                {['1st Place (5 PTS)', '2nd Place (3 PTS)', '3rd Place (1 PT)'].map((label, idx) => {
                  const w = winners[idx] || { n: '', s: 4, d: 'CSE', q: 'Lannister' };
                  const maxSem = w.d === 'MCA' ? 4 : 7;
                  return (
                    <div key={idx} className="adm-winner-row">
                      <div className="adm-win-badge">0{idx + 1} &middot; {label}</div>
                      <div className="adm-win-fields">
                        <div>
                          <label className="adm-sublabel">Student Name</label>
                          <input
                            type="text"
                            placeholder="Student Name"
                            value={w.n}
                            onChange={(e) => handleWinnerChange(idx, 'n', e.target.value)}
                            required
                            className="adm-input"
                          />
                        </div>
                        <div>
                          <label className="adm-sublabel">Department</label>
                          <select
                            value={w.d}
                            onChange={(e) => handleWinnerChange(idx, 'd', e.target.value)}
                            className="adm-select"
                          >
                            {DEPTS.map((d) => (
                              <option key={d} value={d}>
                                {d} ({DEPT_TO_SQUAD[d]})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="adm-sublabel">Semester (S1-S{maxSem})</label>
                          <select
                            value={w.s}
                            onChange={(e) => handleWinnerChange(idx, 's', parseInt(e.target.value, 10))}
                            className="adm-select"
                          >
                            {Array.from({ length: maxSem }, (_, i) => i + 1).map((s) => (
                              <option key={s} value={s}>S{s}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="adm-sublabel">Squad</label>
                          <div className="adm-squad-tag" style={{ color: SQ[w.q]?.c }}>
                            {w.q}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button type="submit" className="adm-btn" style={{ marginTop: 22 }}>
                Save Winners for {selectedEvent} &rarr;
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 4: LEADERBOARD & MANUAL POINT MARKING */}
      {tab === 'leaderboard' && (
        <div className="adm-section">
          <div className="adm-section-head">
            <div>
              <h2>Leaderboard Standings &amp; Manual Point Marking</h2>
              <p>Mark squad points manually or let them calculate automatically from event results.</p>
            </div>
            <div className="adm-lb-mode-strip">
              <span className={`adm-mode-badge ${isManual ? 'manual' : 'auto'}`}>
                {isManual ? '⚙️ MANUAL OVERRIDE ACTIVE' : '⚡ AUTO MODE (FROM RESULTS)'}
              </span>
              <button
                type="button"
                className="adm-sec-btn"
                onClick={handleResetToAuto}
                title="Recalculate points based on all recorded 1st, 2nd, and 3rd place winners"
              >
                🔄 Recalculate &amp; Sync from Results
              </button>
            </div>
          </div>

          <div className="adm-lb-cards">
            {SQN.map((squad) => {
              const currentVal = manualScores[squad] ?? (points[squad] || 0);
              const autoVal = autoPoints[squad] || 0;
              const s = SQ[squad];
              const rankIdx = board.findIndex(([name]) => name === squad);
              const rankStr = rankIdx >= 0 ? ['🥇 1st Place', '🥈 2nd Place', '🥉 3rd Place'][rankIdx] || `#${rankIdx + 1}` : '';

              return (
                <div key={squad} className="adm-lb-card edit-mode" style={{ '--sq': s.c }}>
                  <div className="adm-lb-card-top">
                    <div>
                      <small>SQUAD</small>
                      <h3>{squad}</h3>
                      <p>{s.d.join(' · ')}</p>
                    </div>
                    {rankStr && <span className="adm-rank-badge">{rankStr}</span>}
                  </div>

                  <div className="adm-lb-score-edit">
                    <label className="adm-sublabel">Mark Squad Points</label>
                    <div className="adm-lb-input-row">
                      <input
                        type="number"
                        min="0"
                        value={currentVal}
                        onChange={(e) => handleManualScoreChange(squad, e.target.value)}
                        className="adm-lb-num-input"
                      />
                      <span className="adm-lb-pts-label">PTS</span>
                    </div>

                    <div className="adm-lb-steppers">
                      <button type="button" onClick={() => adjustSquadPoints(squad, -10)} title="-10 pts">-10</button>
                      <button type="button" onClick={() => adjustSquadPoints(squad, -5)} title="-5 pts">-5</button>
                      <button type="button" onClick={() => adjustSquadPoints(squad, -1)} title="-1 pt">-1</button>
                      <button type="button" onClick={() => adjustSquadPoints(squad, 1)} title="+1 pt">+1</button>
                      <button type="button" onClick={() => adjustSquadPoints(squad, 5)} title="+5 pts">+5</button>
                      <button type="button" onClick={() => adjustSquadPoints(squad, 10)} title="+10 pts">+10</button>
                    </div>
                  </div>

                  <div className="adm-lb-footer-info">
                    <span>Auto results: <b>{autoVal} PTS</b></span>
                    {isManual && currentVal !== autoVal && (
                      <span className="adm-lb-diff">
                        {currentVal > autoVal ? `+${currentVal - autoVal}` : currentVal - autoVal} manual diff
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="adm-lb-actions-bar">
            <button
              type="button"
              onClick={handleSaveManualPoints}
              disabled={savingLb}
              className="adm-btn adm-save-lb-btn"
            >
              {savingLb ? 'Saving Points...' : '💾 Save Manual Leaderboard Points'}
            </button>
            <p className="adm-lb-note">
              {isManual
                ? 'ℹ️ Custom manual points are currently broadcasted live to the Homepage and Hall of Fame.'
                : 'ℹ️ Saving points will activate Manual Override mode. You can revert to auto calculation anytime using "Recalculate & Sync".'}
            </p>
          </div>

          <div className="adm-lb-preview-box">
            <h3>Current Live Standings</h3>
            <div className="adm-lb-rank-table">
              {board.map(([name, depts, pts], i) => (
                <div key={name} className="adm-lb-rank-row">
                  <div className="adm-lb-rank-pos">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'} #{i + 1}
                  </div>
                  <div className="adm-lb-rank-name">
                    <strong style={{ color: SQ[name]?.c }}>{name}</strong>
                    <small>{depts}</small>
                  </div>
                  <div className="adm-lb-rank-pts">
                    <b>{pts}</b> PTS
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
